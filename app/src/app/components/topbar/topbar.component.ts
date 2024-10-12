import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'dartapp-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {

  constructor(private router: Router) {}

  navHome(){
    this.router.navigateByUrl('/');
  }
}
