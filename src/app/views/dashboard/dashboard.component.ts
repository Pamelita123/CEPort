import { Component, signal } from '@angular/core';
import { CardComponent } from '@layouts/card/card.component';
import { StatusTagComponent } from '@layouts/tag/status-tag.component';
import { LoaderComponent } from '@components/loader/loader';
import {getCurrentUserFromToken} from '@services/auth/auth.service';
import {UserAttributes} from '@expressModels/users/users';
import {NavBar} from '@components/navBar/navBar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CardComponent,
    StatusTagComponent,
    LoaderComponent,
    NavBar
  ],
  standalone: true
})
export class DashboardComponent {
  username = signal<UserAttributes | string>('');

  async ngOnInit(): Promise<void> {
    const user = await getCurrentUserFromToken();
    if (!user) {
      this.username.set('');
      return;
    }
    this.username.set(user.username.charAt(0).toUpperCase() + user.username.substring(1));


  }


  constructor() {

  }
}
