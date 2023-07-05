import { MeshStandardMaterial, TextureLoader, Mesh, PlaneGeometry } from "three"
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';
import { CONFIG } from "./config.js";
let gltfLoader = new GLTFLoader();

let texloader = new TextureLoader();
export let textureMetal1 = new MeshStandardMaterial({
    map: texloader.load('textures/metal1/red-scifi-metal_albedo.png'),
    aoMap: texloader.load('textures/metal1/red-scifi-metal_ao.png'),
    metalnessMap: texloader.load('textures/metal1/red-scifi-metal_metallic.png'),
    roughnessMap: texloader.load('textures/metal1/red-scifi-metal_roughness.png'),
    normalMap: texloader.load('textures/metal1/red-scifi-metal_normal-ogl.png'),

    metalness: 0.5,
    roughness: 0.8,
    transparent: true,
})

export let textureMetal2 = new MeshStandardMaterial({
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
    new Mesh(
        new PlaneGeometry(CONFIG.planeWidth, CONFIG.planeHeight),
        textureMetal2.clone()
    )
];

gltfLoader.load('./models/plane.glb', glb => {
    props.push(glb.scene.children[0])
});
