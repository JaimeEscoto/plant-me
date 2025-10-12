const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const { grantSeedsSchema, userIdParamSchema } = require('../validations/adminValidation');
const {
  SUPPORTED_LANGUAGES,
  createEventTypeSchema,
  updateEventTypeSchema,
  eventTypeIdParamSchema,
} = require('../validations/eventTypeValidation');
const {
  SUPPORTED_LANGUAGES: CATEGORY_LANGUAGES,
  createEventCategorySchema,
  updateEventCategorySchema,
  eventCategoryIdParamSchema,
} = require('../validations/eventCategoryValidation');

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

const mapEventTypeRow = (row) => {
  const translations = Array.isArray(row?.event_type_translations) ? row.event_type_translations : [];
  const labels = translations.reduce((acc, translation) => {
    if (translation?.language) {
      acc[translation.language] = translation.label || '';
    }
    return acc;
  }, {});

  SUPPORTED_LANGUAGES.forEach((language) => {
    if (!Object.prototype.hasOwnProperty.call(labels, language)) {
      labels[language] = '';
    }
  });

  return {
    id: row.id,
    code: row.code,
    plantDelta: row.plant_delta,
    removeDelta: row.remove_delta,
    position: row.position,
    labels,
  };
};

const fetchEventTypeRowById = async (eventTypeId) => {
  const { data, error } = await supabase
    .from('event_types')
    .select('id, code, plant_delta, remove_delta, position, event_type_translations(language, label)')
    .eq('id', eventTypeId)
    .maybeSingle();

  if (error) {
    throw toHttpError(error, 'No se pudo obtener la información del tipo de evento.');
  }

  return data;
};

const mapEventCategoryRow = (row) => {
  const translations = Array.isArray(row?.event_category_translations)
    ? row.event_category_translations
    : [];
  const labels = translations.reduce((acc, translation) => {
    if (translation?.language) {
      acc[translation.language] = translation.label || '';
    }
    return acc;
  }, {});

  CATEGORY_LANGUAGES.forEach((language) => {
    if (!Object.prototype.hasOwnProperty.call(labels, language)) {
      labels[language] = '';
    }
  });

  return {
    id: row.id,
    code: row.code,
    position: row.position,
    labels,
  };
};

const fetchEventCategoryRowById = async (eventCategoryId) => {
  const { data, error } = await supabase
    .from('event_categories')
    .select('id, code, position, event_category_translations(language, label)')
    .eq('id', eventCategoryId)
    .maybeSingle();

  if (error) {
    throw toHttpError(error, 'No se pudo obtener la información de la categoría de evento.');
  }

  return data;
};

exports.getDashboard = async (req, res, next) => {
  try {
    const [
      { data: users, error: usersError },
      { data: gardens, error: gardensError },
      { data: plants, error: plantsError },
      { data: seedTransfers, error: seedTransfersError },
      { data: accessoryTransfers, error: accessoryTransfersError },
      { data: userAccessories, error: userAccessoriesError },
      { data: friendships, error: friendshipsError },
      { data: plantComments, error: plantCommentsError },
      { data: commentLikes, error: commentLikesError },
      { data: plantLikes, error: plantLikesError },
    ] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, nombre_usuario, semillas, rol, fecha_creacion'),
      supabase.from('jardines').select('id, usuario_id, estado_salud, ultima_modificacion'),
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
      supabase
        .from('usuario_accesorios')
        .select('usuario_id, cantidad'),
      supabase.from('amistades').select('usuario_a, usuario_b'),
      supabase
        .from('plantas_comentarios')
        .select('usuario_id, fecha_creacion'),
      supabase
        .from('comentarios_likes')
        .select('usuario_id, fecha_creacion'),
      supabase
        .from('plantas_likes')
        .select('usuario_id, fecha_creacion'),
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

    if (userAccessoriesError) {
      throw toHttpError(userAccessoriesError, 'No se pudo obtener la información de accesorios por usuario.');
    }

    if (friendshipsError) {
      throw toHttpError(friendshipsError, 'No se pudo obtener la información de amistades.');
    }

    if (plantCommentsError) {
      throw toHttpError(plantCommentsError, 'No se pudieron obtener los comentarios de plantas.');
    }

    if (commentLikesError) {
      throw toHttpError(commentLikesError, 'No se pudieron obtener los likes de comentarios.');
    }

    if (plantLikesError) {
      throw toHttpError(plantLikesError, 'No se pudieron obtener los likes de plantas.');
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
    const eventosPorCategoriaMap = new Map();
    const firstPlantByUser = new Map();

    plantsList.forEach((plant) => {
      const tipo = plant.tipo || 'desconocido';
      eventosPorTipoMap.set(tipo, (eventosPorTipoMap.get(tipo) || 0) + 1);

      const garden = gardenById.get(plant.jardin_id);
      if (garden?.usuario_id) {
        const current = eventosPorUsuarioMap.get(garden.usuario_id) || { total: 0 };
        eventosPorUsuarioMap.set(garden.usuario_id, { total: current.total + 1 });

        const existingDate = firstPlantByUser.get(garden.usuario_id);
        const plantDate = plant.fecha_plantado ? new Date(plant.fecha_plantado) : null;
        if (plantDate && !Number.isNaN(plantDate.getTime())) {
          if (!existingDate || plantDate < existingDate) {
            firstPlantByUser.set(garden.usuario_id, plantDate);
          }
        }
      }

      const categoria = plant.categoria || 'sin_categoria';
      eventosPorCategoriaMap.set(categoria, (eventosPorCategoriaMap.get(categoria) || 0) + 1);
    });

    const eventosPorTipo = Array.from(eventosPorTipoMap.entries())
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const usuariosEventosDestacados = buildTopList(eventosPorUsuarioMap, usersById, 5);
    const usuariosEventosTabla = buildTopList(eventosPorUsuarioMap, usersById, 20);

    const eventosPorCategoria = Array.from(eventosPorCategoriaMap.entries())
      .map(([categoria, cantidad]) => ({ categoria, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

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

    const accessoriesWithQuantity = new Set(
      (userAccessories || [])
        .filter((row) => normalizeNumber(row.cantidad) > 0 && row.usuario_id)
        .map((row) => row.usuario_id)
    );

    const transferSendersSet = new Set(acceptedSeedTransfers.map((transfer) => transfer.remitente_id));
    const transferRecipientsSet = new Set(acceptedSeedTransfers.map((transfer) => transfer.destinatario_id));

    const scatterNow = Date.now();
    const msInDay = 1000 * 60 * 60 * 24;
    const semillasDistribucion = usersList.map((user) => {
      const creationDate = user.fecha_creacion ? new Date(user.fecha_creacion) : null;
      const ageDays = creationDate && !Number.isNaN(creationDate.getTime())
        ? (scatterNow - creationDate.getTime()) / msInDay
        : 0;

      return {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        rol: user.rol || 'usuario',
        semillas: normalizeNumber(user.semillas),
        fecha_creacion: user.fecha_creacion,
        antiguedad_dias: Number.parseFloat(ageDays.toFixed(2)),
      };
    });

    const communityActivityMap = new Map();
    const ensureActivityEntry = (userId) => {
      if (!userId) return null;
      if (!communityActivityMap.has(userId)) {
        communityActivityMap.set(userId, {
          comentarios: 0,
          likesComentarios: 0,
          likesPlantas: 0,
          ultimaActividad: null,
        });
      }
      return communityActivityMap.get(userId);
    };

    (plantComments || []).forEach((comment) => {
      const entry = ensureActivityEntry(comment.usuario_id);
      if (!entry) return;
      entry.comentarios += 1;
      const commentDate = comment.fecha_creacion ? new Date(comment.fecha_creacion) : null;
      if (commentDate && !Number.isNaN(commentDate.getTime())) {
        if (!entry.ultimaActividad || commentDate > entry.ultimaActividad) {
          entry.ultimaActividad = commentDate;
        }
      }
    });

    (commentLikes || []).forEach((like) => {
      const entry = ensureActivityEntry(like.usuario_id);
      if (!entry) return;
      entry.likesComentarios += 1;
      const likeDate = like.fecha_creacion ? new Date(like.fecha_creacion) : null;
      if (likeDate && !Number.isNaN(likeDate.getTime())) {
        if (!entry.ultimaActividad || likeDate > entry.ultimaActividad) {
          entry.ultimaActividad = likeDate;
        }
      }
    });

    (plantLikes || []).forEach((like) => {
      const entry = ensureActivityEntry(like.usuario_id);
      if (!entry) return;
      entry.likesPlantas += 1;
      const likeDate = like.fecha_creacion ? new Date(like.fecha_creacion) : null;
      if (likeDate && !Number.isNaN(likeDate.getTime())) {
        if (!entry.ultimaActividad || likeDate > entry.ultimaActividad) {
          entry.ultimaActividad = likeDate;
        }
      }
    });

    const actividadComunidad = Array.from(communityActivityMap.entries())
      .map(([userId, info]) => {
        const user = usersById.get(userId);
        if (!user) {
          return null;
        }

        const totalInteracciones = info.comentarios + info.likesComentarios + info.likesPlantas;
        const rolTransferencia = transferSendersSet.has(userId) && transferRecipientsSet.has(userId)
          ? 'mixto'
          : transferSendersSet.has(userId)
            ? 'remitente'
            : transferRecipientsSet.has(userId)
              ? 'destinatario'
              : 'sin_movimientos';

        return {
          id: userId,
          nombre_usuario: user.nombre_usuario,
          rol: user.rol || 'usuario',
          comentarios: info.comentarios,
          likes: info.likesComentarios + info.likesPlantas,
          totalInteracciones,
          rol_transferencias: rolTransferencia,
          ultimaActividad: info.ultimaActividad ? info.ultimaActividad.toISOString() : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.totalInteracciones - a.totalInteracciones)
      .slice(0, 30);

    const friendCountMap = new Map();
    (friendships || []).forEach((friendship) => {
      if (!friendship?.usuario_a || !friendship?.usuario_b) return;

      const currentA = friendCountMap.get(friendship.usuario_a) || { total: 0 };
      currentA.total += 1;
      friendCountMap.set(friendship.usuario_a, currentA);

      const currentB = friendCountMap.get(friendship.usuario_b) || { total: 0 };
      currentB.total += 1;
      friendCountMap.set(friendship.usuario_b, currentB);
    });

    const usuariosMasAmigos = buildTopList(friendCountMap, usersById, 10);

    const healthTimelineMap = new Map();
    gardensList.forEach((garden) => {
      const referenceDate = garden.ultima_modificacion ? new Date(garden.ultima_modificacion) : null;
      if (!referenceDate || Number.isNaN(referenceDate.getTime())) {
        return;
      }

      const key = referenceDate.toISOString().slice(0, 10);
      const entry = healthTimelineMap.get(key) || { total: 0, count: 0, date: referenceDate };
      entry.total += normalizeNumber(garden.estado_salud);
      entry.count += 1;
      if (!entry.date || referenceDate > entry.date) {
        entry.date = referenceDate;
      }
      healthTimelineMap.set(key, entry);
    });

    const saludPromedioTemporal = Array.from(healthTimelineMap.entries())
      .map(([key, info]) => ({
        fecha: key,
        promedio: Number.parseFloat((info.total / (info.count || 1)).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    const funnelEmbudo = [
      { etapa: 'registrados', total: totalUsuarios },
      { etapa: 'con_jardin', total: gardensList.length },
      { etapa: 'con_planta', total: firstPlantByUser.size },
    ];

    const promedioDiasPrimeraPlanta = firstPlantByUser.size
      ? Number.parseFloat(
          (
            Array.from(firstPlantByUser.entries()).reduce((acc, [userId, firstPlantDate]) => {
              const user = usersById.get(userId);
              if (!user?.fecha_creacion) {
                return acc;
              }
              const createdAt = new Date(user.fecha_creacion);
              if (Number.isNaN(createdAt.getTime())) {
                return acc;
              }

              const diffDays = Math.max(0, (firstPlantDate.getTime() - createdAt.getTime()) / msInDay);
              return acc + diffDays;
            }, 0) / firstPlantByUser.size
          ).toFixed(2)
        )
      : null;

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
        porCategoria: eventosPorCategoria,
        usuariosDestacados: usuariosEventosDestacados,
        usuariosDestacadosTabla: usuariosEventosTabla,
        recientes: eventosRecientes,
        accesoriosDestacados: usuariosDestacadosAccesorios,
      },
      salud: {
        promedioTemporal: saludPromedioTemporal,
      },
      usuarios: {
        distribucionSemillas: semillasDistribucion,
        actividadComunidad: actividadComunidad,
        accesorios: {
          totalUsuarios,
          totalUsuariosConAccesorios: accessoriesWithQuantity.size,
          porcentajeUsuariosConAccesorios: totalUsuarios
            ? Number.parseFloat(((accessoriesWithQuantity.size / totalUsuarios) * 100).toFixed(2))
            : 0,
        },
        topAmigos: usuariosMasAmigos,
        embudo: funnelEmbudo,
        promedioDiasPrimeraPlanta,
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

exports.listEventCategories = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('event_categories')
      .select('id, code, position, event_category_translations(language, label)')
      .order('position', { ascending: true })
      .order('code', { ascending: true });

    if (error) {
      throw toHttpError(error, 'No se pudieron obtener las categorías de evento.');
    }

    const eventCategories = (data || []).map(mapEventCategoryRow);

    return res.json({ eventCategories });
  } catch (err) {
    return next(err);
  }
};

exports.createEventCategory = async (req, res, next) => {
  try {
    const { value, error } = createEventCategorySchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const insertPayload = {
      code: value.code,
      position: value.position ?? 0,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('event_categories')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Ya existe una categoría con ese código.' });
      }
      throw toHttpError(insertError, 'No se pudo crear la categoría de evento.');
    }

    const translationsPayload = CATEGORY_LANGUAGES.map((language) => ({
      event_category_id: inserted.id,
      language,
      label: value.labels[language],
    }));

    if (translationsPayload.length > 0) {
      const { error: translationError } = await supabase
        .from('event_category_translations')
        .upsert(translationsPayload, { onConflict: 'event_category_id,language' });

      if (translationError) {
        throw toHttpError(translationError, 'No se pudieron guardar las traducciones de la categoría.');
      }
    }

    const eventCategoryRow = await fetchEventCategoryRowById(inserted.id);
    if (!eventCategoryRow) {
      return res.status(500).json({ error: 'No se pudo recuperar la categoría recién creada.' });
    }

    const eventCategory = mapEventCategoryRow(eventCategoryRow);

    return res.status(201).json({ eventCategory });
  } catch (err) {
    return next(err);
  }
};

exports.updateEventCategory = async (req, res, next) => {
  try {
    const { value: params, error: paramsError } = eventCategoryIdParamSchema.validate(req.params, {
      abortEarly: false,
    });
    if (paramsError) {
      paramsError.status = 400;
      throw paramsError;
    }

    const { value, error } = updateEventCategorySchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('event_categories')
      .select('id, code')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      throw toHttpError(fetchError, 'No se pudo obtener la categoría de evento.');
    }

    if (!existing) {
      return res.status(404).json({ error: 'Categoría de evento no encontrada.' });
    }

    if (value.code && value.code !== existing.code) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from('event_categories')
        .select('id')
        .eq('code', value.code)
        .neq('id', params.id)
        .maybeSingle();

      if (duplicateError) {
        throw toHttpError(duplicateError, 'No se pudo validar el código de la categoría.');
      }

      if (duplicate) {
        return res.status(409).json({ error: 'Ya existe una categoría con ese código.' });
      }
    }

    const updatePayload = {};
    if (value.code) updatePayload.code = value.code;
    if (typeof value.position === 'number') updatePayload.position = value.position;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('event_categories')
        .update(updatePayload)
        .eq('id', params.id);

      if (updateError) {
        throw toHttpError(updateError, 'No se pudo actualizar la categoría de evento.');
      }
    }

    if (value.labels) {
      const normalizedLabels = Object.keys(value.labels).reduce((acc, key) => {
        acc[key.toLowerCase()] = value.labels[key];
        return acc;
      }, {});

      const translationsPayload = Object.entries(normalizedLabels).map(([language, label]) => ({
        event_category_id: params.id,
        language,
        label,
      }));

      if (translationsPayload.length > 0) {
        const { error: translationError } = await supabase
          .from('event_category_translations')
          .upsert(translationsPayload, { onConflict: 'event_category_id,language' });

        if (translationError) {
          throw toHttpError(translationError, 'No se pudieron actualizar las traducciones de la categoría.');
        }
      }
    }

    const eventCategoryRow = await fetchEventCategoryRowById(params.id);
    if (!eventCategoryRow) {
      return res.status(404).json({ error: 'Categoría de evento no encontrada.' });
    }

    const eventCategory = mapEventCategoryRow(eventCategoryRow);

    return res.json({ eventCategory });
  } catch (err) {
    return next(err);
  }
};

exports.deleteEventCategory = async (req, res, next) => {
  try {
    const { value: params, error: paramsError } = eventCategoryIdParamSchema.validate(req.params, {
      abortEarly: false,
    });
    if (paramsError) {
      paramsError.status = 400;
      throw paramsError;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('event_categories')
      .select('id, code')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      throw toHttpError(fetchError, 'No se pudo obtener la categoría de evento.');
    }

    if (!existing) {
      return res.status(404).json({ error: 'Categoría de evento no encontrada.' });
    }

    const { count, error: usageError } = await supabase
      .from('plantas')
      .select('id', { count: 'exact', head: true })
      .eq('categoria', existing.code);

    if (usageError) {
      throw toHttpError(usageError, 'No se pudo comprobar el uso de la categoría.');
    }

    if ((count || 0) > 0) {
      return res
        .status(400)
        .json({ error: 'No se puede eliminar la categoría porque está en uso.' });
    }

    const { error: deleteError } = await supabase.from('event_categories').delete().eq('id', params.id);

    if (deleteError) {
      throw toHttpError(deleteError, 'No se pudo eliminar la categoría de evento.');
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

exports.listEventTypes = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('event_types')
      .select('id, code, plant_delta, remove_delta, position, event_type_translations(language, label)')
      .order('position', { ascending: true })
      .order('code', { ascending: true });

    if (error) {
      throw toHttpError(error, 'No se pudieron obtener los tipos de evento.');
    }

    const eventTypes = (data || []).map(mapEventTypeRow);

    return res.json({ eventTypes });
  } catch (err) {
    return next(err);
  }
};

exports.createEventType = async (req, res, next) => {
  try {
    const { value, error } = createEventTypeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const insertPayload = {
      code: value.code,
      plant_delta: value.plantDelta,
      remove_delta: value.removeDelta,
      position: value.position ?? 0,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('event_types')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Ya existe un tipo de evento con ese código.' });
      }
      throw toHttpError(insertError, 'No se pudo crear el tipo de evento.');
    }

    const translationsPayload = SUPPORTED_LANGUAGES.map((language) => ({
      event_type_id: inserted.id,
      language,
      label: value.labels[language],
    }));

    if (translationsPayload.length > 0) {
      const { error: translationError } = await supabase
        .from('event_type_translations')
        .upsert(translationsPayload, { onConflict: 'event_type_id,language' });

      if (translationError) {
        throw toHttpError(translationError, 'No se pudieron guardar las traducciones del tipo de evento.');
      }
    }

    const eventTypeRow = await fetchEventTypeRowById(inserted.id);
    if (!eventTypeRow) {
      return res.status(500).json({ error: 'No se pudo recuperar el tipo de evento recién creado.' });
    }

    const eventType = mapEventTypeRow(eventTypeRow);

    return res.status(201).json({ eventType });
  } catch (err) {
    return next(err);
  }
};

exports.updateEventType = async (req, res, next) => {
  try {
    const { value: params, error: paramsError } = eventTypeIdParamSchema.validate(req.params, { abortEarly: false });
    if (paramsError) {
      paramsError.status = 400;
      throw paramsError;
    }

    const { value, error } = updateEventTypeSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('event_types')
      .select('id, code')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      throw toHttpError(fetchError, 'No se pudo obtener el tipo de evento.');
    }

    if (!existing) {
      return res.status(404).json({ error: 'Tipo de evento no encontrado.' });
    }

    if (value.code && value.code !== existing.code) {
      const { data: duplicate, error: duplicateError } = await supabase
        .from('event_types')
        .select('id')
        .eq('code', value.code)
        .neq('id', params.id)
        .maybeSingle();

      if (duplicateError) {
        throw toHttpError(duplicateError, 'No se pudo validar el código del tipo de evento.');
      }

      if (duplicate) {
        return res.status(409).json({ error: 'Ya existe un tipo de evento con ese código.' });
      }
    }

    const updatePayload = {};
    if (value.code) updatePayload.code = value.code;
    if (typeof value.plantDelta === 'number') updatePayload.plant_delta = value.plantDelta;
    if (typeof value.removeDelta === 'number') updatePayload.remove_delta = value.removeDelta;
    if (typeof value.position === 'number') updatePayload.position = value.position;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('event_types')
        .update(updatePayload)
        .eq('id', params.id);

      if (updateError) {
        throw toHttpError(updateError, 'No se pudo actualizar el tipo de evento.');
      }
    }

    if (value.labels) {
      const normalizedLabels = Object.keys(value.labels).reduce((acc, key) => {
        acc[key.toLowerCase()] = value.labels[key];
        return acc;
      }, {});

      const translationsPayload = Object.entries(normalizedLabels).map(([language, label]) => ({
        event_type_id: params.id,
        language,
        label,
      }));

      if (translationsPayload.length > 0) {
        const { error: translationError } = await supabase
          .from('event_type_translations')
          .upsert(translationsPayload, { onConflict: 'event_type_id,language' });

        if (translationError) {
          throw toHttpError(translationError, 'No se pudieron actualizar las traducciones del tipo de evento.');
        }
      }
    }

    const eventTypeRow = await fetchEventTypeRowById(params.id);
    if (!eventTypeRow) {
      return res.status(404).json({ error: 'Tipo de evento no encontrado.' });
    }

    const eventType = mapEventTypeRow(eventTypeRow);

    return res.json({ eventType });
  } catch (err) {
    return next(err);
  }
};

exports.deleteEventType = async (req, res, next) => {
  try {
    const { value: params, error: paramsError } = eventTypeIdParamSchema.validate(req.params, { abortEarly: false });
    if (paramsError) {
      paramsError.status = 400;
      throw paramsError;
    }

    const { data: existing, error: fetchError } = await supabase
      .from('event_types')
      .select('id, code')
      .eq('id', params.id)
      .maybeSingle();

    if (fetchError) {
      throw toHttpError(fetchError, 'No se pudo obtener el tipo de evento.');
    }

    if (!existing) {
      return res.status(404).json({ error: 'Tipo de evento no encontrado.' });
    }

    const { count, error: usageError } = await supabase
      .from('plantas')
      .select('id', { count: 'exact', head: true })
      .eq('tipo', existing.code);

    if (usageError) {
      throw toHttpError(usageError, 'No se pudo comprobar el uso del tipo de evento.');
    }

    if ((count || 0) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar el tipo de evento porque está en uso.' });
    }

    const { error: deleteError } = await supabase.from('event_types').delete().eq('id', params.id);

    if (deleteError) {
      throw toHttpError(deleteError, 'No se pudo eliminar el tipo de evento.');
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
