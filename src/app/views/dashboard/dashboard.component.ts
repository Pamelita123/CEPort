import { Component } from '@angular/core';
import { CardComponent } from '@layouts/card/card.component';
import { StatusTagComponent } from '@layouts/tag/status-tag.component';
import { LoaderComponent } from '@components/loader/loader';
import { ThreeDotsComponent } from '@components/threeDots/threeDots.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CardComponent, 
    StatusTagComponent,
    LoaderComponent,
    ThreeDotsComponent
  ],
  standalone: true
})
export class DashboardComponent {


  constructor() {

  }
}