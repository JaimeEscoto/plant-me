jest.mock('../../src/lib/supabaseClient', () => ({
  from: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

const supabase = require('../../src/lib/supabaseClient');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middleware/authMiddleware');

const createQueryBuilder = (response = { data: null, error: null }) => {
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn(() => Promise.resolve(response)),
    then: (resolve) => resolve(response),
  };
  return builder;
};

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects when authorization header missing', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await authMiddleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization token missing' });
  });

  test('rejects when token invalid', async () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jwt.verify.mockImplementation(() => {
      throw new Error('bad token');
    });

    await authMiddleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  test('rejects when supabase returns error', async () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jwt.verify.mockReturnValue({ id: 1 });
    supabase.from.mockReturnValue(
      createQueryBuilder({ data: null, error: new Error('supabase failed') })
    );

    await authMiddleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'No se pudo validar el token contra Supabase' });
  });

  test('rejects when user not found', async () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    jwt.verify.mockReturnValue({ id: 2 });
    supabase.from.mockReturnValue(createQueryBuilder({ data: null, error: null }));

    await authMiddleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  test('attaches user when token valid and supabase responds', async () => {
    const req = { headers: { authorization: 'Bearer token' } };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();
    const user = { id: 3, nombre_usuario: 'alice' };

    jwt.verify.mockReturnValue({ id: 3 });
    supabase.from.mockReturnValue(createQueryBuilder({ data: user, error: null }));

    await authMiddleware(req, res, next);

    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
  });
});
