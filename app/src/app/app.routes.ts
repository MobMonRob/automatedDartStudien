import { Routes } from '@angular/router';
import { GamestateComponent } from './components/game-pages/gamestate-x01/gamestate.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { GamestateCricketComponent } from './components/game-pages/gamestate-cricket/gamestate-cricket.component';
import { GamestateTyaComponent } from './components/game-pages/gamestate-tya/gamestate-tya.component';

export const routes: Routes = [
  { path: 'game/x01', component: GamestateComponent },
  { path: 'game/cricket', component: GamestateCricketComponent },
  { path: 'game/tya', component: GamestateTyaComponent },
  { path: '', component: LandingPageComponent }
];
