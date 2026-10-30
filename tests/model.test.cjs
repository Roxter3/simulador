// Ejecutar: node tests/model.test.cjs (Node.js solo se necesita para estas pruebas).
const assert=require('node:assert/strict');
const p=require('../physics.js');
const close=(actual,expected,tol=1e-5)=>assert.ok(Math.abs(actual-expected)<tol,`${actual} != ${expected}`);
function setup(fault='normal'){const s={speed:110,altitude:3500,vs:500,fault,leakBias:200};s.trapped=p.capture(s);return s;}
for(const h of [0,3500,10000,18000])close(p.altitude(p.pressure(h)),h);
let s=setup(),r=p.indications(s);close(r.speed,110);close(r.altitude,3500);close(r.vs,500);
s=setup('pitot-open');for(const speed of [0,80,220]){s.speed=speed;r=p.indications(s);close(r.speed,0);close(r.altitude,3500);close(r.vs,500);}
s=setup('pitot-closed');s.speed=180;close(p.indications(s).speed,110);s.altitude=4000;assert.ok(p.indications(s).speed>110);s.altitude=3000;assert.ok(p.indications(s).speed<110);
s=setup('static');s.altitude=3700;r=p.indications(s);close(r.altitude,3500);close(r.vs,0);assert.ok(r.speed<110);s.altitude=3300;assert.ok(p.indications(s).speed>110);s.altitude=18000;assert.ok(p.indications(s).underRange);close(p.indications(s).speed,0);
s=setup('leak');r=p.indications(s);assert.ok(r.altitude>3500);assert.ok(r.speed>110);assert.ok(r.vs>0);s.leakBias=0;r=p.indications(s);close(r.speed,110);close(r.altitude,3500);close(r.vs,500,0.01);
for(const fault of ['normal','pitot-open','pitot-closed','static','leak'])for(const h of [0,9000,18000])for(const v of [0,110,220]){s=setup(fault);s.altitude=h;s.speed=v;r=p.indications(s);for(const key of ['speed','altitude','vs','ps','pt'])assert.ok(Number.isFinite(r[key]));assert.ok(r.speed>=0);}
console.log('Modelo: pruebas de presión, conversión, 5 estados y límites correctas.');
