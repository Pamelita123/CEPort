import { Routes } from '@angular/router';
import { LoginView } from '@views/login/login.view';
import { RegisterView } from '@views/register/register.view';
import { DashboardComponent } from '@views/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: LoginView},
  { path: 'login', component: LoginView },
  { path: 'register', component: RegisterView },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'Dashboard', component: DashboardComponent },
  { path: 'Home', redirectTo: 'dashboard', pathMatch: 'full' },
]