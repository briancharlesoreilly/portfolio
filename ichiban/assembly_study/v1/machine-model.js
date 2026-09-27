export function createMachine(THREE) {
  const root=new THREE.Group(), fixture=new THREE.Group(), work=new THREE.Group(), tool=new THREE.Group(), trace=new THREE.Group();
  root.add(fixture,work,tool,trace);
  const ink=0x3e443b, paper=0xf7f7f1, accent=0xe3462e;
  const mat=(color=paper)=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0});
  function solid(parent,geo,color=paper,pos=[0,0,0],edge=ink){const m=new THREE.Mesh(geo,mat(color));m.position.set(...pos);m.castShadow=false;m.receiveShadow=false;const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,28),new THREE.LineBasicMaterial({color:edge,transparent:true,opacity:.8}));m.add(e);parent.add(m);return m;}
  function box(p,size,pos,color=paper){return solid(p,new THREE.BoxGeometry(...size),color,pos);}
  function cylinder(p,r,h,pos,color=paper){return solid(p,new THREE.CylinderGeometry(r,r,h,64),color,pos);}
  function pathHole(s,x,z,r){const p=new THREE.Path();p.absarc(x,z,r,0,Math.PI*2,true);s.holes.push(p);}
  function plate(p,{radius=.66,inner=.2,height=.09,y=.67,bolts=true,pockets=false,color=paper}){
    const s=new THREE.Shape();s.absarc(0,0,radius,0,Math.PI*2,false);if(inner>0)pathHole(s,0,0,inner);
    if(bolts)for(let n=0;n<6;n++){const a=n*Math.PI/3;pathHole(s,Math.cos(a)*.578,Math.sin(a)*.578,.045);}
    if(pockets)for(let n=0;n<3;n++){const a=n*Math.PI*2/3+.25,b=a+1.1,h=new THREE.Path();h.moveTo(.34*Math.cos(a),.34*Math.sin(a));h.absarc(0,0,.34,a,b,false);h.lineTo(.48*Math.cos(b),.48*Math.sin(b));h.absarc(0,0,.48,b,a,true);h.closePath();s.holes.push(h);}
    const g=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:48});g.rotateX(-Math.PI/2);return solid(p,g,color,[0,y,0]);
  }
  // A quiet sectional mill: table, column, slide and spindle, without an enclosure hiding the work.
  box(fixture,[2.95,.16,2.4],[0,-.02,0],0xeeeeE7);
  for(let i=-2;i<=2;i++)box(fixture,[2.8,.003,.016],[0,.062,i*.4],0xb9bfb1);
  box(fixture,[.68,2.10,.4],[0,.99,-1.30],0xe9ece2);
  box(fixture,[.40,1.66,.07],[0,1.04,-1.06],0xd9dfd1);
  box(fixture,[2.7,.26,.32],[0,1.92,-1.08],0xe9ece2);
  box(fixture,[1.95,.15,1.86],[0,.18,0],0xe4e8dc);
  box(fixture,[1.58,.12,1.48],[0,.31,0],0xf3f4ed);
  const jaws=new THREE.Group();fixture.add(jaws);
  const spindle=box(tool,[.28,.35,.3],[0,.52,0],0xedeee6);
  cylinder(tool,.09,.13,[0,.30,0],0xc7cebe);
  const endmill=new THREE.Group(),probe=new THREE.Group(),drill=new THREE.Group(),chamfer=new THREE.Group();tool.add(endmill,probe,drill,chamfer);
  cylinder(endmill,.040,.24,[0,.12,0],0xf8f8f1);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;box(endmill,[.007,.20,.008],[Math.cos(a)*.037,.12,Math.sin(a)*.037],0x5b6554);}
  cylinder(probe,.011,.22,[0,.13,0],0xa7b29c);solid(probe,new THREE.SphereGeometry(.023,16,12),accent,[0,.012,0]);
  solid(drill,new THREE.CylinderGeometry(.039,0,.075,24),paper,[0,.0375,0]);cylinder(drill,.039,.17,[0,.16,0]);
  solid(chamfer,new THREE.CylinderGeometry(.068,.01,.10,24),paper,[0,.05,0]);cylinder(chamfer,.028,.16,[0,.18,0]);
  function selectTool(kind){endmill.visible=kind==='endmill';probe.visible=kind==='probe';drill.visible=kind==='drill';chamfer.visible=kind==='chamfer';}
  tool.position.set(.1,1.2,.1);
  let cutLine,completedLine,rapidLine,points=[],timings=[],totalTime=0,currentStep=0,drillStart=Infinity;
  const inspect=new THREE.Group();root.add(inspect);inspect.visible=false;
  box(inspect,[1.05,.028,.04],[0,1.04,0],0xedefe6);box(inspect,[.028,.20,.04],[-.20,.94,0]);box(inspect,[.028,.20,.04],[.20,.94,0]);box(inspect,[.18,.10,.08],[.20,1.07,0],0xdbdfd4);
  function clear(group){while(group.children.length){const c=group.children[0];group.remove(c);c.traverse(o=>{o.geometry?.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose();}});}}
  function makeJaws(soft){clear(jaws);if(!soft){box(jaws,[.23,.20,1.64],[-.826,.47,0]);box(jaws,[.23,.20,1.64],[.826,.47,0]);box(jaws,[1.25,.10,.10],[0,.43,-.645]);box(jaws,[1.25,.10,.10],[0,.43,.645]);}else{for(let sign of [-1,1]){const s=new THREE.Shape();s.moveTo(.96,-.82);s.lineTo(.39,-.82);s.lineTo(.39,-Math.sqrt(.668*.668-.39*.39));const a=Math.acos(.39/.668);s.absarc(0,0,.668,-a,a,false);s.lineTo(.39,.82);s.lineTo(.96,.82);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:.40,bevelEnabled:false,curveSegments:48});geo.rotateX(-Math.PI/2);geo.scale(sign,1,1);solid(jaws,geo,0xe6eadd,[0,.39,0]);for(const z of [-.18,.18])cylinder(jaws,.055,.16,[sign*.56,.65,z],0xd8dfcf);}}}
  function point(x,y,z,cut=true){points.push({v:new THREE.Vector3(x,y,z),cut});}
  function travel(x,y,z){if(points.length){const p=points[points.length-1].v;point(p.x,1.12,p.z,false);}point(x,1.12,z,false);point(x,y,z,false);}
  function circle(r,y,cx=0,cz=0,turns=1,dy=0){travel(cx+r,y,cz);for(let i=0;i<=100*turns;i++){const a=i/100*Math.PI*2;point(cx+r*Math.cos(a),y+dy*i/(100*turns),cz+r*Math.sin(a));}}
  function setStep(step){currentStep=step;clear(work);clear(trace);makeJaws(step>=4);fixture.visible=step!==6;inspect.visible=step===6;tool.visible=step!==6;
    if(step===0)box(work,[1.42,.39,1.42],[0,.675,0]);
    if(step>=1&&step<4){if(step<3)box(work,[1.42,.12,1.42],[0,.54,0]);else{const s=new THREE.Shape();s.moveTo(-.71,-.71);s.lineTo(.71,-.71);s.lineTo(.71,.71);s.lineTo(-.71,.71);s.closePath();pathHole(s,0,0,.20);for(let n=0;n<6;n++){const a=n*Math.PI/3;pathHole(s,Math.cos(a)*.578,Math.sin(a)*.578,.045);}const g=new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false,curveSegments:32});g.rotateX(-Math.PI/2);solid(work,g,paper,[0,.48,0]);}plate(work,{inner:step>=3?.20:0,bolts:step>=3,height:.085,y:.60});plate(work,{radius:.54,inner:step>=3?.20:0,bolts:false,pockets:step>=2,height:.18,y:.685});}
    // Setup B shows the opposite face upward: pocketed face below, mating face and register above.
    if(step>=4){plate(work,{height:.10,y:.73});plate(work,{radius:.54,height:.15,y:.58,pockets:true,bolts:false});plate(work,{radius:.30,inner:.21,height:.055,y:.83,bolts:false});}
    points=[];drillStart=Infinity;
    if(step===0){travel(-.6,.9,-.6);point(-.6,.875,-.6,true);travel(.6,.9,.6);point(.6,.875,.6,true);travel(-.735,.81,0);point(-.735,.81,0,true);travel(0,.81,.735);point(0,.81,.735,true);}
    if(step===1){for(let i=0;i<7;i++){const z=-.63+i*.21;travel(i%2?.67:-.67,.875,z);point(i%2?-.67:.67,.875,z);}for(let i=0;i<4;i++)circle(.76-i*.03,.84-i*.048);}
    if(step===2){for(let sector=0;sector<3;sector++){const base=sector*Math.PI*2/3+.25;for(let depth=0;depth<3;depth++){const y=.84-depth*.065;travel(.395*Math.cos(base+.15),y,-.395*Math.sin(base+.15));for(let i=0;i<=180;i++){const t=i/180,a=base+.15+t*.8,r=.409+.028*Math.sin(t*Math.PI*24);point(r*Math.cos(a),y,-r*Math.sin(a));}}}}
    if(step===3){circle(.152,.88,0,0,5,-.42);drillStart=points.length;for(let n=0;n<6;n++){const a=n*Math.PI/3,x=Math.cos(a)*.578,z=Math.sin(a)*.578;travel(x,.72,z);point(x,.46,z);point(x,1.12,z,false);}}
    if(step===4){for(let i=0;i<5;i++){const z=-.58+i*.29;travel(-.65,.89,z);point(.65,.89,z);}circle(.335,.84);circle(.17,.88,0,0,2,-.08);circle(.17,.81);}
    if(step===5){circle(.665,.836);circle(.30,.89);circle(.215,.89);for(let n=0;n<6;n++){const a=n*Math.PI/3;circle(.047,.836,Math.cos(a)*.578,Math.sin(a)*.578);}}
    if(step===6){point(-.2,.98,0,false);point(.2,.98,0,false);}
    const cutVertices=[],rapidVertices=[];timings=[0];totalTime=0;let cuts=0;points[0].cutCount=0;for(let i=1;i<points.length;i++){const p=points[i-1].v,q=points[i].v;(points[i].cut?cutVertices:rapidVertices).push(p.x,p.y,p.z,q.x,q.y,q.z);if(points[i].cut)cuts++;points[i].cutCount=cuts;totalTime+=Math.max(p.distanceTo(q)/(points[i].cut?.35:.85),.025);timings.push(totalTime);}
    const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cutVertices,3));cutLine=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:accent,transparent:true,opacity:.23,depthTest:false}));cutLine.renderOrder=3;trace.add(cutLine);
    completedLine=new THREE.LineSegments(cg.clone(),new THREE.LineBasicMaterial({color:accent,transparent:true,opacity:.95,depthTest:false}));completedLine.renderOrder=4;trace.add(completedLine);
    const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(rapidVertices,3));rapidLine=new THREE.LineSegments(rg,new THREE.LineDashedMaterial({color:0x7b8770,dashSize:.035,gapSize:.026,transparent:true,opacity:.48,depthTest:false}));rapidLine.computeLineDistances();rapidLine.renderOrder=2;trace.add(rapidLine);setProgress(0);
  }
  function setProgress(t){if(!points.length)return;const elapsed=Math.min(t,.999999)*totalTime;let i=0;while(i<timings.length-2&&timings[i+1]<elapsed)i++;const f=(elapsed-timings[i])/Math.max(.0001,timings[i+1]-timings[i]);tool.position.copy(points[i].v).lerp(points[Math.min(i+1,points.length-1)].v,f);selectTool(currentStep===0?'probe':currentStep===5?'chamfer':currentStep===3&&i>=drillStart?'drill':'endmill');tool.rotation.y=currentStep===0?0:t*Math.PI*80;spindle.rotation.y=-tool.rotation.y;completedLine.geometry.setDrawRange(0,(t===1?points[points.length-1].cutCount:points[i].cutCount)*2);}
  function setPaths(value){trace.visible=value&&currentStep!==6;}
  setStep(0);
  return {root,setStep,setProgress,setPaths};
}
