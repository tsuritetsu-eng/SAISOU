
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import RAPIER from 'https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js';

await RAPIER.init();
const mount=document.querySelector('#game');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bb2bb);scene.fog=new THREE.Fog(0x9bb2bb,38,150);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,250);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;mount.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xdcecff,0x594637,1.35));
scene.add(new THREE.AmbientLight(0x8b9aa3,.28));
const sun=new THREE.DirectionalLight(0xffd6a0,3.1);sun.position.set(-25,45,20);sun.castShadow=true;sun.shadow.mapSize.set(3072,3072);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;sun.shadow.bias=-.00018;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun);
const mat=(c,r=.85,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function surfaceTexture(base,kind='noise'){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,512,512);for(let i=0;i<8500;i++){const v=Math.random()*34-17;x.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)/500})`;x.fillRect(Math.random()*512,Math.random()*512,Math.random()*4+1,Math.random()*3+1)}if(kind==='wood'){x.strokeStyle='rgba(25,12,5,.16)';for(let i=0;i<28;i++){const y=Math.random()*512;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(160,y-8,330,y+9,512,y);x.stroke()}}if(kind==='stone'){x.strokeStyle='rgba(20,25,25,.2)';for(let y=0;y<512;y+=64){x.beginPath();x.moveTo(0,y);x.lineTo(512,y);x.stroke()}for(let y=0;y<512;y+=64)for(let xx=(y/64%2)*48;xx<512;xx+=96){x.beginPath();x.moveTo(xx,y);x.lineTo(xx,y+64);x.stroke()}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const roadMat=mat(0x777b7c,.98), stone=mat(0xaaa69a,.95), wood=mat(0x765039,.82), darkWood=mat(0x38291f,.8), plaster=mat(0xe0d3b9,.95), roof=mat(0x303b40,.9), red=mat(0x8e3025,.72), gold=mat(0xc59a4d,.38,.62);
stone.map=surfaceTexture('#a39e91','stone');roadMat.map=surfaceTexture('#505657','stone');wood.map=surfaceTexture('#765039','wood');plaster.map=surfaceTexture('#d9ccb2');
function box(parent,x,y,z,sx,sy,sz,material){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
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
 for(let i=0;i<tiles.count;i++){dummy.position.set(-w/2-.35+(i+.5)*(w+1)/tiles.count,h+.56,0);dummy.updateMatrix();tiles.setMatrixAt(i,dummy.matrix)}tiles.castShadow=true;tiles.receiveShadow=true;g.add(tiles);
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
const MAX_SPEED=18.5;
// simple Enma pursuer, stylized rather than graphic
const demon=new THREE.Group();scene.add(demon);
const demonMat=mat(0x3a171b), hornMat=mat(0xe0b68a), eyeMat=new THREE.MeshBasicMaterial({color:0xff2c16});
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(1.05,2.2,5,10),demonMat);torso.position.y=2.1;demon.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.85,20,16),mat(0x762c25));head.position.y=4.15;demon.add(head);
for(const x of [-.38,.38]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),eyeMat);eye.position.set(x,4.2,.73);demon.add(eye);const horn=new THREE.Mesh(new THREE.ConeGeometry(.23,1,12),hornMat);horn.position.set(x*1.6,5.1,0);horn.rotation.z=x<0?.25:-.25;demon.add(horn)}
box(demon,0,3.1,.95,1.2,.24,.15,mat(0xb18c3e));
const worldMap={};
let chaseDistance=34,camMode=0,started=false,gameOver=false,elapsed=0,shake=0,travelDistance=0,escaped=false;
const streamedChunks=new Map();const CHUNK_LENGTH=48,CHUNK_BEHIND=2,CHUNK_AHEAD=5;
const keys={};
const joystick={x:0,y:0,active:false,pointerId:null};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='KeyC')toggleCamera()});
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
function toggleCamera(){camMode=(camMode+1)%3;document.querySelector('#camera').textContent=['視点：追尾','視点：近距離','視点：一人称'][camMode]}
document.querySelector('#camera').onclick=toggleCamera;
function reset(){for(const chunk of streamedChunks.values())disposeChunk(chunk);streamedChunks.clear();driveSpeed=0;driveYaw=0;sideSlip=0;bodyLean=0;travelDistance=0;escaped=false;for(const k in keys)keys[k]=false;releaseStick();floatBody.setTranslation({x:0,y:1.8,z:22},true);floatBody.setLinvel({x:0,y:0,z:0},true);floatBody.setAngvel({x:0,y:0,z:0},true);floatBody.setRotation({x:0,y:0,z:0,w:1},true);float.rotation.set(0,0,0);floatUpper.rotation.set(0,0,0);chaseDistance=34;elapsed=0;gameOver=false;demon.position.set(0,0,56);document.querySelector('#overlay').style.display='none';document.querySelector('#overlay h1').textContent='祭走';document.querySelector('#start').textContent='出走する';document.querySelector('#status').textContent='順路の矢印に従って進もう';started=true}
document.querySelector('#reset').onclick=reset;document.querySelector('#start').onclick=reset;
demon.position.set(0,0,56);
const clock=new THREE.Clock();
const tmp=new THREE.Vector3();
// Baked-looking individual stone paving, batched for mobile performance.
const pavingGeo=new THREE.BoxGeometry(.82,.035,.42),pavingMat=mat(0x777a76,.96);const paving=new THREE.InstancedMesh(pavingGeo,pavingMat,650);const pavingDummy=new THREE.Object3D();let pavingN=0;
for(let z=-72;z<75;z+=.72)for(let x=-4.1;x<=4.1;x+=.94){if(Math.random()<.14)continue;pavingDummy.position.set(x,.055,z);pavingDummy.rotation.y=(Math.random()-.5)*.035;pavingDummy.scale.set(.86+Math.random()*.16,1,.9+Math.random()*.18);pavingDummy.updateMatrix();if(pavingN<650)paving.setMatrixAt(pavingN++,pavingDummy.matrix)}paving.count=pavingN;paving.receiveShadow=true;scene.add(paving);

function makeRouteChunk(index){
 const centerZ=-80-index*CHUNK_LENGTH,group=new THREE.Group(),bodies=[],obstacles=[];scene.add(group);
 const terrain=new THREE.Mesh(new THREE.PlaneGeometry(80,CHUNK_LENGTH),stone);terrain.rotation.x=-Math.PI/2;terrain.position.set(0,-.36,centerZ);terrain.receiveShadow=true;group.add(terrain);
 const roadMesh=new THREE.Mesh(new THREE.PlaneGeometry(13,CHUNK_LENGTH),roadMat);roadMesh.rotation.x=-Math.PI/2;roadMesh.position.set(0,.012,centerZ);roadMesh.receiveShadow=true;group.add(roadMesh);
 const floor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.225,centerZ));world.createCollider(RAPIER.ColliderDesc.cuboid(40,.25,CHUNK_LENGTH/2).setFriction(1.1),floor);bodies.push(floor);
 for(const side of [-1,1]){
  const x=side*7.35;
  for(let j=0;j<=8;j++){const post=new THREE.Mesh(new THREE.BoxGeometry(.22,1.45,.22),darkWood);post.position.set(x,.72,centerZ-24+j*6);post.castShadow=true;group.add(post);}
  for(const y of [.55,1.15]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.18,.18,CHUNK_LENGTH),wood);rail.position.set(x,y,centerZ);rail.castShadow=true;group.add(rail);}
  for(let j=0;j<8;j++){const reflector=new THREE.Mesh(new THREE.BoxGeometry(.12,.32,.08),gold);reflector.position.set(x-side*.13,.9,centerZ-20+j*5.5);group.add(reflector);}
 }
 // Repeating direction boards and arrows mark the route ahead.
 for(let j=0;j<3;j++){const z=centerZ-18+j*15;const board=new THREE.Mesh(new THREE.BoxGeometry(2.3,.72,.14),red);board.position.set(0,2.35,z);group.add(board);const arrow=new THREE.Mesh(new THREE.ConeGeometry(.32,.72,3),gold);arrow.rotation.z=-Math.PI/2;arrow.position.set(.08,2.35,z-.1);group.add(arrow);}
 // District scenery changes as the player advances, while staying cheap to render.
 const facadeMat=index%3===0?plaster:(index%3===1?wood:mat(0x9a7656));
 for(const side of [-1,1]){
  const bx=side*(13.8+(index%2)*1.2),bz=centerZ-((index*7)%19);
  const house=new THREE.Group();house.position.set(bx,0,bz);group.add(house);
  const body=new THREE.Mesh(new THREE.BoxGeometry(5.4,4.2,7.2),facadeMat);body.position.y=2.1;body.castShadow=true;body.receiveShadow=true;house.add(body);
  const roofMesh=new THREE.Mesh(new THREE.ConeGeometry(4.5,1.6,4),roof);roofMesh.rotation.y=Math.PI/4;roofMesh.position.y=5;roofMesh.castShadow=true;house.add(roofMesh);
  for(let k=-1;k<=1;k++){const post=new THREE.Mesh(new THREE.BoxGeometry(.13,3.2,.16),darkWood);post.position.set(k*1.45,1.6,3.68);house.add(post);}
  const lanternMesh=new THREE.Mesh(new THREE.BoxGeometry(.65,.8,.65),red);lanternMesh.position.set(0,2.6,4.05);house.add(lanternMesh);
  // A few roadside trees make each streamed section visually distinct.
  const tx=side*10.5,tz=centerZ+((index*11)%27)-12;
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,2.1,7),darkWood);trunk.position.set(tx,1.05,tz);group.add(trunk);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(1.25,8,7),mat(index%2?0x3c6948:0x52734c));crown.position.set(tx,2.75,tz);crown.castShadow=true;group.add(crown);
 }
 // Staggered road hazards: every few sections require a deliberate lane change.
 if(index%2===0){const ox=index%4===0?-3.6:3.6,oz=centerZ-13;const crate=new THREE.Mesh(new THREE.BoxGeometry(1.05,.9,1.05),wood);crate.position.set(ox,.45,oz);crate.castShadow=true;group.add(crate);const band=new THREE.Mesh(new THREE.BoxGeometry(1.08,.12,1.08),gold);band.position.set(ox,.76,oz);group.add(band);obstacles.push({x:ox,z:oz,hx:.85,hz:.85});}
 // Route progress marker, visible on the HUD via the current district number.
 const marker=new THREE.Mesh(new THREE.BoxGeometry(2.8,.8,.16),red);marker.position.set(0,2.6,centerZ-CHUNK_LENGTH*.38);group.add(marker);
 return {index,centerZ,group,bodies,obstacles};
}
function disposeChunk(chunk){
 scene.remove(chunk.group);chunk.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material&&![roadMat,stone,wood,darkWood,gold,red,roof,plaster].includes(o.material))o.material.dispose?.();});
 for(const body of chunk.bodies){try{world.removeRigidBody(body)}catch(e){}}
}
function updateStreaming(playerZ){
 const current=Math.max(0,Math.floor((-playerZ-80)/CHUNK_LENGTH)),wanted=new Set();
 for(let i=Math.max(0,current-CHUNK_BEHIND);i<=current+CHUNK_AHEAD;i++){wanted.add(i);if(!streamedChunks.has(i))streamedChunks.set(i,makeRouteChunk(i));}
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
 if(Math.abs(p.x)+ex>7.18){triggerGameOver('フェンス・柵に衝突した！コース内を走ろう。');return true;}
 for(const chunk of streamedChunks.values())for(const o of chunk.obstacles){if(Math.abs(p.x-o.x)<o.hx+ex*.45&&Math.abs(p.z-o.z)<o.hz+ez*.45){triggerGameOver('コース上の障害物に衝突した！');return true;}}
 for(const h of hazardMeshes){if(h.kind==='obstacle'&&Math.hypot(p.x-h.group.position.x,p.z-h.group.position.z)<1.65){triggerGameOver('路上の障害物に衝突した！');return true;}}
 return false;
}

function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.033);
 if(started&&!gameOver){
  elapsed+=dt;
  const p=floatBody.translation();
  const keySteer=(keys.ArrowLeft||keys.KeyA?-1:0)+(keys.ArrowRight||keys.KeyD?1:0);
  const steer=THREE.MathUtils.clamp(keySteer+joystick.x,-1,1);
  const throttle=keys.ArrowUp||keys.KeyW||joystick.y<-.22,brake=keys.Space||keys.ArrowDown||keys.KeyS||joystick.y>.32;
  if(throttle)driveSpeed=Math.min(MAX_SPEED,driveSpeed+10.5*dt);
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
  updateStreaming(np.z);checkCollisions(np);
  float.position.set(np.x,np.y-.45,np.z);float.quaternion.set(nr.x,nr.y,nr.z,nr.w);
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

  // Enma is a real pursuer: outrun its 9 m/s pace to open the gap, slow down and it closes in.
  travelDistance+=speed*dt;
  chaseDistance=THREE.MathUtils.clamp(chaseDistance+(speed-9.0)*dt,1.8,90);
  const targetZ=np.z+chaseDistance;
  demon.position.x+=(np.x-demon.position.x)*Math.min(1,dt*1.8);
  demon.position.z+=(targetZ-demon.position.z)*Math.min(1,dt*3.2);
  demon.rotation.y=Math.PI;
  if(chaseDistance>=90&&!escaped){escaped=true;triggerWin();}
  const danger=!escaped&&chaseDistance<15;
  document.querySelector('#warning').style.opacity=(!escaped&&chaseDistance<19)?1:0;
  if(!escaped&&chaseDistance>=19)document.querySelector('#status').textContent='閻魔から逃走中';
  document.querySelector('#stats').innerHTML=`速度 ${Math.round(speed*3.6)} km/h<br>閻魔との距離 ${Math.round(chaseDistance)} m<br>走行距離 ${Math.floor(travelDistance)} m<br>区画 ${Math.max(1,Math.floor(travelDistance/48)+1)}`;
  document.querySelector('#speedFill').style.width=`${Math.min(100,speed/MAX_SPEED*100)}%`;
  if(!escaped&&chaseDistance<=2)triggerGameOver('閻魔に追いつかれてしまった！');
  if(Math.abs(np.x)>78||Math.abs(np.z)>78){floatBody.setLinvel({x:v.x*.7,y:v.y,z:v.z*.7},true)}
  shake=danger?Math.sin(elapsed*23)*.04:0;
 }
 const p=floatBody.translation();
 const heading=new THREE.Vector3(-Math.sin(driveYaw),0,-Math.cos(driveYaw));
 let desired;
 if(camMode===0)desired=new THREE.Vector3(p.x-heading.x*10, p.y+6.5, p.z-heading.z*10);
 else if(camMode===1)desired=new THREE.Vector3(p.x-heading.x*5.2,p.y+3.3,p.z-heading.z*5.2);
 else desired=new THREE.Vector3(p.x,p.y+5.05,p.z);
 camera.position.lerp(desired,.09);const look=new THREE.Vector3(p.x+heading.x*(camMode===2?18:2),p.y+(camMode===2?4.5:2),p.z+heading.z*(camMode===2?18:2));camera.lookAt(look);camera.position.y+=shake;
 renderer.render(scene,camera);
}
updateStreaming(floatBody.translation().z);
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
