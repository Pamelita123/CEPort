import Router, { Request, Response } from 'express';
import {
  BAD_REQUEST,
  DEFAULT_INTERNAL_ERROR,
  NO_USER_PAYLOAD,
  SERVER_ERROR,
  VALIDATION_ERROR
} from '@app/api/constants/errors/errors.constant';
import {
  getAllFeeds,
  getFeed,
  createFeed,
  updateFeed,
  deleteFeed,
  getLastData,
  getAllLastData,
  getFeedData,
  createData,
  updateDataPoint,
  deleteDataPoint,
  getChartFeedData,
  initializeDefaultFeeds,
  checkAdafruitConnection
} from '@expressControllers/feeds/feeds.controller';
import { feedSchema, createDataSchema, feedKeySchema } from '@joiSchemas/feeds/feeds.joi';

const router = Router();

// ===== UTILITY ROUTES =====

// Check Adafruit IO connection
router.get('/connection', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await checkAdafruitConnection();
    res.status(200).json(result);
  } catch (err) {
    console.error(SERVER_ERROR(err));
    res.status(500).json({ error: DEFAULT_INTERNAL_ERROR });
  }
});

// Initialize default feeds
router.post('/initialize', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await initializeDefaultFeeds();
    res.status(200).json(result);
  } catch (err) {
    console.error(SERVER_ERROR(err));
    res.status(500).json({ error: DEFAULT_INTERNAL_ERROR });
  }
});

// ===== FEED ROUTES =====

// Get all feeds
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const feeds = await getAllFeeds();
    res.status(200).json(feeds);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
  }
});

// Get specific feed
router.get('/:feedKey', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const feed = await getFeed(feedKey);
    res.status(200).json(feed);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Create new feed
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const feedPayload = req.body;

  if (!feedPayload) {
    res.status(400).json({ error: NO_USER_PAYLOAD });
    return;
  }

  const { error } = feedSchema.validate(feedPayload);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const newFeed = await createFeed(feedPayload);
    res.status(201).json(newFeed);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('already exists')) {
      res.status(409).json({ error: err.message });
    } else if (err.message.includes('Unauthorized')) {
      res.status(401).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Update feed
router.put('/:feedKey', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;
  const feedPayload = req.body;

  const { error: keyError } = feedKeySchema.validate(feedKey);
  if (keyError) {
    res.status(400).json({ error: VALIDATION_ERROR(keyError.message) });
    return;
  }

  if (!feedPayload) {
    res.status(400).json({ error: NO_USER_PAYLOAD });
    return;
  }

  // Validate partial feed data
  const { error } = feedSchema.validate(feedPayload, { allowUnknown: true });
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const updatedFeed = await updateFeed(feedKey, feedPayload);
    res.status(200).json(updatedFeed);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('Unauthorized')) {
      res.status(401).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Delete feed
router.delete('/:feedKey', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const result = await deleteFeed(feedKey);
    res.status(200).json(result);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('Unauthorized')) {
      res.status(401).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// ===== DATA ROUTES =====

// Get last data for all feeds
router.get('/data/last-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const lastData = await getAllLastData();
    res.status(200).json(lastData);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
  }
});

// Get last data for specific feed
router.get('/:feedKey/data/last', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const lastData = await getLastData(feedKey);
    res.status(200).json(lastData);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found') || err.message.includes('No data available')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Get feed data with optional filters
router.get('/:feedKey/data', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;
  const { limit, start_time, end_time } = req.query;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  const limitNum = limit ? parseInt(limit as string, 10) : 100;
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
    res.status(400).json({ error: 'Limit must be a number between 1 and 1000' });
    return;
  }

  try {
    const data = await getFeedData(
      feedKey, 
      limitNum, 
      start_time as string, 
      end_time as string
    );
    res.status(200).json(data);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Get chart data for feed
router.get('/:feedKey/chart', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;
  const { hours } = req.query;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  const hoursNum = hours ? parseInt(hours as string, 10) : 24;
  if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 720) { // Max 30 days
    res.status(400).json({ error: 'Hours must be a number between 1 and 720 (30 days)' });
    return;
  }

  try {
    const chartData = await getChartFeedData(feedKey, hoursNum);
    res.status(200).json(chartData);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Create new data point
router.post('/:feedKey/data', async (req: Request, res: Response): Promise<void> => {
  const { feedKey } = req.params;
  const dataPayload = req.body;

  const { error: keyError } = feedKeySchema.validate(feedKey);
  if (keyError) {
    res.status(400).json({ error: VALIDATION_ERROR(keyError.message) });
    return;
  }

  if (!dataPayload) {
    res.status(400).json({ error: NO_USER_PAYLOAD });
    return;
  }

  const { error } = createDataSchema.validate(dataPayload);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const newData = await createData(feedKey, dataPayload);
    res.status(201).json(newData);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else if (err.message.includes('Unauthorized')) {
      res.status(401).json({ error: err.message });
    } else if (err.message.includes('rate limit')) {
      res.status(429).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Update data point
router.put('/:feedKey/data/:dataId', async (req: Request, res: Response): Promise<void> => {
  const { feedKey, dataId } = req.params;
  const { value } = req.body;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  if (value === undefined || value === null) {
    res.status(400).json({ error: 'Value is required' });
    return;
  }

  try {
    const updatedData = await updateDataPoint(feedKey, dataId, value);
    res.status(200).json(updatedData);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

// Delete data point
router.delete('/:feedKey/data/:dataId', async (req: Request, res: Response): Promise<void> => {
  const { feedKey, dataId } = req.params;

  const { error } = feedKeySchema.validate(feedKey);
  if (error) {
    res.status(400).json({ error: VALIDATION_ERROR(error.message) });
    return;
  }

  try {
    const result = await deleteDataPoint(feedKey, dataId);
    res.status(200).json(result);
  } catch (err: any) {
    console.error(SERVER_ERROR(err));
    if (err.message.includes('not found')) {
      res.status(404).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message || DEFAULT_INTERNAL_ERROR });
    }
  }
});

export default router;
