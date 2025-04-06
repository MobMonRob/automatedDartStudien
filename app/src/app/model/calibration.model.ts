import { CalibrationState, CameraState } from './api.models';

export interface CalibrationModel {
  currentPosition: number[];
  calibrationState: CalibrationState;
  cameras: CameraModel[];
  calibrationIndex: number;
  calibrationCount: number;
}

export interface CameraModel {
  id: number;
  state: CameraState;
  evaluation?: number;
}
