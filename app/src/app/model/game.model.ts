import { Player } from "./player.model";

export interface GameState{
    gameType: string,
    players: Player[],
    points: number[],
    averages: number[],
    darts: number[],
    bust: boolean,
    currentPlayerIndex: number
    //X01 Specific Details
    inVariant: string,
    outVariant: string,
    includeBulls: boolean
}