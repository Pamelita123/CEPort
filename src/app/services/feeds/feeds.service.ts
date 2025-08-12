import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { getTokenFromLocalStorage } from '@services/auth/auth.service';

export interface FeedData {
  id: string;
  value: string | number;
  created_at: string;
  feed_id: string;
  lat?: number;
  lon?: number;
  ele?: number;
}

export interface Feed {
  id: number;
  name: string;
  key: string;
  description: string | null;
  unit_type: string | null;
  unit_symbol: string | null;
  history: boolean;
  visibility: string;
  license: string | null;
  enabled: boolean;
  last_value: string | null;
  created_at: string;
  updated_at: string;
}

export interface LastDataSummary {
  feedKey: string;
  feedName: string;
  lastValue: FeedData | null;
  config: {
    name: string;
    description: string;
    unit: string;
  } | null;
  error?: string;
}

export interface ChartData {
  feedKey: string;
  feedName: string;
  unit: string;
  data: Array<{
    timestamp: string;
    value: number;
    formatted_time: string;
  }>;
  timeRange: string;
  totalPoints: number;
}

export interface CreateFeedPayload {
  name: string;
  key: string;
  description?: string;
  unit?: string;
  enabled?: boolean;
}

export interface CreateDataPayload {
  value: string | number;
  lat?: number;
  lon?: number;
  ele?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeedsService {
  private readonly apiUrl = '/api/feeds';

  constructor(private http: HttpClient) {}

  private getHttpOptions(extra?: { params?: HttpParams }) {
    const token = getTokenFromLocalStorage();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers, ...(extra?.params ? { params: extra.params } : {}) };
  }


  checkConnection(): Observable<{ connected: boolean; error?: string }> {
    return this.http.get<{ connected: boolean; error?: string }>(`${this.apiUrl}/connection`, this.getHttpOptions());
  }

  initializeDefaultFeeds(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/initialize`, {}, this.getHttpOptions());
  }


  getAllFeeds(): Observable<Feed[]> {
    return this.http.get<Feed[]>(this.apiUrl, this.getHttpOptions());
  }

  getFeed(feedKey: string): Observable<Feed> {
    return this.http.get<Feed>(`${this.apiUrl}/${feedKey}`, this.getHttpOptions());
  }

  createFeed(feedPayload: CreateFeedPayload): Observable<Feed> {
    return this.http.post<Feed>(this.apiUrl, feedPayload, this.getHttpOptions());
  }

  updateFeed(feedKey: string, feedPayload: Partial<CreateFeedPayload>): Observable<Feed> {
    return this.http.put<Feed>(`${this.apiUrl}/${feedKey}`, feedPayload, this.getHttpOptions());
  }

  deleteFeed(feedKey: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${feedKey}`, this.getHttpOptions());
  }


  getAllLastData(): Observable<LastDataSummary[]> {
    return this.http.get<LastDataSummary[]>(`${this.apiUrl}/data/last-all`, this.getHttpOptions());
  }

  getLastData(feedKey: string): Observable<FeedData> {
    return this.http.get<FeedData>(`${this.apiUrl}/${feedKey}/data/last`, this.getHttpOptions());
  }

  getFeedData(
    feedKey: string, 
    limit = 100, 
    startTime?: string, 
    endTime?: string
  ): Observable<FeedData[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (startTime) params = params.set('start_time', startTime);
    if (endTime) params = params.set('end_time', endTime);
    return this.http.get<FeedData[]>(`${this.apiUrl}/${feedKey}/data`, this.getHttpOptions({ params }));
  }

  getChartData(feedKey: string, hours = 24): Observable<ChartData> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<ChartData>(`${this.apiUrl}/${feedKey}/chart`, this.getHttpOptions({ params }));
  }

  createData(feedKey: string, dataPayload: CreateDataPayload): Observable<FeedData> {
    return this.http.post<FeedData>(`${this.apiUrl}/${feedKey}/data`, dataPayload, this.getHttpOptions());
  }

  updateDataPoint(feedKey: string, dataId: string, value: string | number): Observable<FeedData> {
    return this.http.put<FeedData>(`${this.apiUrl}/${feedKey}/data/${dataId}`, { value }, this.getHttpOptions());
  }

  deleteDataPoint(feedKey: string, dataId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${feedKey}/data/${dataId}`, this.getHttpOptions());
  }

  getParkingSpaceStatus(distance: number): 'occupied' | 'free' | 'unknown' {
    if (distance === 0) return 'unknown';
    if (distance > 0 && distance <= 15) return 'occupied';
    return 'free';
  }

  formatSensorValue(value: string | number, unit?: string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return value.toString();
    
    const formatted = numValue.toFixed(unit === '°C' || unit === '%' ? 1 : 0);
    return unit ? `${formatted} ${unit}` : formatted;
  }


  getStatusColor(feedKey: string, value: number): string {
    switch (feedKey) {
      case 'gas-sensor':
        return value > 500 ? 'danger' : value > 300 ? 'warning' : 'success';
      case 'sound-sensor':
        return value > 80 ? 'danger' : value > 60 ? 'warning' : 'success';
      case 'temperature':
        return value > 30 || value < 15 ? 'warning' : 'success';
      case 'humidity':
        return value > 80 || value < 30 ? 'warning' : 'success';
      case 'motion-detector':
        return value === 1 ? 'warning' : 'success';
      case 'ultrasonic-distance':
      case 'ultrasonic-distance2':
        const status = this.getParkingSpaceStatus(value);
        return status === 'occupied' ? 'danger' : status === 'free' ? 'success' : 'secondary';
      default:
        return 'primary';
    }
  }


  getStatusText(feedKey: string, value: number): string {
    switch (feedKey) {
      case 'gas-sensor':
        return value > 500 ? 'Calidad del aire mala' : value > 300 ? 'Calidad moderada' : 'Calidad buena';
      case 'sound-sensor':
        return value > 80 ? 'Ruido alto' : value > 60 ? 'Ruido moderado' : 'Ambiente silencioso';
      case 'motion-detector':
        return value === 1 ? 'Presencia detectada' : 'Sin presencia';
      case 'ultrasonic-distance':
      case 'ultrasonic-distance2':
        const status = this.getParkingSpaceStatus(value);
        return status === 'occupied' ? 'Ocupado' : status === 'free' ? 'Libre' : 'Estado desconocido';
      default:
        return this.formatSensorValue(value);
    }
  }
}
