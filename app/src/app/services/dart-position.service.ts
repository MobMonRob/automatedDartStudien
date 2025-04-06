import { Injectable } from '@angular/core';
import { ApiDartPosition, WsPosition } from '../model/api.models';

@Injectable({
  providedIn: 'root'
})
export class DartPositionService {

  private readonly theta: number = Math.PI / 40;
  private readonly cosTheta: number = Math.cos(this.theta);
  private readonly sinTheta: number = Math.sin(this.theta);

  constructor() {}

  convertDartPositionToImage(position: WsPosition): number[] {
    if (!position || position.x === undefined || position.y === undefined) {
      return [0, 0]; 
    }
  
    const x = position.x;
    const y = position.y;
  
    const xRot = x * this.cosTheta - y * this.sinTheta;
    const yRot = x * this.sinTheta + y * this.cosTheta;
  
    const xImg = ((xRot * 750 + 1000) * 250.0) / 2000.0;
    const yImg = ((yRot * -750 + 1000) * 254.44) / 2000.0;
  
    return [xImg, yImg];
  }

  convertImagePositionToDart(imageX: number, imageY: number): number[] {
    const xRot = ((imageX * 2000) / 250.0 - 1000) / 750.0;
    const yRot = ((imageY * 2000) / 254.44 - 1000) / -750.0;

    const x = xRot * this.cosTheta + yRot * this.sinTheta;
    const y = -xRot * this.sinTheta + yRot * this.cosTheta;

    return [x, y];
  }
}
