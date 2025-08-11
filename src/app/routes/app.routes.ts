import { Routes } from '@angular/router';
import { LoginView } from '@views/login/login.view';
import { RegisterView } from '@views/register/register.view';
import { DashboardComponent } from '@views/dashboard/dashboard.component';
import { ClimaView } from '@views/clima/clima.view';
import { AirQualityView } from '@views/air-quality/air-quality.view';
import { NoiseView } from '@views/noise/noise.view';
import { TransitoView } from '@views/transit/transito.view';
import { Charger1View } from '@views/charger1/charger1.view';
import { Charger2View } from '@views/charger2/charger2.view';
import { HumidityView } from '@views/humidity/humidity.view';

export const routes: Routes = [
  { path: '', component: LoginView },
  { path: 'login', component: LoginView },
  { path: 'register', component: RegisterView },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'Dashboard', component: DashboardComponent },
  { path: 'clima', component: ClimaView },
  { path: 'Home', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'calidad-aire', component: AirQualityView },
  { path: 'nivel-ruido', component: NoiseView },
  { path: 'transito', component: TransitoView },
  { path: 'cargador-1', component: Charger1View },
  { path: 'cargador-2', component: Charger2View },
  { path: 'humedad', component: HumidityView },
];
