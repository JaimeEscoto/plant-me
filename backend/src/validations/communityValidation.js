const Joi = require('joi');

const plantIdParamSchema = Joi.object({
  plantId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
}).unknown(false);

const commentIdParamSchema = Joi.object({
  commentId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
}).unknown(false);

const createCommentSchema = Joi.object({
  contenido: Joi.string().trim().min(1).max(500).required(),
}).unknown(false);

module.exports = {
  plantIdParamSchema,
  commentIdParamSchema,
  createCommentSchema,
};
