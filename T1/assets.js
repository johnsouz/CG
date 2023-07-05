import * as THREE from "three"
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { CONFIG } from "./config.js";
let gltfLoader = new GLTFLoader();

let texloader = new THREE.TextureLoader();
export let textureMetal1 = new THREE.MeshStandardMaterial({
    map: texloader.load('textures/metal1/red-scifi-metal_albedo.png'),
    aoMap: texloader.load('textures/metal1/red-scifi-metal_ao.png'),
    metalnessMap: texloader.load('textures/metal1/red-scifi-metal_metallic.png'),
    roughnessMap: texloader.load('textures/metal1/red-scifi-metal_roughness.png'),
    normalMap: texloader.load('textures/metal1/red-scifi-metal_normal-ogl.png'),

    metalness: 0.5,
    roughness: 0.8,
    transparent: true,
})

export let textureMetal2 = new THREE.MeshStandardMaterial({
    map: texloader.load('textures/metal2/sci-fi-panel1-albedo.png'),
    aoMap: texloader.load('textures/metal2/sci-fi-panel1-ao.png'),
    metalnessMap: texloader.load('textures/metal2/sci-fi-panel1-metallic.png'),
    roughnessMap: texloader.load('textures/metal2/sci-fi-panel1-roughness.png'),
    normalMap: texloader.load('textures/metal2/sci-fi-panel1-normal-ogl.png'),

    metalness: 0.6,
    roughness: 0.2,
    transparent: true,
})

/** @param {THREE.Mesh[]} props */
export let props = [
    new THREE.Mesh(
        new THREE.PlaneGeometry(CONFIG.planeWidth, CONFIG.planeHeight),
        textureMetal2.clone()
    )
];

// export let turretModel = new THREE.Mesh(
//     new THREE.BoxGeometry(10, 20, 10),
//     new THREE.MeshStandardMaterial({color: 'white', transparent: true}));

export let turretModel = new THREE.Object3D();

gltfLoader.load('./models/turret.glb', glb => {
    glb.scene.traverse(obj => {
        if (obj.isMesh) {
            turretModel = obj;
            turretModel.material.transparent = true;
        }
    });
});

let models = [
    './models/plane.glb',
    './models/plane2.glb'
];
models.forEach(path =>
    gltfLoader.load(path, glb => { props.push(glb.scene.children[0]) })
)