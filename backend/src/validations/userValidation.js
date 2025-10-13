const Joi = require('joi');

const MAX_PROFILE_PHOTO_LENGTH = 2_500_000;
const PROFILE_PHOTO_DATA_URL_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i;

const searchUsersSchema = Joi.object({
  q: Joi.string().trim().min(2).max(50).required(),
}).unknown(false);

const userIdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
}).unknown(false);

const updateProfilePhotoSchema = Joi.object({
  foto_perfil: Joi.string()
    .allow(null, '')
    .custom((value, helpers) => {
      if (value === null || value === '') {
        return null;
      }

      const trimmed = value.trim();
      if (!PROFILE_PHOTO_DATA_URL_REGEX.test(trimmed)) {
        return helpers.error('string.pattern.base', {
          name: 'profilePhotoDataUrl',
          value,
        });
      }

      if (trimmed.length > MAX_PROFILE_PHOTO_LENGTH) {
        return helpers.error('string.max', {
          limit: MAX_PROFILE_PHOTO_LENGTH,
          value,
        });
      }

      return trimmed;
    })
    .messages({
      'string.pattern.base': 'La foto de perfil debe ser una imagen válida (JPG, PNG o WebP).',
      'string.max': 'La foto de perfil es demasiado grande.',
    }),
}).unknown(false);

module.exports = {
  searchUsersSchema,
  userIdParamSchema,
  updateProfilePhotoSchema,
};
