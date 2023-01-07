//VARIABLES GLOBALES
//de THREE
var camera, scene, renderer, cameraArm, loader;

//de texturas
var floortextures = [], wheeltextures = [], headtextures = [], cylindertextures = [];
var rmirrorRenderTarget, rmirrorCamera;
var lmirrorRenderTarget, lmirrorCamera;

//de materiales
var fovfillmaterial, fovedgematerial, floormaterial, tirematerial, spokesmaterial, headmaterial, eyematerial, crosshairmaterial,
    bodymaterial, cylindermaterial, rwallmaterial, lwallmaterial;

//de luces
var spotlights = [], ambient, eyelight;

//de animación
var moving = ["", ""], rotating = [null, null], time = 0, angle;
const pointer = new THREE.Vector3(0, 0, 0);

//del modelo de robot
var robot;
var head, eye, body, fov, fovfill, wheel;
var tire, spokes;

//de otros objetos
var crosshair, ground, walls = [];

//Caracteristicas de la ventana
const width = window.innerWidth;
const height = window.innerHeight;
const aspect = (width / height);

//FUNCIONES DE LA ENTRADA
//eventos del ratón
function onPointerMove( event ) { 

	pointer.x = 2 * event.clientX /  window.innerWidth - 1;
	pointer.y = - 2 * event.clientY / window.innerHeight + 1;
  pointer.z = 0;

  if (rotating[0] != null){
    cameraArm.rotation.y = rotating[0] - 2 * pointer.x;
  }
  if (rotating[1] != null){
    camera.position.y = rotating[1] - 3 * pointer.y;
    camera.lookAt(robot.position);
  }

}

function onMouseClick( event ) {

  rotating[0] = cameraArm.rotation.y + 4 * event.clientX /  window.innerWidth - 2;
  rotating[1] = camera.position.y - 6 * event.clientY / window.innerHeight + 3;

}

function onMouseRelease( event ){

  rotating[0] = null;
  rotating[1] = null;

}

function onWheelChange( event ) {

  if (cameraArm.position.add(camera.position).sub(robot.position).length() > 3 &&
      cameraArm.position.add(camera.position).sub(robot.position).length() < 45){
    camera.position.multiplyScalar(Math.sign(event.deltaY) * 0.04 + 1);
  }

}

//eventos del teclado
function onKeydown( event ) { 

  switch (event.key) {
    case 'ArrowLeft':
      cameraArm.rotation.y -= 0.1;
      break;
    case 'ArrowRight':
      cameraArm.rotation.y += 0.1;
      break;
    case 'w':
      moving[0] = "forwards";
      break;
    case 's':
      moving[0] = "backwards";
      break;
    case 'a':
      moving[1] = "left";
      break;
    case 'd':
      moving[1] = "right";
      break;
    default:
      break;
  }

}

function onKeyup( event ){
  
  switch (event.key) {
    case 'w':
      moving[0] = "";
      break;
    case 's':
      moving[0] = "";
      break;
    case 'a':
      moving[1] = "";
      break;
    case 'd':
      moving[1] = "";
      break;
    default:
      break;
  }

  moveRobot();

}

//INICIALIZACIÓN
function init(){
 
  initTextures();
  initMaterials();
  initScene(); 
  initGround();
  initWalls();
  initCrosshair();
  initRobot();
  initLights();
  completeScene();
  addEventListeners();
  update();

}

//inicialización de las texturas
function initTextures(){

  loader = new THREE.TextureLoader();

  //texturas del suelo
  floortextures.push(loader.load('textures/floor/BaseTexture.jpg'));
  floortextures.push(loader.load('textures/floor/AmbientOcclusionMap.jpg'));
  floortextures.push(loader.load('textures/floor/NormalMap.jpg'));
  floortextures.push(loader.load('textures/floor/RoughnessMap.jpg'));
  floortextures.push(loader.load('textures/floor/HeightMap.png'));

  //texturas de la rueda
  wheeltextures.push(loader.load('textures/wheel/BaseTexture.jpg'));
  wheeltextures.push(loader.load('textures/wheel/MetalnessMap.jpg'));
  wheeltextures.push(loader.load('textures/wheel/NormalMap.jpg'));
  wheeltextures.push(loader.load('textures/wheel/RoughnessMap.jpg'));

  //texturas de la cabeza
  headtextures.push(loader.load('textures/head/BaseTexture.jpg'));
  headtextures.push(loader.load('textures/head/AmbientOcclusionMap.jpg'));
  headtextures.push(loader.load('textures/head/NormalMap.jpg'));
  headtextures.push(loader.load('textures/head/HeightMap.jpg'));

  //texturas del cilindro
  cylindertextures.push(loader.load('textures/cylinder/BaseTexture.jpg'));
  cylindertextures.push(loader.load('textures/cylinder/AmbientOcclusionMap.jpg'));
  cylindertextures.push(loader.load('textures/cylinder/HeightMap.jpg'));
  cylindertextures.push(loader.load('textures/cylinder/NormalMap.jpg'));

  //configuraciones de texturas
  floortextures.forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 6, 6 );
  });

  wheeltextures.forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 10, 2 );
  });

  headtextures.forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 1 );
  });

  cylindertextures.forEach(texture => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 1, 2 );
  });

}

//inicialización de los materiales
function initMaterials(){

  //material del suelo
  floormaterial = new THREE.MeshStandardMaterial({map: floortextures[0], aoMap: floortextures[1],
                                                  normalMap: floortextures[2], roughnessMap: floortextures[3],
                                                  displacementMap: floortextures[4], displacementScale: 0.1});
  //material de la rueda
  tirematerial = new THREE.MeshStandardMaterial({ map: wheeltextures[0], metalnessMap: wheeltextures[1],
                                                 normalMap: wheeltextures[2], roughnessMap: wheeltextures[3], });
  //material de los radios
  spokesmaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.75 });

  //material del cilindro
  cylindermaterial = new THREE.MeshStandardMaterial({ map: cylindertextures[0],
                                                      aoMap: cylindertextures[1], normalMap: cylindertextures[2]});
  //material del cuerpo
  bodymaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.25});
  //material de la cabeza y configuración
  headmaterial = new THREE.MeshStandardMaterial({map: headtextures[0], aoMap: headtextures[1],
                                                  normalMap: headtextures[2], displacementMap: headtextures[3],
                                                  displacementScale: 0.025});
  headmaterial.side = THREE.DoubleSide;
  //materiales del objeto fov
  fovfillmaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, opacity: 0.3, transparent: true });
  fovfillmaterial.side = THREE.DoubleSide;
  fovedgematerial = new THREE.LineBasicMaterial({ color: 0x0000ff });
  
  //material del ojo
  eyematerial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  //material del punto de mira
  crosshairmaterial = new THREE.LineBasicMaterial({ color: 0xcc5555 });

  //configuración de los materiales de las paredes
  rmirrorRenderTarget = new THREE.WebGLRenderTarget( 512, 512 );
  rmirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
  rmirrorRenderTarget.texture.repeat.x = -1;

  lmirrorRenderTarget = new THREE.WebGLRenderTarget( 512, 512 );
  lmirrorRenderTarget.texture.wrapS = THREE.RepeatWrapping;
  lmirrorRenderTarget.texture.repeat.x = -1;

  rmirrorCamera = new THREE.PerspectiveCamera(20, 33/8, 20, 100);
  rmirrorCamera.position.set(0, 0.5, -37);
  rmirrorCamera.rotation.y = Math.PI;

  lmirrorCamera = new THREE.PerspectiveCamera(20, 33/8, 20, 100);
  lmirrorCamera.position.set(-37, 0.5, 0);
  lmirrorCamera.rotation.y = - Math.PI / 2;

  //materiales de las paredes
  rwallmaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, reflectivity: 1,
                                                map: rmirrorRenderTarget.texture,
                                                emissiveMap: rmirrorRenderTarget.texture,
                                                emissiveIntensity: 10  } );

  lwallmaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, reflectivity: 1,
                                                map: lmirrorRenderTarget.texture,
                                                emissiveMap: lmirrorRenderTarget.texture,
                                                emissiveIntensity: 1  } );
                                                
}

//construcción de la escena
function initScene(){

  //La escena con niebla
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 5, 100);

  //La cámara y el sistema de rotación
  camera = new THREE.PerspectiveCamera(45, aspect, 1, 100);
  camera.position.set(9, 6, 16);
  camera.lookAt(0,0,0);

  cameraArm = new THREE.Group();
  cameraArm.add(camera);

  //El renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( width, height );
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio( window.devicePixelRatio );
  document.getElementById("threejs").appendChild( renderer.domElement );

}

//inicialización del suelo
function initGround(){

  ground = new THREE.Mesh(new THREE.PlaneGeometry(32, 32, 32).rotateX(-0.5*Math.PI), floormaterial);
  ground.position.y -= 3.75;
  ground.receiveShadow = true; ground.castShadow = true;

}

//inicialización de las paredes
function initWalls(){

  //construir las paredes
  walls[0] = new THREE.Mesh(new THREE.PlaneGeometry(33, 8, 32), rwallmaterial);
  walls[0].position.set(0, 0.5, -17);
  walls[1] = new THREE.Mesh(new THREE.PlaneGeometry(33, 8, 32), lwallmaterial);
  walls[1].position.set(-17, 0.5, 0);
  walls[1].rotation.y = 0.5*Math.PI;

  //configuración de la sombra
  walls.forEach(wall => {
    wall.receiveShadow = true; wall.castShadow = true;
  });

}

//inicialización del punto de mira
function initCrosshair(){

  crosshair = new THREE.Group();

  //construir el punto de mira con 3 líneas
  for (let i = 0; i < 3; i++) {
  
    const points = [];
    points.push(new THREE.Vector3(i == 0 ? -1 : 0, i == 1 ? -1 : 0, i == 2 ? -1 : 0));
    points.push(new THREE.Vector3(i == 0 ?  1 : 0, i == 1 ?  1 : 0, i == 2 ?  1 : 0));
  
    const linegeometry = new THREE.BufferGeometry().setFromPoints(points);
  
    const line = new THREE.Line(linegeometry, crosshairmaterial);
    crosshair.add(line);

  }

}

//inicialización del robot
function initRobot(){

  robot = new THREE.Group();

  //La cabeza
  head = new THREE.Group();

  //la parte principal
  const headgeometry = new THREE.TorusGeometry(1, 0.5, 16, 32);
  const headmesh = new THREE.Mesh(headgeometry, headmaterial);
  headmesh.castShadow = true; headmesh.receiveShadow = false;

  //la parte de atrás
  const headcirclegeometry = new THREE.CircleGeometry(1, 32).translate(0, 0, -0.5 );
  const headcirclemesh = new THREE.Mesh(headcirclegeometry, headmaterial);
  
  //el ojo
  const eyegeometry = new THREE.TorusKnotGeometry(0.25, 0.075, 32, 32, 2, 3 );
  eye = new THREE.Mesh(eyegeometry, eyematerial);

  //completar la cabeza
  head.add(headmesh);
  head.add(headcirclemesh);
  head.add(eye);
  head.position.y = 3.5;

  //El cuerpo
  body = new THREE.Group();

  //la parte principal
  const bodybase  = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 6).translate(0, -0.25, 0),
                                  bodymaterial);
  const joint     = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.5, 0.5, 30, 15, 15).translate(0, -0.75, 0),
                                  bodymaterial);
  const leftfork  = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2, 0.5, 8, 60, 15).translate(0.5, -1.5, 0),
                                  bodymaterial);
  const rightfork = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2, 0.5, 8, 60, 15).translate(-0.5, -1.5, 0),
                                  bodymaterial);
  const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6).translate(0, 0.75, 0),
                                  cylindermaterial);


  //configuración de la sombra
  bodybase.castShadow = true; bodybase.receiveShadow = true;
  leftfork.castShadow = true; leftfork.receiveShadow = true;
  rightfork.castShadow = true; rightfork.receiveShadow = true;
  joint.castShadow = true; joint.receiveShadow = true;
  cylinder.castShadow = true; cylinder.receiveShadow = true;

  //completar el cuerpo
  body.add(bodybase);
  body.add(leftfork);
  body.add(rightfork);
  body.add(joint);
  body.add(cylinder);

  //La rueda
  wheel = new THREE.Group();

  //la parte principal
  tire = new THREE.Mesh(new THREE.TorusGeometry(1, 0.3, 8, 16), tirematerial);
  tire.position.y -= 2.5; tire.rotateY(Math.PI / 2);
  tire.castShadow = true; tire.receiveShadow = true; 

  //los radios
  spokes = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), spokesmaterial);
    spoke.position.set(0, 0, 0);
    spoke.rotateY(i * Math.PI / 4);
    spoke.rotateZ(Math.PI / 2);
    spoke.castShadow = true; spoke.receiveShadow = true;
    spokes.add(spoke);
  }
  spokes.position.y -= 2.5; spokes.rotateZ(Math.PI / 2);
  
  //completar la rueda
  wheel.add(tire);
  wheel.add(spokes);

  //El FoV del robot
  fov = new THREE.Group();
  const fovfillgeometry = new THREE.PlaneGeometry(6, 3, 1);
  fovfillgeometry.translate(0, 2.5, 6);
  const fovedgegeometry = new THREE.EdgesGeometry(fovfillgeometry);
  fovfill = new THREE.Mesh(fovfillgeometry, fovfillmaterial);
  const fovedge = new THREE.LineSegments(fovedgegeometry, fovedgematerial);
  fov.add(fovfill);
  fov.add(fovedge);


  //Completar el robot
  robot.add(head);
  robot.add(fov);
  robot.add(crosshair)
  robot.add(body);
  robot.add(wheel);

}

//inicialización de las luces
function initLights(){
  
  //luz ambiental
  ambient = new THREE.HemisphereLight(0xFFFFFF, 1000);
  ambient.position.set(0, 10, 0);
  
  //luces direccionales
  spotlights.push(new THREE.SpotLight(0xFFFFFF, 0.5));
    spotlights[0].position.set(4, 10, 2);
  spotlights.push(new THREE.SpotLight(0xFFFFFF, 0.5));
    spotlights[1].position.set(-4, 10, 2);
  spotlights.push(new THREE.SpotLight(0xFFFFFF, 0.5));
    spotlights[2].position.set(0, 10, -4);
  
  //configuración de la sombra y seguimiento del robot
  spotlights.forEach(spotlight => {
    spotlight.penumbra = 0.2;
    spotlight.angle = Math.PI / 6;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize = new THREE.Vector2(256,256);
    spotlight.shadow.radius = 4;
    spotlight.target = robot;
  });

  //luz del ojo
  eyelight = new THREE.PointLight(0x3333ff, 30, 2);
  eyelight.position.set(0, 3, 0);

}

//completar la escena
function completeScene(){

  //añadir objetos visibles
  scene.add(robot);
  scene.add(crosshair);
  scene.add(ground);
  walls.forEach(wall => scene.add(wall));
  
  //añadir las cámaras
  scene.add(cameraArm);
  scene.add(rmirrorCamera);
  scene.add(lmirrorCamera);

  //añadir las luces
  scene.add(ambient);
  scene.add(eyelight);
  spotlights.forEach(spotlight => scene.add(spotlight));

}

//añadir los listeners
function addEventListeners(){

  //eventos del ratón
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('mousedown', onMouseClick);
  window.addEventListener('mouseup', onMouseRelease);
  window.addEventListener('wheel', onWheelChange);
  //eventos del teclado
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
  //eventos de la ventana
  window.addEventListener('resize', resize, false);

}


//FUNCIONES DE ANIMACIÓN
function update(){

  correctRotations();
  setCrosshair();
  rotateHead();
  animateRobot();
  followRobot();

  //actualizar la escena
  requestAnimationFrame(update);

  //renderizar los espejos
  renderer.setRenderTarget(rmirrorRenderTarget);
  renderer.render(scene, rmirrorCamera);

  renderer.setRenderTarget(lmirrorRenderTarget);
  renderer.render(scene, lmirrorCamera);

  //renderizar la escena
  renderer.setRenderTarget(null);
  renderer.render(scene, camera);

  //actualizar el tiempo
  if (time < 100000) time += 0.01;
  else time = 0;

}

//corrección de rotaciones (reducción de las rotaciones al intervalo [-2pi, 2pi])
function correctRotations(){

  if (cameraArm.rotation.y > 2 * Math.PI) cameraArm.rotation.y -= 2 * Math.PI;
  if (cameraArm.rotation.y < -2 * Math.PI) cameraArm.rotation.y += 2 * Math.PI;
  if (robot.rotation.y > 2 * Math.PI) robot.rotation.y -= 2 * Math.PI;
  if (robot.rotation.y < -2 * Math.PI) robot.rotation.y += 2 * Math.PI;

}

//posición del punto de mira
function setCrosshair(){

  /*aplicar las coordenadas de la pantalla a la posición del punto de mira
    con respeto a la escala y rotación del objeto fov*/
  if (Math.abs(robot.rotation.y - (cameraArm.rotation.y + camera.rotation.y)) > 1.25 &&
      Math.abs(robot.rotation.y - (cameraArm.rotation.y + camera.rotation.y)) < 5 ){
    crosshair.position.set(-pointer.x * 3, pointer.y * 1.5 + 2.5, pointer.z + 6);
  } else {
    crosshair.position.set(pointer.x * 3, pointer.y * 1.5 + 2.5, pointer.z + 6);
  }
  
  //rotación y traslación del punto de mira
  crosshair.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), robot.rotation.y);
  crosshair.position.add(robot.position);
  crosshair.position.add(fov.position);

}

//rotación de la cabeza
function rotateHead(){

  //comprobar si la cámara está mirando hacia atrás
  if (Math.abs(robot.rotation.y - (cameraArm.rotation.y + camera.rotation.y)) > 1.25 &&
      Math.abs(robot.rotation.y - (cameraArm.rotation.y + camera.rotation.y)) < 5 ){
    angle = new THREE.Vector3(-pointer.y / Math.PI, -pointer.x / Math.PI, 0);
  } else {
    angle = new THREE.Vector3(-pointer.y / Math.PI, pointer.x / Math.PI, 0);
  }
  
  //aplicar el angulo de rotación
  angle.angleTo(new THREE.Vector3(0, 0, 1));
  head.rotation.setFromVector3(angle);

}

//movimiento del robot, en descanso y en movimientoq
function animateRobot(){

  //animaciones en descanso
  head.position.y = 2.5 + 0.3 * Math.pow(Math.sin(2 * time), 2);
  eyelight.position.y = 2.5 + 0.3 * Math.pow(Math.sin(2 * time), 2);
  fov.position.y = 0.3 * Math.pow(Math.sin(2 * time + Math.PI / 6), 2); 
  body.position.y = 0.25 * Math.pow(Math.sin(2 * time + Math.PI / 3), 4);
  body.rotation.y = 0.2 * Math.pow(Math.sin(time), 3);
  eye.rotation.y = 7 * Math.pow(Math.sin(time), 3);
  eye.rotation.z = 7 * time;  

  //animación en movimiento
  if (moving[0] == "forwards"){
    spokes.rotation.x += 0.1;
    tire.rotation.x += 0.1;
  } else if (moving[0] == "backwards"){
    spokes.rotation.x -= 0.1;
    tire.rotation.x -= 0.1;
  }

  if (moving[1] == "left"){
    body.rotation.y += 0.25;
  } else if (moving[1] == "right"){
    body.rotation.y -= 0.25;
  }

  moveRobot();
  rotateRobot();

}

//seguimiento de la cámara
function followRobot(){

  cameraArm.position.set(robot.position.x,
                         robot.position.y,
                         robot.position.z);

}

//función de movimiento del robot
function moveRobot(){

  const move = new THREE.Vector3(0, 0, 0.25);

  //movimiento con respeto a la rotación del robot
  switch(moving[0]){
    case "forwards":
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), robot.rotation.y);
      robot.position.add(move);
      break;
    case "backwards":
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), robot.rotation.y);
      robot.position.addScaledVector(move, -1);
      break;
  }

  //limites de la escena
  if (robot.position.x < -15.5) robot.position.x = -15.5;
  if (robot.position.x > 15.5) robot.position.x = 15.5;
  if (robot.position.z < -15.5) robot.position.z = -15.5;
  if (robot.position.z > 15.5) robot.position.z = 15.5;

  //actualizar la posición de la luz de la cabeza
  eyelight.position.set(robot.position.x, robot.position.y + 3, robot.position.z);

}

//función de rotación del robot
function rotateRobot(){
  
    switch(moving[1]){
      case "left":
        robot.rotation.y += 0.03;
        break;
      case "right":
        robot.rotation.y -= 0.03;
        break;
    }
  
}


//FUNCIONES DE CONTROL DE VENTANA
function resize(){

  const width = window.innerWidth;
	const height = window.innerHeight;
	const aspect = (width / height);
	renderer.setSize(width, height);

  camera.aspect = aspect;
	camera.updateProjectionMatrix();

}