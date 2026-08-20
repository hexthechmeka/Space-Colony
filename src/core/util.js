export const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
export const now = () => Date.now();
export const rnd = (a,b) => a + Math.random()*(b-a);
export const lerp = (a,b,t) => a + (b-a)*t;
export const dist = (ax,ay,bx,by) => Math.hypot(ax-bx, ay-by);
export const fmt = n => {
  n = Math.floor(n);
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e4) return (n/1e3).toFixed(1)+'k';
  return n.toLocaleString('ko-KR');
};
export const fmtDur = ms => {
  const s = Math.max(0, Math.floor(ms/1000));
  const h = Math.floor(s/3600), m = Math.floor(s%3600/60);
  if (h) return h+'시간 '+m+'분';
  if (m) return m+'분 '+(s%60)+'초';
  return s+'초';
};
