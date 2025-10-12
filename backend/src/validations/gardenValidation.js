const Joi = require('joi');

exports.createPlantSchema = Joi.object({
  nombre: Joi.string().trim().min(2).max(60).required(),
  categoria: Joi.string().trim().lowercase().pattern(/^[a-z0-9_-]+$/).min(2).max(60).required(),
  tipo: Joi.string().trim().min(2).max(60).required(),
  descripcion: Joi.string().trim().max(500).allow('', null),
  foto: Joi.string()
    .trim()
    .dataUri({ scheme: [/^data:image\//] })
    .max(5_000_000)
    .optional(),
});

exports.updatePlantSchema = Joi.object({
  descripcion: Joi.string().trim().max(500).required(),
});

exports.historyQuerySchema = Joi.object({
  fechaInicio: Joi.date().iso().optional(),
  fechaFin: Joi.date().iso().optional(),
});
