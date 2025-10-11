const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');

const EVENT_SEED_REWARD = Number(process.env.EVENT_SEED_REWARD || 5);
const ACCESSORY_HEALTH_DELTA = 5;

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

const fetchUserEconomy = async (userId) => {
  const [{ data: userRow, error: userError }, { data: inventoryRows, error: inventoryError }] =
    await Promise.all([
      supabase
        .from('usuarios')
        .select('id, semillas, medalla_compras')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('usuario_accesorios')
        .select('accesorio_id, cantidad')
        .eq('usuario_id', userId),
    ]);

  if (userError) {
    throw toHttpError(userError, 'No se pudo obtener la información económica del usuario.');
  }

  if (!userRow) {
    const error = new Error('Usuario no encontrado.');
    error.status = 404;
    throw error;
  }

  if (inventoryError) {
    throw toHttpError(inventoryError, 'No se pudo obtener el inventario de accesorios.');
  }

  const inventoryMap = new Map();
  (inventoryRows || []).forEach((row) => {
    if (row?.accesorio_id && row?.cantidad > 0) {
      inventoryMap.set(row.accesorio_id, row.cantidad);
    }
  });

  return {
    semillas: userRow.semillas || 0,
    medalla_compras: userRow.medalla_compras || 0,
    inventario: inventoryMap,
  };
};

const fetchGarden = async (userId) => {
  const { data: garden, error } = await supabase
    .from('jardines')
    .select('id, estado_salud')
    .eq('usuario_id', userId)
    .maybeSingle();

  if (error) {
    throw toHttpError(error, 'No se pudo obtener el jardín del usuario.');
  }

  if (!garden) {
    const err = new Error('Jardín no encontrado.');
    err.status = 404;
    throw err;
  }

  return garden;
};

const fetchTransfers = async (userId) => {
  const [seedTransfersResult, accessoryTransfersResult] = await Promise.all([
    supabase
      .from('semillas_transferencias')
      .select(
        'id, remitente_id, destinatario_id, cantidad, mensaje, estado, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
      )
      .or(`remitente_id.eq.${userId},destinatario_id.eq.${userId}`)
      .order('fecha_creacion', { ascending: false }),
    supabase
      .from('accesorios_transferencias')
      .select(
        'id, remitente_id, destinatario_id, accesorio_id, cantidad, estado, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
      )
      .or(`remitente_id.eq.${userId},destinatario_id.eq.${userId}`)
      .order('fecha_creacion', { ascending: false }),
  ]);

  if (seedTransfersResult.error) {
    throw toHttpError(seedTransfersResult.error, 'No se pudieron obtener las transferencias de semillas.');
  }

  if (accessoryTransfersResult.error) {
    throw toHttpError(
      accessoryTransfersResult.error,
      'No se pudieron obtener las transferencias de accesorios.'
    );
  }

  const seedTransfers = (seedTransfersResult.data || []).filter((transfer) =>
    ['pendiente'].includes(transfer.estado)
  );

  const accessoryTransfers = (accessoryTransfersResult.data || []).filter((transfer) =>
    ['pendiente'].includes(transfer.estado)
  );

  return { seedTransfers, accessoryTransfers };
};

const buildAccessoryList = (inventoryMap) =>
  ACCESSORIES_CATALOG.map((item) => ({
    ...item,
    cantidad: inventoryMap.get(item.id) || 0,
  }));

const updateInventoryQuantity = async (userId, accessoryId, nextQuantity) => {
  const { data: existingRow, error: fetchError } = await supabase
    .from('usuario_accesorios')
    .select('id, cantidad')
    .eq('usuario_id', userId)
    .eq('accesorio_id', accessoryId)
    .maybeSingle();

  if (fetchError) {
    throw toHttpError(fetchError, 'No se pudo consultar el inventario.');
  }

  if (existingRow) {
    if (nextQuantity > 0) {
      const { error: updateError } = await supabase
        .from('usuario_accesorios')
        .update({ cantidad: nextQuantity, fecha_actualizacion: new Date().toISOString() })
        .eq('id', existingRow.id);

      if (updateError) {
        throw toHttpError(updateError, 'No se pudo actualizar el inventario del accesorio.');
      }
    } else {
      const { error: deleteError } = await supabase
        .from('usuario_accesorios')
        .delete()
        .eq('id', existingRow.id);

      if (deleteError) {
        throw toHttpError(deleteError, 'No se pudo actualizar el inventario del accesorio.');
      }
    }
  } else if (nextQuantity > 0) {
    const { error: insertError } = await supabase
      .from('usuario_accesorios')
      .insert({ usuario_id: userId, accesorio_id: accessoryId, cantidad: nextQuantity });

    if (insertError) {
      throw toHttpError(insertError, 'No se pudo agregar el accesorio al inventario.');
    }
  }
};

const createAccessoryEvent = async (userId, accessory) => {
  const garden = await fetchGarden(userId);
  const now = new Date().toISOString();

  const { data: event, error: eventError } = await supabase
    .from('plantas')
    .insert({
      jardin_id: garden.id,
      nombre: `Nuevo accesorio: ${accessory.nombre}`,
      categoria: 'Accesorios',
      tipo: 'positivo',
      descripcion: accessory.descripcion,
    })
    .select()
    .single();

  if (eventError) {
    throw toHttpError(eventError, 'No se pudo registrar el evento del accesorio.');
  }

  const updatedHealth = Math.max(0, Math.min(100, (garden.estado_salud || 50) + ACCESSORY_HEALTH_DELTA));

  const { data: updatedGarden, error: updateGardenError } = await supabase
    .from('jardines')
    .update({ estado_salud: updatedHealth, ultima_modificacion: now })
    .eq('id', garden.id)
    .select('id, usuario_id, estado_salud, ultima_modificacion')
    .single();

  if (updateGardenError) {
    throw toHttpError(updateGardenError, 'No se pudo actualizar el jardín tras la compra.');
  }

  return { event, garden: updatedGarden };
};

exports.getEconomyOverview = async (req, res, next) => {
  try {
    const economy = await fetchUserEconomy(req.user.id);
    const { seedTransfers, accessoryTransfers } = await fetchTransfers(req.user.id);

    return res.json({
      semillas: economy.semillas,
      medalla_compras: economy.medalla_compras,
      accesorios: buildAccessoryList(economy.inventario),
      transferencias: {
        semillas: seedTransfers,
        accesorios: accessoryTransfers,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.getSeedTransferHistory = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('semillas_transferencias')
      .select(
        'id, remitente_id, destinatario_id, cantidad, mensaje, estado, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
      )
      .or(`remitente_id.eq.${req.user.id},destinatario_id.eq.${req.user.id}`)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      throw toHttpError(error, 'No se pudo obtener el historial de semillas.');
    }

    return res.json({ transferencias: data || [] });
  } catch (err) {
    return next(err);
  }
};

exports.listAccessories = async (req, res, next) => {
  try {
    const economy = await fetchUserEconomy(req.user.id);
    return res.json({ accesorios: buildAccessoryList(economy.inventario) });
  } catch (err) {
    return next(err);
  }
};

exports.purchaseAccessory = async (req, res, next) => {
  try {
    const catalogMap = toCatalogMap();
    const accessoryId = req.params.id;
    const accessory = catalogMap.get(accessoryId);

    if (!accessory) {
      return res.status(404).json({ error: 'El accesorio solicitado no existe.' });
    }

    const economy = await fetchUserEconomy(req.user.id);

    if (economy.semillas < accessory.precio) {
      return res.status(400).json({ error: 'No tienes suficientes semillas para comprar este accesorio.' });
    }

    const nextMedalCount = economy.medalla_compras + 1;
    const nextSeedBalance = economy.semillas - accessory.precio + EVENT_SEED_REWARD;

    await updateInventoryQuantity(
      req.user.id,
      accessory.id,
      (economy.inventario.get(accessory.id) || 0) + 1
    );

    const { data: updatedUser, error: updateUserError } = await supabase
      .from('usuarios')
      .update({ semillas: nextSeedBalance, medalla_compras: nextMedalCount })
      .eq('id', req.user.id)
      .select('id, semillas, medalla_compras')
      .single();

    if (updateUserError) {
      throw toHttpError(updateUserError, 'No se pudo actualizar la información del usuario tras la compra.');
    }

    const { event, garden } = await createAccessoryEvent(req.user.id, accessory);

    const refreshedInventory = await fetchUserEconomy(req.user.id);

    return res.status(201).json({
      accesorio: accessory,
      semillas: updatedUser.semillas,
      medalla_compras: updatedUser.medalla_compras,
      recompensa_semillas: EVENT_SEED_REWARD,
      plant: event,
      jardin: garden,
      accesorios: buildAccessoryList(refreshedInventory.inventario),
    });
  } catch (err) {
    return next(err);
  }
};

exports.sellAccessory = async (req, res, next) => {
  try {
    const catalogMap = toCatalogMap();
    const accessoryId = req.params.id;
    const accessory = catalogMap.get(accessoryId);

    if (!accessory) {
      return res.status(404).json({ error: 'El accesorio solicitado no existe.' });
    }

    const quantity = Math.max(1, Number.parseInt(req.body?.cantidad, 10) || 1);

    const economy = await fetchUserEconomy(req.user.id);
    const ownedQuantity = economy.inventario.get(accessory.id) || 0;

    if (ownedQuantity < quantity) {
      return res
        .status(400)
        .json({ error: 'No tienes suficientes unidades de este accesorio para vender.' });
    }

    const saleValue = Math.floor((accessory.precio * quantity) / 2);
    const nextSeedBalance = economy.semillas + saleValue;

    await updateInventoryQuantity(req.user.id, accessory.id, ownedQuantity - quantity);

    const { data: updatedUser, error: updateUserError } = await supabase
      .from('usuarios')
      .update({ semillas: nextSeedBalance })
      .eq('id', req.user.id)
      .select('id, semillas, medalla_compras')
      .single();

    if (updateUserError) {
      throw toHttpError(updateUserError, 'No se pudo actualizar las semillas tras la venta.');
    }

    const refreshedInventory = await fetchUserEconomy(req.user.id);

    return res.json({
      accesorio: accessory,
      semillas: updatedUser.semillas,
      medalla_compras: updatedUser.medalla_compras,
      valor_recuperado: saleValue,
      accesorios: buildAccessoryList(refreshedInventory.inventario),
    });
  } catch (err) {
    return next(err);
  }
};

const resolveUsernameToId = async (username) => {
  const trimmed = String(username || '').trim();
  if (!trimmed) {
    const err = new Error('Debes indicar un nombre de usuario destino.');
    err.status = 400;
    throw err;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_usuario')
    .ilike('nombre_usuario', trimmed)
    .maybeSingle();

  if (error) {
    throw toHttpError(error, 'No se pudo buscar el usuario destino.');
  }

  if (!data) {
    const err = new Error('La persona destinataria no existe.');
    err.status = 404;
    throw err;
  }

  return data;
};

exports.createSeedTransfer = async (req, res, next) => {
  try {
    const cantidad = Number.parseInt(req.body?.cantidad, 10);
    const mensaje = req.body?.mensaje ? String(req.body.mensaje).slice(0, 240) : null;
    const destinatarioUsername = req.body?.destinatario;

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return res.status(400).json({ error: 'Debes indicar una cantidad de semillas válida.' });
    }

    const destinatario = await resolveUsernameToId(destinatarioUsername);

    if (destinatario.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes transferirte semillas a ti mismo.' });
    }

    const economy = await fetchUserEconomy(req.user.id);

    if (economy.semillas < cantidad) {
      return res.status(400).json({ error: 'No tienes suficientes semillas disponibles.' });
    }

    const nextSeedBalance = economy.semillas - cantidad;

    const [{ data: updatedUser, error: updateUserError }, { data: transfer, error: transferError }] =
      await Promise.all([
        supabase
          .from('usuarios')
          .update({ semillas: nextSeedBalance })
          .eq('id', req.user.id)
          .select('id, semillas, medalla_compras')
          .single(),
        supabase
          .from('semillas_transferencias')
          .insert({
            remitente_id: req.user.id,
            destinatario_id: destinatario.id,
            cantidad,
            mensaje,
          })
          .select(
            'id, remitente_id, destinatario_id, cantidad, mensaje, estado, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
          )
          .single(),
      ]);

    if (updateUserError) {
      throw toHttpError(updateUserError, 'No se pudo descontar la cantidad enviada.');
    }

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo crear la transferencia de semillas.');
    }

    return res.status(201).json({
      transferencia: transfer,
      semillas: updatedUser.semillas,
      medalla_compras: updatedUser.medalla_compras,
    });
  } catch (err) {
    return next(err);
  }
};

exports.acceptSeedTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.transferId;
    const { data: transfer, error: transferError } = await supabase
      .from('semillas_transferencias')
      .select('*')
      .eq('id', transferId)
      .maybeSingle();

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo consultar la transferencia.');
    }

    if (!transfer || transfer.destinatario_id !== req.user.id) {
      return res.status(404).json({ error: 'Transferencia no encontrada.' });
    }

    if (transfer.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La transferencia ya fue gestionada.' });
    }

    const economy = await fetchUserEconomy(req.user.id);
    const nextSeedBalance = economy.semillas + transfer.cantidad;

    const [{ data: updatedUser, error: updateUserError }, { error: updateTransferError }] =
      await Promise.all([
        supabase
          .from('usuarios')
          .update({ semillas: nextSeedBalance })
          .eq('id', req.user.id)
          .select('id, semillas, medalla_compras')
          .single(),
        supabase
          .from('semillas_transferencias')
          .update({ estado: 'aceptado' })
          .eq('id', transferId),
      ]);

    if (updateUserError) {
      throw toHttpError(updateUserError, 'No se pudo acreditar la transferencia.');
    }

    if (updateTransferError) {
      throw toHttpError(updateTransferError, 'No se pudo actualizar el estado de la transferencia.');
    }

    return res.json({ semillas: updatedUser.semillas, medalla_compras: updatedUser.medalla_compras });
  } catch (err) {
    return next(err);
  }
};

exports.rejectSeedTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.transferId;
    const { data: transfer, error: transferError } = await supabase
      .from('semillas_transferencias')
      .select('*')
      .eq('id', transferId)
      .maybeSingle();

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo consultar la transferencia.');
    }

    if (!transfer || (transfer.destinatario_id !== req.user.id && transfer.remitente_id !== req.user.id)) {
      return res.status(404).json({ error: 'Transferencia no encontrada.' });
    }

    if (transfer.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La transferencia ya fue gestionada.' });
    }

    const senderEconomy = await fetchUserEconomy(transfer.remitente_id);
    const restoredSeeds = senderEconomy.semillas + transfer.cantidad;

    const [{ error: updateTransferError }, { error: restoreError }] = await Promise.all([
      supabase.from('semillas_transferencias').update({ estado: 'rechazado' }).eq('id', transferId),
      supabase.from('usuarios').update({ semillas: restoredSeeds }).eq('id', transfer.remitente_id),
    ]);

    if (updateTransferError) {
      throw toHttpError(updateTransferError, 'No se pudo actualizar el estado de la transferencia.');
    }

    if (restoreError) {
      throw toHttpError(restoreError, 'No se pudo regresar las semillas al remitente.');
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

exports.createAccessoryTransfer = async (req, res, next) => {
  try {
    const catalogMap = toCatalogMap();
    const accessoryId = req.params.id;
    const accessory = catalogMap.get(accessoryId);

    if (!accessory) {
      return res.status(404).json({ error: 'El accesorio solicitado no existe.' });
    }

    const cantidad = Math.max(1, Number.parseInt(req.body?.cantidad, 10) || 1);
    const destinatario = await resolveUsernameToId(req.body?.destinatario);

    if (destinatario.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes transferirte accesorios a ti mismo.' });
    }

    const economy = await fetchUserEconomy(req.user.id);
    const ownedQuantity = economy.inventario.get(accessoryId) || 0;

    if (ownedQuantity < cantidad) {
      return res.status(400).json({ error: 'No tienes suficientes unidades para transferir.' });
    }

    await updateInventoryQuantity(req.user.id, accessoryId, ownedQuantity - cantidad);

    const { data: transfer, error: transferError } = await supabase
      .from('accesorios_transferencias')
      .insert({
        remitente_id: req.user.id,
        destinatario_id: destinatario.id,
        accesorio_id: accessoryId,
        cantidad,
      })
      .select(
        'id, remitente_id, destinatario_id, accesorio_id, cantidad, estado, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
      )
      .single();

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo crear la transferencia de accesorio.');
    }

    const refreshedInventory = await fetchUserEconomy(req.user.id);

    return res.status(201).json({
      transferencia: transfer,
      accesorios: buildAccessoryList(refreshedInventory.inventario),
    });
  } catch (err) {
    return next(err);
  }
};

exports.acceptAccessoryTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.transferId;
    const { data: transfer, error: transferError } = await supabase
      .from('accesorios_transferencias')
      .select('*')
      .eq('id', transferId)
      .maybeSingle();

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo consultar la transferencia de accesorio.');
    }

    if (!transfer || transfer.destinatario_id !== req.user.id) {
      return res.status(404).json({ error: 'Transferencia de accesorio no encontrada.' });
    }

    if (transfer.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La transferencia ya fue gestionada.' });
    }

    const recipientEconomy = await fetchUserEconomy(req.user.id);
    const nextQuantity = (recipientEconomy.inventario.get(transfer.accesorio_id) || 0) + transfer.cantidad;

    await updateInventoryQuantity(req.user.id, transfer.accesorio_id, nextQuantity);

    const { error: updateTransferError } = await supabase
      .from('accesorios_transferencias')
      .update({ estado: 'aceptado' })
      .eq('id', transferId);

    if (updateTransferError) {
      throw toHttpError(updateTransferError, 'No se pudo actualizar la transferencia de accesorio.');
    }

    const refreshedInventory = await fetchUserEconomy(req.user.id);

    return res.json({ accesorios: buildAccessoryList(refreshedInventory.inventario) });
  } catch (err) {
    return next(err);
  }
};

exports.rejectAccessoryTransfer = async (req, res, next) => {
  try {
    const transferId = req.params.transferId;
    const { data: transfer, error: transferError } = await supabase
      .from('accesorios_transferencias')
      .select('*')
      .eq('id', transferId)
      .maybeSingle();

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo consultar la transferencia de accesorio.');
    }

    if (!transfer || (transfer.destinatario_id !== req.user.id && transfer.remitente_id !== req.user.id)) {
      return res.status(404).json({ error: 'Transferencia de accesorio no encontrada.' });
    }

    if (transfer.estado !== 'pendiente') {
      return res.status(400).json({ error: 'La transferencia ya fue gestionada.' });
    }

    const senderEconomy = await fetchUserEconomy(transfer.remitente_id);
    const restoredQuantity = (senderEconomy.inventario.get(transfer.accesorio_id) || 0) + transfer.cantidad;

    await updateInventoryQuantity(transfer.remitente_id, transfer.accesorio_id, restoredQuantity);

    const { error: updateTransferError } = await supabase
      .from('accesorios_transferencias')
      .update({ estado: 'rechazado' })
      .eq('id', transferId);

    if (updateTransferError) {
      throw toHttpError(updateTransferError, 'No se pudo actualizar la transferencia de accesorio.');
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
