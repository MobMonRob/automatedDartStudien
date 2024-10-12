import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from "../topbar/topbar.component";
import { GameselectComponent } from "../start-game/gameselect/gameselect.component";

@Component({
  selector: 'dartapp-landing-page',
  standalone: true,
  imports: [CommonModule, TopbarComponent, GameselectComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
  images = [
    { src: 'assets/image1.jpg', title: 'Bild 1' },
    { src: 'assets/image2.jpg', title: 'Bild 2' },
    { src: 'assets/image3.jpg', title: 'Bild 3' }
  ];
  currentIndex = 0;

  ngOnInit() {
    this.startSlideshow();
  }

  startSlideshow() {
    setInterval(() => {
      this.changeSlide(1);
    }, 3000); 
  }

  changeSlide(step: number) {
    this.currentIndex = (this.currentIndex + step + this.images.length) % this.images.length;
  }
}
