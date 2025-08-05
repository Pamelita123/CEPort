import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

import { FeedsService, LastDataSummary } from '@app/services/feeds/feeds.service';
import { LoaderComponent } from '@app/components/loader/loader';

interface SensorData extends LastDataSummary {
  icon: string;
  category: 'environmental' | 'activity' | 'parking';
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  icon: string;
}

interface ConnectionStatus {
  connected: boolean;
  message?: string;
  username?: string;
  feedCount?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Loading states
  loading = true;
  refreshing = false;
  connectionError: string | null = null;

  // Connection status
  connectionStatus: ConnectionStatus = { connected: false };
  lastUpdate: Date = new Date();

  // Sensor data
  allSensorData: SensorData[] = [];
  environmentalSensors: SensorData[] = [];
  activitySensors: SensorData[] = [];
  parkingSensors: SensorData[] = [];

  // Parking statistics
  availableSpaces = 0;
  totalSpaces = 2;
  occupancyRate = 0;

  // System alerts
  systemAlerts: SystemAlert[] = [];

  // Auto-refresh
  autoRefreshEnabled = true;
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  constructor(
    private feedsService: FeedsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando Dashboard IoT');
    this.initializeDashboard();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private initializeDashboard(): void {
    this.loading = true;
    console.log('🔄 Cargando datos iniciales del dashboard...');
    
    this.checkConnection();
  }

  checkConnection(): void {
    console.log('🔍 Verificando conexión con Adafruit IO...');
    
    this.feedsService.checkConnection().pipe(
      catchError((error: any) => {
        console.error('❌ Error verificando conexión:', error);
        setTimeout(() => {
          this.connectionStatus = { connected: false, message: 'Error de red' };
          this.connectionError = 'Error al verificar conexión con Adafruit IO';
          this.loading = false;
          this.cdr.detectChanges();
        });
        return of({ connected: false });
      })
    ).subscribe((result) => {
      setTimeout(() => {
        this.connectionStatus = { 
          connected: result.connected, 
          message: result.connected ? 'Conectado a Adafruit IO' : 'Desconectado'
        };
        console.log('📡 Estado de conexión:', this.connectionStatus);
        
        if (result.connected) {
          this.loadSensorData();
        } else {
          this.connectionError = 'No se pudo conectar con Adafruit IO';
          this.loading = false;
        }
        this.cdr.detectChanges();
      });
    });
  }

  loadSensorData(): void {
    console.log('📊 Cargando datos de sensores...');
    this.refreshing = true;
    
    this.feedsService.getAllLastData().pipe(
      catchError(error => {
        console.error('❌ Error cargando datos de sensores:', error);
        this.connectionError = 'Error al cargar datos de sensores';
        return of([]);
      }),
      finalize(() => {
        setTimeout(() => {
          this.refreshing = false;
          this.loading = false;
          this.cdr.detectChanges();
        });
      })
    ).subscribe(data => {
      console.log('✅ Datos de sensores obtenidos:', data);
      setTimeout(() => {
        this.processSensorData(data);
        this.lastUpdate = new Date();
        this.connectionError = null;
        this.cdr.detectChanges();
      });
    });
  }

  private processSensorData(data: LastDataSummary[]): void {
    console.log('🔄 Procesando datos de sensores...');
    
    this.allSensorData = data.map(sensor => ({
      ...sensor,
      icon: this.getSensorIcon(sensor.feedKey),
      category: this.getSensorCategory(sensor.feedKey)
    }));

    // Categorizar sensores
    this.environmentalSensors = this.allSensorData.filter(s => s.category === 'environmental');
    this.activitySensors = this.allSensorData.filter(s => s.category === 'activity');
    this.parkingSensors = this.allSensorData.filter(s => s.category === 'parking');

    // Calcular estadísticas de estacionamiento
    this.calculateParkingStats();

    // Generar alertas si es necesario
    this.checkForAlerts();

    console.log('📈 Datos procesados:', {
      environmental: this.environmentalSensors.length,
      activity: this.activitySensors.length,
      parking: this.parkingSensors.length
    });
  }

  private getSensorIcon(feedKey: string): string {
    const iconMap: { [key: string]: string } = {
      'sound-sensor': 'icon-volume',
      'gas-sensor': 'icon-gas',
      'temperature': 'icon-thermometer',
      'humidity': 'icon-droplet',
      'motion-detector': 'icon-motion',
      'ultrasonic-distance': 'icon-ruler',
      'ultrasonic-distance2': 'icon-ruler',
      'nfc-uid': 'icon-nfc',
      'servo-angle': 'icon-settings'
    };
    return iconMap[feedKey] || 'icon-sensor';
  }

  private getSensorCategory(feedKey: string): 'environmental' | 'activity' | 'parking' {
    const categoryMap: { [key: string]: 'environmental' | 'activity' | 'parking' } = {
      'sound-sensor': 'environmental',
      'gas-sensor': 'environmental',
      'temperature': 'environmental',
      'humidity': 'environmental',
      'motion-detector': 'activity',
      'nfc-uid': 'activity',
      'servo-angle': 'activity',
      'ultrasonic-distance': 'parking',
      'ultrasonic-distance2': 'parking'
    };
    return categoryMap[feedKey] || 'environmental';
  }

  private calculateParkingStats(): void {
    this.totalSpaces = this.parkingSensors.length;
    this.availableSpaces = this.parkingSensors.filter(sensor => 
      !this.isParkingSpaceOccupied(sensor)
    ).length;
    
    this.occupancyRate = this.totalSpaces > 0 
      ? Math.round(((this.totalSpaces - this.availableSpaces) / this.totalSpaces) * 100)
      : 0;

    console.log('🅿️ Estadísticas de estacionamiento:', {
      total: this.totalSpaces,
      available: this.availableSpaces,
      occupancy: this.occupancyRate
    });
  }

  private checkForAlerts(): void {
    // Limpiar alertas antiguas
    this.systemAlerts = [];

    // Verificar sensores sin datos
    const sensorsWithoutData = this.allSensorData.filter(s => !s.lastValue);
    if (sensorsWithoutData.length > 0) {
      this.addAlert('warning', 'Sensores sin datos', 
        `${sensorsWithoutData.length} sensor(es) no están enviando datos`, 
        'icon-alert');
    }

    // Verificar valores extremos
    this.environmentalSensors.forEach(sensor => {
      if (sensor.lastValue && sensor.feedKey === 'gas-sensor') {
        const gasValue = parseFloat(sensor.lastValue.value.toString());
        if (gasValue > 500) {
          this.addAlert('error', 'Nivel de gas alto', 
            `Detectado nivel de gas elevado: ${gasValue} PPM`, 
            'icon-gas');
        }
      }
      
      if (sensor.lastValue && sensor.feedKey === 'temperature') {
        const tempValue = parseFloat(sensor.lastValue.value.toString());
        if (tempValue > 35) {
          this.addAlert('warning', 'Temperatura alta', 
            `Temperatura elevada detectada: ${tempValue}°C`, 
            'icon-thermometer');
        }
      }
    });
  }

  private addAlert(type: 'warning' | 'error' | 'info', title: string, message: string, icon: string): void {
    const alert: SystemAlert = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      icon
    };
    this.systemAlerts.push(alert);
  }

  // Template methods
  formatActivityValue(sensor: SensorData): string {
    if (!sensor.lastValue) return '--';
    
    const value = sensor.lastValue.value.toString();
    
    switch (sensor.feedKey) {
      case 'motion-detector':
        return value === '1' ? 'Detectado' : 'Sin movimiento';
      case 'nfc-uid':
        return value || 'Sin tarjeta';
      case 'servo-angle':
        return `${value}°`;
      default:
        return value;
    }
  }

  isParkingSpaceOccupied(sensor: SensorData): boolean {
    if (!sensor.lastValue) return false;
    const distance = parseFloat(sensor.lastValue.value.toString());
    return distance < 100; // Consideramos ocupado si la distancia es menor a 100cm
  }

  getParkingSpaceStatus(sensor: SensorData): string {
    if (!sensor.lastValue) return 'Sin datos';
    return this.isParkingSpaceOccupied(sensor) ? 'Ocupado' : 'Disponible';
  }

  // Action methods
  refreshData(): void {
    console.log('🔄 Actualizando datos manualmente...');
    this.loadSensorData();
  }

  viewHistory(feedKey: string): void {
    console.log('📊 Viendo historial para:', feedKey);
    // TODO: Implementar navegación a página de historial
    alert(`Historial para ${feedKey} - Funcionalidad en desarrollo`);
  }

  viewAllHistory(): void {
    console.log('📊 Viendo historial completo');
    // TODO: Implementar navegación a página de historial completo
    alert('Historial completo - Funcionalidad en desarrollo');
  }

  exportData(): void {
    console.log('💾 Exportando datos');
    // TODO: Implementar exportación de datos
    alert('Exportación de datos - Funcionalidad en desarrollo');
  }

  openSettings(): void {
    console.log('⚙️ Abriendo configuración');
    // TODO: Implementar navegación a configuración
    alert('Configuración - Funcionalidad en desarrollo');
  }

  dismissAlert(alertId: string): void {
    this.systemAlerts = this.systemAlerts.filter(alert => alert.id !== alertId);
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.setupAutoRefresh();
    } else {
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
      }
    }
    console.log('🔄 Auto-refresh:', this.autoRefreshEnabled ? 'activado' : 'desactivado');
  }

  private setupAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    if (this.autoRefreshEnabled) {
      this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
        if (!this.loading && !this.refreshing) {
          console.log('🔄 Auto-refresh ejecutándose...');
          this.loadSensorData();
        }
      });
    }
  }
}
