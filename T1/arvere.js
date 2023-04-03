import * as THREE from  'three';
import { OrbitControls } from '../build/jsm/controls/OrbitControls.js';
import {initRenderer, 
        initCamera,
        initDefaultBasicLight,
        setDefaultMaterial,
        InfoBox,
        onWindowResize,
        createGroundPlaneXZ} from "../libs/util/util.js";

let scene, renderer, camera, material, light, orbit;; // Initial variables
scene = new THREE.Scene();    // Create main scene
renderer = initRenderer();    // Init a basic renderer
camera = initCamera(new THREE.Vector3(0, 15, 30)); // Init camera in this position
material = setDefaultMaterial(); // create a basic material
light = initDefaultBasicLight(scene); // Create a basic light to illuminate the scene
orbit = new OrbitControls( camera, renderer.domElement ); // Enable mouse rotation, pan, zoom etc.

// Listen window size changes
window.addEventListener( 'resize', function(){onWindowResize(camera, renderer)}, false );


const geometry = new THREE.CylinderGeometry( 2, 2, 20, 32 );
let material1 = new THREE.MeshPhysicalMaterial({
    color: "chocolate",})
const madeira = new THREE.Mesh( geometry, material1 );
scene.add( madeira );

const geometry6 = new THREE.SphereGeometry( 4, 32, 16 );
let material2 = new THREE.MeshPhysicalMaterial({
    color: "green",})
const folhas = new THREE.Mesh( geometry6, material2 );
folhas.position.set(0, 8, 0);
folhas.scale.set(.8, .8, .8);
madeira.add( folhas );

const folhas2 = new THREE.Mesh( geometry6, material2 );
folhas2.position.set(0, 5, -2);
folhas2.scale.set(.9, .9, .9);
madeira.add(folhas2);

const folhas3 = new THREE.Mesh( geometry6, material2 );
folhas3.position.set(-1, 4, 2);
madeira.add(folhas3);

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
