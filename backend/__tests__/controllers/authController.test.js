jest.mock('../../src/lib/supabaseClient', () => ({
  from: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

const supabase = require('../../src/lib/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buildAccessoryList } = require('../../src/utils/accessories');
const authController = require('../../src/controllers/authController');

const createQueryBuilder = ({
  defaultResponse = { data: null, error: null },
  singleResponse,
  maybeSingleResponse,
} = {}) => {
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    order: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    in: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(singleResponse ?? defaultResponse)),
    maybeSingle: jest.fn(() => Promise.resolve(maybeSingleResponse ?? defaultResponse)),
    then: (resolve) => resolve(defaultResponse),
  };
  return builder;
};

describe('authController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jwt.sign.mockReturnValue('signed-token');
  });

  test('register propagates validation errors to next', async () => {
    const req = { body: {} };
    const res = { status: jest.fn(), json: jest.fn() };
    const next = jest.fn();

    await authController.register(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.status).toBe(400);
  });

  test('register returns 409 when user already exists', async () => {
    const req = {
      body: {
        nombre_usuario: 'alice',
        email: 'alice@example.com',
        contrasena: 'Password1',
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    supabase.from
      .mockReturnValueOnce(
        createQueryBuilder({ defaultResponse: { data: [{ id: 1 }], error: null } })
      )
      .mockReturnValueOnce(
        createQueryBuilder({ defaultResponse: { data: [], error: null } })
      );

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'El nombre de usuario o email ya está en uso.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('register creates user and returns token with garden and accessories', async () => {
    const req = {
      body: {
        nombre_usuario: 'alice',
        email: 'alice@example.com',
        contrasena: 'Password1',
      },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const user = {
      id: 10,
      nombre_usuario: 'alice',
      email: 'alice@example.com',
      semillas: 20,
      medalla_compras: 1,
      rol: 'usuario',
    };
    const garden = {
      id: 99,
      usuario_id: 10,
      estado_salud: 50,
      ultima_modificacion: '2024-01-01T00:00:00.000Z',
    };

    bcrypt.hash.mockResolvedValue('hashed');

    supabase.from
      .mockReturnValueOnce(createQueryBuilder()) // username availability
      .mockReturnValueOnce(createQueryBuilder()) // email availability
      .mockReturnValueOnce(
        createQueryBuilder({ singleResponse: { data: user, error: null } })
      )
      .mockReturnValueOnce(
        createQueryBuilder({ singleResponse: { data: garden, error: null } })
      )
      .mockReturnValueOnce(
        createQueryBuilder({ defaultResponse: { data: [{ accesorio_id: 'sombrero_floral', cantidad: 1 }], error: null } })
      );

    await authController.register(req, res, next);

    expect(bcrypt.hash).toHaveBeenCalledWith('Password1', 10);
    expect(jwt.sign).toHaveBeenCalledWith({ id: 10 }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.token).toBe('signed-token');
    expect(responsePayload.user).toMatchObject({
      id: 10,
      nombre_usuario: 'alice',
      email: 'alice@example.com',
      semillas: 20,
      medalla_compras: 1,
      rol: 'usuario',
    });
    expect(responsePayload.user.jardin.accesorios).toEqual(
      buildAccessoryList([{ accesorio_id: 'sombrero_floral', cantidad: 1 }])
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('login rejects invalid credentials', async () => {
    const req = { body: { email: 'user@example.com', contrasena: 'Password1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    supabase.from.mockReturnValueOnce(createQueryBuilder({ maybeSingleResponse: { data: null, error: null } }));

    await authController.login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas.' });
  });

  test('login returns token and garden data when credentials valid', async () => {
    const req = { body: { email: 'user@example.com', contrasena: 'Password1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const user = {
      id: 11,
      nombre_usuario: 'bob',
      email: 'user@example.com',
      contrasena: 'hashed',
      semillas: 5,
      medalla_compras: 0,
    };
    const garden = {
      id: 5,
      usuario_id: 11,
      estado_salud: 60,
    };

    bcrypt.compare.mockResolvedValue(true);

    supabase.from
      .mockReturnValueOnce(
        createQueryBuilder({ maybeSingleResponse: { data: user, error: null } })
      )
      .mockReturnValueOnce(
        createQueryBuilder({ maybeSingleResponse: { data: garden, error: null } })
      )
      .mockReturnValueOnce(
        createQueryBuilder({ defaultResponse: { data: [], error: null } })
      );

    await authController.login(req, res, next);

    expect(bcrypt.compare).toHaveBeenCalledWith('Password1', 'hashed');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 11 }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.user).toMatchObject({ id: 11, nombre_usuario: 'bob', email: 'user@example.com' });
    expect(payload.user.jardin.id).toBe(5);
    expect(next).not.toHaveBeenCalled();
  });
});
