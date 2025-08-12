import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getCurrentUserFromToken } from '@services/auth/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-three-dots',
  templateUrl: './threeDots.component.html',
  styleUrls: ['./threeDots.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class ThreeDotsComponent implements OnInit {
  private router = inject(Router);

  isMenuOpen = signal<boolean>(false);
  isUserLoggedIn = signal<boolean>(false);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Clima', route: '/clima', icon: 'device_thermostat' },
    { label: 'Calidad del aire', route: '/calidad-aire', icon: 'air' },
    { label: 'Nivel de Ruido', route: '/nivel-ruido', icon: 'graphic_eq' },
    { label: 'Tránsito', route: '/transito', icon: 'person' },
    { label: 'Cargador 1', route: '/cargador-1', icon: 'bolt' },
    { label: 'Cargador 2', route: '/cargador-2', icon: 'bolt' }
  ];

  async ngOnInit(): Promise<void> {
    try {
      const user = await getCurrentUserFromToken();
      if (user) {
        this.isUserLoggedIn.set(true);
      } else {
        this.isUserLoggedIn.set(false);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      this.isUserLoggedIn.set(false);
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update(current => !current);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  navigateTo(route: string): void {
    if (!this.isUserLoggedIn() && route !== '/' && route !== '/login' && route !== '/register') {
      this.router.navigate(['/login']);
    } else {
      this.router.navigate([route]);
    }
    this.closeMenu();
  }

  onBackdropClick(): void {
    this.closeMenu();
  }
}