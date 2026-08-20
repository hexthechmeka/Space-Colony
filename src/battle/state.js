import { seeded } from '../art/space.js';
import { CLASS_PAL } from '../art/sprites.js';
import { App, openModal } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { gain, loseSite } from '../core/economy.js';
import { S, T, clsOf, coreMaxHp, crewById, crewMaxHp, fillSquad, heldSites, injuryMs, makeCrew, opById, planetOf, saveGame, shipMaxHp, siteDef, squadList, weaponUnlocked } from '../core/state.js';
import { OPT, toast } from '../core/store.js';
import { clamp, dist, now, rnd } from '../core/util.js';
import { DATA } from '../data/index.js';
import { LH, LW } from '../ui/canvas.js';

/* ═══ 17. 전투 상태 ═════════════════════════════════════════════════ */
export const AW = LW, AH = LH, ACX = LW/2, ACY = LH/2 + 6;
export const Battle = {
  active:false, mode:'claim', siteId:null, tier:1, waveDefs:[], phase:'prep',
  prepLeft:0, interLeft:0, waveIdx:0, queue:[], spawnT:0,
  core:null, units:[], enemies:[], bullets:[], eb:[], turrets:[], parts:[],
  turretLeft:0, auto:false, orbCd:0, shake:0, drops:{}, kills:0, placing:false, paused:false, time:0, decor:null,
};
export const keys = {};
export const dmgMul = () => 1 + T('trooper','power')*0.22;
/** 승무원 + 로드아웃 + 병과 특성으로 전장 유닛을 만든다 */
export function buildUnit(c, i){
  const cl = clsOf(c), g = DATA.gears[c.load.g] || DATA.gears.none, am = DATA.ammo[c.load.a] || DATA.ammo.std;
  const op = opById(S.operator), od = op ? DATA.operators[op.type] : null;
  const w = { ...DATA.weapons[c.load.w], id:c.load.w };
  w.dmg   *= dmgMul() * (cl.pref === c.load.w ? DATA.prefBonus : 1) * (am.dmg || 1);
  w.cd    *= (g.rate || 1);
  w.range *= (g.range || 1) * (cl.perkRange || 1) * (am.range || 1) * (od && od.passRange ? od.passRange : 1);
  w.spd   *= (am.spd || 1);
  w.spread*= (g.spread || 1);
  const hp = Math.round(crewMaxHp(c) * (1 + T('trooper','plate')*0.25));
  const a = -Math.PI/2 + i*Math.PI/2;
  return {
    i, crew:c, pal: CLASS_PAL[c.cls] || 'cmd',
    def: { name:c.name, spd: cl.spd * (g.spd || 1) },
    x: ACX + Math.cos(a)*52, y: ACY + Math.sin(a)*52,
    hp, max:hp, cd:0, aim:-Math.PI/2, down:false, w, flash:0, muzzle:0, kills:0,
    armor:(cl.perkArmor || 1) * (g.armor || 1), regen:(g.regen || 0), regenT:0,
    burn:(am.burn || 0) * (cl.perkBurn || 1), frag:(am.frag || 0),
  };
}

export function battleDecor(seed){
  const R = seeded(seed), d = [];
  for (let i=0;i<120;i++){
    const x = R()*AW, y = R()*AH;
    if (dist(x,y,ACX,ACY) < 54) continue;
    d.push({ x:Math.round(x), y:Math.round(y), w:1+Math.floor(R()*4), h:1+Math.floor(R()*3), t:R() });
  }
  return d;
}
export function startBattle(mode, siteId){
  const def = siteId ? siteDef(siteId) : null;
  const tier = mode === 'ship' ? clamp(1 + Math.floor(heldSites().length/2), 1, 5) : def.tier;
  const all  = mode === 'ship' ? DATA.shipWaves : DATA.waves[tier];
  const waveDefs = mode === 'claim' ? all.slice(0, def.waves) : mode === 'defend' ? all.slice(-2) : all;
  Object.assign(Battle, {
    active:true, mode, siteId, tier, waveDefs, phase:'prep',
    prepLeft: mode === 'ship' ? 12 : DATA.meta.prepSec,
    interLeft:0, waveIdx:0, queue:[], spawnT:0,
    enemies:[], bullets:[], eb:[], turrets:[], parts:[],
    turretLeft: T('outpost','turret'), auto: OPT.autoDefault, orbCd:0, shake:0,
    drops:{}, kills:0, placing:false, paused:false, time:0,
    decor: battleDecor((siteId||'ship')+mode),
  });
  Battle.core = mode === 'ship'
    ? { x:ACX, y:ACY, hp:S.ship.hp, max:shipMaxHp(), r:30, ship:true }
    : { x:ACX, y:ACY, hp:coreMaxHp(), max:coreMaxHp(), r:DATA.core.r };
  Battle.units = squadList().slice(0,4).map((c,i) => buildUnit(c, i));
  Battle.opType = (opById(S.operator) || {}).type || null;
  App.modal = null; App.scene = 'battle';
  sfx('build');
}
export function endBattle(won){
  const mode = Battle.mode, id = Battle.siteId;
  Battle.active = false;
  const rep = { won, mode, drops:{...Battle.drops}, kills:Battle.kills, name: id ? siteDef(id).name : '모선' };
  if (mode === 'ship'){
    S.ship.hp = won ? shipMaxHp() : Math.max(Math.round(shipMaxHp()*0.35), Battle.core.hp);
    S.pendingShipRaid = false;
    if (won) rep.bonus = { alloy:8 + Battle.tier*4, scrap:60*Battle.tier };
    else {
      rep.loss = {};
      for (const k of ['scrap','fuel','alloy']){
        const l = Math.floor((S.res[k]||0)*0.15);
        if (l>0){ S.res[k]-=l; rep.loss[k]=l; }
      }
    }
    rep.lead = won ? '모선을 노린 편대를 격퇴했습니다' : '모선이 피해를 입고 화물을 약탈당했습니다';
  } else if (mode === 'claim'){
    if (won){
      const st = S.sites[id];
      st.status='held'; st.store=0; st.lastTick=now(); st.threatAt=0;
      S.stats.built++;
      const p = planetOf(id), idx = p.sites.findIndex(s => s.id === id), nx = p.sites[idx+1];
      if (nx && S.sites[nx.id].status === 'locked'){ S.sites[nx.id].status = 'open'; rep.unlocked = nx.name; }
      rep.bonus = { scrap: 40*Battle.tier };
    }
    rep.lead = won ? rep.name + ' 전초기지 가동 시작' : '거점이 무너져 분대가 철수했습니다';
  } else {
    const st = S.sites[id];
    if (won){ st.threatAt = 0; S.stats.defended++; rep.bonus = { scrap:30*Battle.tier }; }
    else { loseSite(id, false); rep.lostSite = true; }
    rep.lead = won ? rep.name + ' 방어 성공' : rep.name + ' 상실 — 재개척이 필요합니다';
  }
  const mul = won ? 1 : 0.5;
  for (const k in rep.drops){ const v = Math.floor(rep.drops[k]*mul); rep.drops[k] = v; if (v) gain(k, v); }
  if (rep.bonus) for (const k in rep.bonus) gain(k, rep.bonus[k]);
  S.stats.kills += Battle.kills;

  // 인사 처리 — 쓰러진 대원은 부상, 부상 중이었다면 전사
  rep.injured = []; rep.dead = [];
  for (const u of Battle.units){
    const c = u.crew; if (!c) continue;
    c.missions++; c.kills += u.kills || 0;
    if (u.down || u.hp <= 0){
      if (c.status === 'injured'){ c.status = 'dead'; S.stats.dead = (S.stats.dead|0)+1; rep.dead.push(c.name); }
      else { c.status = 'injured'; c.wounds++; c.healAt = now() + injuryMs(); rep.injured.push(c.name); }
    }
  }
  if (rep.dead.length){
    S.crew = S.crew.filter(c => c.status !== 'dead');
    S.squad = S.squad.filter(id => crewById(id));
    // 전원 전사 시 모선 예비 인원으로 긴급 충원 (진행 불가 방지)
    if (!S.crew.length){
      const keys = Object.keys(DATA.classes);
      for (let i=0;i<2;i++){
        const c = makeCrew(keys[Math.floor(Math.random()*keys.length)]);
        c.load.w = weaponUnlocked(clsOf(c).pref) ? clsOf(c).pref : 'rifle';
        S.crew.push(c);
      }
      fillSquad();
      rep.draft = S.crew.map(c => c.name);
    }
  }
  saveGame();
  App.scene = id ? 'planet' : 'bridge';
  App.sel = id || null;
  openModal({ type:'result', rep });
  sfx(won ? 'win' : 'lose');
}

/* ── 웨이브 ─────────────────────────────────────────────────────── */
export function beginWave(){
  Battle.phase = 'wave'; Battle.queue = [];
  for (const [type, n, gap] of (Battle.waveDefs[Battle.waveIdx] || []))
    for (let k=0;k<n;k++) Battle.queue.push({ type, at:k*gap + Math.random()*0.3 });
  Battle.queue.sort((a,b)=>a.at-b.at);
  Battle.spawnT = 0; sfx('wave');
}
export function spawnEnemy(type){
  const e = DATA.enemies[type], mul = DATA.tierMul[Battle.tier];
  const edge = Math.floor(Math.random()*4);
  let x, y;
  if (edge===0){ x = rnd(0,AW); y = -14; } else if (edge===1){ x = AW+14; y = rnd(0,AH); }
  else if (edge===2){ x = rnd(0,AW); y = AH+14; } else { x = -14; y = rnd(0,AH); }
  const hp = Math.round(e.hp*mul);
  Battle.enemies.push({ type, def:e, x, y, hp, max:hp, r:e.r*1.4, spd:e.spd*rnd(0.9,1.1), dmg:e.dmg*mul, cd:rnd(0,0.6), flash:0 });
}
export function nearestEnemy(x,y,range){
  let b = null, bd = range*range;
  for (const e of Battle.enemies){ const d = (e.x-x)**2 + (e.y-y)**2; if (d < bd){ bd = d; b = e; } }
  return b;
}
export function fireWeapon(u, ang){
  const w = u.w, n = w.pellets || 1;
  for (let k=0;k<n;k++){
    const a = ang + (Math.random()-0.5)*w.spread;
    Battle.bullets.push({ x:u.x, y:u.y, vx:Math.cos(a)*w.spd, vy:Math.sin(a)*w.spd,
      dmg:w.dmg, life:w.life || (w.range/w.spd), pierce:!!w.pierce, hit:new Set(),
      owner:u, burn:u.burn, frag:u.frag });
  }
  u.cd = w.cd; u.muzzle = 0.06; sfx(w.id);
}
export function moveUnit(u, dx, dy, dt){
  const d = Math.hypot(dx,dy); if (d < 2) return;
  const sp = u.def.spd * (u.w.moveMul || 1);
  u.x = clamp(u.x + dx/d*sp*dt, 6, AW-6);
  u.y = clamp(u.y + dy/d*sp*dt, 26, AH-46);
}
export function unitAI(u, dt){
  const w = u.w, tgt = nearestEnemy(u.x, u.y, w.range*1.5);
  const homeA = -Math.PI/2 + u.i*Math.PI/2;
  let tx = ACX + Math.cos(homeA)*58, ty = ACY + Math.sin(homeA)*58;
  if (tgt){
    const d = dist(tgt.x,tgt.y,u.x,u.y);
    if (d > w.range*0.8){ tx = tgt.x; ty = tgt.y; }
    else if (d < w.range*0.35){ tx = u.x - (tgt.x-u.x); ty = u.y - (tgt.y-u.y); }
    else { tx = u.x; ty = u.y; }
    u.aim = Math.atan2(tgt.y-u.y, tgt.x-u.x);
  }
  const leash = 140, dc = dist(tx,ty,ACX,ACY);
  if (dc > leash){ tx = ACX + (tx-ACX)/dc*leash; ty = ACY + (ty-ACY)/dc*leash; }
  moveUnit(u, tx-u.x, ty-u.y, dt);
  if (tgt && u.cd <= 0 && dist(tgt.x,tgt.y,u.x,u.y) <= w.range) fireWeapon(u, u.aim);
}
export function damageUnit(u, dmg){
  u.hp -= dmg * (u.armor || 1); u.flash = 0.1;
  if (u.hp <= 0){ u.hp = 0; u.down = true; burst(u.x,u.y,'#c9603f',10); sfx('hurt'); }
}
export function damageCore(dmg){
  const c = Battle.core;
  c.hp -= dmg; Battle.shake = Math.max(Battle.shake, 5); sfx('hurt');
  if (c.hp <= 0){ c.hp = 0; endBattle(false); }
}
export function killEnemy(e, idx, by){
  for (const k in e.def.drop) Battle.drops[k] = (Battle.drops[k]||0) + e.def.drop[k];
  Battle.kills++;
  if (by && by.kills !== undefined) by.kills++;
  burst(e.x, e.y, e.def.boss ? '#e0503a' : '#c98f4a', e.def.boss ? 26 : 8);
  if (e.def.boss){ Battle.shake = Math.max(Battle.shake, 8); sfx('boom'); } else sfx('kill');
  Battle.enemies.splice(idx, 1);
}
export function burst(x,y,color,n){
  for (let i=0;i<n;i++){
    const a = Math.random()*6.28, s = rnd(20,90);
    Battle.parts.push({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:rnd(0.25,0.6), color });
  }
}
export const opLvl   = () => T('trooper','orbital');
export const opPower = () => 1 + opLvl()*0.35;
export const opCd    = d => Math.round(d.cd * (1 - opLvl()*0.12));
/** 오퍼레이터 지원 능력 (Space) */
export function operatorAbility(x, y){
  const op = opById(S.operator);
  if (!op || Battle.orbCd > 0 || Battle.phase !== 'wave') return;
  const d = DATA.operators[op.type];
  Battle.orbCd = opCd(d);
  if (op.type === 'gunnery'){
    const R = d.radius, dmg = d.dmg * opPower();
    for (let i=Battle.enemies.length-1;i>=0;i--){
      const e = Battle.enemies[i];
      if ((e.x-x)**2 + (e.y-y)**2 < (R+e.r)**2){ e.hp -= dmg; e.flash = 0.12; if (e.hp <= 0) killEnemy(e,i); }
    }
    Battle.parts.push({ ring:true, x, y, r:4, life:0.5, color:'#e6c56d' });
    burst(x,y,'#c9603f',24);
    Battle.shake = Math.max(Battle.shake, 7); sfx('boom');
  } else if (op.type === 'recon'){
    for (const e of Battle.enemies)
      if ((e.x-x)**2 + (e.y-y)**2 < d.radius**2){ e.slow = d.slow; e.slowT = d.dur * opPower(); }
    Battle.parts.push({ ring:true, x, y, r:4, life:0.9, color:'#9fb6c8' });
    Battle.flare = { x, y, t:d.dur * opPower() };
    sfx('alert');
  } else if (op.type === 'supply'){
    for (const u of Battle.units){
      if (u.down) continue;
      u.hp = Math.min(u.max, u.hp + u.max * d.heal * opPower());
      Battle.parts.push({ ring:true, x:u.x, y:u.y, r:2, life:0.5, color:'#9bad63' });
    }
    sfx('buy');
  } else if (op.type === 'tech'){
    Battle.core.hp = Math.min(Battle.core.max, Battle.core.hp + Battle.core.max * d.repair * opPower());
    for (const t of Battle.turrets) t.hp = Math.min(DATA.turret.hp, t.hp + DATA.turret.hp * d.repair * opPower());
    Battle.parts.push({ ring:true, x:ACX, y:ACY, r:6, life:0.7, color:'#c8a24a' });
    sfx('build');
  }
}
export const orbitalStrike = operatorAbility;      // 구 이름 호환
export function turretMaxHp(){
  const eng = Battle.units.some(u => u.crew && u.crew.cls === 'engineer');
  return Math.round(DATA.turret.hp * (eng ? DATA.classes.engineer.perkTurret : 1));
}
export function placeTurret(x,y){
  if (Battle.turretLeft <= 0) return;
  const d = dist(x,y,ACX,ACY);
  if (d > 140 || d < 30){ toast('건설 구역 안에만 배치할 수 있습니다', 'bad'); return; }
  const mh = turretMaxHp();
  Battle.turrets.push({ x:Math.round(x), y:Math.round(y), hp:mh, max:mh, cd:0, aim:-1.57, muzzle:0, r:6 });
  Battle.turretLeft--;
  if (Battle.turretLeft <= 0) Battle.placing = false;
  sfx('build');
}
