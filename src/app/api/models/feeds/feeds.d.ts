import {CreationOptional} from 'sequelize';

export interface FeedAttributes {
  id: string;
  name: string;
  key: string;
  description?: string;
  unit?: string;
  last_value?: string | number | null;
  created_at?: string;
  updated_at?: string;
  enabled?: boolean;
}

export interface FeedPayload {
  name: string;
  key: string;
  description?: string;
  unit?: string;
  enabled?: boolean;
}

export interface DataPoint {
  id: string;
  value: string | number;
  created_at: string;
  feed_id: string;
  lat?: number;
  lon?: number;
  ele?: number;
}

export interface AdafruitDataResponse {
  id: string;
  value: string;
  feed_id: number;
  feed_key: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  lat: number | null;
  lon: number | null;
  ele: number | null;
}

export interface AdafruitFeedResponse {
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

export interface CreateDataPayload {
  value: string | number;
  lat?: number;
  lon?: number;
  ele?: number;
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  formatted_time: string;
}
