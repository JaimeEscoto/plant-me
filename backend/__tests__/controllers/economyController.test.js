jest.mock('../../src/lib/supabaseClient', () => ({
  from: jest.fn(),
}));

const supabase = require('../../src/lib/supabaseClient');
const economyController = require('../../src/controllers/economyController');
const { buildAccessoryList, ACCESSORIES_CATALOG } = require('../../src/utils/accessories');

const createBuilder = ({
  defaultResponse = { data: null, error: null },
  maybeSingleResponse,
  singleResponse,
} = {}) => {
  const response = defaultResponse;
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    or: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(singleResponse ?? response)),
    maybeSingle: jest.fn(() => Promise.resolve(maybeSingleResponse ?? response)),
    then: (resolve) => resolve(response),
  };
  return builder;
};

describe('economyController.purchaseAccessory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when user lacks seeds', async () => {
    const accessory = ACCESSORIES_CATALOG[0];
    const req = { params: { id: accessory.id }, user: { id: 1 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    supabase.from
      .mockReturnValueOnce(
        createBuilder({ maybeSingleResponse: { data: { id: 1, semillas: 10, medalla_compras: 0 }, error: null } })
      )
      .mockReturnValueOnce(createBuilder({ defaultResponse: { data: [], error: null } }));

    await economyController.purchaseAccessory(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tienes suficientes semillas para comprar este accesorio.' });
  });

  test('completes purchase, updates inventory and returns garden with accessories', async () => {
    const accessory = ACCESSORIES_CATALOG[0];
    const req = { params: { id: accessory.id }, user: { id: 7 }, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    supabase.from
      // fetchUserEconomy - usuarios
      .mockReturnValueOnce(
        createBuilder({ maybeSingleResponse: { data: { id: 7, semillas: 100, medalla_compras: 2 }, error: null } })
      )
      // fetchUserEconomy - usuario_accesorios
      .mockReturnValueOnce(createBuilder({ defaultResponse: { data: [], error: null } }))
      // updateInventoryQuantity - fetch existing row
      .mockReturnValueOnce(createBuilder({ maybeSingleResponse: { data: null, error: null } }))
      // updateInventoryQuantity - insert new row
      .mockReturnValueOnce(createBuilder({ defaultResponse: { data: null, error: null } }))
      // update user seeds/medal
      .mockReturnValueOnce(
        createBuilder({ singleResponse: { data: { semillas: 45, medalla_compras: 3 }, error: null } })
      )
      // fetchGarden inside createAccessoryEvent
      .mockReturnValueOnce(
        createBuilder({ maybeSingleResponse: { data: { id: 5, estado_salud: 50 }, error: null } })
      )
      // create accessory event insert
      .mockReturnValueOnce(
        createBuilder({ singleResponse: { data: { id: 12, nombre: 'Nuevo accesorio' }, error: null } })
      )
      // update garden health
      .mockReturnValueOnce(
        createBuilder({ singleResponse: { data: { id: 5, usuario_id: 7, estado_salud: 55, ultima_modificacion: '2024-06-01' }, error: null } })
      )
      // recordSeedMovement insert
      .mockReturnValueOnce(createBuilder({ defaultResponse: { data: null, error: null } }))
      // refreshed economy - usuarios
      .mockReturnValueOnce(
        createBuilder({ maybeSingleResponse: { data: { id: 7, semillas: 45, medalla_compras: 3 }, error: null } })
      )
      // refreshed economy - usuario_accesorios
      .mockReturnValueOnce(
        createBuilder({ defaultResponse: { data: [{ accesorio_id: accessory.id, cantidad: 1 }], error: null } })
      );

    await economyController.purchaseAccessory(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    const payload = res.json.mock.calls[0][0];
    expect(payload.accesorio.id).toBe(accessory.id);
    expect(payload.semillas).toBe(45);
    expect(payload.medalla_compras).toBe(3);
    expect(payload.accesorios).toEqual(
      buildAccessoryList([{ accesorio_id: accessory.id, cantidad: 1 }])
    );
    expect(payload.jardin).toMatchObject({ id: 5, estado_salud: 55 });
    expect(next).not.toHaveBeenCalled();
  });
});
