import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

const $=s=>document.querySelector(s);
const products={
 QW01:{number:'OBJECT 01 / THE MOOD MAKER',title:'Bathroom Mood Department',copy:'Some moments deserve a soundtrack. A walnut sign, five wooden buttons, and a small musical response to your current situation. From “Please Hold” to “Disco Emergency,” the bathroom has a department for that.',accent:'#F2E86D'},
 QW05:{number:'OBJECT 02 / THE SLOW LISTENER',title:'Sound Library',copy:'Choose your atmosphere by hand. Slide in a wooden cartridge and let the room become rain on a tin roof, a kitchen disco, or a Sunday with absolutely no plans. A small ritual for leaving the scroll behind.',accent:'#F3B7C6'},
 QW07:{number:'OBJECT 03 / THE PEACE KEEPER',title:'Domestic Peace Treaty',copy:'Energy: low. Tolerance: thin. Dinner: unresolved. Turn two wooden dials, press Negotiate, and invite a handsome little box to make a household suggestion. “TAKEAWAY. NO DEBATE.” Diplomacy has rarely looked this good.',accent:'#F2E86D'}
};
const stage=$('#stage'),host=$('#canvas-host'),range=$('#explode-range'),partSelect=$('#part-select'),tip=$('#hover-tip');
let renderer,scene,camera,controls,root,parts=[],groups=new Map(),currentId='',loadSerial=0,selected='',hovered='',amount=0,desired=0,baseSpan=1,expandedSpan=1,baseCentre=new THREE.Vector3(),expandedCentre=new THREE.Vector3(),lastCentre=new THREE.Vector3();
let ground,baseFloor=0,expandedFloor=0,animating=false,dirty=true,lastTime=0,zoomFactor=1;
const cache=new Map(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const direction=new THREE.Vector3(1,.78,1.38).normalize();

function setStory(id){
 const p=products[id];currentId=id;
 $('#object-number').textContent=p.number;$('#product-title').textContent=p.title;$('#product-copy').textContent=p.copy;
 document.documentElement.style.setProperty('--accent',p.accent);
 $('#brief-link').href=`briefs/${id}-shop-brief.pdf`;
 $('#fallback').src=`assets/${id}.png`;$('#fallback').alt=`${p.title} concept render`;
 document.querySelectorAll('[data-product]').forEach(b=>{const active=b.dataset.product===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active)});
}
function resetDescription(){
 $('#part-title').textContent='The whole is lovely. So are the parts.';
 $('#part-copy').textContent='Drag to turn. Scroll or pinch to zoom. Hover over a piece—or tap it—to see what it does.';
}
function setPart(id,temporary=false){
 if(!temporary){selected=id;partSelect.value=id;}
 const g=groups.get(id);
 if(g){$('#part-title').textContent=g.title;$('#part-copy').textContent=g.description;}else resetDescription();
 for(const m of parts){const active=m.userData.partId===id;for(const mat of Array.isArray(m.material)?m.material:[m.material]){if(mat.emissive){mat.emissive.set(active?'#3f55bc':'#000000');mat.emissiveIntensity=active?.32:0;}}}
 dirty=true;requestDraw();
}
function updateAmountUI(){
 const pct=Math.round(desired*100);range.value=pct;$('#explode-output').value=`${pct}%`;
 range.setAttribute('aria-valuetext',pct===0?'Assembled':pct===100?'Fully exploded':`${pct} percent exploded`);
 $('#assembled').classList.toggle('selected',pct===0);$('#assembled').setAttribute('aria-pressed',pct===0);
 $('#exploded').classList.toggle('selected',pct>0);$('#exploded').setAttribute('aria-pressed',pct>0);
 $('#view-tag').textContent=pct===0?'ASSEMBLED':pct===100?'EXPLODED':'COMING APART';
}
function explode(value){desired=value;updateAmountUI();tip.hidden=true;hovered='';requestDraw();}
function resize(){
 if(!renderer)return;const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
 renderer.setSize(width,height,false);updateFrustum();dirty=true;requestDraw();
}
function updateFrustum(){
 const w=host.clientWidth,h=host.clientHeight,aspect=w/h;
 const span=THREE.MathUtils.lerp(baseSpan,expandedSpan,amount);
 const half=span*.5/Math.min(1,aspect)*zoomFactor;
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
 camera.updateProjectionMatrix();
}
function frameModel(resetRotation=true){
 if(!root)return;
 const centre=baseCentre.clone().lerp(expandedCentre,amount);
 controls.target.copy(centre);lastCentre.copy(centre);
 if(resetRotation)camera.position.copy(centre).addScaledVector(direction,5);
 camera.zoom=1;zoomFactor=1;camera.lookAt(centre);controls.update();updateFrustum();dirty=true;requestDraw();
}
function grain(mat,mesh){
 if(!/walnut|ash/i.test(mat.name))return;
 mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox,size=bounds.getSize(new THREE.Vector3());
 const across=/long-grain Y/i.test(mat.name)?'p.x':'p.y';
 mat.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 woodPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nwoodPosition = position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 woodPosition;\nfloat qsNoise(vec3 p){ return sin(p.x*3.13+sin(p.y*1.73))*sin(p.z*2.19+p.y); }`)
   .replace('#include <color_fragment>',`#include <color_fragment>\nvec3 p=woodPosition*170.0;float drift=qsNoise(p*.33)*.42;float broad=sin(${across}*4.0+drift+sin(p.x*.24)*.3);float fine=sin(${across}*36.0+drift*5.0+sin(p.x*.43));float grainTone=.90+.13*broad+.055*fine;diffuseColor.rgb*=grainTone;`);
 };mat.customProgramCacheKey=()=>`quite-wood-${across}`;mat.needsUpdate=true;
}
function loadGLB(id){if(!cache.has(id))cache.set(id,new GLTFLoader().loadAsync(`assets/${id}.glb`));return cache.get(id);}
async function choose(id){
 const serial=++loadSerial;setStory(id);stage.classList.remove('ready');$('#status').textContent='Opening the model…';
 tip.hidden=true;selected='';hovered='';amount=desired=0;updateAmountUI();resetDescription();partSelect.innerHTML='<option value="">Choose a component</option>';
 if(root){scene.remove(root);root=null;}parts=[];groups.clear();
 try{
  const asset=await loadGLB(id);if(serial!==loadSerial)return;root=asset.scene;
  root.traverse(m=>{
   if(!m.isMesh)return;
   if(!m.userData.partId){let p=m.parent;while(p&&!p.userData.partId)p=p.parent;if(p)Object.assign(m.userData,p.userData);}
   if(!m.userData.partId)return;
   if(!m.userData.initialized){
    m.material=(Array.isArray(m.material)?m.material:[m.material]).map(mat=>{const c=mat.clone();if(/walnut/i.test(c.name))c.color.multiplyScalar(.28);grain(c,m);if(/window/i.test(c.name)){c.transparent=true;c.opacity=.17;c.depthWrite=false;c.side=THREE.DoubleSide;}return c;});
    if(m.material.length===1)m.material=m.material[0];
    m.userData.home=m.position.clone();m.userData.travel=new THREE.Vector3(...m.userData.explode);
    m.userData.initialized=true;
   }
   m.position.copy(m.userData.home);m.castShadow=true;m.receiveShadow=true;parts.push(m);
   if(!groups.has(m.userData.partId))groups.set(m.userData.partId,{title:m.userData.title,description:m.userData.description});
  });
  scene.add(root);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root);box.getCenter(baseCentre);const size=box.getSize(new THREE.Vector3());baseSpan=size.length()*1.23;
  for(const m of parts)m.position.copy(m.userData.home).add(m.userData.travel);
  root.updateMatrixWorld(true);const expanded=new THREE.Box3().setFromObject(root);expanded.getCenter(expandedCentre);expandedSpan=Math.max(baseSpan,expanded.getSize(new THREE.Vector3()).length()*1.19);
  for(const m of parts)m.position.copy(m.userData.home);
  baseFloor=box.min.y-.001;expandedFloor=expanded.min.y-.001;ground.position.set(baseCentre.x,baseFloor,baseCentre.z);ground.scale.setScalar(Math.max(3,baseSpan*10));
  for(const [key,g]of groups){const option=document.createElement('option');option.value=key;option.textContent=g.title;partSelect.append(option);}
  setPart('');frameModel();resize();renderer.render(scene,camera);stage.classList.add('ready');
  $('#status').textContent='Drag to orbit · pinch or scroll to zoom';
  document.title=`${products[id].title} — Quite Weird`;
 }catch(error){console.error(error);$('#status').textContent='The 3D model could not load. The render and shop brief are still available.';}
}

function requestDraw(){if(!animating){animating=true;requestAnimationFrame(draw);}}
function draw(time){
 animating=false;if(!renderer||document.hidden)return;
 const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;
 let moving=Math.abs(amount-desired)>.0005;
 if(moving){amount=reduced?desired:THREE.MathUtils.damp(amount,desired,8,dt||.016);if(Math.abs(amount-desired)<.0005)amount=desired;
  for(const m of parts)m.position.copy(m.userData.home).addScaledVector(m.userData.travel,amount);
  ground.position.y=THREE.MathUtils.lerp(baseFloor,expandedFloor,amount);
  const centre=baseCentre.clone().lerp(expandedCentre,amount),delta=centre.clone().sub(lastCentre);
  camera.position.add(delta);controls.target.add(delta);lastCentre.copy(centre);updateFrustum();dirty=true;
 }
 const changed=controls.update();if(dirty||changed||moving){renderer.render(scene,camera);dirty=false;}
 if(moving||changed)requestDraw();
}
function hit(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(parts,false).find(h=>h.object.visible)?.object;}
let down=null,dragging=false;
function showTip(event,obj){
 if(!obj){tip.hidden=true;if(hovered){hovered='';setPart(selected,true);}return;}
 const id=obj.userData.partId;if(id!==hovered){hovered=id;setPart(id,true);}
 tip.replaceChildren();const title=document.createElement('strong');title.textContent=obj.userData.title;tip.append(title);
 const line=document.createElement('span');line.textContent=obj.userData.description;tip.append(line);tip.hidden=false;
 const r=stage.getBoundingClientRect();tip.style.left=`${Math.max(8,Math.min(event.clientX-r.left+16,r.width-tip.offsetWidth-10))}px`;tip.style.top=`${Math.max(8,Math.min(event.clientY-r.top+16,r.height-tip.offsetHeight-60))}px`;
}

try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive 3D prototype. Drag to orbit, pinch or scroll to zoom. Arrow keys rotate; plus and minus zoom. Use the component list for accessible part descriptions.');host.append(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,100);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.enablePan=false;controls.minZoom=.45;controls.maxZoom=5;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI-.08;controls.zoomSpeed=.8;
 controls.addEventListener('change',()=>{dirty=true;requestDraw();});controls.addEventListener('start',()=>{tip.hidden=true;});
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xffffff,0xc7b399,2));const light=new THREE.DirectionalLight(0xfff6e8,3);light.position.set(-1,2,2);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-1;light.shadow.camera.right=1;light.shadow.camera.top=1;light.shadow.camera.bottom=-1;light.shadow.normalBias=.001;light.shadow.bias=-.0001;light.shadow.radius=4;scene.add(light);
 const fill=new THREE.DirectionalLight(0xe4ebff,1);fill.position.set(2,1,-1);scene.add(fill);
 ground=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};dragging=false;});
 renderer.domElement.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)dragging=true;if(e.pointerType==='mouse'&&!down)showTip(e,hit(e));});
 renderer.domElement.addEventListener('pointerup',e=>{if(down&&!dragging){const obj=hit(e);setPart(obj?.userData.partId||'');showTip(e,obj);}down=null;dragging=false;});
 renderer.domElement.addEventListener('pointercancel',()=>{down=null;dragging=false;tip.hidden=true;});
 renderer.domElement.addEventListener('pointerleave',()=>{tip.hidden=true;hovered='';if(!down)setPart(selected,true);});
 renderer.domElement.addEventListener('keydown',e=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();const v=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(v);
   if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;s.phi=THREE.MathUtils.clamp(s.phi,.08,Math.PI-.08);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));controls.update();requestDraw();
  }else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.2);}else if(e.key==='-'){e.preventDefault();zoom(1/1.2);}
 });
 new ResizeObserver(resize).observe(stage);document.addEventListener('visibilitychange',()=>{if(!document.hidden){dirty=true;requestDraw();}});
}catch(error){console.error(error);$('#status').textContent='3D is unavailable in this browser. Enjoy the renders and shop briefs.';renderer=null;}

function zoom(factor){if(!renderer)return;camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,.45,5);camera.updateProjectionMatrix();dirty=true;requestDraw();}
$('#zoom-in').addEventListener('click',()=>zoom(1.2));$('#zoom-out').addEventListener('click',()=>zoom(1/1.2));$('#reset').addEventListener('click',()=>frameModel());
$('#assembled').addEventListener('click',()=>explode(0));$('#exploded').addEventListener('click',()=>explode(1));range.addEventListener('input',()=>explode(Number(range.value)/100));partSelect.addEventListener('change',()=>setPart(partSelect.value));
let previousFocus=null;
function enlarge(on){if(on)previousFocus=document.activeElement;stage.classList.toggle('enlarged',on);$('#fullscreen').setAttribute('aria-label',on?'Close enlarged viewer':'Enlarge model viewer');$('#fullscreen').textContent=on?'×':'⛶';document.body.style.overflow=on?'hidden':'';if(on){stage.setAttribute('role','dialog');stage.setAttribute('aria-modal','true');stage.setAttribute('aria-label','Enlarged interactive prototype');}else{stage.removeAttribute('role');stage.removeAttribute('aria-modal');stage.removeAttribute('aria-label');}resize();if(on)renderer?.domElement.focus();else previousFocus?.focus();}
$('#fullscreen').addEventListener('click',()=>enlarge(!stage.classList.contains('enlarged')));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stage.classList.contains('enlarged'))enlarge(false);});
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!stage.classList.contains('enlarged'))return;const items=[...stage.querySelectorAll('canvas,button')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
for(const b of document.querySelectorAll('[data-product]'))b.addEventListener('click',()=>{if(b.dataset.product===currentId)return;if(renderer)choose(b.dataset.product);else setStory(b.dataset.product);});
if(renderer)choose('QW01');else{setStory('QW01');document.querySelectorAll('.controls button,.controls input,.zoom button,#part-select').forEach(el=>el.disabled=true);}
