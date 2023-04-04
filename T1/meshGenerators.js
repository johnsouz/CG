import * as THREE from 'three';

export function createAirplane() {
    const geometry = new THREE.CylinderGeometry(2, 1.2, 25, 32);
    let material1 = new THREE.MeshPhysicalMaterial({
        color: "yellow",
    })
    const tronco = new THREE.Mesh(geometry, material1);
    tronco.rotateX(Math.PI / 2);

    // criando ponta traseira
    const geometry6 = new THREE.SphereGeometry(1.2, 32, 16);
    const ponta = new THREE.Mesh(geometry6, material1);
    ponta.position.set(0, -12.5, 0);
    ponta.scale.set(1, 1.3, 1);
    tronco.add(ponta);

    // criando estabilizadores
    let material = new THREE.MeshPhysicalMaterial({
        color: "red",
    })
    const estabH = new THREE.Mesh(geometry6, material);
    estabH.position.set(0, -12.5, 0);
    estabH.scale.set(6, 1, .1);
    tronco.add(estabH);

    const estabV = new THREE.Mesh(geometry6, material);
    estabV.position.set(0, -12.5, -1.6);
    estabV.scale.set(.2, 1, 3);
    tronco.add(estabV);

    // criando o visor
    const geometry2 = new THREE.SphereGeometry(1, 32, 16);
    let material2 = new THREE.MeshPhysicalMaterial({
        color: "blue",
        transparent: true,
        opacity: 0.7,
    })
    const visor = new THREE.Mesh(geometry2, material2);
    visor.scale.set(1, 2.4, 1);
    visor.position.set(0, 3, -1.6);
    tronco.add(visor);

    // criando as asas
    const geometry3 = new THREE.CylinderGeometry(2, 2, 30, 32);
    let material3 = new THREE.MeshPhysicalMaterial({
        color: "red"
    })
    const cylinder = new THREE.Mesh(geometry3, material3);
    cylinder.rotateZ(Math.PI / 2);
    cylinder.position.set(0, 4, 0);
    cylinder.scale.set(1, 1, 0.4);
    tronco.add(cylinder);

    // criando a haste da hélice
    const geometry4 = new THREE.CylinderGeometry(.2, .2, 3, 32);
    const cylinder2 = new THREE.Mesh(geometry4, material);
    cylinder2.rotateY(Math.PI / 2);
    cylinder2.position.set(0, 12.5, 0);
    tronco.add(cylinder2);


    // criando a hélice
    const geometry5 = new THREE.CylinderGeometry(2.2, 2.2, .4, 32);
    let material6 = new THREE.MeshPhysicalMaterial({
        color: "white",
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    })
    const cylinder3 = new THREE.Mesh(geometry5, material6);
    cylinder3.rotateY(Math.PI / 2);
    cylinder3.position.set(0, 13.75, 0);
    tronco.add(cylinder3);

    // tronco.add(new THREE.AxesHelper(10));

    return tronco.rotateZ(Math.PI);
}

export function createTree() {
    const geometry = new THREE.CylinderGeometry(2, 2, 20, 32);
    let material1 = new THREE.MeshPhysicalMaterial({
      color: "chocolate",
    })
    const madeira = new THREE.Mesh(geometry, material1);
  
    const geometry6 = new THREE.SphereGeometry(4, 32, 16);
    let material2 = new THREE.MeshPhysicalMaterial({
      color: "green",
    })
    const folhas = new THREE.Mesh(geometry6, material2);
    folhas.position.set(0, 8, 0);
    folhas.scale.set(.8, .8, .8);
    madeira.add(folhas);
  
    const folhas2 = new THREE.Mesh(geometry6, material2);
    folhas2.position.set(0, 5, -2);
    folhas2.scale.set(.9, .9, .9);
    madeira.add(folhas2);
  
    const folhas3 = new THREE.Mesh(geometry6, material2);
    folhas3.position.set(-1, 4, 2);
    madeira.add(folhas3);

    return madeira;
  }

export function createGround() {
    let mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        new THREE.MeshPhysicalMaterial({
            color: 'green',
            opacity: 0.6,
            side: THREE.DoubleSide,
        }));

    mesh.rotation.set(Math.PI / 2, 0, 0);
    mesh.position.set(0, -25, -500);
    return mesh;
}
