const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const { grantSeedsSchema, userIdParamSchema } = require('../validations/adminValidation');

const normalizeNumber = (value) => Number.parseFloat(Number(value) || 0);

const buildTopList = (entriesMap, usersById, limit = 5) =>
  Array.from(entriesMap.entries())
    .map(([userId, info]) => ({
      id: Number(userId),
      nombre_usuario: usersById.get(Number(userId))?.nombre_usuario || null,
      ...info,
    }))
    .filter((entry) => Boolean(entry.nombre_usuario))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

exports.getDashboard = async (req, res, next) => {
  try {
    const [
      { data: users, error: usersError },
      { data: gardens, error: gardensError },
      { data: plants, error: plantsError },
      { data: seedTransfers, error: seedTransfersError },
      { data: accessoryTransfers, error: accessoryTransfersError },
    ] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, nombre_usuario, semillas, rol, fecha_creacion'),
      supabase.from('jardines').select('id, usuario_id, estado_salud'),
      supabase
        .from('plantas')
        .select('id, jardin_id, nombre, categoria, tipo, fecha_plantado')
        .order('fecha_plantado', { ascending: false }),
      supabase
        .from('semillas_transferencias')
        .select(
          'id, remitente_id, destinatario_id, cantidad, estado, mensaje, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
        )
        .order('fecha_creacion', { ascending: false })
        .limit(50),
      supabase
        .from('accesorios_transferencias')
        .select('id, remitente_id, destinatario_id, accesorio_id, cantidad, estado, fecha_creacion')
        .order('fecha_creacion', { ascending: false })
        .limit(50),
    ]);

    if (usersError) {
      throw toHttpError(usersError, 'No se pudieron obtener los usuarios.');
    }

    if (gardensError) {
      throw toHttpError(gardensError, 'No se pudo obtener la información de los jardines.');
    }

    if (plantsError) {
      throw toHttpError(plantsError, 'No se pudo obtener la actividad de plantas.');
    }

    if (seedTransfersError) {
      throw toHttpError(seedTransfersError, 'No se pudieron obtener las transferencias de semillas.');
    }

    if (accessoryTransfersError) {
      throw toHttpError(accessoryTransfersError, 'No se pudieron obtener las transferencias de accesorios.');
    }

    const usersList = users || [];
    const usersById = new Map(usersList.map((user) => [user.id, user]));

    const totalUsuarios = usersList.length;
    const totalSemillas = usersList.reduce((acc, user) => acc + normalizeNumber(user.semillas), 0);

    const gardensList = gardens || [];
    const averageHealth = gardensList.length
      ? gardensList.reduce((acc, garden) => acc + normalizeNumber(garden.estado_salud), 0) / gardensList.length
      : 0;

    const gardenById = new Map(gardensList.map((garden) => [garden.id, garden]));

    const plantsList = plants || [];
    const totalEventos = plantsList.length;

    const eventosPorTipoMap = new Map();
    const eventosPorUsuarioMap = new Map();

    plantsList.forEach((plant) => {
      const tipo = plant.tipo || 'desconocido';
      eventosPorTipoMap.set(tipo, (eventosPorTipoMap.get(tipo) || 0) + 1);

      const garden = gardenById.get(plant.jardin_id);
      if (garden?.usuario_id) {
        const current = eventosPorUsuarioMap.get(garden.usuario_id) || { total: 0 };
        eventosPorUsuarioMap.set(garden.usuario_id, { total: current.total + 1 });
      }
    });

    const eventosPorTipo = Array.from(eventosPorTipoMap.entries())
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const usuariosEventosDestacados = buildTopList(eventosPorUsuarioMap, usersById, 5);

    const acceptedSeedTransfers = (seedTransfers || []).filter((transfer) => transfer.estado === 'aceptado');

    const totalSemillasTransferidas = acceptedSeedTransfers.reduce(
      (acc, transfer) => acc + normalizeNumber(transfer.cantidad),
      0
    );

    const transferSenders = new Map();
    const transferRecipients = new Map();
    const transferTotals = new Map();

    acceptedSeedTransfers.forEach((transfer) => {
      if (transfer.remitente_id) {
        const senderEntry = transferSenders.get(transfer.remitente_id) || { total: 0, operaciones: 0 };
        senderEntry.total += normalizeNumber(transfer.cantidad);
        senderEntry.operaciones += 1;
        transferSenders.set(transfer.remitente_id, senderEntry);

        const totalEntry = transferTotals.get(transfer.remitente_id) || { total: 0, operaciones: 0 };
        totalEntry.total += normalizeNumber(transfer.cantidad);
        totalEntry.operaciones += 1;
        transferTotals.set(transfer.remitente_id, totalEntry);
      }

      if (transfer.destinatario_id) {
        const recipientEntry = transferRecipients.get(transfer.destinatario_id) || { total: 0, operaciones: 0 };
        recipientEntry.total += normalizeNumber(transfer.cantidad);
        recipientEntry.operaciones += 1;
        transferRecipients.set(transfer.destinatario_id, recipientEntry);

        const totalEntry = transferTotals.get(transfer.destinatario_id) || { total: 0, operaciones: 0 };
        totalEntry.total += normalizeNumber(transfer.cantidad);
        totalEntry.operaciones += 1;
        transferTotals.set(transfer.destinatario_id, totalEntry);
      }
    });

    const topRemitentes = buildTopList(transferSenders, usersById, 5);
    const topDestinatarios = buildTopList(transferRecipients, usersById, 5);
    const topMovimientos = buildTopList(transferTotals, usersById, 5);

    const transferenciasRecientes = (seedTransfers || [])
      .slice(0, 6)
      .map((transfer) => ({
        id: transfer.id,
        cantidad: normalizeNumber(transfer.cantidad),
        estado: transfer.estado,
        mensaje: transfer.mensaje,
        fecha_creacion: transfer.fecha_creacion,
        remitente: transfer.remitente || null,
        destinatario: transfer.destinatario || null,
      }));

    const acceptedAccessoryTransfers = (accessoryTransfers || []).filter(
      (transfer) => transfer.estado === 'aceptado'
    );

    const totalAccesoriosTransferidos = acceptedAccessoryTransfers.reduce(
      (acc, transfer) => acc + normalizeNumber(transfer.cantidad),
      0
    );

    const accessoryTotals = new Map();
    acceptedAccessoryTransfers.forEach((transfer) => {
      if (transfer.destinatario_id) {
        const entry = accessoryTotals.get(transfer.destinatario_id) || { total: 0, operaciones: 0 };
        entry.total += normalizeNumber(transfer.cantidad);
        entry.operaciones += 1;
        accessoryTotals.set(transfer.destinatario_id, entry);
      }
    });

    const usuariosDestacadosAccesorios = buildTopList(accessoryTotals, usersById, 5);

    const eventosRecientes = plantsList
      .slice(0, 8)
      .map((plant) => {
        const garden = gardenById.get(plant.jardin_id);
        const owner = garden ? usersById.get(garden.usuario_id) : null;
        return {
          id: plant.id,
          nombre: plant.nombre,
          categoria: plant.categoria,
          tipo: plant.tipo,
          fecha_plantado: plant.fecha_plantado,
          usuario: owner
            ? { id: owner.id, nombre_usuario: owner.nombre_usuario }
            : null,
        };
      });

    return res.json({
      resumen: {
        totalUsuarios,
        totalSemillas,
        saludPromedioJardines: Number(averageHealth.toFixed(2)),
        totalEventos,
        totalSemillasTransferidas,
        totalAccesoriosTransferidos,
      },
      semillas: {
        topRemitentes,
        topDestinatarios,
        topMovimientos,
        transferenciasRecientes,
      },
      eventos: {
        porTipo: eventosPorTipo,
        usuariosDestacados: usuariosEventosDestacados,
        recientes: eventosRecientes,
        accesoriosDestacados: usuariosDestacadosAccesorios,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.listUsers = async (req, res, next) => {
  try {
    const [
      { data: users, error: usersError },
      { data: transfers, error: transfersError },
    ] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, nombre_usuario, email, semillas, medalla_compras, rol, fecha_creacion')
        .order('nombre_usuario', { ascending: true }),
      supabase
        .from('semillas_transferencias')
        .select('remitente_id, destinatario_id, cantidad, estado'),
    ]);

    if (usersError) {
      throw toHttpError(usersError, 'No se pudieron obtener los usuarios.');
    }

    if (transfersError) {
      throw toHttpError(transfersError, 'No se pudieron obtener las transferencias de semillas.');
    }

    const acceptedTransfers = (transfers || []).filter((transfer) => transfer.estado === 'aceptado');

    const sentMap = new Map();
    const receivedMap = new Map();

    acceptedTransfers.forEach((transfer) => {
      if (transfer.remitente_id) {
        const entry = sentMap.get(transfer.remitente_id) || { total: 0, operaciones: 0 };
        entry.total += normalizeNumber(transfer.cantidad);
        entry.operaciones += 1;
        sentMap.set(transfer.remitente_id, entry);
      }

      if (transfer.destinatario_id) {
        const entry = receivedMap.get(transfer.destinatario_id) || { total: 0, operaciones: 0 };
        entry.total += normalizeNumber(transfer.cantidad);
        entry.operaciones += 1;
        receivedMap.set(transfer.destinatario_id, entry);
      }
    });

    const response = (users || []).map((user) => {
      const sent = sentMap.get(user.id) || { total: 0, operaciones: 0 };
      const received = receivedMap.get(user.id) || { total: 0, operaciones: 0 };

      return {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        semillas: normalizeNumber(user.semillas),
        medalla_compras: normalizeNumber(user.medalla_compras),
        rol: user.rol || 'usuario',
        fecha_creacion: user.fecha_creacion,
        semillas_enviadas: sent.total,
        semillas_enviadas_operaciones: sent.operaciones,
        semillas_recibidas: received.total,
        semillas_recibidas_operaciones: received.operaciones,
      };
    });

    return res.json({ usuarios: response });
  } catch (err) {
    return next(err);
  }
};

exports.grantSeeds = async (req, res, next) => {
  try {
    const { value: params, error: paramsError } = userIdParamSchema.validate(req.params);
    if (paramsError) {
      paramsError.status = 400;
      throw paramsError;
    }

    const { value, error } = grantSeedsSchema.validate(req.body || {}, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const targetUserId = params.userId;

    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario, email, semillas, medalla_compras, rol')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError) {
      throw toHttpError(userError, 'No se pudo obtener el usuario solicitado.');
    }

    if (!user) {
      return res.status(404).json({ error: 'El usuario indicado no existe.' });
    }

    const transferMessage = value.mensaje ? value.mensaje : 'Regalo administrativo';

    const { data: transfer, error: transferError } = await supabase
      .from('semillas_transferencias')
      .insert({
        remitente_id: req.user.id,
        destinatario_id: targetUserId,
        cantidad: value.cantidad,
        mensaje: transferMessage,
        estado: 'pendiente',
      })
      .select(
        'id, cantidad, estado, mensaje, fecha_creacion, remitente:remitente_id ( id, nombre_usuario ), destinatario:destinatario_id ( id, nombre_usuario )'
      )
      .single();

    if (transferError) {
      throw toHttpError(transferError, 'No se pudo registrar la recarga de semillas.');
    }

    return res.status(201).json({
      usuario: user,
      transferencia: transfer,
    });
  } catch (err) {
    return next(err);
  }
};
