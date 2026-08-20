export const KEY = { save:'fo_save_v2', opt:'fo_opt_v2' };

export const Store = (() => {
  let ok = false;
  try { localStorage.setItem('__fo','1'); ok = localStorage.getItem('__fo')==='1'; localStorage.removeItem('__fo'); }
  catch(e){ ok = false; }
  const mem = new Map();
  return {
    available: ok,
    get(k, fb){
      try {
        const raw = ok ? localStorage.getItem(k) : mem.get(k);
        if (!raw) return fb === undefined ? null : structuredClone(fb);
        const p = JSON.parse(raw);
        if (!p || typeof p !== 'object') return fb === undefined ? null : structuredClone(fb);
        return (fb && typeof fb === 'object') ? Object.assign(structuredClone(fb), p) : p;
      } catch(e){ return fb === undefined ? null : structuredClone(fb); }
    },
    set(k, v){
      const raw = JSON.stringify(v);
      try { if (ok) localStorage.setItem(k, raw); else mem.set(k, raw); return true; }
      catch(e){ mem.set(k, raw); return false; }
    },
    has(k){ try { return !!(ok ? localStorage.getItem(k) : mem.get(k)); } catch(e){ return false; } },
    del(k){ try { if (ok) localStorage.removeItem(k); } catch(e){} mem.delete(k); },
  };
})();

export const DEFAULT_OPT = { sfx:true, vol:45, shake:true, scan:true, autoDefault:false };
export let OPT = Store.get(KEY.opt, DEFAULT_OPT);
export function setOpt(v){ OPT = v; }
export const saveOpt = () => Store.set(KEY.opt, OPT);

export const TOASTS = [];
export function toast(msg, kind){ TOASTS.push({ msg, kind:kind||'info', life:3.4 }); if (TOASTS.length > 4) TOASTS.shift(); }
