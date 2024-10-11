import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScoreboardComponent } from "./components/game-pages/scoreboard/scoreboard.component";
import { StatisticsComponent } from "./components/statistics/statistics.component";
import { GameState } from "./components/game-pages/gamestate/gamestate.component";
import { GameselectComponent } from "./components/start-game/gameselect/gameselect.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ScoreboardComponent, StatisticsComponent, GameState, GameselectComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Dart Score Tracker';
}
