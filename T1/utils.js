import { DefaultLoadingManager } from "three";
import { createWorld } from "./world.js";
import { CONFIG } from "./config.js";

/** @param {string} speed */
export let changeSpeed = (speed) => {
  switch (speed) {
    case '1':
      CONFIG.cameraFov = 45;
      CONFIG.speed = 200;
      break;

    case '2':
      CONFIG.cameraFov = 50;
      CONFIG.speed = 400;
      break;

    case '3':
      CONFIG.cameraFov = 55;
      CONFIG.speed = 500;
      break;
  }
}

window.addEventListener('keyup', ev => {
  if (ev.key != 'd')
    return;

  CONFIG.debug = !CONFIG.debug;
  document.getElementById('coords').style.opacity = CONFIG.debug ? 1 : 0;
  window.dispatchEvent(new Event('debug'));
});

export let vectorToString = (vec) => {
  let ret = []

  for (let prop of ['x', 'y', 'z', 'w']) {
    if (prop in vec) {
      ret.push(vec[prop].toFixed(2));
    }
  }

  return '[' + ret.join(', ') + ']';
}

/**
 * @param {any} obj 
 * @param {string[]} props 
 * @param {string?} label
 */
export let sprintProps = (obj, props, label) => {
  let ret = [];

  for (let prop of props)
    ret.push((label ?? prop).padStart(12, ' ') + vectorToString(obj[prop]) + '\n');

  return ret.join('')
}

let btn = document.querySelector('#startGame .btn');
DefaultLoadingManager.onProgress = ( _, loaded, total ) => {
  btn.textContent = 'Carregando: ' + (loaded / total * 100).toFixed(1) + '%';
};

DefaultLoadingManager.onLoad = () => {
  createWorld();
  CONFIG.loadedAssets = true;
  btn.textContent = 'Jogar';
}