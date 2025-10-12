const { normalizeRole } = require('../utils/roles');

module.exports = (req, res, next) => {
  const role = normalizeRole(req.user?.rol);

  if (role !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido al panel administrativo.' });
  }

  req.user = {
    ...req.user,
    rol: role,
  };

  return next();
};
