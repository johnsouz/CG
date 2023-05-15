import * as THREE from 'three';
import { createGroundPlaneWired, setDefaultMaterial } from '../libs/util/util.js';
import { GLTFLoader } from '../build/jsm/loaders/GLTFLoader.js';


export function createAirplane() {
    const geometry = new THREE.CylinderGeometry(2, 1.2, 25, 32);
    let yellowMaterial = setDefaultMaterial("yellow");
    const tronco = new THREE.Mesh(geometry, yellowMaterial);
    tronco.rotateX(Math.PI / 2);

    // criando ponta traseira
    const geometry6 = new THREE.SphereGeometry(1.2, 32, 16);
    const ponta = new THREE.Mesh(geometry6, yellowMaterial);
    ponta.position.set(0, -12.5, 0);
    ponta.scale.set(1, 1.3, 1);
    tronco.add(ponta);

    // criando estabilizadores
    let redMaterial = setDefaultMaterial("red");
    const estabH = new THREE.Mesh(geometry6, redMaterial);
    estabH.position.set(0, -12.5, 0);
    estabH.scale.set(6, 1, .1);
    tronco.add(estabH);

    const estabV = new THREE.Mesh(geometry6, redMaterial);
    estabV.position.set(0, -12.5, -1.6);
    estabV.scale.set(.2, 1, 3);
    tronco.add(estabV);

    // criando o visor
    const geometry2 = new THREE.SphereGeometry(1, 32, 16);
    let blueMaterial = setDefaultMaterial("blue");
    blueMaterial.transparent = true;
    blueMaterial.opacity = 0.7;

    const visor = new THREE.Mesh(geometry2, blueMaterial);
    visor.scale.set(1, 2.4, 1);
    visor.position.set(0, 3, -1.6);
    tronco.add(visor);

    // criando as asas
    const geometry3 = new THREE.CylinderGeometry(2, 2, 30, 32);
    const cylinder = new THREE.Mesh(geometry3, redMaterial);
    cylinder.rotateZ(Math.PI / 2);
    cylinder.position.set(0, 4, 0);
    cylinder.scale.set(1, 1, 0.4);
    tronco.add(cylinder);

    // criando a haste da hélice
    const geometry4 = new THREE.CylinderGeometry(.2, .2, 3, 32);
    const cylinder2 = new THREE.Mesh(geometry4, redMaterial);
    cylinder2.rotateY(Math.PI / 2);
    cylinder2.position.set(0, 12.5, 0);
    tronco.add(cylinder2);


    // criando a hélice
    const geometry5 = new THREE.CylinderGeometry(2.2, 2.2, .4, 32);
    let whiteMaterial = setDefaultMaterial("white");
    whiteMaterial.transparent = true;
    whiteMaterial.opacity = 0.5;
    whiteMaterial.side = THREE.DoubleSide;

    const cylinder3 = new THREE.Mesh(geometry5, whiteMaterial);
    cylinder3.rotateY(Math.PI / 2);
    cylinder3.position.set(0, 13.75, 0);
    tronco.add(cylinder3);

    let holder = new THREE.Object3D();
    holder.add(tronco.rotateZ(Math.PI));

    return holder;
}

export function importAirplane(scene) {
    let holder = new THREE.Object3D();
    scene.add(holder);

    const loader = new GLTFLoader();
    loader.load('./airplane/airplane.glb', loaded => {
        /** @type {THREE.Group} */
        const obj = loaded.scene;

        holder.add(loaded.scene);
        holder.traverse(o => {
            o.castShadow = true;
            o.receiveShadow = true;
        });
    });

    return holder
}

export function createTree() {
    const geometry = new THREE.CylinderGeometry(2, 2, 20, 32);
    let brownMaterial = setDefaultMaterial("chocolate");
    brownMaterial.transparent = true;
    const madeira = new THREE.Mesh(geometry, brownMaterial);

    const geometry6 = new THREE.SphereGeometry(4, 32, 16);
    let greenMaterial = setDefaultMaterial("green");
    greenMaterial.transparent = true;

    const folhas = new THREE.Mesh(geometry6, greenMaterial);
    folhas.position.set(0, 8, 0);
    folhas.scale.set(.8, .8, .8);
    madeira.add(folhas);

    const folhas2 = new THREE.Mesh(geometry6, greenMaterial);
    folhas2.position.set(0, 5, -2);
    folhas2.scale.set(.9, .9, .9);
    madeira.add(folhas2);

    const folhas3 = new THREE.Mesh(geometry6, greenMaterial);
    folhas3.position.set(-1, 4, 2);
    madeira.add(folhas3);

    madeira.traverse(a => {
        a.castShadow = true;
        a.receiveShadow = true;
    })

    return madeira;
}

/**
 * @param {number} width 
 * @param {number} height 
 * @param {number} yOffset
 * @returns {THREE.Mesh}
 */
export function createGround(width, height, yOffset) {
    let mesh = createGroundPlaneWired(width, height, 15, 5, 1, 'darkgreen', 'green');
    mesh.material.transparent = true;
    mesh.traverse(obj => { if (obj.isLine) obj.material.transparent = true });
    mesh.position.set(0, yOffset, 0);
    return mesh;
}

/**
 * @param {number} sizeX 
 * @param {number} sizeY 
 * @param {number} sizeZ 
 * @returns {THREE.Mesh}
 */
export function createCuboid(sizeX, sizeY, sizeZ) {
    let mesh = new THREE.Mesh(
        new THREE.BoxGeometry(sizeX, sizeY, sizeZ),
        setDefaultMaterial('darkgreen')
    );
    mesh.material.transparent = true;
    mesh.receiveShadow = true;

    return mesh;
}

export function importTargets(scene) {
    let material = new THREE.SpriteMaterial({
        map: new THREE.TextureLoader().load('./airplane/crosshairBack.png')
    });
    let sprite = new THREE.Sprite(material);
    scene.add(sprite);
    return sprite
}