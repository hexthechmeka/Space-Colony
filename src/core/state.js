import { KEY, Store, toast } from './store.js';
import { clamp, now } from './util.js';
import { DATA } from '../data/index.js';

export const ALL_SITES = DATA.planets.flatMap(p => p.sites.map(s => ({...s, planet:p.id, planetName:p.name})));
export const siteDef  = id => ALL_SITES.find(s => s.id === id);
export const planetDef= id => DATA.planets.find(p => p.id === id);
export const planetOf = id => planetDef(siteDef(id).planet);

export let S = null;
/** S 는 다른 모듈에서 재대입할 수 없으므로 세터를 통해 교체한다 */
export function setS(v){ S = v; }
export const T = (tree,id) => (S.tech[tree][id]|0);
export const drillMul  = () => 1 + T('outpost','drill')*0.28;
export const siloMul   = () => 1 + T('outpost','silo')*0.5;
export const relayEff  = () => [0,0.6,0.8,1.0][T('outpost','relay')];
export const slotMax   = () => DATA.meta.baseSlots + T('ship','hangar');
export const graceMs   = () => (DATA.meta.threatGraceMin + T('ship','scan')*2) * 60000;
export const shipMaxHp = () => 600 + T('ship','armor')*260;
export const coreMaxHp = () => DATA.core.hp + T('outpost','wall')*160;
export const heldSites = () => Object.entries(S.sites).filter(([,v]) => v.status === 'held').map(([k])=>k);
export const siteCap   = id => Math.round(siteDef(id).rate * DATA.meta.storeMinutes * siloMul());
export const planetOpen= p => p.warp <= T('ship','warp');

/* ── 승무원 ─────────────────────────────────────────────────────── */
export const PN = DATA.personnel;
export function newId(){ return 'c' + (S ? (S.seq = (S.seq|0) + 1) : 1); }
export function randName(){
  const f = PN.firstNames[Math.floor(Math.random()*PN.firstNames.length)];
  const l = PN.lastNames[Math.floor(Math.random()*PN.lastNames.length)];
  return f + l;
}
export function makeCrew(cls, name, id){
  return { id: id || newId(), name: name || randName(), cls,
           wounds:0, status:'ready', healAt:0, kills:0, missions:0,
           load:{ w:'rifle', g:'none', a:'std' } };
}
export function makeOp(type, name, id){ return { id: id || newId(), name: name || randName(), type }; }
export const crewCap    = () => PN.startCapacity + T('ship','quarters')*PN.perQuarters;
export const crewCount  = () => S.crew.length + S.ops.length;
export const injuryMs   = () => PN.injuryMinutes*60000 * Math.pow(1-PN.medbayCut, T('ship','medbay'));
export const crewById   = id => S.crew.find(c => c.id === id) || null;
export const opById     = id => S.ops.find(o => o.id === id) || null;
export const clsOf      = c => DATA.classes[c.cls];
export const weaponUnlocked = id => DATA.weapons[id].tier <= T('trooper','arsenal');
export const gearUnlocked   = id => DATA.gears[id].tier <= T('trooper','kit');
export function crewMaxHp(c){
  const g = DATA.gears[c.load.g] || DATA.gears.none;
  let hp = clsOf(c).hp * (g.hp || 1);
  if (c.status === 'injured') hp *= PN.injuredHpPenalty;
  return Math.round(hp);
}
/** 부상 회복 (온라인·오프라인 공통) */
export function tickCrew(){
  const t = now();
  for (const c of S.crew){
    if (c.status === 'injured' && t >= c.healAt){
      c.status = 'ready';
      toast(c.name + ' 복귀 — 전투 준비 완료');
    }
  }
}
export function squadList(){ return (S.squad || []).map(id => crewById(id)).filter(Boolean); }
export function fillSquad(){
  S.squad = (S.squad || []).filter(id => crewById(id));
  for (const c of S.crew){
    if (S.squad.length >= 4) break;
    if (!S.squad.includes(c.id) && c.status === 'ready') S.squad.push(c.id);
  }
  if (!opById(S.operator)) S.operator = S.ops.length ? S.ops[0].id : null;
}

export function freshState(){
  const st = {
    v:3, seq:0, res:{...DATA.meta.startRes},
    tech:{ ship:{}, outpost:{}, trooper:{} },
    sites:{}, ship:{ hp:600 }, at:'rubicon',
    crew:[], ops:[], squad:[], operator:null, ammo:{...DATA.ammoStart},
    stats:{ built:0, defended:0, lost:0, kills:0, dead:0 },
    lastSeen: now(), shipEventAt: now() + 12*60000, seenHelp:false,
  };
  for (const p of DATA.planets)
    p.sites.forEach((s,i) => st.sites[s.id] = { status: i===0 ? 'open' : 'locked', store:0, lastTick:now(), threatAt:0, lostOnce:false });
  // 초기 승무원: 전투원 4 + 오퍼레이터 1
  const start = [['assault','반 하이드'],['marksman','오르타'],['engineer','두굴'],['heavy','마르타']];
  start.forEach(([cls,name],i) => st.crew.push(makeCrew(cls, name, 'c'+(i+1))));
  st.crew[0].load = { w:'rifle', g:'none', a:'std' };
  st.ops.push(makeOp('gunnery', '이르마', 'c5'));
  st.seq = 5;
  st.squad = st.crew.map(c => c.id);
  st.operator = st.ops[0].id;
  return st;
}
export function saveGame(){ if (!S) return false; S.lastSeen = now(); return Store.set(KEY.save, S); }
export function loadGame(){
  const d = Store.get(KEY.save);
  if (!d || !d.sites) return false;
  S = Object.assign(freshState(), d);
  for (const s of ALL_SITES) if (!S.sites[s.id]) S.sites[s.id] = { status:'locked', store:0, lastTick:now(), threatAt:0, lostOnce:false };
  for (const tree of ['ship','outpost','trooper'])
    for (const t of DATA.tech[tree]) S.tech[tree][t.id] = clamp(S.tech[tree][t.id]|0, 0, t.max);
  if (!planetDef(S.at) || !planetOpen(planetDef(S.at))) S.at = 'rubicon';
  // 구버전 저장 파일 보정
  if (!Array.isArray(S.crew) || !S.crew.length){ const f = freshState(); S.crew = f.crew; S.ops = f.ops; S.seq = f.seq; }
  if (!S.ammo) S.ammo = {...DATA.ammoStart};
  for (const c of S.crew){
    if (!c.load) c.load = { w:'rifle', g:'none', a:'std' };
    if (!DATA.classes[c.cls]) c.cls = 'assault';
    if (!DATA.weapons[c.load.w] || !weaponUnlocked(c.load.w)) c.load.w = 'rifle';
    if (!DATA.gears[c.load.g] || !gearUnlocked(c.load.g)) c.load.g = 'none';
    if (!DATA.ammo[c.load.a]) c.load.a = 'std';
  }
  fillSquad();
  return true;
}
