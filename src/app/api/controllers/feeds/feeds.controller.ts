import adafruitService from '@app/api/services/adafruit/adafruit.service';
import { FeedPayload, CreateDataPayload } from '@expressModels/feeds/feeds';
import { FEED_CONFIG, FEED_KEYS, FeedKey } from '@app/api/constants/feeds/feeds.constant';
import {
  FEED_NOT_FOUND,
  FEED_ALREADY_EXISTS,
  FEED_CREATION_FAILED,
  DATA_CREATION_FAILED,
  ADAFRUIT_IO_ERROR,
  ADAFRUIT_IO_UNAUTHORIZED,
  ADAFRUIT_IO_RATE_LIMIT,
  NO_DATA_AVAILABLE,
  SERVER_ERROR
} from '@app/api/constants/errors/errors.constant';


export const getAllFeeds = async () => {
  try {
    return await adafruitService.getAllFeeds();
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
    }
    if (error.message.includes('429')) {
      throw new Error(ADAFRUIT_IO_RATE_LIMIT);
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const getFeed = async (feedKey: string) => {
  try {
    return await adafruitService.getFeed(feedKey);
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const createFeed = async (feedPayload: FeedPayload) => {
  try {
    try {
      await adafruitService.getFeed(feedPayload.key);
      throw new Error(FEED_ALREADY_EXISTS(feedPayload.key));
    } catch (error: any) {
      if (!error.message.includes('404')) {
        throw error;
      }
    }

    const config = FEED_CONFIG[feedPayload.key as FeedKey];
    if (config) {
      feedPayload.name = feedPayload.name || config.name;
      feedPayload.description = feedPayload.description || config.description;
      feedPayload.unit = feedPayload.unit || config.unit;
    }

    return await adafruitService.createFeed(feedPayload);
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes(FEED_ALREADY_EXISTS(''))) {
      throw error; 
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
    }
    throw new Error(FEED_CREATION_FAILED(feedPayload.key));
  }
};

export const updateFeed = async (feedKey: string, feedPayload: Partial<FeedPayload>) => {
  try {
    return await adafruitService.updateFeed(feedKey, feedPayload);
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const deleteFeed = async (feedKey: string) => {
  try {
    await adafruitService.deleteFeed(feedKey);
    return { success: true, message: `Feed ${feedKey} deleted successfully` };
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};


export const getLastData = async (feedKey: string) => {
  try {
    const lastValue = await adafruitService.getLastValue(feedKey);
    if (!lastValue) {
      throw new Error(NO_DATA_AVAILABLE(feedKey));
    }
    return lastValue;
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes(NO_DATA_AVAILABLE(''))) {
      throw error; 
    }
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const getAllLastData = async () => {
  try {
    const feeds = await getAllFeeds();
    const lastDataPromises = feeds.map(async (feed) => {
      try {
        const lastValue = await adafruitService.getLastValue(feed.key);
        return {
          feedKey: feed.key,
          feedName: feed.name,
          lastValue: lastValue,
          config: FEED_CONFIG[feed.key as FeedKey] || null
        };
      } catch (error) {
        console.error(`Error obteniendo datos para feed ${feed.key}:`, error);
        return {
          feedKey: feed.key,
          feedName: feed.name,
          lastValue: null,
          config: FEED_CONFIG[feed.key as FeedKey] || null,
          error: 'No data available'
        };
      }
    });

    const results = await Promise.all(lastDataPromises);
    console.log(`✅ Datos obtenidos de ${results.length} feeds de Adafruit IO`);
    return results;
  } catch (error: any) {
    console.error('❌ Error al obtener feeds de Adafruit IO:', error);
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const getFeedData = async (feedKey: string, limit = 100, startTime?: string, endTime?: string) => {
  try {
    return await adafruitService.getFeedData(feedKey, limit, startTime, endTime);
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const createData = async (feedKey: string, dataPayload: CreateDataPayload) => {
  try {
    return await adafruitService.createData(feedKey, dataPayload);
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      throw new Error(ADAFRUIT_IO_UNAUTHORIZED);
    }
    if (error.message.includes('429')) {
      throw new Error(ADAFRUIT_IO_RATE_LIMIT);
    }
    throw new Error(DATA_CREATION_FAILED(feedKey));
  }
};

export const updateDataPoint = async (feedKey: string, dataId: string, value: string | number) => {
  try {
    return await adafruitService.updateData(feedKey, dataId, value);
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const deleteDataPoint = async (feedKey: string, dataId: string) => {
  try {
    await adafruitService.deleteData(feedKey, dataId);
    return { success: true, message: `Data point ${dataId} deleted successfully` };
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};


export const getChartFeedData = async (feedKey: string, hours = 24) => {
  try {
    const chartData = await adafruitService.getChartData(feedKey, hours);
    const config = FEED_CONFIG[feedKey as FeedKey];
    
    return {
      feedKey,
      feedName: config?.name || feedKey,
      unit: config?.unit || '',
      data: chartData,
      timeRange: `${hours} hours`,
      totalPoints: chartData.length
    };
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    if (error.message.includes('404')) {
      throw new Error(FEED_NOT_FOUND(feedKey));
    }
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};


export const initializeDefaultFeeds = async () => {
  try {
    const existingFeeds = await getAllFeeds();
    const existingKeys = existingFeeds.map(feed => feed.key);
    
    const feedsToCreate = Object.entries(FEED_CONFIG)
      .filter(([key]) => !existingKeys.includes(key))
      .map(([key, config]) => ({
        key,
        name: config.name,
        description: config.description,
        unit: config.unit,
        enabled: true
      }));

    const createdFeeds = [];
    for (const feedPayload of feedsToCreate) {
      try {
        const createdFeed = await createFeed(feedPayload);
        createdFeeds.push(createdFeed);
      } catch (error) {
        console.warn(`Failed to create feed ${feedPayload.key}:`, error);
      }
    }

    return {
      existing: existingFeeds.length,
      created: createdFeeds.length,
      total: existingFeeds.length + createdFeeds.length,
      createdFeeds
    };
  } catch (error: any) {
    console.error(SERVER_ERROR(error));
    throw new Error(ADAFRUIT_IO_ERROR(error.message));
  }
};

export const checkAdafruitConnection = async () => {
  try {
    const isConnected = await adafruitService.testConnection();
    if (isConnected) {
      const feeds = await adafruitService.getAllFeeds();
      return { 
        connected: true,
        username: process.env['ADAFRUIT_IO_USERNAME'],
        feedCount: feeds.length,
        message: 'Conexión exitosa con Adafruit IO'
      };
    } else {
      return { 
        connected: false, 
        message: 'No se pudo conectar con Adafruit IO'
      };
    }
  } catch (error: any) {
    return { 
      connected: false, 
      error: error.message,
      message: 'Error al verificar la conexión con Adafruit IO'
    };
  }
};
