const {
  ACCESSORIES_CATALOG,
  toCatalogMap,
  buildAccessoryList,
  buildInventoryMap,
} = require('../../src/utils/accessories');

describe('accessories utilities', () => {
  test('toCatalogMap returns all catalog entries by id', () => {
    const map = toCatalogMap();
    expect(map).toBeInstanceOf(Map);
    ACCESSORIES_CATALOG.forEach((item) => {
      expect(map.get(item.id)).toEqual(item);
    });
  });

  test('buildInventoryMap converts array entries into a map ignoring invalid rows', () => {
    const inventory = [
      { accesorio_id: 'sombrero_floral', cantidad: 2 },
      { accesorio_id: 'invalid', cantidad: 'not-a-number' },
      { accesorio_id: null, cantidad: 1 },
      { accesorio_id: 'maceta_arcoiris', cantidad: -3 },
    ];

    const map = buildInventoryMap(inventory);

    expect(map).toBeInstanceOf(Map);
    expect(Array.from(map.entries())).toEqual([
      ['sombrero_floral', 2],
    ]);
  });

  test('buildInventoryMap returns same instance when map provided', () => {
    const original = new Map([
      ['guirnalda_luces', 4],
    ]);

    const result = buildInventoryMap(original);
    expect(result).toBe(original);
  });

  test('buildAccessoryList merges quantities into catalog response', () => {
    const list = buildAccessoryList([
      { accesorio_id: 'sombrero_floral', cantidad: 1 },
      { accesorio_id: 'guirnalda_luces', cantidad: 3 },
    ]);

    expect(list).toHaveLength(ACCESSORIES_CATALOG.length);
    const sombrero = list.find((item) => item.id === 'sombrero_floral');
    const guirnalda = list.find((item) => item.id === 'guirnalda_luces');
    const arcoiris = list.find((item) => item.id === 'maceta_arcoiris');

    expect(sombrero.cantidad).toBe(1);
    expect(guirnalda.cantidad).toBe(3);
    expect(arcoiris.cantidad).toBe(0);
  });
});
