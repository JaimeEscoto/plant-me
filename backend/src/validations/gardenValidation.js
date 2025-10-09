const Joi = require('joi');

exports.createPlantSchema = Joi.object({
  nombre: Joi.string().trim().min(2).max(60).required(),
  categoria: Joi.string().trim().min(2).max(40).required(),
  tipo: Joi.string().valid('positivo', 'negativo', 'neutro').required(),
  descripcion: Joi.string().trim().max(500).allow('', null),
});

exports.updatePlantSchema = Joi.object({
  descripcion: Joi.string().trim().max(500).required(),
});

exports.historyQuerySchema = Joi.object({
  fechaInicio: Joi.date().iso().optional(),
  fechaFin: Joi.date().iso().optional(),
});
