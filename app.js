/* Interfaz sin dependencias; funciona también al abrir index.html directamente. */
'use strict';
const $=id=>document.getElementById(id), P=PitotPhysics;
const FAULTS=[
 {id:'normal',name:'Sistema normal',detail:'Pitot y toma estática libres',explain:'Las tres indicaciones responden normalmente a las condiciones de vuelo.'},
 {id:'pitot-open',name:'Entrada Pitot obstruida',detail:'Drenaje libre',explain:'La línea Pitot se iguala con la presión exterior por el drenaje. La diferencia Pt − Ps se anula y el anemómetro indica cero. Altímetro y VSI funcionan normalmente.'},
 {id:'pitot-closed',name:'Pitot y drenaje obstruidos',detail:'Presión total atrapada',explain:'La presión total queda atrapada. Cambiar solo la velocidad no cambia la indicación. Al ascender, la presión estática baja y la velocidad indicada aumenta; al descender, disminuye.'},
 {id:'static',name:'Toma estática obstruida',detail:'Presión estática atrapada',explain:'El altímetro permanece en la altitud de bloqueo y el VSI estabilizado indica cero. Manteniendo la velocidad de referencia, el anemómetro subindica al ascender y sobreindica al descender.'},
 {id:'leak',name:'Fuga en línea estática',detail:'Depresión de cabina idealizada',explain:'En este modelo, la línea estática recibe una presión menor que la exterior. El altímetro y el anemómetro indican valores mayores; el VSI sigue la variación de esa presión con el vuelo. El efecto real depende de la presión de cabina y de la fuga.'}
];
const state={speed:110,altitude:3500,vs:0,fault:'pitot-open',leakBias:200,running:false,elapsed:0,exam:false,revealed:false,caseName:'Práctica libre',scored:false};
state.trapped=P.capture(state);
let diagram=false,history=[],storageAvailable=true,last=performance.now(),renderAt=0;
try{const data=JSON.parse(localStorage.getItem('pitot-static-results-v1')||'[]');history=Array.isArray(data)?data.filter(r=>r&&typeof r.fault==='string'&&typeof r.correct==='boolean'&&typeof r.date==='string').slice(-200):[];}catch{storageAvailable=false;}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const faultBy=id=>FAULTS.find(f=>f.id===id)||FAULTS[0];
const fmt=n=>Math.round(n).toLocaleString('es-PE');
function svgText(x,y,txt,size=14,extra=''){return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" fill="#e5ebed" font-family="Arial,sans-serif" ${extra}>${txt}</text>`;}
function polar(r,a){const t=a*Math.PI/180;return [120+r*Math.sin(t),120-r*Math.cos(t)];}
function makeGauge(id,type){
 let ticks='',labels='';
 const spec=type==='speed'?{min:0,max:220,step:5,start:-135,sweep:270}:type==='alt'?{min:0,max:100,step:1,start:0,sweep:360}:{min:-2000,max:2000,step:100,start:-220,sweep:260};
 for(let n=spec.min;n<=spec.max;n+=spec.step){if(type==='alt'&&n===100)continue;const a=spec.start+(n-spec.min)/(spec.max-spec.min)*spec.sweep;const major=type==='speed'?n%20===0:type==='alt'?n%10===0:n%500===0;const [x1,y1]=polar(major?84:90,a),[x2,y2]=polar(98,a);ticks+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#e9eff0" stroke-width="${major?2:1}"/>`;if(major){const [tx,ty]=polar(type==='alt'?72:69,a);const value=type==='alt'?n/10:type==='vs'?Math.abs(n/100):n;labels+=svgText(tx,ty+5,value,type==='speed'?13:16);}}
 // El VSI recorre de abajo a arriba por el lado izquierdo: -2000 abajo, 0 izquierda, +2000 arriba.
 const units=type==='speed'?'kt':type==='alt'?'FEET':'×100 ft/min';
 const title=type==='speed'?'AIRSPEED':type==='alt'?'ALT':'VERTICAL SPEED';
 $(id).innerHTML=`<svg viewBox="0 0 240 240" aria-hidden="true"><defs><radialGradient id="face-${type}"><stop stop-color="#343a3d"/><stop offset="1" stop-color="#121719"/></radialGradient><linearGradient id="rim-${type}" x2="1" y2="1"><stop stop-color="#7a8287"/><stop offset=".23" stop-color="#151b20"/><stop offset=".7" stop-color="#555f64"/><stop offset="1" stop-color="#080e12"/></linearGradient></defs><circle cx="120" cy="120" r="118" fill="url(#rim-${type})"/><circle cx="120" cy="120" r="110" fill="#080e12" stroke="#6b7377"/><circle cx="120" cy="120" r="104" fill="url(#face-${type})"/>${ticks}${labels}${svgText(120,type==='alt'?85:90,title,type==='vs'?10:12)}${svgText(120,155,units,11)}${type==='alt'?svgText(155,130,'1013',9):''}${type==='vs'?svgText(160,110,'UP +',9)+svgText(160,135,'DN −',9):''}<g id="needle-${type}-small" ${type==='alt'?'':'visibility="hidden"'}><path d="M115 133 L116 68 L120 56 L124 68 L125 133Z" fill="#c6d1d6" stroke="#080e12"/></g><g id="needle-${type}-tiny" ${type==='alt'?'':'visibility="hidden"'}><path d="M120 24 L114 40 L126 40Z" fill="#aebac1"/></g><g id="needle-${type}"><path d="M116 135 L117 39 L120 28 L123 39 L124 135Z" fill="#f8f6e8" stroke="#41474b" stroke-width="1"/></g><circle cx="120" cy="120" r="8" fill="#333b3f" stroke="#050a0c"/><circle cx="118" cy="118" r="2" fill="#71818a"/><path d="M40 50 Q120 -5 199 50" fill="none" stroke="#fff" stroke-width="2" opacity=".08"/></svg>`;
}
makeGauge('gauge-speed','speed');makeGauge('gauge-alt','alt');makeGauge('gauge-vs','vs');
$('fault-options').innerHTML=FAULTS.map(f=>`<label class="fault-option" data-fault="${f.id}"><input type="radio" name="fault" value="${f.id}" ${f.id===state.fault?'checked':''}><span><b>${f.name}</b><small>${f.detail}</small></span></label>`).join('');
$('diagnosis').insertAdjacentHTML('beforeend',FAULTS.map(f=>`<option value="${f.id}">${f.name}${f.id==='pitot-open'?' (drenaje libre)':''}</option>`).join(''));
function resetFeedback(){state.scored=false;$('check').disabled=false;$('feedback').hidden=true;$('diagnosis').value='';}
function setFault(id){state.trapped=P.capture(state);state.fault=id;resetFeedback();if(id==='static'||id==='leak'||id.startsWith('pitot'))setDiagram(false);else render();}
$('fault-options').addEventListener('click',e=>{if(e.target.name==='fault'&&e.target.value===state.fault&&(state.fault==='static'||state.fault==='leak'||state.fault.startsWith('pitot')))setDiagram(false);});
$('fault-options').addEventListener('change',e=>{if(e.target.name==='fault')setFault(e.target.value);});
for(const key of ['speed','altitude','vs']){
 const input=$(key),range=$(key+'-range');
 const update=(source)=>{if(source.value.trim()===''||!Number.isFinite(Number(source.value)))return;state[key]=P.clamp(Number(source.value),Number(input.min),Number(input.max));input.value=key==='altitude'?Math.round(state[key]):state[key];range.value=state[key];render();};
 input.addEventListener('input',()=>update(input));range.addEventListener('input',()=>update(range));input.addEventListener('blur',()=>{input.value=Math.round(state[key]);});
}
$('leak-bias').addEventListener('input',e=>{if(e.target.value==='')return;state.leakBias=P.clamp(Number(e.target.value),0,500);e.target.value=state.leakBias;render();});
$('leak-bias').addEventListener('blur',()=>{$('leak-bias').value=state.leakBias;});
$('toggle-run').addEventListener('click',()=>{state.running=!state.running;last=performance.now();render();});
$('level').addEventListener('click',()=>{state.vs=0;syncInputs();render();});
function syncInputs(){for(const k of ['speed','altitude','vs']){$(k).value=Math.round(state[k]);$(k+'-range').value=state[k];}$('leak-bias').value=state.leakBias;}
function reset(){Object.assign(state,{speed:110,altitude:3500,vs:0,leakBias:200,running:false,elapsed:0});if(!state.exam)state.fault='pitot-open';else {const initial=scenarios.find(c=>c.fault===state.fault);if(initial)Object.assign(state,{speed:initial.speed,altitude:initial.altitude,vs:initial.vs});}state.trapped=P.capture(state);state.revealed=false;resetFeedback();syncInputs();$('inspection').textContent='Selecciona una toma para inspeccionarla o abre la vista del circuito.';render();}
$('reset').addEventListener('click',reset);
function setDiagram(value){diagram=value;$('show-aircraft').classList.toggle('selected',!value);$('show-diagram').classList.toggle('selected',value);$('circuit').hidden=!value;$('aircraft-stage').hidden=value;render();}
$('show-aircraft').addEventListener('click',()=>setDiagram(false));$('show-diagram').addEventListener('click',()=>setDiagram(true));
function drawCircuit(read,visible){
 const fault=visible?state.fault:'normal',bp=fault.startsWith('pitot'),bs=fault==='static',leak=fault==='leak';
 $('circuit').innerHTML=`<svg viewBox="0 0 820 240" role="img" aria-label="Circuito funcional: Pitot conectado solo al anemómetro; toma estática conectada a los tres instrumentos."><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#344458"/></pattern></defs><rect width="820" height="240" fill="url(#dots)"/><path class="pipe" stroke="${bp?'#ffba42':'#13d4da'}" d="M120 65 H295 V85 H365"/><path class="pipe" stroke="${bs?'#ffba42':'#329ef5'}" d="M120 185 H690 M320 185 V125 H365 M525 185 V125 M690 185 V125"/><path class="flow ${bp?'blocked':''}" d="M120 65 H295 V85 H365"/><path class="flow ${bs?'blocked':''}" d="M120 185 H690"/><rect x="12" y="35" width="110" height="60" rx="8" fill="#142b40" stroke="${bp?'#ffba42':'#13d4da'}"/><rect x="12" y="154" width="110" height="60" rx="8" fill="#142b40" stroke="${bs||leak?'#ffba42':'#329ef5'}"/>${svgText(67,60,'TUBO PITOT',12)}${svgText(67,80,bp?'OBSTRUIDO':'LIBRE',10)}${svgText(67,180,'TOMA ESTÁTICA',10)}${svgText(67,199,bs?'OBSTRUIDA':'LIBRE',10)}${[415,550,690].map((x,i)=>`<rect x="${x-50}" y="60" width="100" height="65" rx="8" fill="#172d43" stroke="#557188"/>${svgText(x,86,['ANEMÓMETRO','ALTÍMETRO','VARIÓMETRO'][i],10)}${svgText(x,108,['Pt − Ps','Ps','ΔPs / Δt'][i],12)}`).join('')}${visible?svgText(215,45,`Pt ${fmt(read.pt)} Pa`,10)+svgText(215,225,`Ps ${fmt(read.ps)} Pa`,10):svgText(400,225,'Conexión normal · falla oculta hasta responder',10)}${bp?svgText(180,73,'×',28):''}${bs?svgText(180,193,'×',28):''}${leak?`<path d="M270 185 V215" stroke="#ffba42" stroke-width="3"/>${svgText(320,221,'FUGA',10)}`:''}</svg>`;
}
// Coordenadas normalizadas de las dos tomas en assets/aircraft-v2.png.
// Las coordenadas del recuadro se refieren a cada fotografía de detalle.
const COMPONENTS={
 pitot:{x:.7596,y:.3858,image:'assets/pitot-detail.png',title:'Tubo Pitot',position:'Bajo el ala izquierda, hacia el exterior del montante.',photoX:30,photoY:55},
 pitotClosed:{x:.7596,y:.3858,image:'assets/pitot-dual-blocked.png',title:'Pitot y drenaje',position:'Bajo el ala izquierda. 1: entrada frontal. 2: drenaje de humedad en la cara inferior del tubo.',photoX:30.3,photoY:54.4},
 static:{x:.3445,y:.5505,image:'assets/static-detail.png',title:'Toma estática',position:'Lateral izquierdo delantero del fuselaje, detrás del carenado del motor y antes de la puerta.',photoX:50,photoY:46.8},
 leak:{x:.3445,y:.5505,title:'Línea estática a cabina',position:'La línea azul une la toma estática con los instrumentos. El punto ámbar representa una fuga en la tubería, no una toma obstruida.'}
};
let currentDetail='';
function updateFaultDetail(visible){
 const part=visible&&!diagram?(state.fault==='pitot-closed'?'pitotClosed':state.fault==='pitot-open'?'pitot':state.fault==='static'?'static':state.fault==='leak'?'leak':''):'';
 const isLeak=part==='leak',dual=part==='pitotClosed';
 const detail=$('fault-detail');detail.classList.toggle('dual-blockage',dual);detail.hidden=!part;$('callout-connector').toggleAttribute('hidden',!part);
 $('scene').classList.toggle('has-detail',Boolean(part));$('scene').classList.toggle('show-leak-route',isLeak);
 $('leak-route').toggleAttribute('hidden',!isLeak);$('leak-route-key').hidden=!isLeak;$('pressure-legend').hidden=isLeak;
 $('detail-photo').hidden=isLeak;$('leak-detail').hidden=!isLeak;
 for(const id of ['drain-ring','drain-arrow','intake-label','drain-label'])$(id).hidden=!dual;
 if(part){const data=COMPONENTS[part];if(currentDetail!==part){
  if(!isLeak){$('detail-image').style.opacity='0';$('detail-image').src=data.image;$('detail-image').alt=dual?'Entrada frontal del Pitot y drenaje inferior de humedad, ambos obstruidos con depósitos, identificados como 1 y 2':part==='pitot'?'Acercamiento al tubo Pitot bajo el ala; círculo sobre su entrada frontal':'Acercamiento a la toma estática; círculo sobre el orificio central del disco en el fuselaje';$('detail-ring').style.left=data.photoX+'%';$('detail-ring').style.top=data.photoY+'%';$('detail-arrow').style.left=(data.photoX+16)+'%';$('detail-arrow').style.top=(data.photoY+4)+'%';}
  $('detail-title').textContent=data.title;
 }
 $('detail-badge').textContent=isLeak?'Toma libre · fuga en tubería':part==='static'?'Toma obstruida':dual?'Dos orificios obstruidos':'Entrada obstruida · drenaje libre';
 $('detail-description').textContent=data.position;
 detail.querySelector('.illustration-note').textContent=isLeak?'Trayecto didáctico · instalación simplificada':'Detalle ilustrativo · obstrucción simulada';
 }
 currentDetail=part;layoutAircraft();
}
function layoutAircraft(){
 if($('view-simulador').hidden||diagram)return;
 const scene=$('scene'),w=scene.clientWidth,h=scene.clientHeight;
 if(!w||!h)return;
 const reserve=currentDetail?(w<500?140:190):0;
 const image=$('aircraft-image'),ratio=image.naturalWidth&&image.naturalHeight?image.naturalWidth/image.naturalHeight:1672/941;
 const sw=Math.min(w-reserve-10,(h-54)*ratio),sh=sw/ratio;
 const left=reserve+(w-reserve-sw)/2,top=(h-sh)/2;
 const stage=$('aircraft-stage');Object.assign(stage.style,{left:left+'px',top:top+'px',width:sw+'px',height:sh+'px'});
 const angle=state.vs>0?3:state.vs<0?-3:0;
 stage.style.transform=`rotate(${angle}deg)`;
 for(const part of ['pitot','static']){const point=COMPONENTS[part];
  const button=stage.querySelector('[data-part="'+part+'"]');button.style.left=point.x*100+'%';button.style.top=point.y*100+'%';
 }
 if(!currentDetail)return;
 const point=COMPONENTS[currentDetail],rad=angle*Math.PI/180;
 const dx=(point.x-.5)*sw,dy=(point.y-.5)*sh;
 const tx=left+sw/2+dx*Math.cos(rad)-dy*Math.sin(rad),ty=top+sh/2+dx*Math.sin(rad)+dy*Math.cos(rad);
 const box=$('fault-detail'),sx=box.offsetLeft+box.offsetWidth,sy=box.offsetTop+48;
 $('callout-connector').setAttribute('viewBox',`0 0 ${w} ${h}`);
 $('connector-path').setAttribute('d',`M ${sx} ${sy} L ${sx+12} ${sy} L ${tx} ${ty}`);
 $('connector-target').setAttribute('cx',tx);$('connector-target').setAttribute('cy',ty);
}
new ResizeObserver(layoutAircraft).observe($('scene'));
$('aircraft-image').addEventListener('load',layoutAircraft);
$('detail-image').addEventListener('load',()=>{$('detail-image').style.opacity='1';});
function render(){
 const r=P.indications(state),visible=!state.exam||state.revealed;
 $('out-speed').textContent=fmt(r.speed)+' kt';$('out-alt').textContent=fmt(r.altitude)+' ft';$('out-vs').textContent=(r.vs>0?'+':'')+fmt(r.vs)+' ft/min';
 $('gauge-speed').setAttribute('aria-label','Anemómetro: '+$('out-speed').textContent);$('gauge-alt').setAttribute('aria-label','Altímetro: '+$('out-alt').textContent);$('gauge-vs').setAttribute('aria-label','Variómetro: '+$('out-vs').textContent);
 $('needle-speed').setAttribute('transform',`rotate(${-135+P.clamp(r.speed,0,220)/220*270} 120 120)`);
 $('needle-alt').setAttribute('transform',`rotate(${r.altitude/1000*360} 120 120)`);$('needle-alt-small').setAttribute('transform',`rotate(${r.altitude/10000*360} 120 120)`);$('needle-alt-tiny').setAttribute('transform',`rotate(${r.altitude/100000*360} 120 120)`);
 $('needle-vs').setAttribute('transform',`rotate(${-90+P.clamp(r.vs,-2000,2000)/2000*130} 120 120)`);
 const warnings=[];if(r.speed>220)warnings.push('Anemómetro fuera de escala (>220 kt): consulta la lectura numérica.');if(r.underRange)warnings.push('Pt < Ps: diferencia negativa; el anemómetro se limita a cero.');if(Math.abs(r.vs)>2000)warnings.push('VSI fuera de escala: consulta la lectura numérica.');$('range-warning').hidden=!warnings.length;$('range-warning').textContent=warnings.join(' ');
 const phase=state.vs>0?'Ascenso':state.vs<0?'Descenso':'Vuelo nivelado';$('flight-text').textContent=phase;$('flight-direction').textContent=(state.vs>0?'↗ ':state.vs<0?'↘ ':'→ ')+phase;
 // La imagen y sus marcas comparten posición y rotación; no se recortan.
 $('elapsed').textContent=String(Math.floor(state.elapsed/60)).padStart(2,'0')+':'+String(Math.floor(state.elapsed%60)).padStart(2,'0');
 $('toggle-run').textContent=state.running?'Ⅱ Pausar vuelo':'▶ Iniciar vuelo';$('run-status').innerHTML=`<i class="live-dot"></i>${state.running?'Escenario en ejecución':'Escenario en pausa'}`;
 $('scene').className='scene '+(visible?(state.fault.startsWith('pitot')?'fault-pitot':state.fault==='static'?'fault-static':''):'')+(state.running?'':' paused');
 $('scene-state').textContent=visible?faultBy(state.fault).name:'Caso de diagnóstico · falla oculta';
 $('fault-options').hidden=state.exam;$('fault-tag').hidden=state.exam;$('exam-note').hidden=!state.exam;$('free-mode').hidden=!state.exam;
 $('leak-control').hidden=state.fault!=='leak'||state.exam;$('fault-tag').textContent=state.fault==='normal'?'Sin fallas':'1 activa';$('mode-label').textContent=state.exam?'Caso de diagnóstico':'Modo práctica';
 document.querySelectorAll('.fault-option').forEach(el=>{const checked=el.dataset.fault===state.fault;el.classList.toggle('active',checked);el.querySelector('input').checked=checked;});
 $('trapped-note').textContent=visible&&(state.fault==='static'||state.fault==='pitot-closed')?`Presión atrapada a ${fmt(state.trapped.altitude)} ft. Para capturar otra condición, selecciona primero «Sistema normal» y reactiva la falla.`:'';
 updateFaultDetail(visible);
 if(diagram)drawCircuit(r,visible);
}
const scenarios=[{fault:'pitot-open',title:'01 · Indicación de velocidad nula',brief:'En vuelo nivelado, el anemómetro ha dejado de responder. Comprueba qué instrumentos se ven afectados.',speed:110,altitude:3500,vs:0},{fault:'static',title:'02 · Instrumentos sin respuesta vertical',brief:'La aeronave asciende, pero algunas indicaciones no siguen el movimiento. Observa el cambio con el tiempo.',speed:120,altitude:3500,vs:1000},{fault:'pitot-closed',title:'03 · Velocidad que cambia con la altitud',brief:'La velocidad de referencia se mantiene. Analiza por qué la velocidad indicada varía al ascender.',speed:110,altitude:4000,vs:1000}];
$('practice-cards').innerHTML=scenarios.map((s,i)=>`<article class="card"><span class="step">0${i+1}</span><h2>${s.title.slice(5)}</h2><p>${s.brief}</p><button class="primary" data-practice="${i}">Iniciar caso →</button></article>`).join('');
$('practice-cards').addEventListener('click',e=>{const button=e.target.closest('[data-practice]');if(!button)return;const s=scenarios[Number(button.dataset.practice)];Object.assign(state,{speed:s.speed,altitude:s.altitude,vs:s.vs,fault:s.fault,exam:true,revealed:false,caseName:s.title,elapsed:0,running:true});state.trapped=P.capture(state);resetFeedback();syncInputs();last=performance.now();$('task-text').textContent=s.brief;$('inspection').textContent='Inspección visual reservada hasta comprobar el diagnóstico.';location.hash='simulador';render();});
$('free-mode').addEventListener('click',()=>{state.exam=false;state.revealed=false;state.caseName='Práctica libre';$('task-text').textContent='Compara las indicaciones y selecciona la causa probable.';reset();});
$('check').addEventListener('click',()=>{
 const answer=$('diagnosis').value;$('feedback').hidden=false;if(!answer){$('feedback').className='wrong';$('feedback').textContent='Selecciona un diagnóstico antes de comprobarlo.';return;}
 const correct=answer===state.fault;$('feedback').className=correct?'':'wrong';$('feedback').textContent=(correct?'✓ Diagnóstico correcto. ':'Revisa tu diagnóstico. La condición es: '+faultBy(state.fault).name+'. ')+faultBy(state.fault).explain;
 state.revealed=true;if(!state.scored){history.push({date:new Date().toISOString(),mode:state.exam?state.caseName:'Práctica libre',fault:state.fault,answer,correct,speed:state.speed,altitude:Math.round(state.altitude),vs:state.vs});history=history.slice(-200);try{localStorage.setItem('pitot-static-results-v1',JSON.stringify(history));}catch{storageAvailable=false;}state.scored=true;}$('check').disabled=true;render();
});
function inspect(part){$('part-title').textContent=part==='pitot'?'Inspección del tubo Pitot':'Inspección de la toma estática';let text;if(state.exam&&!state.revealed)text='Durante el caso de diagnóstico, utiliza las indicaciones para inferir la falla. La inspección se habilita después de comprobar tu respuesta.';else if(part==='pitot')text=state.fault==='pitot-open'?'Entrada obstruida, drenaje libre. La presión se iguala con el exterior: el anemómetro indica cero.':state.fault==='pitot-closed'?'Entrada y drenaje obstruidos. La presión total queda atrapada al activar la falla.':'Entrada y drenaje libres. La presión total alimenta únicamente al anemómetro.';else text=state.fault==='static'?'La toma estática está obstruida. La presión atrapada alimenta al altímetro, al VSI y a la referencia estática del anemómetro.':state.fault==='leak'?'La toma exterior está libre; existe una fuga en la tubería hacia una cabina con presión menor que la exterior (modelo ajustable).':'La toma estática está libre. Suministra la presión ambiente a los tres instrumentos.';$('part-body').textContent=text;$('inspection').textContent=text;$('part-dialog').showModal();}
 document.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.part)));$('close-dialog').addEventListener('click',()=>$('part-dialog').close());
function renderResults(){const good=history.filter(x=>x.correct).length;$('stats').innerHTML=[['Intentos',history.length],['Aciertos',good],['Precisión',history.length?Math.round(good/history.length*100)+'%':'—']].map(([label,v])=>`<div class="stat"><strong>${v}</strong><span>${label}</span></div>`).join('');$('history').innerHTML=history.length?[...history].reverse().map(r=>`<tr><td>${esc(new Date(r.date).toLocaleString('es-PE'))}</td><td>${esc(r.mode)}</td><td>${esc(faultBy(r.fault).name)}</td><td>${esc(faultBy(r.answer).name)}</td><td>${r.correct?'✓ Correcto':'× Por revisar'}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">Aún no hay intentos. Resuelve un diagnóstico para comenzar.</td></tr>';$('storage-note').textContent=storageAvailable?'Historial local · hasta 200 intentos.':'El navegador no permite guardar resultados; solo se conservarán durante esta sesión. Exporta el CSV antes de cerrar.';$('export').disabled=!history.length;$('clear-results').disabled=!history.length;}
$('export').addEventListener('click',()=>{const rows=[['Fecha','Modalidad','Falla','Respuesta','Correcto','Referencia kt','Altitud ft','Vertical ft/min'],...history.map(r=>[r.date,r.mode,faultBy(r.fault).name,faultBy(r.answer).name,r.correct?'Sí':'No',r.speed,r.altitude,r.vs])];const csv='\uFEFF'+rows.map(row=>row.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),a=document.createElement('a');a.href=url;a.download='resultados-pitot-static.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('clear-results').addEventListener('click',()=>{if(!confirm('¿Borrar todos los intentos guardados en este navegador?'))return;history=[];try{localStorage.removeItem('pitot-static-results-v1');}catch{storageAvailable=false;}renderResults();});
function route(){let name=location.hash.slice(1)||'simulador';if(!['inicio','simulador','practicas','resultados','ayuda'].includes(name))name='simulador';document.querySelectorAll('.view').forEach(el=>{el.hidden=el.id!=='view-'+name;});document.querySelectorAll('.sidebar a').forEach(el=>el.classList.toggle('active',el.hash==='#'+name));if(name!=='simulador')state.running=false;if(name==='resultados')renderResults();render();}
window.addEventListener('hashchange',route);
document.addEventListener('visibilitychange',()=>{if(document.hidden){state.running=false;render();}last=performance.now();});
function tick(now){const dt=Math.min((now-last)/1000,0.25);last=now;if(state.running){state.elapsed+=dt;state.altitude=P.clamp(state.altitude+state.vs/60*dt,0,18000);if((state.altitude===0&&state.vs<0)||(state.altitude===18000&&state.vs>0))state.vs=0;if(now-renderAt>100){if(document.activeElement!==$('altitude'))$('altitude').value=Math.round(state.altitude);$('altitude-range').value=state.altitude;$('vs').value=state.vs;$('vs-range').value=state.vs;render();renderAt=now;}}requestAnimationFrame(tick);}
route();requestAnimationFrame(tick);
