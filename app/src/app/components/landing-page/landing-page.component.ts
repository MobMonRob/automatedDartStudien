import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from "../topbar/topbar.component";
import { GameselectComponent } from "../start-game/gameselect/gameselect.component";
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GameState } from '../../model/game.model';
import { GameType } from '../../model/api.models';

@Component({
  selector: 'dartapp-landing-page',
  standalone: true,
  imports: [CommonModule, TopbarComponent, GameselectComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  private testingGamestate: GameState = {} as GameState;

  constructor(private router: Router, private apiService: ApiService){}

  navToHistory(){
    this.router.navigateByUrl("/history")
  }

  navToTestingSuite(){
    this.testingGamestate = {
      gameType: GameType.TESTING,
      players: [{
        id: "67813f25fe49356c18b9fb42",
        name: "TestingSuite",
        currentDarts: [],
        currentDartPositions: [[], [], []]
      }],
      points: [],
      darts: [],
      averages: [],
      currentPlayerIndex: 0,
      bust: false,
      inVariant: "",
      outVariant: "",
    }
    this.apiService.initGame(this.testingGamestate)
    this.router.navigateByUrl("/game", {
      state: { requestedGameType: GameType.TESTING }
    });
  }
}
