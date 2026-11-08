/* Rocket-orbit mark. Only the rocket kind from the supplied anim.js. */
(function () {
"use strict";
// Shared animated icons. draw(kind, ctx, sizePx, t) — all motion periodic in T=8s for seamless loops.
const T=8,TAU=Math.PI*2,CY='#5ee7ff',VI='#6d4cff';
function globe(c,S,t,o={}){const R=S*o.r,cx=S/2,cy=S/2;
 // atmosphere glow
 let g=c.createRadialGradient(cx,cy,R*.9,cx,cy,R*1.35);g.addColorStop(0,'rgba(94,231,255,.28)');g.addColorStop(1,'rgba(94,231,255,0)');c.fillStyle=g;c.beginPath();c.arc(cx,cy,R*1.35,0,TAU);c.fill();
 g=c.createRadialGradient(cx-R*.35,cy-R*.4,R*.05,cx,cy,R);g.addColorStop(0,'#3d7bff');g.addColorStop(.45,'#1f3aa8');g.addColorStop(.85,'#14104a');g.addColorStop(1,'#0a0828');
 c.fillStyle=g;c.beginPath();c.arc(cx,cy,R,0,TAU);c.fill();
 // rotating graticule (subtle globe rotation)
 c.save();c.beginPath();c.arc(cx,cy,R,0,TAU);c.clip();c.lineWidth=Math.max(.6,S/400);
 const rot=TAU*t/T/2,tilt=.35;
 for(let k=0;k<12;k++){const lon=k*TAU/12+rot;c.beginPath();let first=true;
  for(let a=-90;a<=90;a+=6){const la=a*Math.PI/180,x=Math.cos(la)*Math.sin(lon),z=Math.cos(la)*Math.cos(lon),y=Math.sin(la);const yy=y*Math.cos(tilt)-z*Math.sin(tilt),zz=y*Math.sin(tilt)+z*Math.cos(tilt);
   if(zz<0){first=true;continue}first?c.moveTo(cx+x*R,cy-yy*R):c.lineTo(cx+x*R,cy-yy*R);first=false}
  c.strokeStyle='rgba(94,231,255,.22)';c.stroke()}
 for(let a=-60;a<=60;a+=30){const la=a*Math.PI/180;c.beginPath();let first=true;for(let l=0;l<=360;l+=6){const lon=l*Math.PI/180,x=Math.cos(la)*Math.sin(lon),z=Math.cos(la)*Math.cos(lon),y=Math.sin(la);const yy=y*Math.cos(tilt)-z*Math.sin(tilt),zz=y*Math.sin(tilt)+z*Math.cos(tilt);if(zz<0){first=true;continue}first?c.moveTo(cx+x*R,cy-yy*R):c.lineTo(cx+x*R,cy-yy*R);first=false}c.strokeStyle='rgba(183,168,255,.16)';c.stroke()}
 if(o.under)o.under(c,cx,cy,R);
 // terminator shading + rim light
 g=c.createLinearGradient(cx-R,cy-R*.6,cx+R,cy+R*.6);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.55,'rgba(0,0,0,.05)');g.addColorStop(1,'rgba(2,3,15,.65)');c.fillStyle=g;c.fillRect(cx-R,cy-R,2*R,2*R);c.restore();
 c.beginPath();c.arc(cx,cy,R,0,TAU);c.strokeStyle='rgba(94,231,255,.55)';c.lineWidth=Math.max(.8,S/220);c.stroke();return{cx,cy,R}}
// orbit in 3D: inclination i about x, then node rotation w about view z
function orb(th,a,i,w){let x=Math.cos(th)*a,y=Math.sin(th)*a*Math.cos(i),z=Math.sin(th)*a*Math.sin(i);return[x*Math.cos(w)-y*Math.sin(w),x*Math.sin(w)+y*Math.cos(w),z]}
const vis=(p,r)=>p[2]>0||Math.hypot(p[0],p[1])>r; // in front or outside disc
const drawFns={
rocket(c,S,t){c.clearRect(0,0,S,S);const r=.27,a=.41,inc=1.18,w=-.42,u=t/T;
 const th=v=>TAU*v+.32*Math.sin(TAU*v)+Math.PI*.5; // eased: faster near perigee-ish, periodic
 const P=v=>orb(th(v),a,inc,w);
 const pass=front=>{const N=70;for(let k=N;k>0;k--){const p0=P(u-k*.0042),p1=P(u-(k-1)*.0042);if((p0[2]>0)!==front&&!(front&&Math.hypot(p0[0],p0[1])>r))continue;if(!vis(p0,r)&&!front)continue;
   if(!front&&p0[2]>0)continue;if(front&&p0[2]<=0&&Math.hypot(p0[0],p0[1])<=r)continue;
   const f=1-k/N;c.strokeStyle=`rgba(${Math.round(94+120*f)},${Math.round(231-60*(1-f))},255,${(f*f*.85).toFixed(3)})`;c.lineWidth=S*(.004+.014*f);c.lineCap='round';c.beginPath();c.moveTo(S/2+p0[0]*S,S/2+p0[1]*S);c.lineTo(S/2+p1[0]*S,S/2+p1[1]*S);c.stroke()}
  const p=P(u),front_=p[2]>0;if(front_===front&&!(front?false:false)){if(!front&&Math.hypot(p[0],p[1])<r)return;const q=P(u+.002),ang=Math.atan2(q[1]-p[1],q[0]-p[0]);const sc=Math.max(S*.06,6)*(1+.18*p[2]/a);
   c.save();c.translate(S/2+p[0]*S,S/2+p[1]*S);c.rotate(ang);c.shadowColor=CY;c.shadowBlur=sc*.8;
   // flame
   const fl=.8+.2*Math.sin(TAU*t*9.5);let g=c.createLinearGradient(-sc*1.6*fl,0,-sc*.5,0);g.addColorStop(0,'rgba(255,170,60,0)');g.addColorStop(1,'rgba(255,220,140,.95)');c.fillStyle=g;c.beginPath();c.moveTo(-sc*.5,-sc*.16);c.lineTo(-sc*1.6*fl,0);c.lineTo(-sc*.5,sc*.16);c.fill();
   // body
   g=c.createLinearGradient(0,-sc*.25,0,sc*.25);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#cfd8ff');g.addColorStop(1,'#7f8bd6');c.fillStyle=g;c.beginPath();c.moveTo(sc*.75,0);c.quadraticCurveTo(sc*.35,-sc*.24,-sc*.5,-sc*.2);c.lineTo(-sc*.5,sc*.2);c.quadraticCurveTo(sc*.35,sc*.24,sc*.75,0);c.fill();
   c.fillStyle=VI;c.beginPath();c.moveTo(-sc*.25,-sc*.2);c.lineTo(-sc*.6,-sc*.42);c.lineTo(-sc*.5,-sc*.18);c.moveTo(-sc*.25,sc*.2);c.lineTo(-sc*.6,sc*.42);c.lineTo(-sc*.5,sc*.18);c.fill();
   c.fillStyle=CY;c.beginPath();c.arc(sc*.22,0,sc*.07,0,TAU);c.fill();c.restore()}};
 // faint orbit path
 const path=front=>{c.beginPath();let d=false;for(let k=0;k<=200;k++){const p=orb(TAU*k/200,a,inc,w);const ok=front?vis(p,r):(p[2]<=0);if(!ok){d=false;continue}d?c.lineTo(S/2+p[0]*S,S/2+p[1]*S):c.moveTo(S/2+p[0]*S,S/2+p[1]*S);d=true}c.strokeStyle=front?'rgba(109,76,255,.35)':'rgba(109,76,255,.15)';c.lineWidth=S/300;c.stroke()};
 path(false);pass(false);globe(c,S,t,{r});path(true);pass(true)}
};

function setup(cv, css) {
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var S = Math.max(1, Math.round(css * dpr));
  cv.width = cv.height = S;
  var ctx = cv.getContext("2d");
  if (!ctx) return null;
  return function (t) { drawFns.rocket(ctx, S, t); };
}
function startBrandOrbit(canvas, fallback) {
  if (!canvas) return;
  function showStill() {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var css = 40;
  var draw = null;
  var raf = 0;
  var running = false;
  function size() {
    css = Math.round(canvas.clientWidth || canvas.parentElement && canvas.parentElement.clientWidth || 40);
    draw = setup(canvas, css);
    if (!draw) showStill();
    return !!draw;
  }
  if (!size()) return;
  function paint(t) { if (draw) draw(t); }
  paint(2.2);
  function loop(now) {
    if (!running) return;
    if (!document.hidden) paint((now / 1000) % T);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (reduceQuery.matches || running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    paint(2.2);
  }
  if (!reduceQuery.matches) start();
  reduceQuery.addEventListener("change", function () {
    if (reduceQuery.matches) stop();
    else start();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    } else if (!reduceQuery.matches) start();
  });
  window.addEventListener("resize", function () {
    var next = Math.round(canvas.clientWidth || css);
    if (Math.abs(next - css) > 2) size();
    paint(reduceQuery.matches ? 2.2 : (performance.now() / 1000) % T);
  });
}
window.startBrandOrbit = startBrandOrbit;
})();
