import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ScoreboardComponent } from "../scoreboard/scoreboard.component";
import { StatisticsComponent } from "../../statistics/statistics.component";
import { PlayerCardComponent } from '../player-card/player-card.component';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'dartapp-gamestate',
  standalone: true,
  imports: [RouterOutlet, ScoreboardComponent, StatisticsComponent, PlayerCardComponent],
  templateUrl: './gamestate.component.html',
  styleUrl: './gamestate.component.scss'
})
export class GameState {
  players = [];
  currentPlayerIndex = 0;
  scores = [];

  constructor (private apiService: ApiService) {}

  ngOnInit(){
    this.apiService.getInitStateOfCurrentGame().subscribe(game => {
      console.log(game)
      this.startGame(game);
    })
  }

  startGame(game: any) {
    this.players = game.players;
    this.scores = game.points;
  }

}
