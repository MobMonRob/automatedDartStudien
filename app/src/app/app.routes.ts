import { Routes } from '@angular/router';
import { GamestateComponent } from './components/game-pages/gamestate-x01/gamestate.component';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { GamestateCricketComponent } from './components/game-pages/gamestate-cricket/gamestate-cricket.component';
import { GamestateTyaComponent } from './components/game-pages/gamestate-tya/gamestate-tya.component';
import { GamehistoryComponent } from './components/gamehistory/gamehistory.component';
import { TestingComponent } from './components/game-pages/testing/testing.component';

export const routes: Routes = [
  { path: 'game/cricket', component: GamestateCricketComponent },
  { path: 'game/x01', component: GamestateComponent },
  { path: 'game/tya', component: GamestateTyaComponent },
  { path: 'game/testing', component: TestingComponent },
  { path: 'history', component: GamehistoryComponent },
  { path: '', component: LandingPageComponent }
];
