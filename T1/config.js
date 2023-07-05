import { Vector3, Box3 } from "three";

export const CONFIG = {
    isMobile: /Mobile|iP(hone|od|ad)|Android/i.test(window.navigator.userAgent),
    simulationOn: false,
    debug: false,
    loadedAssets: false,
    muted: false,
  
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
    planeWidth: 50,
    planeHeight: 100,
    planeVerticalOffset: -50,
  
    airplaneOffset: 175,
    raycastPlaneOffset: new Vector3(0, 0, -100),
    targetOffset: new Vector3(0, 0, -100),
  
    turretCount: 3,
    turretDistribution: 60,
    turretVerticalOffset: -50,
  
    bulletBoundingBox: new Box3(new Vector3(-100, -50, -1000), new Vector3(100, 50, 0)),
    bulletSpeed: 1000
  };