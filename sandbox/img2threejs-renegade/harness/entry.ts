import * as THREE from 'three';
import {
  createRenegadeByHMISuperstratElectricGuitarModel as mk,
  createRenegadeByHMISuperstratElectricGuitarLookDevLights as mkLights,
  createRenegadeByHMISuperstratElectricGuitarEnvironment as mkEnv,
} from './src/createRenegadeModel';
(window as any).THREE = THREE;
(window as any).makeModel = mk;
(window as any).makeLights = mkLights;
(window as any).makeEnv = mkEnv;
