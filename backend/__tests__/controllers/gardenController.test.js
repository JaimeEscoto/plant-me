jest.mock('../../src/lib/supabaseClient', () => ({
  from: jest.fn(),
}));

const supabase = require('../../src/lib/supabaseClient');
const gardenController = require('../../src/controllers/gardenController');
const { buildAccessoryList } = require('../../src/utils/accessories');

const createQueryBuilder = ({
  defaultResponse = { data: null, error: null },
  maybeSingleResponse,
} = {}) => {
  const builder = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(defaultResponse)),
    maybeSingle: jest.fn(() => Promise.resolve(maybeSingleResponse ?? defaultResponse)),
    then: (resolve) => resolve(defaultResponse),
  };
  return builder;
};

describe('gardenController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getGarden returns sorted plants with accessories', async () => {
    const req = { user: { id: 1 } };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    const garden = {
      id: 3,
      usuario_id: 1,
      estado_salud: 80,
      plantas: [
        { id: 1, fecha_plantado: '2024-05-01T00:00:00Z' },
        { id: 2, fecha_plantado: '2024-06-01T00:00:00Z' },
      ],
    };

    supabase.from
      .mockReturnValueOnce(
        createQueryBuilder({ maybeSingleResponse: { data: garden, error: null } })
      )
      .mockReturnValueOnce(
        createQueryBuilder({ defaultResponse: { data: [{ accesorio_id: 'sombrero_floral', cantidad: 2 }], error: null } })
      );

    await gardenController.getGarden(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      ...garden,
      plantas: [
        { id: 2, fecha_plantado: '2024-06-01T00:00:00Z' },
        { id: 1, fecha_plantado: '2024-05-01T00:00:00Z' },
      ],
      accesorios: buildAccessoryList([{ accesorio_id: 'sombrero_floral', cantidad: 2 }]),
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('getGarden returns 404 when garden missing', async () => {
    const req = { user: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    supabase.from
      .mockReturnValueOnce(createQueryBuilder({ maybeSingleResponse: { data: null, error: null } }))
      .mockReturnValueOnce(createQueryBuilder());

    await gardenController.getGarden(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Jardín no encontrado.' });
  });

  test('getEventTypes maps translations using preferred language', async () => {
    const req = { query: { lang: 'en' } };
    const res = { json: jest.fn() };

    supabase.from.mockReturnValueOnce(
      createQueryBuilder({
        defaultResponse: {
          data: [
            {
              code: 'gratitude',
              plant_delta: 5,
              remove_delta: -2,
              position: 1,
              event_type_translations: [
                { language: 'es', label: 'Gratitud' },
                { language: 'en', label: 'Gratitude' },
              ],
            },
          ],
          error: null,
        },
      })
    );

    await gardenController.getEventTypes(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith([
      {
        code: 'gratitude',
        label: 'Gratitude',
        plantDelta: 5,
        removeDelta: -2,
        position: 1,
      },
    ]);
  });

  test('getEventCategories falls back to spanish translation when preferred missing', async () => {
    const req = { query: { lang: 'fr' } };
    const res = { json: jest.fn() };

    supabase.from.mockReturnValueOnce(
      createQueryBuilder({
        defaultResponse: {
          data: [
            {
              code: 'emociones',
              position: 2,
              event_category_translations: [
                { language: 'es', label: 'Emociones' },
              ],
            },
          ],
          error: null,
        },
      })
    );

    await gardenController.getEventCategories(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith([
      { code: 'emociones', label: 'Emociones', position: 2 },
    ]);
  });
});
