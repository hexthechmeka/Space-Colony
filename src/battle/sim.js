import { AH, AW, Battle, beginWave, burst, damageCore, damageUnit, endBattle, fireWeapon, keys, killEnemy, moveUnit, nearestEnemy, spawnEnemy, unitAI } from './state.js';
import { App } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { T } from '../core/state.js';
import { dist, rnd } from '../core/util.js';
import { DATA } from '../data/index.js';
import { MOUSE } from '../ui/widgets.js';

/* ═══ 18. 전투 업데이트 ═════════════════════════════════════════════ */
export function updateBattle(dt){
  const B = Battle;
  if (B.paused || App.modal) return;
  B.time += dt;
  if (B.shake > 0) B.shake = Math.max(0, B.shake - dt*20);
  if (B.orbCd > 0) B.orbCd = Math.max(0, B.orbCd - dt);

  if (B.phase === 'prep'){ B.prepLeft -= dt; if (B.prepLeft <= 0) beginWave(); }
  else if (B.phase === 'inter'){ B.interLeft -= dt; if (B.interLeft <= 0) beginWave(); }
  else if (B.phase === 'wave'){
    B.spawnT += dt;
    while (B.queue.length && B.queue[0].at <= B.spawnT) spawnEnemy(B.queue.shift().type);
    if (!B.queue.length && !B.enemies.length){
      if (B.waveIdx + 1 < B.waveDefs.length){
        B.waveIdx++; B.phase = 'inter'; B.interLeft = DATA.meta.interWaveSec;
        for (const u of B.units) if (u.down){ u.down = false; u.hp = Math.round(u.max*0.5); }
        sfx('build');
      } else { endBattle(true); return; }
    }
  }

  for (const u of B.units){
    if (u.down) continue;
    if (u.cd > 0) u.cd -= dt;
    if (u.flash > 0) u.flash -= dt;
    if (u.muzzle > 0) u.muzzle -= dt;
    if (u.regen){                                    // 의료 키트
      u.regenT = (u.regenT || 0) + dt;
      if (u.regenT >= 5){ u.regenT = 0; u.hp = Math.min(u.max, u.hp + u.max*u.regen); }
    }
    if (u.i === 0 && !B.auto){
      let dx = 0, dy = 0;
      if (keys['w']||keys['arrowup']) dy--;
      if (keys['s']||keys['arrowdown']) dy++;
      if (keys['a']||keys['arrowleft']) dx--;
      if (keys['d']||keys['arrowright']) dx++;
      if (dx||dy) moveUnit(u, dx, dy, dt);
      u.aim = Math.atan2(MOUSE.y-u.y, MOUSE.x-u.x);
      if (MOUSE.down && !B.placing && u.cd <= 0 && B.phase !== 'prep' && MOUSE.y < AH-40) fireWeapon(u, u.aim);
    } else unitAI(u, dt);
  }

  const opd = B.opType ? DATA.operators[B.opType] : null;
  const tMul = (1 + T('outpost','turret')*0.15) * (opd && opd.passTurret ? opd.passTurret : 1);
  for (let i=B.turrets.length-1;i>=0;i--){
    const t = B.turrets[i];
    if (t.hp <= 0){ burst(t.x,t.y,'#8d97a0',12); B.turrets.splice(i,1); continue; }
    t.cd -= dt;
    const e = nearestEnemy(t.x, t.y, DATA.turret.range);
    if (e){
      t.aim = Math.atan2(e.y-t.y, e.x-t.x);
      if (t.cd <= 0){
        const a = t.aim + (Math.random()-0.5)*0.07;
        B.bullets.push({ x:t.x, y:t.y, vx:Math.cos(a)*250, vy:Math.sin(a)*250,
          dmg:DATA.turret.dmg*tMul, life:DATA.turret.range/250, hit:new Set() });
        t.cd = DATA.turret.cd; t.muzzle = 0.06; sfx('turret');
      }
    }
    if (t.muzzle > 0) t.muzzle -= dt;
  }

  for (let i=B.bullets.length-1;i>=0;i--){
    const b = B.bullets[i];
    b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
    if (b.life <= 0 || b.x<-20||b.x>AW+20||b.y<-20||b.y>AH+20){ B.bullets.splice(i,1); continue; }
    for (let j=B.enemies.length-1;j>=0;j--){
      const e = B.enemies[j];
      if (b.hit.has(e)) continue;
      if ((e.x-b.x)**2 + (e.y-b.y)**2 < (e.r+3)**2){
        e.hp -= b.dmg; e.flash = 0.1;
        if (b.burn){ e.burn = b.burn; e.burnT = 3; }                     // 소이탄 화상
        if (b.frag){                                                     // 파쇄탄 파편
          for (let k=B.enemies.length-1;k>=0;k--){
            const o = B.enemies[k];
            if (o === e) continue;
            if ((o.x-e.x)**2 + (o.y-e.y)**2 < 26*26){
              o.hp -= b.frag; o.flash = 0.1;
              if (o.hp <= 0) killEnemy(o, k, b.owner);
            }
          }
          burst(e.x, e.y, '#ffd08a', 6);
        }
        if (e.hp <= 0) killEnemy(e, j, b.owner); else sfx('hit');
        if (b.pierce) b.hit.add(e); else B.bullets.splice(i,1);
        break;
      }
    }
  }

  if (B.flare){ B.flare.t -= dt; if (B.flare.t <= 0) B.flare = null; }
  for (let i=B.enemies.length-1;i>=0;i--){
    const e = B.enemies[i];
    if (e.flash > 0) e.flash -= dt;
    e.cd -= dt;
    if (e.burnT > 0){                                // 화상 지속 피해
      e.burnT -= dt; e.hp -= e.burn*dt;
      if (Math.random() < dt*8) B.parts.push({ x:e.x+rnd(-4,4), y:e.y+rnd(-4,4), vx:0, vy:-20, life:0.3, color:'#e08040' });
      if (e.hp <= 0){ killEnemy(e, i); continue; }
    }
    if (e.slowT > 0) e.slowT -= dt; else e.slow = 0;
    let tgt = B.core, td = dist(B.core.x,B.core.y,e.x,e.y) - B.core.r;
    for (const u of B.units){
      if (u.down) continue;
      const d = dist(u.x,u.y,e.x,e.y);
      if (d < 78 && d < td){ tgt = u; td = d; }
    }
    for (const t of B.turrets){
      const d = dist(t.x,t.y,e.x,e.y);
      if (d < 72 && d < td){ tgt = t; td = d; }
    }
    const dx = tgt.x-e.x, dy = tgt.y-e.y, dd = Math.hypot(dx,dy)||1;
    if (e.def.ranged){
      const sp0 = e.spd * (e.slowT > 0 ? (1-e.slow) : 1);
      if (dd > e.def.range*0.85){ e.x += dx/dd*sp0*dt; e.y += dy/dd*sp0*dt; }
      else if (e.cd <= 0){
        const a = Math.atan2(dy,dx) + (Math.random()-0.5)*0.12;
        B.eb.push({ x:e.x, y:e.y, vx:Math.cos(a)*e.def.bulletSpd, vy:Math.sin(a)*e.def.bulletSpd,
          dmg:e.dmg*0.6, life:e.def.range/e.def.bulletSpd + 0.2 });
        e.cd = e.def.fireRate;
      }
    } else {
      const reach = (tgt === B.core ? B.core.r : (tgt.r || 7)) + e.r;
      const sp1 = e.spd * (e.slowT > 0 ? (1-e.slow) : 1);
      if (dd > reach){ e.x += dx/dd*sp1*dt; e.y += dy/dd*sp1*dt; }
      else if (e.cd <= 0){
        e.cd = 0.85;
        if (tgt === B.core) damageCore(e.dmg);
        else if (tgt.i !== undefined) damageUnit(tgt, e.dmg);
        else tgt.hp -= e.dmg;
      }
    }
  }

  for (let i=B.eb.length-1;i>=0;i--){
    const b = B.eb[i];
    b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
    if (b.life <= 0 || b.x<-20||b.x>AW+20||b.y<-20||b.y>AH+20){ B.eb.splice(i,1); continue; }
    let done = false;
    for (const u of B.units){
      if (u.down) continue;
      if ((u.x-b.x)**2 + (u.y-b.y)**2 < 49){ damageUnit(u, b.dmg); done = true; break; }
    }
    if (!done) for (const t of B.turrets) if ((t.x-b.x)**2 + (t.y-b.y)**2 < 64){ t.hp -= b.dmg; done = true; break; }
    if (!done && (B.core.x-b.x)**2 + (B.core.y-b.y)**2 < B.core.r**2){ damageCore(b.dmg); done = true; }
    if (done) B.eb.splice(i,1);
  }

  for (let i=B.parts.length-1;i>=0;i--){
    const p = B.parts[i];
    p.life -= dt;
    if (p.ring) p.r += dt*180;
    else { p.x += p.vx*dt; p.y += p.vy*dt; p.vx *= 0.93; p.vy *= 0.93; }
    if (p.life <= 0) B.parts.splice(i,1);
  }
}
