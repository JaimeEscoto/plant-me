const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const { buildAccessoryList } = require('../utils/accessories');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const { normalizeRole } = require('../utils/roles');

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

    const [{ data: existingByUsername, error: usernameError }, { data: existingByEmail, error: emailError }] = await Promise.all([
      supabase.from('usuarios').select('id').eq('nombre_usuario', value.nombre_usuario).limit(1),
      supabase.from('usuarios').select('id').eq('email', value.email).limit(1),
    ]);

    if (usernameError || emailError) {
      throw toHttpError(usernameError || emailError, 'No se pudo verificar la disponibilidad del usuario.');
    }

    if ((existingByUsername && existingByUsername.length > 0) || (existingByEmail && existingByEmail.length > 0)) {
      return res.status(409).json({ error: 'El nombre de usuario o email ya está en uso.' });
    }

    const hashedPassword = await bcrypt.hash(value.contrasena, 10);
    const { data: user, error: createUserError } = await supabase
      .from('usuarios')
      .insert({
        nombre_usuario: value.nombre_usuario,
        email: value.email,
        contrasena: hashedPassword,
        rol: 'usuario',
      })
      .select()
      .single();

    if (createUserError) {
      throw toHttpError(createUserError, 'No se pudo crear el usuario en Supabase.');
    }

    const { data: garden, error: gardenError } = await supabase
      .from('jardines')
      .insert({ usuario_id: user.id })
      .select()
      .single();

    if (gardenError) {
      throw toHttpError(gardenError, 'No se pudo crear el jardín en Supabase.');
    }

    const { data: accessoryRows, error: accessoryError } = await supabase
      .from('usuario_accesorios')
      .select('accesorio_id, cantidad')
      .eq('usuario_id', user.id);

    if (accessoryError) {
      throw toHttpError(accessoryError, 'No se pudieron obtener los accesorios del jardín.');
    }

    const gardenWithAccessories = {
      ...garden,
      accesorios: buildAccessoryList(accessoryRows || []),
    };

    const token = signToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        semillas: user.semillas,
        medalla_compras: user.medalla_compras,
        rol: normalizeRole(user.rol),
        foto_perfil: user.foto_perfil || null,
        jardin: gardenWithAccessories,
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

    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', value.email)
      .maybeSingle();

    if (userError) {
      throw toHttpError(userError, 'No se pudo consultar el usuario en Supabase.');
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isValid = await bcrypt.compare(value.contrasena, user.contrasena);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = signToken(user.id);
    const { data: garden, error: gardenError } = await supabase
      .from('jardines')
      .select('*')
      .eq('usuario_id', user.id)
      .maybeSingle();

    if (gardenError) {
      throw toHttpError(gardenError, 'No se pudo obtener el jardín del usuario.');
    }

    const { data: accessoryRows, error: accessoryError } = await supabase
      .from('usuario_accesorios')
      .select('accesorio_id, cantidad')
      .eq('usuario_id', user.id);

    if (accessoryError) {
      throw toHttpError(accessoryError, 'No se pudieron obtener los accesorios del jardín.');
    }

    const gardenWithAccessories = garden
      ? {
          ...garden,
          accesorios: buildAccessoryList(accessoryRows || []),
        }
      : null;

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        semillas: user.semillas,
        medalla_compras: user.medalla_compras,
        rol: normalizeRole(user.rol),
        foto_perfil: user.foto_perfil || null,
        jardin: gardenWithAccessories,
      },
    });
  } catch (err) {
    return next(err);
  }
};
