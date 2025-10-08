const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Garden } = require('../models');
const { registerSchema, loginSchema } = require('../validations/authValidation');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res, next) => {
  try {
    const { value, error } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ nombre_usuario: value.nombre_usuario }, { email: value.email }],
      },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'El nombre de usuario o email ya está en uso.' });
    }

    const hashedPassword = await bcrypt.hash(value.contrasena, 10);
    const user = await User.create({
      nombre_usuario: value.nombre_usuario,
      email: value.email,
      contrasena: hashedPassword,
    });

    const garden = await Garden.create({ usuario_id: user.id });

    const token = signToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        jardin: garden,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { value, error } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const user = await User.findOne({ where: { email: value.email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isValid = await bcrypt.compare(value.contrasena, user.contrasena);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = signToken(user.id);
    const garden = await Garden.findOne({ where: { usuario_id: user.id } });

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        jardin: garden,
      },
    });
  } catch (err) {
    return next(err);
  }
};
