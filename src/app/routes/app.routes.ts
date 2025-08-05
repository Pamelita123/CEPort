import { Routes } from '@angular/router';
import { LoginView } from '@views/login/login.view';
import { RegisterView } from '@views/register/register.view';
import { LandingComponent } from '@views/landing/landing.component';
import { ClientsView } from '@views/clients/clients.view';
import { DoctorsView } from '@views/doctors/doctors.view';
import { MedicinesView } from '@views/medicines/medicines.view';
import { DiagnosticsView } from '@views/diagnostics/diagnostics.view';
import { MedicinesRequiredView } from '@views/medicinesRequired/medicinesRequired.view';
import { DashboardComponent } from '@views/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', component: LoginView},
  { path: 'login', component: LoginView },
  { path: 'register', component: RegisterView },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'Dashboard', component: DashboardComponent },
  { path: 'Home', redirectTo: 'dashboard', pathMatch: 'full' },
]