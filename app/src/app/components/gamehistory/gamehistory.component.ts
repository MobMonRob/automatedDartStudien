import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ArchiveGameData } from '../../model/game.model';
import { ApiService } from '../../services/api.service';
import { TopbarComponent } from "../topbar/topbar.component";

@Component({
  selector: 'dartapp-gamehistory',
  standalone: true,
  imports: [CommonModule, TopbarComponent],
  templateUrl: './gamehistory.component.html',
  styleUrl: './gamehistory.component.scss'
})
export class GamehistoryComponent implements OnInit {
  gameHistory: ArchiveGameData[] = [];
  playerStrings: string[] = [];

  constructor(private apiservice: ApiService) {}

  ngOnInit(): void {
    this.apiservice.getGameHistory().subscribe((history) => {
      this.gameHistory = history;
      this.playerStrings = history.map((game) => game.players).map((player) => player.map((player) => player.name).join(', '));
    });
  }
}
