import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from "../topbar/topbar.component";
import { GameselectComponent } from "../start-game/gameselect/gameselect.component";
import { Router } from '@angular/router';

@Component({
  selector: 'dartapp-landing-page',
  standalone: true,
  imports: [CommonModule, TopbarComponent, GameselectComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

  constructor(private router: Router){}

  navToHistory(){
    console.log("E")
    this.router.navigateByUrl("/history")
  }
}
