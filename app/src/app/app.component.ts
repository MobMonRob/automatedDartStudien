import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScoreboardComponent } from './components/game-pages/scoreboard/scoreboard.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { GamestateComponent } from './components/game-pages/gamestate-x01/gamestate.component';
import { GameselectComponent } from './components/start-game/gameselect/gameselect.component';
import { GamestateCricketComponent } from "./components/game-pages/gamestate-cricket/gamestate-cricket.component";
import { ScoringZoomViewComponent } from './components/scoring-zoom-view/scoring-zoom-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ScoreboardComponent, StatisticsComponent, GamestateComponent, GameselectComponent, GamestateCricketComponent, ScoringZoomViewComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Dart Score Tracker';
}
