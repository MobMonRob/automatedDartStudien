import { Injectable } from '@angular/core';
import { Player } from '../model/player.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  mockPlayers: Player[] = [
    {id: "481d6713-dcca-473b-a68b-97d55f9378f9", name: "Janosch"},
    {id: "96cc7aa1-d15f-4faf-b5db-3f231b875f11", name: "Nils"}
  ]

  constructor() { }

  getPlayers(): Observable<Player[]>{
    return of(this.mockPlayers);
  }
}
