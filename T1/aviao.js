import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer,
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, light, orbit; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
// create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );

// criando o tronco
const geometry = new THREE.CylinderGeometry( 2, 1.2, 25, 32 );
let material1 = new THREE.MeshPhysicalMaterial({
    color: "yellow",})
const tronco = new THREE.Mesh( geometry, material1 );
tronco.rotateX(Math.PI/2);
scene.add( tronco );

// criando ponta traseira
const geometry6 = new THREE.SphereGeometry( 1.2, 32, 16 );
const ponta = new THREE.Mesh( geometry6, material1 );
ponta.position.set(0, -12.5, 0);
ponta.scale.set(1, 1.3, 1);
tronco.add( ponta );

// criando estabilizadores
let material = new THREE.MeshPhysicalMaterial({
  color: "red",})
const estabH = new THREE.Mesh( geometry6, material );
estabH.position.set(0, -12.5, 0);
estabH.scale.set(6, 1, .1);
tronco.add( estabH );

const estabV = new THREE.Mesh( geometry6, material );
estabV.position.set(0, -12.5, -1.6);
estabV.scale.set(.2, 1, 3);
tronco.add( estabV );

// criando o visor
const geometry2 = new THREE.SphereGeometry( 1, 32, 16 );
let material2 = new THREE.MeshPhysicalMaterial({
color: "blue",
transparent: true,
opacity: 0.7,
})
const visor = new THREE.Mesh( geometry2, material2 );
visor.scale.set(1, 2.4, 1);
visor.position.set(0, 3, -1.6);
tronco.add( visor );

// criando as asas
const geometry3 = new THREE.CylinderGeometry( 2, 2, 30, 32 );
let material3 = new THREE.MeshPhysicalMaterial({
color: "red"})
const cylinder = new THREE.Mesh( geometry3, material3 );
cylinder.rotateZ(Math.PI/2);
cylinder.position.set(0, 4, 0);
cylinder.scale.set(1, 1, 0.4);
tronco.add( cylinder );

// criando a haste da hélice
const geometry4 = new THREE.CylinderGeometry( .2, .2, 3, 32 );
const cylinder2 = new THREE.Mesh( geometry4, material );
cylinder2.rotateY(Math.PI/2);
cylinder2.position.set(0, 12.5, 0);
tronco.add( cylinder2 );


// criando a hélice
const geometry5 = new THREE.CylinderGeometry( 2.2, 2.2, .4, 32 );
let material6 = new THREE.MeshPhysicalMaterial({
    color: "white",
    transparent: true,
    opacity: 0.5,})
const cylinder3 = new THREE.Mesh( geometry5, material6 );
cylinder3.rotateY(Math.PI/2);
cylinder3.position.set(0, 13.75, 0);
tronco.add( cylinder3 );


// Use this to show information onscreen
let controls = new InfoBox();
  controls.add("Basic Scene");
  controls.addParagraph();
  controls.add("Use mouse to interact:");
  controls.add("* Left button to rotate");
  controls.add("* Right button to translate (pan)");
  controls.add("* Scroll to zoom in/out.");
  controls.show();

render();
function render()
{
  requestAnimationFrame(render);
  renderer.render(scene, camera) // Render scene
}