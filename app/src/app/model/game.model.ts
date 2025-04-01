import { Player } from './player.model';

export interface GameState {
  gameType: string;
  players: Player[];
  points: number[];
  averages: number[];
  darts: number[];
  bust: boolean;
  currentPlayerIndex: number;
  //X01 Specific Details
  inVariant: string;
  outVariant: string;
}

export interface ArchiveGameData {
  id: number;
  duration: string;
  winner: Player;
  players: Player[];
  gameMode: string;
  darts: number[];
  averages: number[];
}

export interface GameStateCricket {
  gameType: string;
  players: Player[];
  points: number[];
  averages: number[];
  darts: number[];
  bust: boolean;
  currentPlayerIndex: number;
  //Cricket specific fields
  indcludeBullsEye: boolean;
  hitMatrix: number[][];
  closedFields: boolean[][];
}
