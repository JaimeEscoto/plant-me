const Joi = require('joi');

const searchUsersSchema = Joi.object({
  q: Joi.string().trim().min(2).max(50).required(),
}).unknown(false);

const userIdParamSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required(),
}).unknown(false);

module.exports = {
  searchUsersSchema,
  userIdParamSchema,
};
