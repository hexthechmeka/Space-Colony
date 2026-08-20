import { Battle } from '../battle/state.js';
import { sfx } from './audio.js';
import { S, drillMul, graceMs, heldSites, relayEff, saveGame, shipMaxHp, siteCap, siteDef, tickCrew } from './state.js';
import { toast } from './store.js';
import { now } from './util.js';
import { DATA } from '../data/index.js';

/* ═══ 3. 경제 · 위협 ════════════════════════════════════════════════ */
export const canPay = cost => Object.keys(cost).every(k => (S.res[k]||0) >= cost[k]);
export function pay(cost){
  if (!canPay(cost)) return false;
  for (const k in cost) S.res[k] -= cost[k];
  return true;
}
export function gain(type, amt){ S.res[type] = (S.res[type]||0) + amt; }

export function tickMeta(dtSec){
  const t = now();
  for (const id of heldSites()){
    const st = S.sites[id], def = siteDef(id);
    if (!st.threatAt){
      const amount = def.rate/60 * dtSec * drillMul();
      if (relayEff() > 0) gain(def.res, amount * relayEff());
      else st.store = Math.min(siteCap(id), st.store + amount);
    }
    st.lastTick = t;
    if (!st.threatAt){
      const meanSec = DATA.meta.threatMeanMin[def.risk] * 60;
      if (Math.random() < dtSec/meanSec){
        st.threatAt = t;
        toast('습격대 접근 — ' + def.name, 'bad');
        sfx('alert');
      }
    } else if (t - st.threatAt > graceMs()) loseSite(id, true);
  }
  S.ship.hp = Math.min(shipMaxHp(), (S.ship.hp||0) + shipMaxHp()*dtSec/600);
  tickCrew();
  if (heldSites().length >= 2 && t > S.shipEventAt && !Battle.active){
    S.shipEventAt = t + 12*60000;
    S.pendingShipRaid = true;
    toast('모선 요격 경보 — 브리지에서 대응', 'bad');
    sfx('alert');
  }
}
export function loseSite(id, auto){
  const st = S.sites[id], def = siteDef(id);
  st.status = 'open'; st.lostOnce = true; st.threatAt = 0; st.store = 0;
  S.stats.lost++;
  if (auto) toast(def.name + ' 전초기지 상실', 'bad');
  saveGame();
}
export function settleOffline(){
  const t = now();
  const rawMs = Math.max(0, t - (S.lastSeen || t));
  const capMs = DATA.meta.offlineCapH * 3600000;
  const ms = Math.min(rawMs, capMs);
  const rep = { ms, rawMs, capped: rawMs > capMs, gained:{}, threats:[], lost:[], shipRaid:null, healed:[] };
  if (rawMs < 60000) return null;
  for (const c of S.crew) if (c.status === 'injured' && t >= c.healAt){ c.status = 'ready'; rep.healed.push(c.name); }

  for (const id of heldSites()){
    const st = S.sites[id], def = siteDef(id);
    if (st.threatAt){
      if (t - st.threatAt > graceMs()){ loseSite(id, false); rep.lost.push(def.name); continue; }
      rep.threats.push(def.name); st.lastTick = t; continue;
    }
    let activeMs = ms;
    const meanMs = DATA.meta.threatMeanMin[def.risk]*60000;
    if (Math.random() < 1 - Math.exp(-ms/meanMs)){
      activeMs = Math.random()*ms;
      st.threatAt = t;
      rep.threats.push(def.name);
    }
    const total = def.rate * (activeMs/60000) * drillMul();
    if (relayEff() > 0){
      const got = total * relayEff();
      gain(def.res, got);
      rep.gained[def.res] = (rep.gained[def.res]||0) + got;
    } else {
      const before = st.store;
      st.store = Math.min(siteCap(id), st.store + total);
      rep.gained['_store_'+def.res] = (rep.gained['_store_'+def.res]||0) + (st.store - before);
    }
    st.lastTick = t;
  }
  S.ship.hp = Math.min(shipMaxHp(), (S.ship.hp||0) + shipMaxHp()*(ms/1000)/600);
  if (heldSites().length >= 2 && t > S.shipEventAt && ms > 20*60000){
    S.shipEventAt = t + 12*60000;
    const loss = {};
    for (const k of ['scrap','fuel','alloy']){
      const l = Math.floor((S.res[k]||0) * 0.06);
      if (l > 0){ S.res[k] -= l; loss[k] = l; }
    }
    S.ship.hp = Math.max(1, (S.ship.hp||shipMaxHp()) - shipMaxHp()*0.25);
    rep.shipRaid = loss;
  }
  return rep;
}
