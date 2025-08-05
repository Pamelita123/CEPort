import Joi from 'joi';
import { FEED_KEYS } from '@app/api/constants/feeds/feeds.constant';

const allowedFeedKeys = Object.values(FEED_KEYS);

export const feedSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Feed name cannot be empty',
      'string.min': 'Feed name must be at least 1 character long',
      'string.max': 'Feed name cannot be longer than 100 characters',
      'any.required': 'Feed name is required'
    }),

  key: Joi.string()
    .valid(...allowedFeedKeys)
    .required()
    .messages({
      'any.only': `Feed key must be one of: ${allowedFeedKeys.join(', ')}`,
      'any.required': 'Feed key is required'
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot be longer than 500 characters'
    }),

  unit: Joi.string()
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Unit cannot be longer than 20 characters'
    }),

  enabled: Joi.boolean()
    .optional()
    .default(true)
});

export const createDataSchema = Joi.object({
  value: Joi.alternatives()
    .try(
      Joi.number(),
      Joi.string().max(255)
    )
    .required()
    .messages({
      'alternatives.match': 'Value must be a number or string (max 255 characters)',
      'any.required': 'Value is required'
    }),

  lat: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90'
    }),

  lon: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180'
    }),

  ele: Joi.number()
    .optional()
    .messages({
      'number.base': 'Elevation must be a number'
    })
});

export const feedKeySchema = Joi.string()
  .valid(...allowedFeedKeys)
  .required()
  .messages({
    'any.only': `Feed key must be one of: ${allowedFeedKeys.join(', ')}`,
    'any.required': 'Feed key is required'
  });
