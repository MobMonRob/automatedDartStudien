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
  LOADING = 4
}