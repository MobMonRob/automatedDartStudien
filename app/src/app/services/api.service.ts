import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { catchError, map, Observable, of } from 'rxjs';
import { ArchiveGameData, GameState } from '../model/game.model';
import { WsGamestateMessage, ApiDartPosition, ApiPlayer, GameType, CalibrationState, WsPosition, CameraState } from '../model/api.models';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CalibrationModel, CameraModel } from '../model/calibration.model';
import { DartPositionService } from './dart-position.service';
import { Router } from '@angular/router';

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
    cameraStatus: [false, false, false],
    inVariant: '',
    outVariant: ''
  };

  private calibrationState: CalibrationModel = {
    currentPosition: [0,0],
    calibrationState: CalibrationState.WAITING_FOR_USER_CONFIRMATION,
    cameras: [],
    calibrationIndex: 1,
    calibrationCount: 4
  };

  constructor(
    private httpClient: HttpClient,
    private dartPositionService: DartPositionService,
    private router: Router
  ) {
    this.ws = new WebSocket(this.gamestateUrl);
    this.ws.onerror = (error) => {
      this.activeGamestate.gameType = GameType.ERROR;
    };
    this.ws.onopen = () => {
      console.log('WebSocket opened');
    };
    this.ws.onmessage = (event) => {
      let data = JSON.parse(event.data) as WsGamestateMessage;
      console.log(data);
      if (data === null) {
        return;
      }

      if (data.gameType !== undefined) {
        this.activeGamestate.gameType = data.gameType;
        if (data.gameType === GameType.CALIBRATION) {
          let cameras: CameraModel[] = [];
          if (data.cameras){
            cameras = data.cameras.map((camera) => {
              return {
                id: camera.id,
                state: camera.state,
                evaluation: camera.evaluation
              };
            })
          }
          this.calibrationState = {
            currentPosition: dartPositionService.convertDartPositionToImage(data.currentPosition),
            calibrationState: data.calibrationState,
            cameras: cameras,
            calibrationIndex: data.calibrationIndex,
            calibrationCount: data.calibrationCount
          };
          console.log(this.calibrationState);
        } else {
          const currentDartPositions = this.getCurrentDartPositions(data.lastDarts);

          // Update active gamestate for game modes
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
            cameraStatus: data.cameraStatus,
            inVariant: '',
            outVariant: ''
          };
          console.log(this.activeGamestate);
        }
      } else {
        this.activeGamestate.gameType = GameType.ERROR;
      }
      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    };
  }

  private getCurrentDartPositions(lastDarts: ApiDartPosition[][]): number[][][] {
    return lastDarts.map((playerDarts) => {
      let currentDartPositions: number[][] = [[], [], []];
      playerDarts.forEach((dart, i) => {
        const position = this.dartPositionService.convertDartPositionToImage(dart.position);
        currentDartPositions[i] = [position[0], position[1]];
      });
      return currentDartPositions;
    });
  }

  private getDartString(dart: ApiDartPosition): string {
    return (dart.doubleField ? 'D' : '') + (dart.tripleField ? 'T' : '') + dart.points;
  }

  initGame(gameState: GameState) {
    const body = {
      gameMode: gameState.gameType,
      playerIds: gameState.players.map((player) => player.id),
      x01InitialPoints: gameState.points[0]
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

  replaceDebugThrow(replacementIndex: number, value: number, valueString: string, reason: number, position: number[]) {
    let dartValue = {
      points: value,
      doubleField: valueString.includes('D'),
      tripleField: valueString.includes('T')
    };
    let body = {
      replace_index: replacementIndex,
      replace_with: dartValue,
      reason: reason
    };
    console.log(body); //TODO Nils add position to body
    this.httpClient.post(`${this.apiUrl}/game/replace-dart`, body).subscribe();
  }

  //Tracker Reset
  restartTracker() {
    return this.httpClient.post(`${this.piUrl}/empty`, {}).subscribe();
  }

  //Calibration Stuff
  startCalibration() {
    const CALIBRATION_SHOW_POSITIONS: number[][] = [
      [136.5, 69],
      [38, 139],
      [114, 185],
      [212.5, 143]
    ]

    const CONTROL_POSITIONS: WsPosition[] = [
      { x: 0.199569, y: 0.59232 },
      { x: -0.934412, y: 0.006765 },
      { x: -0.199569, y: -0.59232 },
      { x: 0.886588, y: -0.295183 }
    ];

    const CALIBRATION_POSITIONS: number[][] = [
      [139.29508473071277, 69.3839994402162],
      [37.6191598033589, 133.5716787300213],
      [110.70491526928724, 185.0560005597838],
      [210.03263153131428, 148.66091041819027]
    ]

    const imagePositions = CALIBRATION_POSITIONS.map(position =>
      this.dartPositionService.convertImagePositionToDart(position[0], position[1])
    );
    console.log('Converted Image Positions:', imagePositions);

    const body = imagePositions.map((position) => {return { x: position[0], y: position[1] }})

    console.log(JSON.stringify(body))
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.httpClient.post(`${this.apiUrl}/calibration/start`,  JSON.stringify(body), { headers }).subscribe();
  }

  getCurrentCalibrationState(): Observable<CalibrationModel> {
    return of(this.calibrationState);
  }

  confirmDartPlacement() {
    this.httpClient.post(`${this.apiUrl}/calibration/confirm`, {}).subscribe();
  }

  cancelCalibration() {
    this.httpClient.post(`${this.apiUrl}/calibration/stop`, {}).subscribe();
  }

  isCalibrationRunning(): boolean {
    const isInCalibration = this.activeGamestate.gameType === GameType.CALIBRATION;
    const isOnGameRoute = this.router.url.includes('/game'); 
    return isInCalibration && isOnGameRoute;
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

  //Camera Feed Stuff 
  getVideoSource(index: number): string {
    return `${this.piUrl}/video_feed/${index}`;
  }
}
