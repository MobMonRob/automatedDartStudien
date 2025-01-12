import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DartEventService {
  private throwEventSubject = new Subject< { currentDartPositions: number[][] } >();
  throwEvent$ = this.throwEventSubject.asObservable();

  emitThrowEvent(currentDartPositions: number[][]) {
    this.throwEventSubject.next( { currentDartPositions } );
  }
}
