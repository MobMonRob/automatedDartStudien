import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { Observable, of } from 'rxjs';
import { GameState } from '../model/game.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  mockPlayers: Player[] = [
    {
      id: '481d6713-dcca-473b-a68b-97d55f9378f9',
      name: 'Janosch',
      currentDarts: [],
    },
    {
      id: '96cc7aa1-d15f-4faf-b5db-3f231b875f11',
      name: 'Nils',
      currentDarts: [],
    },
    {
      id: '96cc7aa1-d15f-4faf-b5db-3f231b875f12',
      name: 'Bilkesohn',
      currentDarts: [],
    },
  ];

  mockGame: GameState = {
    gameType: 'X01',
    players: this.mockPlayers,
    points: [101, 101, 101],
    averages: [0, 0, 0],
    darts: [0, 0, 0],
    details: 'Double Out',
    bust: false,
    currentPlayerIndex: 0,
  };

  initialPointValue = 0;
  previousScoreValue = 0;
  afterPlayerChange = true;

  constructor() {}

  getPlayers(): Observable<Player[]> {
    return of(this.mockPlayers);
  }

  getInitStateOfCurrentGame(): Observable<GameState> {
    this.initialPointValue = this.mockGame.points[0];
    return of(this.mockGame);
  }

  getCurrentGameState(): Observable<GameState> {
    return of(this.mockGame);
  }

  evaluateThrow(value: number, valueString: string): Observable<GameState> {
    let curPlayInd = this.mockGame.currentPlayerIndex;
    let currentThrow = this.mockGame.players[curPlayInd].currentDarts;
    if (currentThrow.length < 3) {
      if (this.afterPlayerChange) {
        this.previousScoreValue = this.mockGame.points[curPlayInd];
      }
      this.afterPlayerChange = false;
      if (this.mockGame.bust) {
        currentThrow = [];
        this.mockGame.bust = false;
      }
      this.mockGame.players[curPlayInd].currentDarts.push(valueString);
      this.mockGame.darts[curPlayInd] += 1;

      let nextValue = this.mockGame.points[curPlayInd] - value;
      if (nextValue < 0) {
        //Bust 
        this.mockGame.bust = true;
        this.mockGame.points[curPlayInd] = this.previousScoreValue;
      } else {
        //Win and No Bust (View handles Win)
        this.mockGame.points[curPlayInd] = nextValue;
      }
      this.mockGame.averages[curPlayInd] = Math.round(
        (this.initialPointValue - this.mockGame.points[curPlayInd]) /
          this.mockGame.darts[curPlayInd]
      );
    } else {
      this.evaluateNextPlayer();
    }
    return of(this.mockGame);
  }

  evaluateNextPlayer(): Observable<GameState> {
    this.mockGame.currentPlayerIndex = (this.mockGame.currentPlayerIndex + 1) % this.mockGame.players.length;
    this.mockGame.bust = false;
    this.mockGame.players[this.mockGame.currentPlayerIndex].currentDarts = [];
    this.afterPlayerChange = true;
    return of(this.mockGame);
  }
}
