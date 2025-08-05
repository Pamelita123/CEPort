import { Component } from '@angular/core';
import { ButtonComponent } from '../../layouts/button/button.component';
import {NavBar} from '../../components/navBar/navBar';
import{ CardComponent } from '../../layouts/card/card.component';
import { StatusTagComponent } from '@app/layouts/tag/status-tag.component';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  standalone: true,
  imports: [ButtonComponent, NavBar, CardComponent, StatusTagComponent]
})
export class LandingComponent {
  navigateToRegister() {
    window.location.href = '/register';
  }
}
