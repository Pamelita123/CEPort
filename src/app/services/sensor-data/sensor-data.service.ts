import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { FeedsService, FeedData } from '../feeds/feeds.service';
import { interval, switchMap, catchError, of, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface SensorData {
  feedKey: string;
  value: number;
  unit: string;
  status: string;
  statusColor: string;
  lastUpdated: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SensorDataService {
  private destroyRef = inject(DestroyRef);
  private feedsService = inject(FeedsService);

  // Sensor data signals
  gasData = signal<SensorData | null>(null);
  temperatureData = signal<SensorData | null>(null);
  humidityData = signal<SensorData | null>(null);
  soundData = signal<SensorData | null>(null);
  motionData = signal<SensorData | null>(null);
  ultrasonicDistance1Data = signal<SensorData | null>(null);
  ultrasonicDistance2Data = signal<SensorData | null>(null);

  private readonly feedKeys = [
    'gas-sensor',
    'temperature',
    'humidity',
    'sound-sensor',
    'motion-detector',
    'ultrasonic-distance',
    'ultrasonic-distance2'
  ] as const;

  private readonly sensorConfig: Record<string, { unit: string; name: string }> = {
    'gas-sensor': { unit: 'PPM', name: 'Calidad del Aire' },
    'temperature': { unit: '°C', name: 'Temperatura' },
    'humidity': { unit: '%', name: 'Humedad' },
    'sound-sensor': { unit: 'dB', name: 'Nivel de Ruido' },
    'motion-detector': { unit: '', name: 'Detección de Movimiento' },
    'ultrasonic-distance': { unit: 'cm', name: 'Distancia Ultrasónica 1' },
    'ultrasonic-distance2': { unit: 'cm', name: 'Distancia Ultrasónica 2' }
  };

  constructor() {
    this.startPolling();
  }

  private startPolling(): void {
    interval(30000)
      .pipe(
        switchMap(() => this.updateAllSensorData()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Initial load
    this.updateAllSensorData().subscribe();
  }

  private updateAllSensorData(): Observable<void> {
    return new Observable<void>(observer => {
      const promises = this.feedKeys.map(feedKey =>
        this.feedsService.getLastData(feedKey)
          .pipe(
            catchError(() => of(null))
          )
          .toPromise()
          .then((data: FeedData | null | undefined) => this.updateSensorSignal(feedKey, data || null))
      );

      Promise.all(promises).then(() => {
        observer.next();
        observer.complete();
      });
    });
  }

  private updateSensorSignal(feedKey: string, data: FeedData | null): void {
    const config = this.sensorConfig[feedKey];

    if (!data) {
      const errorData: SensorData = {
        feedKey,
        value: 0,
        unit: config.unit,
        status: 'Datos no disponibles',
        statusColor: 'secondary',
        lastUpdated: new Date(),
        error: 'No hay datos disponibles'
      };

      this.setSensorData(feedKey, errorData);
      return;
    }

    const value = parseFloat(data.value.toString());
    const sensorData: SensorData = {
      feedKey,
      value,
      unit: config.unit,
      status: this.feedsService.getStatusText(feedKey, value),
      statusColor: this.feedsService.getStatusColor(feedKey, value),
      lastUpdated: new Date(data.created_at)
    };

    this.setSensorData(feedKey, sensorData);
  }

  private setSensorData(feedKey: string, data: SensorData): void {
    switch (feedKey) {
      case 'gas-sensor':
        this.gasData.set(data);
        break;
      case 'temperature':
        this.temperatureData.set(data);
        break;
      case 'humidity':
        this.humidityData.set(data);
        break;
      case 'sound-sensor':
        this.soundData.set(data);
        break;
      case 'motion-detector':
        this.motionData.set(data);
        break;
      case 'ultrasonic-distance':
        this.ultrasonicDistance1Data.set(data);
        break;
      case 'ultrasonic-distance2':
        this.ultrasonicDistance2Data.set(data);
        break;
    }
  }

  getSensorData(feedKey: string) {
    switch (feedKey) {
      case 'gas-sensor': return this.gasData;
      case 'temperature': return this.temperatureData;
      case 'humidity': return this.humidityData;
      case 'sound-sensor': return this.soundData;
      case 'motion-detector': return this.motionData;
      case 'ultrasonic-distance': return this.ultrasonicDistance1Data;
      case 'ultrasonic-distance2': return this.ultrasonicDistance2Data;
      default: return signal<SensorData | null>(null);
    }
  }
}
