# 📡 API de Feeds IoT - Documentación para Frontend

## 🏗️ Base URL
```
http://localhost:3000/api/feeds // el puerto dependera de en que puerto lo hayas iniciado, por lo general 4200 pero no solo lo copien y peguen en postman
```

## 🔐 Autenticación
Todas las peticiones requieren el token JWT en el header:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 🔧 UTILITY ENDPOINTS

### 1. Check Connection
**Verificar conexión con Adafruit IO**
```http
GET /api/feeds/connection
```

**Response:**
```json
{
  "connected": true,
  "message": "Successfully connected to Adafruit IO",
  "timestamp": "2025-08-01T10:30:00.000Z"
}
```

**Frontend Implementation:**
```typescript
async checkAdafruitConnection(): Promise<{connected: boolean, message: string}> {
  const response = await fetch('/api/feeds/connection', {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  return await response.json();
}
```

### 2. Initialize Default Feeds
**Crear feeds por defecto del sistema IoT**
```http
POST /api/feeds/initialize
```

**Response:**
```json
{
  "message": "Default feeds initialized successfully",
  "feeds": ["sound-sensor", "gas-sensor", "temperature", "humidity", "motion-detector", "ultrasonic-distance", "ultrasonic-distance2", "nfc-uid", "servo-angle"],
  "count": 9
}
```

---

## 📝 FEED MANAGEMENT

### 3. Get All Feeds
**Obtener lista de todos los feeds**
```http
GET /api/feeds/
```

**Response:**
```json
[
  {
    "id": 12345,
    "name": "temperature",
    "key": "temperature",
    "description": "Sensor de temperatura ambiental",
    "unit_type": "°C",
    "unit_symbol": "°C",
    "history": true,
    "visibility": "private",
    "license": null,
    "enabled": true,
    "last_value": "24.5",
    "created_at": "2025-08-01T08:00:00.000Z",
    "updated_at": "2025-08-01T10:30:00.000Z"
  }
]
```

**Frontend Implementation:**
```typescript
async getAllFeeds(): Promise<Feed[]> {
  const response = await fetch('/api/feeds/', {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  return await response.json();
}
```

### 4. Get Specific Feed
**Obtener un feed específico**
```http
GET /api/feeds/{feedKey}
```

**Parameters:**
- `feedKey` (string): Nombre del feed (ej: "temperature", "humidity", "gas-sensor", "sound-sensor", "motion-detector", "ultrasonic-distance", "ultrasonic-distance2", "nfc-uid", "servo-angle")

**Response:**
```json
{
  "id": 12345,
  "name": "temperature",
  "key": "temperature",
  "description": "Sensor de temperatura ambiental",
  "unit_type": "°C",
  "unit_symbol": "°C",
  "history": true,
  "visibility": "private",
  "license": null,
  "enabled": true,
  "last_value": "24.5",
  "created_at": "2025-08-01T08:00:00.000Z",
  "updated_at": "2025-08-01T10:30:00.000Z"
}
```

**Frontend Implementation:**
```typescript
async getFeed(feedKey: string): Promise<Feed> {
  const response = await fetch(`/api/feeds/${feedKey}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  return await response.json();
}
```

### 5. Create Feed
**Crear un nuevo feed**
```http
POST /api/feeds/
```

**Request Body:**
```json
{
  "name": "nuevo_sensor",
  "description": "Descripción del sensor",
  "unit_type": "°C",
  "unit_symbol": "°C",
  "visibility": "private"
}
```

**Response:**
```json
{
  "id": 67890,
  "name": "nuevo_sensor",
  "key": "nuevo_sensor",
  "description": "Descripción del sensor",
  "unit_type": "°C",
  "unit_symbol": "°C",
  "history": true,
  "visibility": "private",
  "license": null,
  "enabled": true,
  "last_value": null,
  "created_at": "2025-08-01T10:35:00.000Z",
  "updated_at": "2025-08-01T10:35:00.000Z"
}
```

**Frontend Implementation:**
```typescript
async createFeed(feedData: CreateFeedRequest): Promise<Feed> {
  const response = await fetch('/api/feeds/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(feedData)
  });
  return await response.json();
}
```

### 6. Update Feed
**Actualizar un feed existente**
```http
PUT /api/feeds/{feedKey}
```

**Request Body:**
```json
{
  "description": "Nueva descripción",
  "unit_type": "Fahrenheit",
  "unit_symbol": "°F"
}
```

### 7. Delete Feed
**Eliminar un feed**
```http
DELETE /api/feeds/{feedKey}
```

**Response:**
```json
{
  "message": "Feed 'temperature' deleted successfully"
}
```

---

## 📊 DATA OPERATIONS

### 8. Get All Last Data
**Obtener el último valor de todos los feeds (DASHBOARD)**
```http
GET /api/feeds/data/last-all
```

**Response:**
```json
[
  {
    "feedKey": "temperature",
    "feedName": "Temperature",
    "value": "24.5",
    "unit": "°C",
    "created_at": "2025-08-01T10:30:00.000Z"
  },
  {
    "feedKey": "humidity",
    "feedName": "Humidity",
    "value": "65.2",
    "unit": "%",
    "created_at": "2025-08-01T10:29:45.000Z"
  }
]
```

**Frontend Implementation (Para Dashboard):**
```typescript
async getAllLastData(): Promise<SensorData[]> {
  const response = await fetch('/api/feeds/data/last-all', {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  return await response.json();
}

// Para categorizar los datos en el dashboard
categorizeSensors(data: SensorData[]) {
  const environmental = data.filter(d => 
    ['temperature', 'humidity', 'gas-sensor', 'sound-sensor'].includes(d.feedKey)
  );
  
  const activity = data.filter(d => 
    ['motion-detector'].includes(d.feedKey)
  );
  
  const parking = data.filter(d => 
    ['ultrasonic-distance', 'ultrasonic-distance2'].includes(d.feedKey)
  );
  
  const others = data.filter(d => 
    ['nfc-uid', 'servo-angle'].includes(d.feedKey)
  );
  
  return { environmental, activity, parking, others };
}
```

### 9. Get Last Data for Specific Feed
**Obtener último valor de un feed específico**
```http
GET /api/feeds/{feedKey}/data/last
```

**Response:**
```json
{
  "feedKey": "temperature",
  "feedName": "Temperature",
  "value": "24.5",
  "unit": "°C",
  "created_at": "2025-08-01T10:30:00.000Z"
}
```

### 10. Get Feed Data History
**Obtener historial de datos de un feed**
```http
GET /api/feeds/{feedKey}/data?limit=100&start_time=2025-08-01T00:00:00Z&end_time=2025-08-01T23:59:59Z
```

**Query Parameters:**
- `limit` (number): Límite de registros (1-1000, default: 100)
- `start_time` (string): Fecha inicio ISO 8601
- `end_time` (string): Fecha fin ISO 8601

**Response:**
```json
[
  {
    "id": "abc123",
    "value": "24.5",
    "created_at": "2025-08-01T10:30:00.000Z"
  },
  {
    "id": "def456",
    "value": "24.3",
    "created_at": "2025-08-01T10:25:00.000Z"
  }
]
```

**Frontend Implementation:**
```typescript
async getFeedHistory(
  feedKey: string, 
  limit: number = 100, 
  startTime?: string, 
  endTime?: string
): Promise<DataPoint[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (startTime) params.append('start_time', startTime);
  if (endTime) params.append('end_time', endTime);
  
  const response = await fetch(`/api/feeds/${feedKey}/data?${params}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  return await response.json();
}
```

### 11. Get Chart Data
**Obtener datos formateados para gráficos**
```http
GET /api/feeds/{feedKey}/chart?hours=24
```

**Query Parameters:**
- `hours` (number): Horas hacia atrás (1-720, default: 24)

**Response:**
```json
{
  "feedKey": "temperature",
  "feedName": "Temperature",
  "unit": "°C",
  "timeRange": "24 hours",
  "data": [
    {
      "timestamp": "2025-08-01T10:00:00.000Z",
      "value": 24.5
    },
    {
      "timestamp": "2025-08-01T11:00:00.000Z",
      "value": 25.1
    }
  ]
}
```

**Frontend Implementation (Para Charts):**
```typescript
async getChartData(feedKey: string, hours: number = 24): Promise<ChartData> {
  const response = await fetch(`/api/feeds/${feedKey}/chart?hours=${hours}`, {
    headers: { 'Authorization': `Bearer ${this.token}` }
  });
  return await response.json();
}

// Para usar con Chart.js o similar
formatForChart(chartData: ChartData) {
  return {
    labels: chartData.data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [{
      label: `${chartData.feedName} (${chartData.unit})`,
      data: chartData.data.map(d => parseFloat(d.value)),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
}
```

### 12. Create Data Point
**Crear nuevo punto de datos**
```http
POST /api/feeds/{feedKey}/data
```

**Request Body:**
```json
{
  "value": "25.6"
}
```

**Response:**
```json
{
  "id": "xyz789",
  "value": "25.6",
  "created_at": "2025-08-01T10:35:00.000Z"
}
```

### 13. Update Data Point
**Actualizar punto de datos existente**
```http
PUT /api/feeds/{feedKey}/data/{dataId}
```

**Request Body:**
```json
{
  "value": "26.1"
}
```

### 14. Delete Data Point
**Eliminar punto de datos**
```http
DELETE /api/feeds/{feedKey}/data/{dataId}
```

---

## 🎯 EJEMPLOS DE USO COMMON

### Dashboard Real-time
```typescript
class DashboardService {
  private token: string;
  
  constructor() {
    this.token = localStorage.getItem('auth_token') || '';
  }
  
  // Cargar datos del dashboard
  async loadDashboardData() {
    try {
      const data = await this.getAllLastData();
      return this.categorizeData(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      throw error;
    }
  }
  
  // Auto-refresh cada 30 segundos
  startAutoRefresh() {
    return setInterval(() => {
      this.loadDashboardData();
    }, 30000);
  }
  
  private categorizeData(data: SensorData[]) {
    return {
      environmental: data.filter(d => 
        ['temperature', 'humidity', 'gas-sensor', 'sound-sensor'].includes(d.feedKey)
      ),
      activity: data.filter(d => d.feedKey === 'motion-detector'),
      parking: data.filter(d => ['ultrasonic-distance', 'ultrasonic-distance2'].includes(d.feedKey)),
      others: data.filter(d => ['nfc-uid', 'servo-angle'].includes(d.feedKey))
    };
  }
}
```

### Gráficos Históricos
```typescript
class ChartsService {
  async loadTemperatureChart(hours: number = 24) {
    const chartData = await this.getChartData('temperature', hours);
    
    return {
      type: 'line',
      data: {
        labels: chartData.data.map(d => 
          new Date(d.timestamp).toLocaleTimeString()
        ),
        datasets: [{
          label: `Temperatura (${chartData.unit})`,
          data: chartData.data.map(d => parseFloat(d.value)),
          borderColor: '#ff6384',
          fill: false
        }]
      }
    };
  }
}
```

## 🚨 Error Handling

### Códigos de Estado HTTP
- `200` - Success
- `201` - Created
- `400` - Bad Request (validación falló)
- `401` - Unauthorized (token inválido)
- `404` - Not Found (feed/data no encontrado)
- `409` - Conflict (feed ya existe)
- `429` - Rate Limit (muy rápido enviando datos)
- `500` - Internal Server Error

### Ejemplo de Manejo de Errores
```typescript
async safeApiCall<T>(apiCall: () => Promise<T>): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error.status === 401) {
      // Token expirado, redirigir a login
      this.router.navigate(['/login']);
    } else if (error.status === 429) {
      // Rate limit, esperar y reintentar
      await this.delay(5000);
      return this.safeApiCall(apiCall);
    } else {
      console.error('API Error:', error);
      this.showErrorMessage(error.message);
    }
    return null;
  }
}
```

## 📱 TypeScript Interfaces

```typescript
interface Feed {
  id: number;
  name: string;
  key: string;
  description: string;
  unit_type: string;
  unit_symbol: string;
  history: boolean;
  visibility: string;
  license: string | null;
  enabled: boolean;
  last_value: string | null;
  created_at: string;
  updated_at: string;
}

interface SensorData {
  feedKey: string;
  feedName: string;
  value: string;
  unit: string;
  created_at: string;
}

interface DataPoint {
  id: string;
  value: string;
  created_at: string;
}

interface ChartData {
  feedKey: string;
  feedName: string;
  unit: string;
  timeRange: string;
  data: Array<{
    timestamp: string;
    value: number;
  }>;
}
```

---

## eso es todo beibe💅🏻💅🏻💅🏻 si llegaste hasta aki quiero confesar que soy un nahual gracias❤️🥰