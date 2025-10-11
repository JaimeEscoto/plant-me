const ACCESSORIES_CATALOG = [
  {
    id: 'sombrero_floral',
    nombre: 'Sombrero floral',
    descripcion: 'Un sombrero tejido con pétalos brillantes que celebra los logros diarios.',
    precio: 60,
    icono: '🎩',
  },
  {
    id: 'guirnalda_luces',
    nombre: 'Guirnalda de luciérnagas',
    descripcion: 'Luce destellos mágicos alrededor de tu planta durante la noche.',
    precio: 55,
    icono: '💡',
  },
  {
    id: 'maceta_arcoiris',
    nombre: 'Maceta arcoíris',
    descripcion: 'Una maceta multicolor que vibra con cada emoción positiva.',
    precio: 75,
    icono: '🌈',
  },
  {
    id: 'duende_guardian',
    nombre: 'Duende guardián',
    descripcion: 'Un pequeño guardián que protege tus emociones con una sonrisa.',
    precio: 90,
    icono: '🧚',
  },
  {
    id: 'piedras_equilibrio',
    nombre: 'Piedras de equilibrio',
    descripcion: 'Piedras pulidas que ayudan a estabilizar la energía de la planta.',
    precio: 40,
    icono: '🪨',
  },
  {
    id: 'campanas_viento',
    nombre: 'Campanas de viento suave',
    descripcion: 'Campanas que suenan cuando tu jardín alcanza armonía.',
    precio: 50,
    icono: '🎐',
  },
  {
    id: 'rastro_estrellas',
    nombre: 'Rastro de estrellas',
    descripcion: 'Un polvo estelar que deja destellos al mover la planta.',
    precio: 85,
    icono: '✨',
  },
  {
    id: 'mariposas_amigas',
    nombre: 'Mariposas amigas',
    descripcion: 'Mariposas que revolotean alrededor recordando pequeños logros.',
    precio: 65,
    icono: '🦋',
  },
  {
    id: 'gotas_aurora',
    nombre: 'Gotas de aurora',
    descripcion: 'Pequeñas luces que cuelgan como gotas de rocío multicolor.',
    precio: 70,
    icono: '💧',
  },
  {
    id: 'cojin_terrenal',
    nombre: 'Cojín terrenal',
    descripcion: 'Un mullido cojín que abraza las raíces de la planta.',
    precio: 45,
    icono: '🪴',
  },
];

const toCatalogMap = () => new Map(ACCESSORIES_CATALOG.map((item) => [item.id, item]));

const buildInventoryMap = (inventory) => {
  if (inventory instanceof Map) {
    return inventory;
  }

  const map = new Map();
  if (Array.isArray(inventory)) {
    inventory.forEach((entry) => {
      if (entry?.accesorio_id && Number.isFinite(Number(entry?.cantidad))) {
        const quantity = Number(entry.cantidad);
        if (quantity > 0) {
          map.set(entry.accesorio_id, quantity);
        }
      }
    });
  }
  return map;
};

const buildAccessoryList = (inventory) => {
  const inventoryMap = buildInventoryMap(inventory);
  return ACCESSORIES_CATALOG.map((item) => ({
    ...item,
    cantidad: inventoryMap.get(item.id) || 0,
  }));
};

module.exports = {
  ACCESSORIES_CATALOG,
  toCatalogMap,
  buildAccessoryList,
  buildInventoryMap,
};
