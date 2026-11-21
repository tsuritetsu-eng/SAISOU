
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import RAPIER from 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js';

await RAPIER.init();
const mount=document.querySelector('#game');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb2bb);scene.fog=new THREE.Fog(0x9bb2bb,38,150);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,250);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=false;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdcecff,0x594637,1.65));
scene.add(new THREE.AmbientLight(0x8b9aa3,.65));
const sun=new THREE.DirectionalLight(0xffd6a0,0);sun.position.set(-25,45,20);sun.castShadow=false;scene.add(sun);
const mat=(c,r=.85,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function surfaceTexture(base,kind='noise'){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);for(let i=0;i<8500;i++){const v=Math.random()*34-17;x.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)/500})`;x.fillRect(Math.random()*512,Math.random()*512,Math.random()*4+1,Math.random()*3+1)}if(kind==='wood'){x.strokeStyle='rgba(25,12,5,.16)';for(let i=0;i<28;i++){const y=Math.random()*512;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(160,y-8,330,y+9,512,y);x.stroke()}}if(kind==='stone'){x.strokeStyle='rgba(20,25,25,.2)';for(let y=0;y<512;y+=64){x.beginPath();x.moveTo(0,y);x.lineTo(512,y);x.stroke()}for(let y=0;y<512;y+=64)for(let xx=(y/64%2)*48;xx<512;xx+=96){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+64);x.stroke()}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const roadMat=mat(0x777b7c,.98), stone=mat(0xaaa69a,.95), wood=mat(0x765039,.82), darkWood=mat(0x38291f,.8), plaster=mat(0xe0d3b9,.95), roof=mat(0x303b40,.9), red=mat(0x8e3025,.72), gold=mat(0xc59a4d,.38,.62);
stone.map=surfaceTexture('#a39e91','stone');roadMat.map=surfaceTexture('#505657','stone');wood.map=surfaceTexture('#765039','wood');plaster.map=surfaceTexture('#d9ccb2');
function box(parent,x,y,z,sx,sy,sz,material){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);o.position.set(x,y,z);o.castShadow=false;o.receiveShadow=false;parent.add(o);return o}
const ground=box(scene,0,-.38,0,170,.7,170,stone);
const world=new RAPIER.World({x:0,y:-9.81,z:0});
function fixedBox(x,y,z,hx,hy,hz){const b=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,y,z));world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz),b);}
// Physical road surface: without this fixed collider, gravity pulls the float through the visual road forever.
const groundBody=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.225,0));
world.createCollider(RAPIER.ColliderDesc.cuboid(85,.25,85).setFriction(1.1),groundBody);
// road layout: main avenue plus cross streets, all within a compact town block
const roads=[{x:0,z:0,w:9,d:150},{x:0,z:0,w:150,d:9},{x:28,z:24,w:7,d:48},{x:-30,z:-25,w:7,d:50},{x:48,z:-28,w:7,d:45}];
for(const r of roads){box(scene,r.x,.005,r.z,r.w,.04,r.d,roadMat)}
// roadside machiya blocks, deliberately leave openings at intersections
function building(x,z,w,d,h,variant=0){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 box(g,0,h/2,0,w,h,d,variant%2?plaster:wood);
 box(g,0,h+.25,0,w+1,.5,d+1,roof);
 // Instanced ceramic roof tiles: dense detail without hundreds of draw calls.
 const tileGeo=new THREE.CylinderGeometry(.145,.145,d+1.12,10,1);tileGeo.rotateX(Math.PI/2);
 const tiles=new THREE.InstancedMesh(tileGeo,mat(0x465258,.78,.12),Math.max(5,Math.floor((w+1)/.27)));const dummy=new THREE.Object3D();
 for(let i=0;i<tiles.count;i++){dummy.position.set(-w/2-.35+(i+.5)*(w+1)/tiles.count,h+.56,0);dummy.updateMatrix();tiles.setMatrixAt(i,dummy.matrix)}tiles .castShadow=false;tiles .receiveShadow=false;g.add(tiles);
 box(g,0,h+.68,0,.38,.28,d+1.35,darkWood);box(g,0,h+.03,d/2+.56,w+1.25,.18,.42,darkWood);
 for(const sx of [-1,1])box(g,sx*(w/2-.18),h/2,d/2+.075,.22,h,.18,darkWood);
 box(g,0,h*.45,d/2+.105,w*.72,h*.36,.12,darkWood);
 const ww=w*.68,wh=h*.32;box(g,0,h*.45,d/2+.18,ww,wh,.045,plaster);
 for(let i=-4;i<=4;i++)box(g,i*ww/8,h*.45,d/2+.215,.045,wh,.06,darkWood);
 for(let i=-2;i<=2;i++)box(g,0,h*.45+i*wh/5,d/2+.215,ww,.045,.06,darkWood);
 box(g,0,h*.82,d/2+.12,w*.82,.18,.18,darkWood);
 const door=box(g,-w*.28,h*.25,d/2+.13,w*.22,h*.5,.08,darkWood);
 for(let i=0;i<4;i++)box(g,-w*.28-w*.09+i*w*.06,h*.25,d/2+.18,.025,h*.46,.035,gold);
 fixedBox(x,h/2,z,w/2,h/2,d/2);
 box(g,0,h*.78,d/2+.5,w+.8,.14,.65,darkWood);
 for(let xx=-w/2+.45;xx<w/2;xx+=1.2)box(g,xx,h*.78,d/2+.43,.12,.48,.12,darkWood);
 box(g,w*.34,2.1,d/2+.62,.42,.62,.35,red);box(g,w*.34,2.45,d/2+.62,.52,.1,.43,gold);
 const glow=new THREE.PointLight(0xffb96e,.55,5,2);glow.position.set(w*.34,2.15,d/2+.9);g.add(glow);
}
const blocks=[
[-11,-12,9,10,7], [11,-12,9,10,8],[-11,12,9,10,7],[11,12,9,10,8],
[-11,-43,9,18,8],[11,-43,9,18,7],[-11,43,9,18,8],[11,43,9,18,7],
[-42,-12,18,9,7],[-42,12,18,9,8],[42,12,18,9,7],[42,-12,18,9,8],
[-42,-43,18,18,8],[42,-43,18,18,9],[-42,43,18,18,7],[42,43,18,18,8],
[-68,0,15,22,8],[68,0,15,22,9]
];
blocks.forEach((b,i)=>building(...b,i));
function lantern(x,z){box(scene,x,1.7,z,.16,3.4,.16,darkWood);box(scene,x,3.5,z,.72,.72,.72,red);box(scene,x,3.9,z,.9,.14,.9,gold);const glow=new THREE.PointLight(0xffb76b,.8,8,2);glow.position.set(x,3.5,z);scene.add(glow)}
for(let z=-60;z<=60;z+=15){lantern(-5.7,z);lantern(5.7,z)}
// shrine gate in the distance
const gate=new THREE.Group();scene.add(gate);gate.position.set(0,0,-69);
box(gate,-3,3,0,.45,6,.45,red);box(gate,3,3,0,.45,6,.45,red);box(gate,0,6.1,0,8,.5,.7,darkWood);box(gate,0,6.7,0,9,.35,1,gold);
const staticGateObstacles=[{x:-3,z:-69,hx:.42,hz:.55,kind:'toriiPost'},{x:3,z:-69,hx:.42,hz:.55,kind:'toriiPost'},{x:0,z:-69,hx:4.7,hz:.58,kind:'toriiBeam',bottom:6.78}];

// Dynamic street hazards: crossing festival-goers and dropped street objects
const personMaterials=[mat(0x345b78),mat(0x8d4938),mat(0xd0b58a),mat(0x454b62)];
const hazardMeshes=[];
const hazardBodies=[];
function makePedestrian(x,z,phase=0){
  const g=new THREE.Group();scene.add(g);
  const shirt=personMaterials[Math.floor(Math.random()*personMaterials.length)];
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.72,4,8),shirt);
  body.position.y=1.02;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),mat(0xd4a17c));
  head.position.y=1.62;g.add(head);
  const legMat=mat(0x292c31);
  for(const sx of [-.13,.13]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.13,.62,.16),legMat);
    leg.position.set(sx,.38,0);g.add(leg);
  }
  g.position.set(x,0,z);
  const item={group:g,baseX:x,baseZ:z,phase,kind:"person",radius:.48};
  hazardMeshes.push(item);
  return item;
}
function makeStreetObstacle(x,z,type="crate"){
  const g=new THREE.Group();scene.add(g);
  if(type==="barrel"){
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.9,16),mat(0x78502f));
    barrel.position.y=.45;g.add(barrel);
    for(const y of [.18,.72]){
      const band=new THREE.Mesh(new THREE.TorusGeometry(.435,.045,6,18),gold);
      band.rotation.x=Math.PI/2;band.position.y=y;g.add(band);
    }
  }else if(type==="basket"){
    const basket=new THREE.Mesh(new THREE.CylinderGeometry(.48,.38,.65,12,1,true),mat(0x927044));
    basket.position.y=.33;g.add(basket);
  }else{
    const crate=new THREE.Mesh(new THREE.BoxGeometry(.9,.78,.9),wood);
    crate.position.y=.39;g.add(crate);
    const stripe=box(g,0,.39,.456,.12,.78,.025,gold);
  }
  g.position.set(x,0,z);
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x,.42,z));
  world.createCollider(RAPIER.ColliderDesc.cuboid(.48,.45,.48).setFriction(.8),body);
  hazardBodies.push(body);
  hazardMeshes.push({group:g,baseX:x,baseZ:z,phase:0,kind:"obstacle",radius:.7});
}
const pedestrians=[
  makePedestrian(-4.7,4,0),makePedestrian(4.7,-17,1.7),
  makePedestrian(-4.7,-34,3.2),makePedestrian(4.7,30,4.6)
];
makeStreetObstacle(-2.7,-7,"crate");
makeStreetObstacle(2.8,-25,"barrel");
makeStreetObstacle(-1.9,18,"basket");
makeStreetObstacle(2.6,42,"crate");

// float visual group
const float=new THREE.Group();scene.add(float);
box(float,0,.1,0,3.1,.35,4.8,darkWood);
for(const x of [-1.18,1.18])for(const z of [-1.45,1.45]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.28,24),darkWood);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.0,z);wheel.castShadow=true;float.add(wheel);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.32,16),gold);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);float.add(hub)}
const floatUpper=new THREE.Group();floatUpper.position.y=.25;float.add(floatUpper);
box(floatUpper,0,.90,0,2.25,1.65,2.8,wood);box(floatUpper,0,1.90,0,2.65,.22,3.2,gold);
for(let x=-1;x<=1;x+=2){box(floatUpper,x*.9,2.90,0,.22,2,.22,darkWood);box(floatUpper,x*.9,3.95,0,.42,.25,.42,gold);box(floatUpper,x*.9,2.9,1.43,.12,1.9,.12,gold);box(floatUpper,x*.9,2.9,-1.43,.12,1.9,.12,gold)}
for(let x=-1.35;x<=1.36;x+=.3){const tile=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,3.55,12),mat(0x9b3428,.72));tile.rotation.x=Math.PI/2;tile.position.set(x,4.22,0);tile.castShadow=true;floatUpper.add(tile)}
const topRoof=box(floatUpper,0,4.00,0,3.5,.32,3.8,red);topRoof.rotation.z=.04;
box(floatUpper,0,4.28,0,3.75,.16,.22,gold);
for(const x of [-1.7,1.7])for(const z of [-1.8,1.8]){const fin=new THREE.Mesh(new THREE.SphereGeometry(.17,20,16),gold);fin.position.set(x,4.25,z);floatUpper.add(fin)}
box(floatUpper,0,4.50,0,.45,.8,.45,gold);
const floatBody=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,1.8,22).setLinearDamping(0).setAngularDamping(0).setCanSleep(false));
world.createCollider(RAPIER.ColliderDesc.cuboid(1.45,1.25,2.25).setMass(7).setFriction(.8),floatBody);
floatBody.setEnabledRotations(false,true,false,true);floatBody.setGravityScale(0,true);
let driveSpeed=0,driveYaw=0,sideSlip=0,bodyLean=0;
let jumpHeight=0,jumpVelocity=0;const JUMP_GRAVITY=13.5;
const MAX_SPEED=18.5,ENMA_SPEED=20.5,ENMA_START_DISTANCE=0,ENMA_INITIAL_GAP=50;
let boostCharge=0,boostTime=0,stumbleTime=0,debuffTime=0;
// Difficulty rises gently every 48 m section (displayed as a round).
function currentRound(){return Math.max(1,Math.floor(travelDistance/48)+1)}
function enmaChasePace(){return ENMA_SPEED+Math.min(2.2,(currentRound()-1)*.22)}
function enmaStumblePace(){return Math.min(19.5,17.2+(currentRound()-1)*.35)}
function enmaStumbleDuration(){return Math.max(.55,1.0-(currentRound()-1)*.08)}
const BOOST_COST=35,BOOST_DURATION=3.4,BOOST_SPEED=34.5;
// simple Enma pursuer, stylized rather than graphic
const demon=new THREE.Group();demon.visible=false;scene.add(demon);
const demonMat=mat(0x3a171b), hornMat=mat(0xe0b68a), eyeMat=new THREE.MeshBasicMaterial({color:0xff2c16});
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(1.05,2.2,5,10),demonMat);torso.position.y=2.1;demon.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.85,20,16),mat(0x762c25));head.position.y=4.15;demon.add(head);
for(const x of [-.38,.38]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),eyeMat);eye.position.set(x,4.2,.73);demon.add(eye);const horn=new THREE.Mesh(new THREE.ConeGeometry(.23,1,12),hornMat);horn.position.set(x*1.6,5.1,0);horn.rotation.z=x<0?.25:-.25;demon.add(horn)}
box(demon,0,3.1,.95,1.2,.24,.15,mat(0xb18c3e));
const worldMap={};
let chaseDistance=ENMA_INITIAL_GAP,camMode=0,started=false,gameOver=false,elapsed=0,shake=0,travelDistance=0,escaped=false,enmaStarted=false;
const streamedChunks=new Map();const CHUNK_LENGTH=48,CHUNK_BEHIND=1;
let renderDistance=2; // Loaded route sections ahead, adjustable like Minecraft view distance.
const renderDistanceSelect=document.querySelector('#renderDistance');
renderDistanceSelect.value=String(renderDistance);
renderDistanceSelect.addEventListener('change',()=>{renderDistance=THREE.MathUtils.clamp(Number(renderDistanceSelect.value)||2,1,4);updateStreaming(floatBody.translation().z);});
const keys={};
function activateBoost(){if(!started||gameOver||boostCharge<BOOST_COST||boostTime>0)return;boostCharge-=BOOST_COST;boostTime=BOOST_DURATION;document.querySelector('#status').textContent='ブースト発動！一気に加速！';}
const joystick={x:0,y:0,active:false,pointerId:null};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyC')toggleCamera();if(e.code==='ShiftLeft'||e.code==='ShiftRight')activateBoost()});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
 // Analog virtual joystick: horizontal = steering, vertical = throttle / brake.
const stickBase=document.querySelector('#stickBase');
const stickKnob=document.querySelector('#stickKnob');
function updateStick(e){
 const r=stickBase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
 const max=r.width*.34,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy),scale=len>max?max/len:1;
 const x=dx*scale,y=dy*scale;
 joystick.x=x/max;joystick.y=y/max;
 stickKnob.style.transform='translate('+x+'px,'+y+'px)';
}
function releaseStick(){
 joystick.x=0;joystick.y=0;joystick.active=false;joystick.pointerId=null;
 stickKnob.style.transform='translate(0px,0px)';
}
stickBase.addEventListener('pointerdown',e=>{e.preventDefault();joystick.active=true;joystick.pointerId=e.pointerId;stickBase.setPointerCapture(e.pointerId);updateStick(e)});
stickBase.addEventListener('pointermove',e=>{if(joystick.active&&e.pointerId===joystick.pointerId)updateStick(e)});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>stickBase.addEventListener(type,releaseStick));
function toggleCamera(){camMode=(camMode+1)%4;document.querySelector('#camera').textContent=['視点：追尾','視点：近距離','視点：一人称','視点：後方確認'][camMode]}

document.querySelector('#camera').onclick=toggleCamera;
document.querySelector('#boostButton').onclick=activateBoost;
function reset(){for(const chunk of streamedChunks.values())disposeChunk(chunk);streamedChunks.clear();driveSpeed=0;driveYaw=0;sideSlip=0;bodyLean=0;jumpHeight=0;jumpVelocity=0;boostCharge=0;boostTime=0;stumbleTime=0;debuffTime=0;travelDistance=0;escaped=false;for(const k in keys)keys[k]=false;releaseStick();floatBody.setTranslation({x:0,y:1.8,z:22},true);floatBody.setLinvel({x:0,y:0,z:0},true);floatBody.setAngvel({x:0,y:0,z:0},true);floatBody.setRotation({x:0,y:0,z:0,w:1},true);float.rotation.set(0,0,0);floatUpper.rotation.set(0,0,0);chaseDistance=ENMA_INITIAL_GAP;enmaStarted=false;demon.visible=true;elapsed=0;gameOver=false;demon.position.set(0,0,22+ENMA_INITIAL_GAP);document.querySelector('#overlay').style.display='none';document.querySelector('#overlay h1').textContent='祭走';document.querySelector('#start').textContent='出走する';document.querySelector('#status').textContent='順路の矢印に従って進もう';started=true}
document.querySelector('#reset').onclick=reset;document.querySelector('#start').onclick=reset;
demon.position.set(0,0,22+ENMA_INITIAL_GAP);demon.visible=true;
const clock=new THREE.Clock();
const tmp=new THREE.Vector3();
// Baked-looking individual stone paving, batched for mobile performance.
const pavingGeo=new THREE.BoxGeometry(.82,.035,.42),pavingMat=mat(0x777a76,.96);const paving=new THREE.InstancedMesh(pavingGeo,pavingMat,380);const pavingDummy=new THREE.Object3D();let pavingN=0;
for(let z=-72;z<75;z+=.72)for(let x=-4.1;x<=4.1;x+=.94){if(Math.random()<.14)continue;pavingDummy.position.set(x,.055+routeHeight(z,x),z);pavingDummy.rotation.y=(Math.random()-.5)*.035;pavingDummy.scale.set(.86+Math.random()*.16,1,.9+Math.random()*.18);pavingDummy.updateMatrix();if(pavingN<380)paving.setMatrixAt(pavingN++,pavingDummy.matrix)}paving.count=pavingN;paving.receiveShadow=true;scene.add(paving);

// Road surface: broad rolling undulations plus smaller stone-road bumps.
function routeHeight(z,x=0){
 const broad=.24*Math.sin(z*.105)+.13*Math.sin(z*.255+1.2);
 const rough=.075*Math.sin(z*.82+x*.34)+.045*Math.sin(z*1.63-x*.72)+.028*Math.sin(z*3.1+x*1.4);
 const cross=.075*Math.sin(x*.95+z*.075)+.035*Math.sin(x*2.1-z*.16);
 return broad+rough+cross;
}
function roadSlopeX(x,z){return (routeHeight(z,x+.35)-routeHeight(z,x-.35))/.7}
function roadSlopeZ(x,z){return (routeHeight(z+.35,x)-routeHeight(z-.35,x))/.7}
function routeCurveOffset(index,t){const amplitude=2.1+(index%3)*.55;return Math.sin(t*Math.PI*2+(index%2)*Math.PI)*amplitude;}
function routeCenterX(z){const index=Math.max(0,Math.floor((-z-80)/CHUNK_LENGTH));const centerZ=-80-index*CHUNK_LENGTH;const t=THREE.MathUtils.clamp((centerZ+CHUNK_LENGTH/2-z)/CHUNK_LENGTH,0,1);return routeCurveOffset(index,t)}
function makeRouteChunk(index){
 const centerZ=-80-index*CHUNK_LENGTH,group=new THREE.Group(),bodies=[],obstacles=[];scene.add(group);
 const curveX=t=>routeCurveOffset(index,t);
 const items=[],jumpPads=[],pedestrians=[];
 const intersectionZ=centerZ-12;
 const terrainGeo=new THREE.PlaneGeometry(80,CHUNK_LENGTH,40,24);terrainGeo.rotateX(-Math.PI/2);const terrainPos=terrainGeo.attributes.position;for(let v=0;v<terrainPos.count;v++){const wx=terrainPos.getX(v),wz=centerZ+terrainPos.getZ(v);terrainPos.setY(v,-.36+routeHeight(wz,wx-routeCenterX(wz)));}terrainGeo.computeVertexNormals();const terrain=new THREE.Mesh(terrainGeo,stone);terrain.position.set(0,0,centerZ);terrain.receiveShadow=true;group.add(terrain);
 const roadGeo=new THREE.BufferGeometry(),roadVerts=[],roadUvs=[],roadIndices=[],roadSegments=40,roadAcross=4;
 for(let j=0;j<=roadSegments;j++){const t=j/roadSegments,z=centerZ+CHUNK_LENGTH/2-t*CHUNK_LENGTH,cx=curveX(t);for(let k=0;k<=roadAcross;k++){const u=k/roadAcross;const roadX=cx+(u-.5)*13;roadVerts.push(roadX,.012+routeHeight(z,roadX-cx),z);roadUvs.push(u,t);if(j<roadSegments&&k<roadAcross){const a=j*(roadAcross+1)+k,b=a+roadAcross+1;roadIndices.push(a,a+1,b,b,a+1,b+1)}}}
 roadGeo.setAttribute('position',new THREE.Float32BufferAttribute(roadVerts,3));roadGeo.setAttribute('uv',new THREE.Float32BufferAttribute(roadUvs,2));roadGeo.setIndex(roadIndices);roadGeo.computeVertexNormals();const roadMesh=new THREE.Mesh(roadGeo,roadMat);roadMesh.receiveShadow=true;group.add(roadMesh);
 // Four-way junctions connect the main avenue to a cross street.
 const intersectionX=curveX((centerZ+24-intersectionZ)/CHUNK_LENGTH);
 if(index%3===1||index%3===2){
  const crossGeo=new THREE.PlaneGeometry(54,8.5,36,8);crossGeo.rotateX(-Math.PI/2);const cp=crossGeo.attributes.position;for(let v=0;v<cp.count;v++){const wx=intersectionX+cp.getX(v),wz=intersectionZ+cp.getZ(v);cp.setY(v,.018+routeHeight(wz,wx-routeCenterX(wz)));}crossGeo.computeVertexNormals();const crossRoad=new THREE.Mesh(crossGeo,roadMat);crossRoad.position.set(intersectionX,0,intersectionZ);group.add(crossRoad);
  for(let stripe=-2;stripe<=2;stripe++){const mark=new THREE.Mesh(new THREE.BoxGeometry(.42,.025,7.2),mat(0xd8d0b8));mark.position.set(intersectionX+stripe*.78,.06+routeHeight(intersectionZ,stripe*.78),intersectionZ);group.add(mark);}
 }
 const floor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.225,centerZ));world.createCollider(RAPIER.ColliderDesc.cuboid(40,.25,CHUNK_LENGTH/2).setFriction(1.1),floor);bodies.push(floor);
 for(const side of [-1,1]){
  const postPositions=[];
  for(let j=0;j<=8;j++){const t=j/8,z=centerZ+24-j*6,x=curveX(t)+side*7.35;postPositions.push({x,z});const post=new THREE.Mesh(new THREE.BoxGeometry(.22,1.45,.22),darkWood);post.position.set(x,.72,z);post.castShadow=true;group.add(post);}
  for(const y of [.55,1.15])for(let j=0;j<postPositions.length-1;j++){const a=postPositions[j],b=postPositions[j+1],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);const rail=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,len),wood);rail.position.set((a.x+b.x)/2,y,(a.z+b.z)/2);rail.rotation.y=Math.atan2(dx,dz);rail.castShadow=true;group.add(rail);}
  for(let j=0;j<8;j++){const t=(j+.5)/8,z=centerZ+24-t*CHUNK_LENGTH,x=curveX(t)+side*7.35;const reflector=new THREE.Mesh(new THREE.BoxGeometry(.12,.32,.08),gold);reflector.position.set(x-side*.13,.9,z);group.add(reflector);}
 }
 // Torii gates appear periodically, with collision on pillars and crossbeam.
 if(index%3===1||index%4===3){
  const gateZ=centerZ-29,gateX=curveX((centerZ+24-gateZ)/CHUNK_LENGTH),toriiRed=mat(0x9b2924,.72),toriiDark=mat(0x38251e,.8);
  for(const side of [-1,1]){const gx=gateX+side*4.05;const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.34,.42,7.05,12),toriiRed);pillar.position.set(gx,3.525,gateZ);pillar.castShadow=true;group.add(pillar);const foot=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.28,12),toriiDark);foot.position.set(gx,.16,gateZ);group.add(foot);obstacles.push({x:gx,z:gateZ,hx:.48,hz:.62,kind:'toriiPost'});}
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(9.7,.48,.72),toriiRed);lintel.position.set(gateX,7.05,gateZ);lintel.castShadow=true;group.add(lintel);
  const topBeam=new THREE.Mesh(new THREE.BoxGeometry(10.8,.34,1.05),toriiDark);topBeam.position.set(gateX,7.45,gateZ);topBeam.castShadow=true;group.add(topBeam);
  obstacles.push({x:gateX,z:gateZ,hx:5.35,hz:.72,kind:'toriiBeam',bottom:6.81});
 }
 // Small ramps launch the float when crossed at speed.
 const jumpZ=centerZ-7,jumpX=curveX(.65);
 const ramp=new THREE.Mesh(new THREE.BoxGeometry(3.4,.34,2.6),gold);ramp.position.set(jumpX,.22+routeHeight(jumpZ),jumpZ);ramp.rotation.x=-.10;ramp.castShadow=true;group.add(ramp);
 jumpPads.push({x:jumpX,z:jumpZ,used:false});
 // District scenery changes as the player advances, while staying cheap to render.
 const facadeMat=index%3===0?plaster:(index%3===1?wood:mat(0x9a7656));
 for(const side of [-1,1]){
  const bz=centerZ-((index*7)%19),bt=(centerZ+24-bz)/CHUNK_LENGTH,bx=curveX(bt)+side*(13.8+(index%2)*1.2);
  const house=new THREE.Group();house.position.set(bx,0,bz);group.add(house);
  const body=new THREE.Mesh(new THREE.BoxGeometry(5.4,4.2,7.2),facadeMat);body.position.y=2.1;body.castShadow=true;body.receiveShadow=true;house.add(body);
  const roofMesh=new THREE.Mesh(new THREE.ConeGeometry(4.5,1.6,4),roof);roofMesh.rotation.y=Math.PI/4;roofMesh.position.y=5;roofMesh.castShadow=true;house.add(roofMesh);
  for(let k=-1;k<=1;k++){const post=new THREE.Mesh(new THREE.BoxGeometry(.13,3.2,.16),darkWood);post.position.set(k*1.45,1.6,3.68);house.add(post);}
  const lanternMesh=new THREE.Mesh(new THREE.BoxGeometry(.65,.8,.65),red);lanternMesh.position.set(0,2.6,4.05);house.add(lanternMesh);
  // A few roadside trees make each streamed section visually distinct.
  const tz=centerZ+((index*11)%27)-12,tx=curveX((centerZ+24-tz)/CHUNK_LENGTH)+side*10.5;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,2.1,7),darkWood);trunk.position.set(tx,1.05,tz);group.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(1.25,8,7),mat(index%2?0x3c6948:0x52734c));crown.position.set(tx,2.75,tz);crown.castShadow=true;group.add(crown);
 }
 // Extra festival-goers populate each loaded district.
 for(let n=0;n<3;n++){
  const side=n%2===0?-1:1,z=centerZ+15-n*13,x=curveX((centerZ+24-z)/CHUNK_LENGTH)+side*4.35;
  const person=new THREE.Group();person.position.set(x,0,z);group.add(person);
  const torsoMesh=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.68,3,7),personMaterials[(index+n)%personMaterials.length]);torsoMesh.position.y=.98;person.add(torsoMesh);
  const headMesh=new THREE.Mesh(new THREE.SphereGeometry(.18,8,7),mat(0xd4a17c));headMesh.position.y=1.55;person.add(headMesh);
  const legs=[];for(const sx of [-.12,.12]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.55,.13),mat(0x292c31));leg.position.set(sx,.32,0);person.add(leg);legs.push(leg);}
  pedestrians.push({group:person,baseX:x,baseZ:z,phase:index*.7+n*1.9,legs});
 }
 // Staggered road hazards: every few sections require a deliberate lane change.
 if(index%2===0){const oz=centerZ-13,ox=curveX((centerZ+24-oz)/CHUNK_LENGTH)+(index%4===0?-3.7:3.7);const crate=new THREE.Mesh(new THREE.BoxGeometry(1.75,1.25,1.55),wood);crate.position.set(ox,.625,oz);crate.castShadow=true;group.add(crate);const band=new THREE.Mesh(new THREE.BoxGeometry(1.79,.16,1.59),gold);band.position.set(ox,.86,oz);group.add(band);obstacles.push({x:ox,z:oz,hx:1.05,hz:1.0});}
 // Side-lane barriers and stacked cargo make both road edges hazardous.
 for(const side of [-1,1]){const laneZ=centerZ-25+(index%3)*7,laneX=curveX((centerZ+24-laneZ)/CHUNK_LENGTH)+side*4.75;const stack=new THREE.Group();stack.position.set(laneX,routeHeight(laneZ),laneZ);group.add(stack);const crate=new THREE.Mesh(new THREE.BoxGeometry(1.35,1.65,1.45),wood);crate.position.y=.82;crate.castShadow=true;stack.add(crate);const strap=new THREE.Mesh(new THREE.BoxGeometry(1.4,.16,1.5),gold);strap.position.y=1.05;stack.add(strap);obstacles.push({x:laneX,z:laneZ,hx:.9,hz:.95,kind:'side'});}
 // Low crossbeams occupy only one side lane. The float's upper roof can strike them.
 const beamSide=index%2===0?-1:1,beamZ=centerZ-37,beamX=curveX((centerZ+24-beamZ)/CHUNK_LENGTH)+beamSide*2.8;
 const beamPostMat=darkWood;for(const dx of [-1.55,1.55]){const post=new THREE.Mesh(new THREE.BoxGeometry(.18,6.8,.18),beamPostMat);post.position.set(beamX+dx,3.4,beamZ);post.castShadow=true;group.add(post);}
 const lowBeam=new THREE.Mesh(new THREE.BoxGeometry(3.35,.28,.34),red);lowBeam.position.set(beamX,7.0,beamZ);lowBeam.castShadow=true;group.add(lowBeam);
 obstacles.push({x:beamX,z:beamZ,hx:1.8,hz:.48,kind:'overhead',bottom:6.86});
 // Utility poles, crossarms and cables along the bends; poles sit close to the road edge.
 for(let j=0;j<2;j++){const t=.28+j*.43,z=centerZ+24-t*CHUNK_LENGTH,x=curveX(t)+(j%2===0?-5.35:5.35);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.22,.29,7.2,10),darkWood);pole.position.set(x,3.6,z);pole.castShadow=true;group.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(1.9,.18,.2),wood);arm.position.set(x,6.65,z);group.add(arm);for(const dx of [-.72,.72]){const ins=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.42,8),gold);ins.position.set(x+dx,6.92,z);group.add(ins)}obstacles.push({x,z,hx:.62,hz:.62});}
 // Pickups: red talismans trip Enma; blue orbs charge boost.
 const pickupSpecs=index===0
  // The opening red talisman is guaranteed and placed before the first boost.
  ?[{x:0,z:17,kind:'slip'},{x:1.7,z:centerZ+8,kind:'boost'}]
  :[{x:0,z:centerZ-2,kind:'boost'},...(index%2===0?[{x:index%4===0?-1.8:1.8,z:centerZ+14,kind:'slip'}]:[]),...(index%3===1?[{x:index%2===0?1.8:-1.8,z:centerZ-18,kind:'debuff'}]:[])];
 for(const spec of pickupSpecs){
  const g=new THREE.Group();g.position.set(curveX(THREE.MathUtils.clamp((centerZ+24-spec.z)/CHUNK_LENGTH,0,1))+spec.x,1.15,spec.z);group.add(g);
  const color=spec.kind==='slip'?0xff6848:(spec.kind==='debuff'?0xb46cff:0x58d8ff);
  const orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.48,2),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.65,metalness:.35,roughness:.25}));g.add(orb);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.68,.075,8,24),new THREE.MeshStandardMaterial({color:spec.kind==='slip'?0xffc06b:0xa9f4ff,emissive:color,emissiveIntensity:.35}));ring.rotation.x=Math.PI/2;g.add(ring);
  if(spec.kind==='debuff'){const mark=new THREE.Mesh(new THREE.TorusGeometry(.25,.07,8,12),mat(0xeee0ff,.3,.2));mark.position.y=.82;g.add(mark);}
  const label=new THREE.Mesh(new THREE.BoxGeometry(.55,.12,.12),gold);label.position.y=.82;g.add(label);
  items.push({group:g,kind:spec.kind,collected:false,baseY:1.15,phase:index*.8+(spec.kind==='slip'?0:1.7)});
 }
 // Route progress marker, visible on the HUD via the current district number.
 const markerZ=centerZ-CHUNK_LENGTH*.38;const marker=new THREE.Mesh(new THREE.BoxGeometry(2.8,.8,.16),red);marker.position.set(curveX((centerZ+24-markerZ)/CHUNK_LENGTH),2.6,markerZ);group.add(marker);
 return {index,centerZ,intersectionZ,group,bodies,obstacles,items,jumpPads,pedestrians};
}
function disposeChunk(chunk){
 scene.remove(chunk.group);chunk.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&![roadMat,stone,wood,darkWood,gold,red,roof,plaster].includes(o.material))o.material.dispose?.();});
 for(const body of chunk.bodies){try{world.removeRigidBody(body)}catch(e){}}
}
function updateStreaming(playerZ){
 const current=Math.max(0,Math.floor((-playerZ-80)/CHUNK_LENGTH)),wanted=new Set();
 for(let i=Math.max(0,current-CHUNK_BEHIND);i<=current+renderDistance;i++){wanted.add(i);if(!streamedChunks.has(i))streamedChunks.set(i,makeRouteChunk(i));}
 for(const [i,chunk] of streamedChunks){if(!wanted.has(i)){disposeChunk(chunk);streamedChunks.delete(i);}}
}
function triggerWin(){
 if(gameOver)return;gameOver=true;driveSpeed=0;document.querySelector('#warning').style.opacity=0;
 document.querySelector('#overlay').style.display='flex';document.querySelector('#overlay h1').textContent='逃走成功！';
 document.querySelector('#overlay p').innerHTML='閻魔を十分に引き離した！<br>祭走コースを走破した。もう一度挑戦することもできる。';
 document.querySelector('#start').textContent='もう一度走る';
}
function triggerGameOver(reason){
 if(gameOver)return;gameOver=true;driveSpeed=0;document.querySelector('#warning').style.opacity=0;
 document.querySelector('#overlay').style.display='flex';document.querySelector('#overlay h1').textContent='ゲームオーバー';
 document.querySelector('#overlay p').innerHTML=reason+'<br>コースを確認して、もう一度挑戦しよう。';
 document.querySelector('#start').textContent='再挑戦する';
}
function checkCollisions(p){
 const ex=1.55*Math.abs(Math.cos(driveYaw))+2.4*Math.abs(Math.sin(driveYaw));
 const ez=1.55*Math.abs(Math.sin(driveYaw))+2.4*Math.abs(Math.cos(driveYaw));
 for(const b of blocks){const [x,z,w,d]=b;if(Math.abs(p.x-x)<w/2+ex*.78&&Math.abs(p.z-z)<d/2+ez*.78){triggerGameOver('建物に衝突した！');return true;}}
 for(const o of staticGateObstacles){if(Math.abs(p.x-o.x)<o.hx+ex*.45&&Math.abs(p.z-o.z)<o.hz+ez*.45){if(o.kind==='toriiBeam'){if(6.52+routeHeight(p.z)+jumpHeight>o.bottom){triggerGameOver('鳥居の横木に衝突した！');return true;}}else{triggerGameOver('鳥居の柱に衝突した！');return true;}}}
 const inJunction=[...streamedChunks.values()].some(c=>(c.index%3===1||c.index%3===2)&&Math.abs(p.z-c.intersectionZ)<5.4);
 if(inJunction?Math.abs(p.x-routeCenterX(p.z))>24:Math.abs(p.x-routeCenterX(p.z))+ex>6.45){triggerGameOver('フェンス・柵に衝突した！カーブに沿って走ろう。');return true;}
 for(const chunk of streamedChunks.values())for(const o of chunk.obstacles){if(Math.abs(p.x-o.x)<o.hx+ex*.45&&Math.abs(p.z-o.z)<o.hz+ez*.45){if(o.kind==='overhead'||o.kind==='toriiBeam'){const roofTop=6.52+routeHeight(p.z)+jumpHeight;if(roofTop>o.bottom){triggerGameOver(o.kind==='toriiBeam'?'鳥居の横木に衝突した！':'山車の屋根が低い横木に衝突した！');return true;}}else{triggerGameOver(o.kind==='toriiPost'?'鳥居の柱に衝突した！':'コース脇の障害物に衝突した！');return true;}}}
 for(const h of hazardMeshes){if(h.kind==='obstacle'&&Math.hypot(p.x-h.group.position.x,p.z-h.group.position.z)<1.65){triggerGameOver('路上の障害物に衝突した！');return true;}}
 return false;
}

function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.033);
 if(started&&!gameOver){
  elapsed+=dt;
  const p=floatBody.translation();
  const keySteer=(keys.ArrowLeft||keys.KeyA?-1:0)+(keys.ArrowRight||keys.KeyD?1:0);
  const steer=THREE.MathUtils.clamp(keySteer-joystick.x,-1,1);
  const throttle=keys.ArrowUp||keys.KeyW||joystick.y<-.22,brake=keys.Space||keys.ArrowDown||keys.KeyS||joystick.y>.32;
  if(boostTime>0)boostTime=Math.max(0,boostTime-dt);
  if(stumbleTime>0)stumbleTime=Math.max(0,stumbleTime-dt);
  if(debuffTime>0)debuffTime=Math.max(0,debuffTime-dt);
  const speedLimit=boostTime>0?BOOST_SPEED:(debuffTime>0?10.5:MAX_SPEED);
  if(throttle)driveSpeed=Math.min(speedLimit,driveSpeed+(boostTime>0?17:(debuffTime>0?6.2:10.5))*dt);
  else driveSpeed=Math.max(0,driveSpeed-1.15*dt);
  if(brake)driveSpeed=Math.max(0,driveSpeed-19*dt);
  const steerAuthority=.18+Math.min(driveSpeed/MAX_SPEED,1)*.92;
  driveYaw+=steer*steerAuthority*1.35*dt*(driveSpeed>.15?1:0);
  const forwardX=-Math.sin(driveYaw),forwardZ=-Math.cos(driveYaw);
  const rightX=Math.cos(driveYaw),rightZ=-Math.sin(driveYaw);
  const targetSlip=steer*driveSpeed*.10;
  sideSlip+=(targetSlip-sideSlip)*Math.min(1,dt*2.8);
  const vx=forwardX*driveSpeed+rightX*sideSlip;
  const vz=forwardZ*driveSpeed+rightZ*sideSlip;
  floatBody.setLinvel({x:vx,y:0,z:vz},true);
  floatBody.setRotation({x:0,y:Math.sin(driveYaw/2),z:0,w:Math.cos(driveYaw/2)},true);
  world.timestep=dt;world.step();
  const np=floatBody.translation(),nr=floatBody.rotation();
  if(jumpHeight>0||jumpVelocity>0){jumpVelocity-=JUMP_GRAVITY*dt;jumpHeight=Math.max(0,jumpHeight+jumpVelocity*dt);if(jumpHeight===0)jumpVelocity=0;}
  updateStreaming(np.z);checkCollisions(np);
  const roadRideHeight=routeHeight(np.z,np.x-routeCenterX(np.z));
  float.position.set(np.x,np.y-.45+roadRideHeight+jumpHeight,np.z);
  // The float rocks with the changing road grade and small stone bumps.
  const roadPitch=Math.atan(roadSlopeZ(np.x-routeCenterX(np.z),np.z));
  const roadRoll=Math.atan(roadSlopeX(np.x-routeCenterX(np.z),np.z));
  float.rotation.set(roadPitch*.72,driveYaw,roadRoll*.72,'YXZ');
  const targetLean=-steer*Math.min(.30,.035+driveSpeed*.014);
  bodyLean+=(targetLean-bodyLean)*Math.min(1,dt*4.5);
  floatUpper.rotation.z=bodyLean;
  const v=floatBody.linvel(),speed=driveSpeed;
  // Pedestrians cross at a measured pace. The player must steer around them.
  for(const h of hazardMeshes){
    if(h.kind==="person"){
      const cross=Math.sin(elapsed*1.05+h.phase);
      h.group.position.x=h.baseX+cross*2.25;
      h.group.position.z=h.baseZ+Math.sin(elapsed*.55+h.phase)*.35;
      h.group.rotation.y=cross>0?Math.PI/2:-Math.PI/2;
      h.group.children[2].rotation.x=Math.sin(elapsed*5+h.phase)*.22;
      h.group.children[3].rotation.x=-Math.sin(elapsed*5+h.phase)*.22;
    }
    const dx=np.x-h.group.position.x,dz=np.z-h.group.position.z;
    const near=Math.hypot(dx,dz);
    if(near<(h.kind==="person"?1.9:1.75)){
      const impulseScale=h.kind==="person"?0.30:0.52;
      const nx=dx/(near||1),nz=dz/(near||1);
      floatBody.applyImpulse({x:nx*impulseScale,y:0,z:nz*impulseScale},true);
      floatBody.applyImpulse({x:-v.x*.035,y:0,z:-v.z*.035},true);
      shake=Math.max(shake,.10);
      if(h.kind==="person") document.querySelector('#status').textContent="人の横断に注意！";
      else document.querySelector('#status').textContent="路上の障害物に接触！";
    }
  }

  // Animate pedestrians in loaded route sections.
  for(const chunk of streamedChunks.values())for(const h of chunk.pedestrians){const sway=Math.sin(elapsed*.85+h.phase);h.group.position.x=h.baseX+sway*1.25;h.group.position.z=h.baseZ+Math.sin(elapsed*.48+h.phase)*.22;h.group.rotation.y=sway>0?Math.PI/2:-Math.PI/2;h.legs[0].rotation.x=Math.sin(elapsed*4+h.phase)*.28;h.legs[1].rotation.x=-Math.sin(elapsed*4+h.phase)*.28;}
  // Pick up course items. Red talismans make Enma stumble; blue orbs charge boost.
  for(const chunk of streamedChunks.values())for(const pad of chunk.jumpPads){if(!pad.used&&Math.abs(np.z-pad.z)<1.5&&Math.abs(np.x-pad.x)<2.0){pad.used=true;if(driveSpeed>5){jumpVelocity=5.8;jumpHeight=Math.max(jumpHeight,.08);document.querySelector('#status').textContent='ジャンプ！着地に備えよう';}}}
  for(const chunk of streamedChunks.values())for(const item of chunk.items){
   if(item.collected)continue;
   item.group.rotation.y+=dt*1.8;item.group.position.y=item.baseY+Math.sin(elapsed*3+item.phase)*.13;
   if(Math.hypot(np.x-item.group.position.x,np.z-item.group.position.z)<1.55){
    item.collected=true;item.group.visible=false;
    if(item.kind==='slip'){stumbleTime=enmaStumbleDuration();chaseDistance=Math.min(90,chaseDistance+7);document.querySelector('#status').textContent=`妨害成功！閻魔がよろめいている！（約${enmaStumbleDuration().toFixed(1)}秒）`;}
    else if(item.kind==='debuff'){debuffTime=3.8;driveSpeed=Math.min(driveSpeed,10.5);document.querySelector('#status').textContent='デバフ！しばらく速度が低下する！';}
    else{boostCharge=Math.min(100,boostCharge+35);document.querySelector('#status').textContent='ブーストエネルギー +35！';}
   }
  }
  travelDistance+=speed*dt;
  if(!enmaStarted&&travelDistance>=ENMA_START_DISTANCE){
   enmaStarted=true;
   document.querySelector('#status').textContent='閻魔が目を覚ました！追跡開始！';
  }
  if(enmaStarted){
   const enmaPace=stumbleTime>0?enmaStumblePace():enmaChasePace();
   chaseDistance=THREE.MathUtils.clamp(chaseDistance+(speed-enmaPace)*dt,1.8,90);
   const targetZ=np.z+chaseDistance;
   const enmaWobble=stumbleTime>0?Math.sin(elapsed*13)*1.35:0;
   demon.position.x+=(np.x+enmaWobble-demon.position.x)*Math.min(1,dt*1.8);
   demon.position.z+=(targetZ-demon.position.z)*Math.min(1,dt*3.2);
   demon.rotation.y=Math.PI;demon.rotation.z=stumbleTime>0?Math.sin(elapsed*17)*.24:0;
  }
  if(chaseDistance>=90&&!escaped){escaped=true;triggerWin();}
  const danger=!escaped&&chaseDistance<15;
  document.querySelector('#warning').style.opacity=(!escaped&&chaseDistance<19)?1:0;
  if(!enmaStarted&&!escaped)document.querySelector('#status').textContent=`閻魔はまだ眠っている…（追跡開始まで ${Math.max(0,Math.ceil(ENMA_START_DISTANCE-travelDistance))} m）`;
  else if(!escaped&&chaseDistance>=19&&stumbleTime<=0&&boostTime<=0)document.querySelector('#status').textContent='閻魔から逃走中';
  document.querySelector('#stats').innerHTML=`速度 ${Math.round(speed*3.6)} km/h<br>閻魔との距離 ${Math.round(chaseDistance)} m<br>走行距離 ${Math.floor(travelDistance)} m<br>ラウンド ${currentRound()}`;
  document.querySelector('#speedFill').style.width=`${Math.min(100,speed/BOOST_SPEED*100)}%`;
  document.querySelector('#boostFill').style.width=`${boostCharge}%`;
  document.querySelector('#boostButton').textContent=boostTime>0?'BOOST!':`ブースト ${Math.floor(boostCharge)}%`;
  document.querySelector('#boostButton').disabled=boostCharge<BOOST_COST||boostTime>0;
  document.querySelector('#boostButton').classList.toggle('boost-active',boostTime>0);
  if(stumbleTime>0)document.querySelector('#status').textContent='閻魔がよろめいている！';
  else if(debuffTime>0)document.querySelector('#status').textContent=`デバフ中：速度低下 ${debuffTime.toFixed(1)}秒`;
  if(enmaStarted&&!escaped&&chaseDistance<=2)triggerGameOver('閻魔に追いつかれてしまった！');
  if(Math.abs(np.x)>78||Math.abs(np.z)>78){floatBody.setLinvel({x:v.x*.7,y:v.y,z:v.z*.7},true)}
  shake=danger?Math.sin(elapsed*23)*.04:0;
 }
 const p=floatBody.translation();
 const heading=new THREE.Vector3(-Math.sin(driveYaw),0,-Math.cos(driveYaw));
 let desired;
 if(camMode===0)desired=new THREE.Vector3(p.x-heading.x*10,p.y+6.5,p.z-heading.z*10);
 else if(camMode===1)desired=new THREE.Vector3(p.x-heading.x*5.2,p.y+3.3,p.z-heading.z*5.2);
 else if(camMode===2)desired=new THREE.Vector3(p.x,p.y+5.05,p.z);
 else desired=new THREE.Vector3(p.x-heading.x*7,p.y+6.0,p.z-heading.z*7);
 camera.position.lerp(desired,.09);
 const look=camMode===3?new THREE.Vector3(p.x-heading.x*36,p.y+2.7,p.z-heading.z*36):new THREE.Vector3(p.x+heading.x*(camMode===2?18:2),p.y+(camMode===2?4.5:2),p.z+heading.z*(camMode===2?18:2));
 camera.lookAt(look);camera.position.y+=shake;
 renderer.render(scene,camera);
}
updateStreaming(floatBody.translation().z);
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
