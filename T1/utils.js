import { Vector3, Box3 } from "three";

export const CONFIG = {
  simulationOn: true,
  debug: true,

  cameraPos: new Vector3(0, 0, 50),
  cameraFov: 45,

  treePosFrom: -1000,
  treePosTo: 100,
  treeVerticalOffset: -40,

  fogFadeFar: -950,
  fogFadeNear: -800,

  speed: 200,

  treeCount: 60,
  treeDistribution: 120,
  treeScaleMin: 1.8,
  treeScaleMax: 2,

  planeCount: 14,
  planeWidth: 150,
  planeHeight: 100,
  planeVerticalOffset: -50,

  airplaneOffset: 175,
  raycastPlaneOffset: new Vector3(0, 0, -100),
  targetOffset: new Vector3(0, 0, -100),

  turretCount: 5,
  turretDistribution: 60,
  turretVerticalOffset: -50,

  bulletBoundingBox: new Box3(new Vector3(-100, -50, -1000), new Vector3(100, 50, 1000)),
  bulletSpeed: 1000
};

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