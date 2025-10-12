const Joi = require('joi');

const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'ar'];

const labelsPattern = Joi.object()
  .pattern(/^(es|en|fr|ar)$/i, Joi.string().trim().min(1).max(60))
  .required();

const ensureAllLanguages = (value, helpers) => {
  const normalized = Object.keys(value || {}).reduce((acc, key) => {
    acc[key.toLowerCase()] = value[key];
    return acc;
  }, {});

  const missing = SUPPORTED_LANGUAGES.filter((language) => !normalized[language]);
  if (missing.length > 0) {
    return helpers.error('any.custom', {
      message: `Missing labels for languages: ${missing.join(', ')}`,
    });
  }

  return Object.fromEntries(Object.entries(normalized));
};

const createEventCategorySchema = Joi.object({
  code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_-]+$/).min(2).max(60).required(),
  position: Joi.number().integer().min(0).max(1000).default(0),
  labels: labelsPattern.custom(ensureAllLanguages),
});

const updateEventCategorySchema = Joi.object({
  code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_-]+$/).min(2).max(60),
  position: Joi.number().integer().min(0).max(1000),
  labels: Joi.object()
    .pattern(/^(es|en|fr|ar)$/i, Joi.string().trim().min(1).max(60))
    .min(1),
}).min(1);

const eventCategoryIdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
});

module.exports = {
  SUPPORTED_LANGUAGES,
  createEventCategorySchema,
  updateEventCategorySchema,
  eventCategoryIdParamSchema,
};
