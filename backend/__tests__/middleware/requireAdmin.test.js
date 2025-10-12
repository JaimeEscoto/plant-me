const requireAdmin = require('../../src/middleware/requireAdmin');

describe('requireAdmin middleware', () => {
  test('denies access when user is missing', () => {
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Acceso restringido al panel administrativo.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('allows access when user is admin', () => {
    const req = { user: { rol: 'admin' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
