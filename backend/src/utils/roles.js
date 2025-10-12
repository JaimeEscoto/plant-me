const ROLE_ALIASES = {
  admin: 'admin',
  administrador: 'admin',
  administradora: 'admin',
  administrator: 'admin',
  superadmin: 'admin',
  usuario: 'usuario',
  user: 'usuario',
  participante: 'usuario',
};

const normalizeRole = (role, fallback = 'usuario') => {
  if (typeof role === 'string') {
    const normalized = role.trim().toLowerCase();
    if (normalized) {
      return ROLE_ALIASES[normalized] || normalized;
    }
  }

  return fallback;
};

module.exports = { normalizeRole };
