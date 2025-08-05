import axios, { AxiosInstance } from 'axios';
import { 
  AdafruitFeedResponse, 
  AdafruitDataResponse, 
  FeedPayload, 
  CreateDataPayload,
  ChartDataPoint 
} from '@expressModels/feeds/feeds';
import {
  ADAFRUIT_IO_ERROR,
  ADAFRUIT_IO_UNAUTHORIZED,
  ADAFRUIT_IO_RATE_LIMIT,
  FEED_NOT_FOUND,
  NO_DATA_AVAILABLE
} from '@app/api/constants/errors/errors.constant';

class AdafruitIOService {
  private client: AxiosInstance;
  private baseUrl = 'https://io.adafruit.com/api/v2';
  private username: string;
  private key: string;

  constructor() {
    this.username = process.env['ADAFRUIT_IO_USERNAME'] || '';
    this.key = process.env['ADAFRUIT_IO_KEY'] || '';
    
    if (!this.username || !this.key) {
      throw new Error('Adafruit IO credentials not configured');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-AIO-Key': this.key,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 seconds timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.error || error.message;

          switch (status) {
            case 401:
            case 403:
              throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
            case 429:
              throw new Error(ADAFRUIT_IO_RATE_LIMIT);
            case 404:
              throw new Error(FEED_NOT_FOUND(error.config.url || ''));
            default:
              throw new Error(ADAFRUIT_IO_ERROR(message));
          }
        }
        throw new Error(ADAFRUIT_IO_ERROR(error.message));
      }
    );
  }

  // ===== CONNECTION TEST =====
  //en joi aparece como checkConnection asi que chequen bien si es necesario cambiarlo
  async testConnection(): Promise<boolean> {
    try {
      // Use feeds endpoint to test connection instead of user endpoint
      await this.client.get(`/${this.username}/feeds`);
      return true;
    } catch (error) {
      console.error('Adafruit IO connection test failed:', error);
      return false;
    }
  }

  // ===== FEED OPERATIONS =====
  
  async getAllFeeds(): Promise<AdafruitFeedResponse[]> {
    const response = await this.client.get(`/${this.username}/feeds`);
    return response.data;
  }

  async getFeed(feedKey: string): Promise<AdafruitFeedResponse> {
    const response = await this.client.get(`/${this.username}/feeds/${feedKey}`);
    return response.data;
  }

  async createFeed(feedPayload: FeedPayload): Promise<AdafruitFeedResponse> {
    const createData = {
      name: feedPayload.name,
      key: feedPayload.key,
      description: feedPayload.description || '',
      unit_type: feedPayload.unit || null,
      visibility: 'private',
      history: true,
      enabled: feedPayload.enabled !== false
    };

    const response = await this.client.post(`/${this.username}/feeds`, createData);
    return response.data;
  }

  async updateFeed(feedKey: string, feedPayload: Partial<FeedPayload>): Promise<AdafruitFeedResponse> {
    const updateData: any = {};
    
    if (feedPayload.name) updateData.name = feedPayload.name;
    if (feedPayload.description !== undefined) updateData.description = feedPayload.description;
    if (feedPayload.unit !== undefined) updateData.unit_type = feedPayload.unit;
    if (feedPayload.enabled !== undefined) updateData.enabled = feedPayload.enabled;

    const response = await this.client.put(`/${this.username}/feeds/${feedKey}`, updateData);
    return response.data;
  }

  async deleteFeed(feedKey: string): Promise<void> {
    await this.client.delete(`/${this.username}/feeds/${feedKey}`);
  }

  // ===== DATA OPERATIONS =====

  async getLastValue(feedKey: string): Promise<AdafruitDataResponse | null> {
    try {
      console.log(`🔍 Obteniendo último valor para feed: ${feedKey}`);
      const response = await this.client.get(`/${this.username}/feeds/${feedKey}/data/last`);
      console.log(`✅ Datos obtenidos para ${feedKey}:`, response.data?.value);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error obteniendo datos para ${feedKey}:`, error.message);
      if (error.response?.status === 404) {
        console.log(`⚠️  Feed ${feedKey} no tiene datos disponibles`);
        return null;
      }
      throw error;
    }
  }

  async getFeedData(
    feedKey: string, 
    limit = 100, 
    startTime?: string, 
    endTime?: string
  ): Promise<AdafruitDataResponse[]> {
    const params: any = { limit };
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    const response = await this.client.get(`/${this.username}/feeds/${feedKey}/data`, { params });
    return response.data;
  }

  async createData(feedKey: string, dataPayload: CreateDataPayload): Promise<AdafruitDataResponse> {
    const response = await this.client.post(`/${this.username}/feeds/${feedKey}/data`, dataPayload);
    return response.data;
  }

  async updateData(feedKey: string, dataId: string, value: string | number): Promise<AdafruitDataResponse> {
    const response = await this.client.put(`/${this.username}/feeds/${feedKey}/data/${dataId}`, { value });
    return response.data;
  }

  async deleteData(feedKey: string, dataId: string): Promise<void> {
    await this.client.delete(`/${this.username}/feeds/${feedKey}/data/${dataId}`);
  }

  // ===== UTILITY METHODS =====

  /**
   * Get chart data for a specific feed over a time period
   */
  async getChartData(feedKey: string, hours = 24): Promise<ChartDataPoint[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
    
    const data = await this.getFeedData(
      feedKey, 
      1000, // Get more data points for charts
      startTime.toISOString(),
      endTime.toISOString()
    );

    return data.map(item => ({
      timestamp: item.created_at,
      value: parseFloat(item.value.toString()),
      formatted_time: new Date(item.created_at).toLocaleTimeString()
    })).filter(item => !isNaN(item.value));
  }

  /**
   * Get summary of last data for all feeds
   */
  async getAllLastData(): Promise<Array<{feedKey: string, lastValue: AdafruitDataResponse | null}>> {
    const feeds = await this.getAllFeeds();
    const results = await Promise.allSettled(
      feeds.map(async feed => ({
        feedKey: feed.key,
        lastValue: await this.getLastValue(feed.key)
      }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{feedKey: string, lastValue: AdafruitDataResponse | null}> => 
        result.status === 'fulfilled')
      .map(result => result.value);
  }

  /**
   * Initialize default feeds based on ESP32 configuration
   */
  async initializeDefaultFeeds(): Promise<AdafruitFeedResponse[]> {
    const defaultFeeds = [
      { key: 'sound-sensor', name: 'Sensor de Sonido', description: 'Nivel de ruido detectado por el micrófono', unit: 'dB' },
      { key: 'gas-sensor', name: 'Sensor de Gas MQ-2', description: 'Calidad del aire - detección de gases', unit: 'PPM' },
      { key: 'temperature', name: 'Temperatura', description: 'Temperatura ambiente medida por DHT11', unit: '°C' },
      { key: 'humidity', name: 'Humedad', description: 'Humedad relativa medida por DHT11', unit: '%' },
      { key: 'motion-detector', name: 'Detector de Movimiento', description: 'Detección de presencia mediante sensor PIR', unit: 'bool' },
      { key: 'ultrasonic-distance', name: 'Distancia Ultrasónica - Espacio 1', description: 'Distancia medida por sensor HC-SR04 para espacio de estacionamiento 1', unit: 'cm' },
      { key: 'ultrasonic-distance2', name: 'Distancia Ultrasónica - Espacio 2', description: 'Distancia medida por sensor HC-SR04 para espacio de estacionamiento 2', unit: 'cm' },
      { key: 'nfc-uid', name: 'Lector NFC', description: 'UID de tarjetas NFC leídas por RC522', unit: 'string' },
      { key: 'servo-angle', name: 'Ángulo del Servo', description: 'Posición angular del servomotor', unit: '°' }
    ];

    const existingFeeds = await this.getAllFeeds();
    const existingKeys = new Set(existingFeeds.map(feed => feed.key));

    const createdFeeds: AdafruitFeedResponse[] = [];

    for (const feedConfig of defaultFeeds) {
      if (!existingKeys.has(feedConfig.key)) {
        try {
          const newFeed = await this.createFeed(feedConfig);
          createdFeeds.push(newFeed);
          console.log(`✅ Created feed: ${feedConfig.name} (${feedConfig.key})`);
        } catch (error) {
          console.error(`❌ Failed to create feed ${feedConfig.key}:`, error);
        }
      } else {
        console.log(`ℹ️ Feed already exists: ${feedConfig.key}`);
      }
    }

    return createdFeeds;
  }
}

// Export singleton instance
const adafruitIOService = new AdafruitIOService();
export default adafruitIOService;
