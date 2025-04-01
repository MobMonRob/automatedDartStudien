import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { catchError, map, Observable, of } from 'rxjs';
import { ArchiveGameData, GameState } from '../model/game.model';
import { WsGamestateMessage, ApiDartPosition, ApiPlayer, GameType } from '../model/api.models';
import { Calibration } from '../model/calibration.models';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private gamestateUrl = environment.gamestateUrl;
  private piUrl = environment.piUrl;
  private ws: WebSocket;

  private activeGamestate: GameState = {
    gameType: GameType.LOADING,
    players: [],
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

  constructor(private httpClient: HttpClient) {
    this.ws = new WebSocket(this.gamestateUrl);
    this.ws.onerror = (error) => {
      console.log(error)
      this.activeGamestate.gameType = GameType.ERROR;
    };
    this.ws.onopen = () => {
      console.log('WebSocket opened');
    };
    this.ws.onmessage = (event) => {
      let data = JSON.parse(event.data) as WsGamestateMessage;
      console.log(data);
      if(data === null){
        return;
      }

      const currentDartPositions = this.getCurrentDartPositions(data.lastDarts);

      // Update active gamestate
      this.activeGamestate = {
        gameType: data.gameType,
        players: data.players.map((apiPlayer, i) => {
          return {
            id: apiPlayer.id,
            name: apiPlayer.name,
            currentDarts: data.lastDarts[i].map((dart) => this.getDartString(dart)),
            currentDartPositions: currentDartPositions[i]
          };
        }),
        points: data.points,
        averages: data.averages,
        darts: data.dartsThrown,
        bust: data.bust,
        currentPlayerIndex: data.currentPlayer,
        inVariant: '',
        outVariant: ''
      };
      console.log(this.activeGamestate);
      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    };
  }

  private getCurrentDartPositions(lastDarts: ApiDartPosition[][]): number[][][] {
    return lastDarts.map((playerDarts) => {
      let currentDartPositions: number[][] = [[], [], []];
      playerDarts.forEach((dart, i) => {
        const position = this.convertDartPosition(dart);
        currentDartPositions[i] = [position[0], position[1]];
      });
      return currentDartPositions;
    });
  }

  private getDartString(dart: ApiDartPosition): string {
    return (dart.doubleField ? 'D' : '') + (dart.tripleField ? 'T' : '') + dart.points;
  }

  private convertDartPosition(dart: ApiDartPosition): number[] {
    if (dart === undefined || !dart.position) return [0, 0];

    const theta = Math.PI / 40;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    const x = dart.position.x;
    const y = dart.position.y;

    const xRot = x * cosTheta - y * sinTheta;
    const yRot = x * sinTheta + y * cosTheta;

    const xImg = Math.round(((xRot * 750 + 1000) * 250) / 2000);
    const yImg = Math.round(((yRot * -750 + 1000) * 254) / 2000);

    return [xImg, yImg];
  }

  initGame(gameState: GameState) {
    const body = {
      gameMode: gameState.gameType,
      playerIds: gameState.players.map((player) => player.id)
    };
    console.log(body);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.httpClient.post(`${this.apiUrl}/game/start-game`, JSON.stringify(body), { headers }).subscribe();
  }

  addPlayer(player: Player): Observable<Object> {
    const body = {
      name: player.name
    };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.httpClient.post(`${this.apiUrl}/players`, JSON.stringify(body), { headers });
  }

  errorPlayer: Player[] = [];
  getPlayers(): Observable<Player[]> {
    return this.httpClient.get<ApiPlayer[]>(`${this.apiUrl}/players`).pipe(
      // convert api response to Player model
      map((apiPlayers: ApiPlayer[]) => {
        return apiPlayers.map((apiPlayer) => {
          console.log(apiPlayer);
          return {
            id: apiPlayer.id,
            name: apiPlayer.name,

            currentDarts: [],
            currentDartPositions: [[], [], []]
          };
        });
      }),
      catchError(() => of(this.errorPlayer))
    );
  }

  getCurrentGameState(): Observable<GameState> {
    return of(this.activeGamestate);
  }

  submitDebugThrow(value: number, valueString: string, position: number[]) {
    let body = {
      points: value,
      doubleField: valueString.includes('D'),
      tripleField: valueString.includes('T')
    };
    console.log(body); //TODO Nils add position to body
    this.httpClient.post(`${this.apiUrl}/game/submit-dart`, body).subscribe();
  }

  replaceDebugThrow(replacementIndex: number, value: number, valueString: string, position: number[]) {
    let dartValue = {
      points: value,
      doubleField: valueString.includes('D'),
      tripleField: valueString.includes('T')
    };
    let body = {
      replace_index: replacementIndex,
      replace_with: dartValue
    };
    console.log(body); //TODO Nils add position to body
    this.httpClient.post(`${this.apiUrl}/game/replace-dart`, body).subscribe();
  }

  handleMiss() {
    return this.httpClient
      .post(`${this.apiUrl}/game/miss`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  handleUndo() {
    return this.httpClient
      .post(`${this.apiUrl}/game/undo-dart`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  //Tracker Reset
  restartTracker() {
    return this.httpClient.post(`${this.piUrl}/empty`, {}).subscribe();
  }

  //Calibration Stuff
  mockCalibration: Calibration = {
    currentZoomPosition: [120, 70],
    errorMsg: '',
    instructionMsg: 'Platziere den Pfeil in der Mitte des Ziels und drücke die Bestätigungstaste',
    isFinished: false,
    isCanceled: false,
    currentStep: 1,
    maximumSteps: 4
  };

  initCalibrationStep(): Observable<Calibration> {
    return of(this.mockCalibration); //TODO Nils call Endpoint here
  }

  evaluateCalibrationStepResult(): Observable<Calibration> {
    return new Observable<Calibration>((observer) => {
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

  //Game History Stuff
  private player: Player = {
    id: '1',
    name: 'Nils',
    currentDarts: [],
    currentDartPositions: [[], [], []]
  };

  mockGameArchive: ArchiveGameData[] = [
    {
      id: 1,
      duration: '25 min',
      winner: this.player,
      players: [],
      gameMode: 'X01 - 501',
      darts: [45, 60],
      averages: [50, 43]
    },
    {
      id: 1,
      duration: '30 min',
      winner: this.player,
      players: [],
      gameMode: 'Cricket',
      darts: [45, 60],
      averages: [50, 43]
    },
    {
      id: 1,
      duration: '20 min',
      winner: this.player,
      players: [],
      gameMode: 'Train Your Aim',
      darts: [45, 60],
      averages: [50, 43]
    }
  ];

  getGameHistory(): Observable<ArchiveGameData[]> {
    return of(this.mockGameArchive);
  }
}
