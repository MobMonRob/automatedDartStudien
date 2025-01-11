import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { Observable, of } from 'rxjs';
import { ArchiveGameData, GameStateX01 } from '../model/game.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  mockPlayers: Player[] = [
    {
      id: '481d6713-dcca-473b-a68b-97d55f9378f9',
      name: 'Test-User',
      currentDarts: [],
      currentDartPositions: [[], [], []]
    },
    {
      id: '481d6713-dcca-473b-a68b-97d55f9378f9',
      name: 'Test-User2',
      currentDarts: [],
      currentDartPositions: [[], [], []]
    },
    {
      id: '481d6713-dcca-473b-a68b-97d55f9378f9',
      name: 'Test-User3',
      currentDarts: [],
      currentDartPositions: [[], [], []]
    }
  ];

  mockGameArchive: ArchiveGameData[] = [
    {
      id: 1,
      duration: '25 min',
      winner: this.mockPlayers[0],
      players: this.mockPlayers,
      gameMode: 'X01 - 501',
      darts: [45, 60],
      averages: [50, 43]
    },
    {
      id: 1,
      duration: '30 min',
      winner: this.mockPlayers[1],
      players: this.mockPlayers,
      gameMode: 'Cricket',
      darts: [45, 60],
      averages: [50, 43]
    },
    {
      id: 1,
      duration: '20 min',
      winner: this.mockPlayers[0],
      players: this.mockPlayers,
      gameMode: 'Train Your Aim',
      darts: [45, 60],
      averages: [50, 43]
    }
  ];

  mockGame: GameStateX01 = {
    gameType: 'X01',
    players: this.mockPlayers,
    points: [101, 101, 101],
    averages: [0, 0, 0],
    darts: [0, 0, 0],
    bust: false,
    currentPlayerIndex: 0,
    inVariant: '',
    outVariant: ''
  };

  initialPointValue = 0;
  previousScoreValue = 0;
  afterPlayerChange = true;

  constructor() {}

  initX01Game(gameState: GameStateX01) {
    this.mockGame = gameState;
    this.mockPlayers = gameState.players;
  }

  addPlayer(player: Player) {
    this.mockPlayers.push(player);
  }

  getPlayers(): Observable<Player[]> {
    return of(this.mockPlayers);
  }

  getGameHistory(): Observable<ArchiveGameData[]>{
    return of(this.mockGameArchive);
  }

  getInitStateOfCurrentGameX01(): Observable<GameStateX01> {
    this.initialPointValue = this.mockGame.points[0];
    return of(this.mockGame);
  }

  getCurrentGameStateX01(): Observable<GameStateX01> {
    return of(this.mockGame);
  }

  evaluateThrow(value: number, valueString: string, position: number[]): Observable<GameStateX01> {
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
      this.mockGame.players[curPlayInd].currentDartPositions[currentThrow.length-1] = position;
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
        (this.initialPointValue - this.mockGame.points[curPlayInd]) / this.mockGame.darts[curPlayInd]
      );
    } else {
      this.evaluateNextPlayerX01();
    }
    return of(this.mockGame);
  }

  evaluateNextPlayerX01(): Observable<GameStateX01> {
    this.mockGame.currentPlayerIndex = (this.mockGame.currentPlayerIndex + 1) % this.mockGame.players.length;
    this.mockGame.bust = false;
    this.mockGame.players[this.mockGame.currentPlayerIndex].currentDarts = [];
    this.mockGame.players[this.mockGame.currentPlayerIndex].currentDartPositions = [[], [], []];
    this.afterPlayerChange = true;
    return of(this.mockGame);
  }
}
