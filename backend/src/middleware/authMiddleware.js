const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabaseClient');
const { normalizeRole } = require('../utils/roles');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, email, semillas, medalla_compras, rol')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'No se pudo validar el token contra Supabase' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = {
      ...user,
      rol: normalizeRole(user.rol),
    };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
