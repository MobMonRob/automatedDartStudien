export interface ApiPlayer {
  id: string;
  name: string;
}

export interface ApiDartPosition {
  points: number;
  doubleField: boolean;
  tripleField: boolean;
  position: WsPosition;
}

export interface WsGamestateMessage {
  gameType: number;
  players: ApiPlayer[];
  points: number[];
  averages: number[];
  bust: boolean;
  currentPlayer: number;
  lastDarts: ApiDartPosition[][];
  dartsThrown: number[];

  //Calibration fields 
  currentPosition : WsPosition;
  calibrationState: number;
  cameras: WsCamera[];
  calibrationIndex: number;
  calibrationCount: number;
}

export interface WsPosition {
  x: number;
  y: number;
}

interface WsCamera {
  id: number;
  state: number;
  evaluation?: number;
}

export enum GameType {
  X01 = 0,
  CRICKET = 1,
  TESTING = 2,
  ERROR = 3,
  LOADING = 4, 
  CALIBRATION = 5
}

export enum CalibrationState {
  WAITING_FOR_EMPTY_BOARD = 0,
  WAITING_FOR_USER_CONFIRMATION = 1,
  WAITING_FOR_DARTS = 2,
  FINISHED = 3
}

export enum CameraState {
  NO_DARTS = 0,
  TOO_MANY_DARTS = 1,
  CONFIRMING_POSITION = 2,
  CONFIRMED_POSITION = 3,
}

export enum Reasons {
  TRACKER = 0,
  MASK = 1,
  CAMERAHIT = 2, 
  BADTHROW = 3,
  BACKEND = 4,
  UNDEFINED = 5
}