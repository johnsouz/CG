import { Vector3 } from "three";

export const CONFIG = {
    debug: true,
    cameraPos: new Vector3(0, 0, 50),
    lerpFactor: 0.2,
  
    treePosFrom: -1000,
    treePosTo: 100,
    treeVerticalOffset: -40,
  
    fogFadeFar: -950,
    fogFadeNear: -800,
  
    speed: 2,
  
    treeCount: 300,
    treeDistribution: 300,
    treeScaleMin: 0.6,
    treeScaleMax: 1.5,
  
    planeCount: 10,
    planeWidth: 1000,
    planeHeight: 100,
    planeVerticalOffset: -50,
  };

export let vec = (vec) =>
  `[${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}${ vec.z != undefined ? ", " + vec.z.toFixed(2) : ""}${ vec.w != undefined ? ", " + vec.z.toFixed(2) : ""}]`;