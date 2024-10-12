import { Player } from "./player.model";

export interface GameState{
    gameType: string,
    players: Player[],
    points: number[],
    averages: number[],
    darts: number[],
    details: string,
    currentThrow: string[],
    bust: boolean,
    currentPlayerIndex: number
}