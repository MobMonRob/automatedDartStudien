export interface ApiPlayer {
  id: string;
  name: string;
}

export interface ApiDartPosition {
  points: number;
  doubleField: boolean;
  tripleField: boolean;
  position: { x: number; y: number };
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
}

export enum GameType {
  X01 = 0,
  CRICKET = 1,
  TESTING = 2,
  ERROR = 3,
  LOADING = 4, 
  CALIBRATION = 5
}

export enum Reasons {
  TRACKER = 0,
  MASK = 1,
  CAMERAHIT = 2, 
  BADTHROW = 3,
  BACKEND = 4,
  UNDEFINED = 5
}