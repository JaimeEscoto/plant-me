const Joi = require('joi');

const userIdParamSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
});

const grantSeedsSchema = Joi.object({
  cantidad: Joi.number().integer().min(1).max(1000000).required(),
  mensaje: Joi.string().max(240).allow('', null),
});

module.exports = {
  userIdParamSchema,
  grantSeedsSchema,
};
