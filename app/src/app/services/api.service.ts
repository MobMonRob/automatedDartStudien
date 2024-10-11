import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { Observable, of } from 'rxjs';
import { GameState } from '../model/game.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  mockPlayers: Player[] = [
    {id: "481d6713-dcca-473b-a68b-97d55f9378f9", name: "Janosch"},
    //{id: "96cc7aa1-d15f-4faf-b5db-3f231b875f11", name: "Nils"}
  ]

  mockGame: GameState = {
    gameType: "X01",
    players: this.mockPlayers,
    points: [20,20],
    averages: [0,0],
    darts: [0,0],
    details: "Double Out",
    currentThrow: [],
    bust: false,
    currentPlayerIndex: 0
  }

  initialPointValue = 0;

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
      let nextThrow = Math.floor(Math.random()*20);
      this.mockGame.currentThrow.push(nextThrow);
      this.mockGame.darts[curPlayInd] +=1;

      let nextValue = this.mockGame.points[curPlayInd] - this.mockGame.currentThrow[this.mockGame.currentThrow.length -1]
      if(nextValue < 0){
        this.mockGame.bust = true;
        this.mockGame.currentPlayerIndex = (curPlayInd + 1)%this.mockGame.players.length;
        
      } else {
        //Win and No Bust (View handles Win)
        this.mockGame.points[curPlayInd] = nextValue;
      }
      this.mockGame.averages[curPlayInd] = Math.round((this.initialPointValue-this.mockGame.points[curPlayInd])/this.mockGame.darts[curPlayInd]);
    }
    else {
      this.mockGame.currentPlayerIndex = (curPlayInd + 1)%this.mockGame.players.length;
      this.mockGame.currentThrow = [];
    }
    console.log(this.mockGame)
    return of(this.mockGame);
  }

}
