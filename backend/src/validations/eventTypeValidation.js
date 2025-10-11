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

  return Object.fromEntries(
    Object.entries(normalized).map(([language, label]) => [language, label])
  );
};

const createEventTypeSchema = Joi.object({
  code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_-]+$/).min(2).max(60).required(),
  plantDelta: Joi.number().integer().min(-50).max(50).required(),
  removeDelta: Joi.number().integer().min(-50).max(50).required(),
  position: Joi.number().integer().min(0).max(1000).default(0),
  labels: labelsPattern.custom(ensureAllLanguages),
});

const updateEventTypeSchema = Joi.object({
  code: Joi.string().trim().lowercase().pattern(/^[a-z0-9_-]+$/).min(2).max(60),
  plantDelta: Joi.number().integer().min(-50).max(50),
  removeDelta: Joi.number().integer().min(-50).max(50),
  position: Joi.number().integer().min(0).max(1000),
  labels: Joi.object()
    .pattern(/^(es|en|fr|ar)$/i, Joi.string().trim().min(1).max(60))
    .min(1),
}).min(1);

const eventTypeIdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
});

module.exports = {
  SUPPORTED_LANGUAGES,
  createEventTypeSchema,
  updateEventTypeSchema,
  eventTypeIdParamSchema,
};
