import { Routes } from '@angular/router';
import { LandingPageComponent } from './components/landing-page/landing-page.component';
import { GamehistoryComponent } from './components/gamehistory/gamehistory.component';
import { GamePageWrapperComponent } from './components/game-pages/game-page-wrapper/game-page-wrapper.component';

export const routes: Routes = [
  { path: 'game', component: GamePageWrapperComponent },
  { path: 'history', component: GamehistoryComponent },
  { path: '', component: LandingPageComponent }
];
