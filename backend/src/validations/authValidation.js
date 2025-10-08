const Joi = require('joi');

const passwordRules = Joi.string().min(8).max(128).pattern(new RegExp('^(?=.*[A-Za-z])(?=.*\\d).+$'));

exports.registerSchema = Joi.object({
  nombre_usuario: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  contrasena: passwordRules.required(),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  contrasena: Joi.string().required(),
});
