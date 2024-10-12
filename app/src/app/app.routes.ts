import { Routes } from '@angular/router';
import { GamestateComponent } from './components/game-pages/gamestate/gamestate.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';

export const routes: Routes = [
    { path: 'game/x01', component: GamestateComponent }, 
    { path: '', component: LandingPageComponent }, 
  ];
