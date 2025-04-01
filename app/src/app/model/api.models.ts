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
