import * as THREE from 'three';
import { MathUtils } from 'three';
import { CONFIG } from './config.js';

export class Translater {
  /**
   * @param {THREE.Vector3} direction vetor unitario da direção
   * @param {THREE.Object3D} object o objeto a ser movido
   * @param {number} distance a distancia maxima que o objeto percorre
   * @param {?function(this: Translater): void} customUpdate função chama a cada update
   * @param {?THREE.Vector3} startPoint 
   */
  constructor(direction, object, distance, customUpdate, startPoint) {
    this.direction = direction.normalize();
    this.object = object;
    this.distance = distance;
    this.customUpdate = customUpdate;
    this.startPoint = startPoint ?? object.position.clone();
  }

  // vetor para realização de operações com vetores
  #deltaPos = new THREE.Vector3();
  update(dt) {
    // deltaPos <- a distancia em que o objeto se move em 1 frame
    this.#deltaPos
      .copy(this.direction)
      .multiplyScalar(CONFIG.speed * dt);

    this.object.position
      .add(this.#deltaPos)

    // deltaPos <- a distancia entre `startPoint` e `object.position`
    this.#deltaPos
      .subVectors(this.object.position, this.startPoint)

    // se a distancia entre o `startPoint` e `object` for maior que `distance`
    // o objeto volta para `startPoint`
    let traveled = this.#deltaPos.length();
    if (traveled > this.distance) {
      this.object.position
        .copy(this.direction)
        .multiplyScalar(traveled - this.distance)
        .add(this.startPoint);
    }

    if (this.customUpdate)
      this.customUpdate(this);
  }
}

/** @param {Translater} t */
export let opacityFog = (t) => {
  let opacity = MathUtils.mapLinear(t.object.position.z, CONFIG.fogFadeFar, CONFIG.fogFadeNear, 0, 1);
  t.object.traverse(obj => {
    if (obj.isMesh || obj.isLine)
      obj.material.opacity = opacity;
  });
}