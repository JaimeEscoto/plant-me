const normalizeRole = (role, fallback = 'usuario') => {
  if (typeof role === 'string') {
    const normalized = role.trim().toLowerCase();
    if (normalized) {
      return normalized;
    }
  }

  return fallback;
};

module.exports = { normalizeRole };
