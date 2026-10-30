/* Modelo educativo: ISA, QNH 1013.25 hPa, flujo incompresible.
 * speed = velocidad equivalente de referencia (kt), altitude = ft, vs = ft/min.
 * No incluye posición de tomas, compresibilidad ni dinámica mecánica del VSI. */
(function (root) {
  'use strict';
  const RHO0=1.225, KNOT=0.514444, FT=0.3048;
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  function pressure(h){return 101325*Math.pow(1-2.25577e-5*h*FT,5.25588);}
  function altitude(p){return (1-Math.pow(p/101325,1/5.25588))/2.25577e-5/FT;}
  function total(s){return pressure(s.altitude)+0.5*RHO0*Math.pow(s.speed*KNOT,2);}
  function capture(s){return {ps:pressure(s.altitude),pt:total(s),altitude:s.altitude};}
  function indications(s){
    const ps=pressure(s.altitude);let sensedStatic=ps, sensedTotal=total(s);
    if(s.fault==='pitot-open') sensedTotal=ps;
    if(s.fault==='pitot-closed') sensedTotal=s.trapped.pt;
    if(s.fault==='static') sensedStatic=s.trapped.ps;
    if(s.fault==='leak') sensedStatic=ps-Number(s.leakBias||0);
    const differential=sensedTotal-sensedStatic;
    const indicatedAltitude=altitude(sensedStatic);
    let vertical=s.fault==='static'?0:s.vs;
    if(s.fault==='leak'){
      // Derivada de altitud indicada respecto a la altitud real.
      vertical=s.vs*(altitude(pressure(s.altitude+0.5)-Number(s.leakBias||0))-altitude(pressure(s.altitude-0.5)-Number(s.leakBias||0)));
    }
    return {speed:Math.sqrt(Math.max(0,differential)*2/RHO0)/KNOT,altitude:indicatedAltitude,vs:vertical,ps:sensedStatic,pt:sensedTotal,differential,underRange:differential<0};
  }
  const api={pressure,altitude,total,capture,indications,clamp};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.PitotPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
