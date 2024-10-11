import { Component } from '@angular/core';
import { GameselectComponent } from "../start-game/gameselect/gameselect.component";

@Component({
  selector: 'dartapp-landing-page',
  standalone: true,
  imports: [GameselectComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {

}
