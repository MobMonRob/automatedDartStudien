import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { Observable, of } from 'rxjs';
import { GameState } from '../model/game.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  mockPlayers: Player[] = [
    {id: "481d6713-dcca-473b-a68b-97d55f9378f9", name: "Janosch", currentDarts: []},
    {id: "96cc7aa1-d15f-4faf-b5db-3f231b875f11", name: "Nils", currentDarts: []},
    {id: "96cc7aa1-d15f-4faf-b5db-3f231b875f12", name: "Bilkesohn", currentDarts: []},
  ]

  mockGame: GameState = {
    gameType: "X01",
    players: this.mockPlayers,
    points: [20,20,20],
    averages: [0,0,0],
    darts: [0,0,0],
    details: "Double Out",
    currentThrow: [],
    bust: false,
    currentPlayerIndex: 0
  }

  initialPointValue = 0;
  previousScoreValue = 0;
  afterPlayerChange = true;

  constructor() { }

  getPlayers(): Observable<Player[]>{
    return of(this.mockPlayers);
  }

  getInitStateOfCurrentGame(): Observable<GameState>{
    this.initialPointValue = this.mockGame.points[0];
    return of(this.mockGame);
  }

  getCurrentGameState(): Observable<GameState>{
    let curPlayInd = this.mockGame.currentPlayerIndex;
    if(this.mockGame.currentThrow.length < 3){
      if(this.afterPlayerChange){
        this.previousScoreValue = this.mockGame.points[curPlayInd];
      }
      this.afterPlayerChange = false;
      if(this.mockGame.bust){
        this.mockGame.currentThrow = [];
        this.mockGame.bust = false;
      }
      let nextThrow = Math.floor(Math.random()*20);
      this.mockGame.currentThrow.push(nextThrow);
      this.mockGame.players[curPlayInd].currentDarts = this.mockGame.currentThrow;
      this.mockGame.darts[curPlayInd] +=1;

      let nextValue = this.mockGame.points[curPlayInd] - this.mockGame.currentThrow[this.mockGame.currentThrow.length -1]
      if(nextValue < 0){
        this.mockGame.bust = true;
        this.mockGame.points[curPlayInd] = this.previousScoreValue;
        this.mockGame.currentPlayerIndex = (curPlayInd + 1)%this.mockGame.players.length;
        this.afterPlayerChange = true;
      } else {
        //Win and No Bust (View handles Win)
        this.mockGame.points[curPlayInd] = nextValue;
      }
      this.mockGame.averages[curPlayInd] = Math.round((this.initialPointValue-this.mockGame.points[curPlayInd])/this.mockGame.darts[curPlayInd]);
    }
    else {
      this.mockGame.currentPlayerIndex = (curPlayInd + 1)%this.mockGame.players.length;
      this.mockGame.currentThrow = [];
      this.afterPlayerChange = true;
    }
    return of(this.mockGame);
  }

}
