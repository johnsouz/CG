import { MeshStandardMaterial } from "three"
import { TexLoader } from "./utils.js"

export let metal1 = new MeshStandardMaterial({
    map: TexLoader.load('textures/metal1/red-scifi-metal_albedo.png'),
    normalMap: TexLoader.load('textures/metal1/red-scifi-metal_normal-ogl.png'),
    aoMap: TexLoader.load('textures/metal1/red-scifi-metal_ao.png'),
    metalnessMap: TexLoader.load('textures/metal1/red-scifi-metal_metallic.png'),
    roughnessMap: TexLoader.load('textures/metal1/red-scifi-metal_roughness.png'),
    bumpMap: TexLoader.load('textures/metal1/red-scifi-metal_height.png'),

    metalness: 0.5,
    roughness: 0.8,
    transparent: true,
})

export let metal2 = new MeshStandardMaterial({
    map: TexLoader.load('textures/metal2/sci-fi-panel1-albedo.png'),
    normalMap: TexLoader.load('textures/metal2/sci-fi-panel1-normal-ogl.png'),
    aoMap: TexLoader.load('textures/metal2/sci-fi-panel1-ao.png'),
    metalnessMap: TexLoader.load('textures/metal2/sci-fi-panel1-metallic.png'),
    roughnessMap: TexLoader.load('textures/metal2/sci-fi-panel1-roughness.png'),
    bumpMap: TexLoader.load('textures/metal2/sci-fi-panel1-height.png'),

    metalness: 0.6,
    roughness: 0.2,
    transparent: true,
})
// metal2.map.anisotropy = 8;