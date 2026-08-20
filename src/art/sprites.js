import { P } from '../ui/canvas.js';

/* ═══ 16. 전투 스프라이트 ═══════════════════════════════════════════ */
export const SPR = {
  trooper: ["..111..",".13331.",".13331.","..222..",".22222.","2.222.2","..2.2..","..3.3..","..3.3.."],
  foe:     ["..333..",".34443.",".34443.","..555..",".55555.","5.555.5","..5.5..","..3.3.."],
  brute:   ["...3333...","..344443..",".34444443.",".35555553.","3355555533","3.555555.3","3.555555.3","..5....5..","..3....3..","..3....3..",".33....33."],
  chief:   ["....33333....","...3444443...","..344444443..","..355555553..",".33355555333.","3.35555555.33","3.355555553.3","..35555553...","..3.5555.3...","..3.5..5.3...","....3..3.....","...33..33....","..333..333..."],
  fly:     ["3.......3","33.....33",".3344333.","..344443.","..355553.","...3553..","....33..."],
  turret:  ["..11111..",".1333331.","113555311","133555331","133555331","113555311",".1333331.","..22222..",".2222222."],
};
export const PAL = {
  cmd:{'1':'#e6c56d','2':'#7a6b3a','3':'#2a231a'}, gun:{'1':'#c8a24a','2':'#5d6640','3':'#241d16'},
  eng:{'1':'#b98f52','2':'#6b5334','3':'#241d16'}, hvy:{'1':'#9fb6c8','2':'#4f5a45','3':'#1e1912'},
  raider:{'3':'#241a14','4':'#a4432c','5':'#6b4a33'}, scrapper:{'3':'#241a14','4':'#8a6a2c','5':'#7d6a4a'},
  gunner:{'3':'#221a16','4':'#77402c','5':'#55605a'}, brute:{'3':'#1d1712','4':'#8e3a28','5':'#5a4a3a'},
  chief:{'3':'#1a1410','4':'#c1452f','5':'#6d5230'}, drone:{'3':'#2b2b2b','4':'#a4432c','5':'#8d97a0'},
  gunship:{'3':'#1f1f22','4':'#c1452f','5':'#6f7a80'}, turret:{'1':'#c8a24a','2':'#4a3a25','3':'#3a3128','5':'#8d97a0'},
  pyro:{'1':'#c9603f','2':'#6b4a33','3':'#241d16'},
};
export const CLASS_PAL = { assault:'cmd', marksman:'gun', engineer:'eng', heavy:'hvy', pyro:'pyro' };
export const FOE_SPRITE = { raider:'foe', scrapper:'foe', gunner:'foe', brute:'brute', chief:'chief', drone:'fly', gunship:'fly' };
export const PXS = 2;
export const sprCache = new Map();
export function baked(name, palKey, white){
  const k = name+'|'+palKey+(white?'|w':'');
  if (sprCache.has(k)) return sprCache.get(k);
  const sp = SPR[name], pal = PAL[palKey];
  const c = document.createElement('canvas');
  c.width = sp[0].length*PXS; c.height = sp.length*PXS;
  const g = c.getContext('2d');
  for (let r=0;r<sp.length;r++) for (let col=0;col<sp[0].length;col++){
    const ch = sp[r][col];
    if (ch === '.' || !pal[ch]) continue;
    g.fillStyle = white ? '#fff6e0' : pal[ch];
    g.fillRect(col*PXS, r*PXS, PXS, PXS);
  }
  sprCache.set(k, c); return c;
}
export function blit(name, palKey, x, y, flash){
  const c = baked(name, palKey, !!flash);
  P.drawImage(c, Math.round(x - c.width/2), Math.round(y - c.height/2));
}
