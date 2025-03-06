import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { catchError, map, Observable, of } from 'rxjs';
import { ArchiveGameData, GameStateX01 } from '../model/game.model';
import { Calibration } from '../model/calibration.models';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = environment.apiUrl
  private gamestateUrl = environment.gamestateUrl
  private ws: WebSocket;

  private activeGamestate: GameStateX01;

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

  mockCalibration: Calibration = {
    currentZoomPosition: [120, 70],
    errorMsg: '',
    instructionMsg: 'Platziere den Pfeil in der Mitte des Ziels und drücke die Bestätigungstaste',
    isFinished: false,
    isCanceled: false,
    currentStep: 1,
    maximumSteps: 4
  };

  initialPointValue = 0;
  previousScoreValue = 0;
  afterPlayerChange = true;

  constructor(private httpClient: HttpClient) {
    this.activeGamestate = this.mockGame;
    this.ws = new WebSocket(this.gamestateUrl);
    this.ws.onopen = () => {
      console.log('WebSocket opened');
    }
    this.ws.onmessage = (event) => {
      let data = JSON.parse(event.data) as WsGamestateMessage;
      console.log(data);    

      const currentDartPositions = this.getCurrentDartPositions(data.lastDarts);

      // Update active gamestate
      this.activeGamestate = {
        gameType: 'X01',
        players: data.players.map((apiPlayer, i) => {
          return {
            id: apiPlayer.id,
            name: apiPlayer.name,
            currentDarts: data.lastDarts[i].map(dart => this.getDartString(dart)),
            currentDartPositions: currentDartPositions[i]
          }
        }
        ),
        points: data.points,
        averages: data.averages,
        darts: data.dartsThrown,
        bust: data.bust,
        currentPlayerIndex: data.currentPlayer,
        inVariant: '',
        outVariant: ''
      }
      console.log(this.activeGamestate);
      this.ws.onclose = () => {
        console.log('WebSocket closed');
      }
    }
  }

  private getCurrentDartPositions(lastDarts: ApiDartPosition[][]): number[][][] {
    return lastDarts.map((playerDarts) => {
      let currentDartPositions: number[][] = [[], [], []];
      playerDarts.forEach((dart, i) => {
          const position = this.convertDartPosition(dart);
          currentDartPositions[i] = [position[0], position[1]];
        })
      return currentDartPositions;
    });
  }

  private getDartString(dart: ApiDartPosition): string {
    return (dart.doubleField ? 'D' : '') + (dart.tripleField ? 'T' : '') + dart.points;
  }

  private convertDartPosition(dart: ApiDartPosition): number[] {
    if(dart === undefined) return [0, 0];

    const theta = Math.PI / 40; 
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const x = dart.position.x
    const y = dart.position.y

    const xRot = x * cosTheta - y * sinTheta;
    const yRot = x * sinTheta + y * cosTheta;

    const xImg = Math.round((xRot * 750 + 1000) * 250/2000);
    const yImg = Math.round((yRot * -750 + 1000) * 254/2000);

    return [xImg, yImg];
  }

  initX01Game(gameState: GameStateX01) {
    this.mockGame = gameState;
    this.mockPlayers = gameState.players;

    const body = {
      gameMode: "X01",
      playerIds: gameState.players.map(player => player.id)
    }
    console.log(body)
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.httpClient.post(`${this.apiUrl}/game/start-game`, JSON.stringify(body), {headers}).subscribe();
  }

  addPlayer(player: Player): Observable<Object> {
    this.mockPlayers.push(player);

    const body = {
      name: player.name
    }
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.httpClient.post(`${this.apiUrl}/players`, JSON.stringify(body), {headers});
  }

  getPlayers(): Observable<Player[]> {
    return this.httpClient.get<ApiPlayer[]>(`${this.apiUrl}/players`).pipe(
      // convert api response to Player model
      map((apiPlayers: ApiPlayer[]) => {
        return apiPlayers.map(apiPlayer => {
          console.log(apiPlayer);
          return {
            id: apiPlayer.id,
            name: apiPlayer.name,
            
            currentDarts: [],
            currentDartPositions: [[], [], []]
          }
        });
      }),
      catchError(() => of(this.mockPlayers)),
    )
  }

  getGameHistory(): Observable<ArchiveGameData[]>{
    return of(this.mockGameArchive);
  }

  getInitStateOfCurrentGameX01(): Observable<GameStateX01> {
    this.initialPointValue = this.mockGame.points[0];
    return of(this.mockGame);
  }

  getCurrentGameStateX01(): Observable<GameStateX01> {
    return of(this.activeGamestate);
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
    return of(this.activeGamestate);
  }

  evaluateNextPlayerX01(): Observable<GameStateX01> {
    this.mockGame.currentPlayerIndex = (this.mockGame.currentPlayerIndex + 1) % this.mockGame.players.length;
    this.mockGame.bust = false;
    this.mockGame.players[this.mockGame.currentPlayerIndex].currentDarts = [];
    this.mockGame.players[this.mockGame.currentPlayerIndex].currentDartPositions = [[], [], []];
    this.afterPlayerChange = true;
    return of(this.mockGame);
  }

  initCalibrationStep(): Observable<Calibration> {
    return of(this.mockCalibration);
  }

  evaluateCalibrationStepResult(): Observable<Calibration> {
    return new Observable<Calibration>(observer => {
      setTimeout(() => {
        this.mockCalibration.currentStep++;
        if (this.mockCalibration.currentStep >= this.mockCalibration.maximumSteps) {
          this.mockCalibration.isFinished = true;
        }
        observer.next(this.mockCalibration);
        observer.complete();
      }, 3000);
    });
  }

  cancelCalibration(): Observable<Calibration> {
    this.mockCalibration.isFinished = false;
    this.mockCalibration.isCanceled = true;
    this.mockCalibration.errorMsg = 'Calibration was canceled by user';
    this.mockCalibration.instructionMsg = '';
    this.mockCalibration.currentStep = 0;
    return of(this.mockCalibration);
  }
}

interface ApiPlayer{
  id: string;
  name: string;
}

interface ApiDartPosition{
  points: number;
  doubleField: boolean;
  tripleField: boolean;
  position: { x: number, y: number };
}

interface WsGamestateMessage{
  gameType: number;
  players: ApiPlayer[];
  points: number[];
  averages: number[];
  bust: boolean;
  currentPlayer: number;
  lastDarts: ApiDartPosition[][];
  dartsThrown: number[];
}
