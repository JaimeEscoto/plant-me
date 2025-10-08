const { Op } = require('sequelize');
const { Garden, Plant } = require('../models');
const {
  createPlantSchema,
  updatePlantSchema,
  historyQuerySchema,
} = require('../validations/gardenValidation');

const adjustGardenHealth = (currentHealth, tipo, manualDelta) => {
  let delta;
  if (typeof manualDelta === 'number') {
    delta = manualDelta;
  } else {
    delta = tipo === 'positivo' ? 5 : tipo === 'negativo' ? -5 : 0;
  }
  const nextHealth = Math.max(0, Math.min(100, currentHealth + delta));
  return nextHealth;
};

exports.getGarden = async (req, res, next) => {
  try {
    const garden = await Garden.findOne({
      where: { usuario_id: req.user.id },
      include: [{ model: Plant, as: 'plantas' }],
      order: [[{ model: Plant, as: 'plantas' }, 'fecha_plantado', 'DESC']],
    });

    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    return res.json(garden);
  } catch (err) {
    return next(err);
  }
};

exports.createPlant = async (req, res, next) => {
  try {
    const { value, error } = createPlantSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const garden = await Garden.findOne({ where: { usuario_id: req.user.id } });
    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const plant = await Plant.create({
      jardin_id: garden.id,
      nombre: value.nombre,
      tipo: value.tipo,
      descripcion: value.descripcion,
    });

    garden.estado_salud = adjustGardenHealth(garden.estado_salud, value.tipo);
    garden.ultima_modificacion = new Date();
    await garden.save();

    return res.status(201).json({ plant, jardin: garden });
  } catch (err) {
    return next(err);
  }
};

exports.updatePlant = async (req, res, next) => {
  try {
    const { value, error } = updatePlantSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const garden = await Garden.findOne({ where: { usuario_id: req.user.id } });
    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const plant = await Plant.findOne({ where: { id: req.params.id, jardin_id: garden.id } });
    if (!plant) {
      return res.status(404).json({ error: 'Planta no encontrada.' });
    }

    plant.descripcion = value.descripcion;
    await plant.save();

    garden.ultima_modificacion = new Date();
    await garden.save();

    return res.json({ plant });
  } catch (err) {
    return next(err);
  }
};

exports.deletePlant = async (req, res, next) => {
  try {
    const garden = await Garden.findOne({ where: { usuario_id: req.user.id } });
    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const plant = await Plant.findOne({ where: { id: req.params.id, jardin_id: garden.id } });
    if (!plant) {
      return res.status(404).json({ error: 'Planta no encontrada.' });
    }

    await plant.destroy();

    const delta = plant.tipo === 'positivo' ? -5 : plant.tipo === 'negativo' ? 5 : -2;
    garden.estado_salud = adjustGardenHealth(garden.estado_salud, plant.tipo, delta);
    garden.ultima_modificacion = new Date();
    await garden.save();

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { value, error } = historyQuerySchema.validate(req.query, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const garden = await Garden.findOne({ where: { usuario_id: req.user.id } });
    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const where = { jardin_id: garden.id };
    if (value.fechaInicio || value.fechaFin) {
      where.fecha_plantado = {};
      if (value.fechaInicio) {
        where.fecha_plantado[Op.gte] = new Date(value.fechaInicio);
      }
      if (value.fechaFin) {
        where.fecha_plantado[Op.lte] = new Date(value.fechaFin);
      }
    }

    const plants = await Plant.findAll({
      where,
      order: [['fecha_plantado', 'DESC']],
    });

    return res.json({ historial: plants });
  } catch (err) {
    return next(err);
  }
};
