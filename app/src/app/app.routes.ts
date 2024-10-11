import { Routes } from '@angular/router';
import { GameState } from './components/game-pages/gamestate/gamestate.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';

export const routes: Routes = [
    { path: 'game', component: GameState }, 
    { path: '', component: LandingPageComponent }, 
  ];
