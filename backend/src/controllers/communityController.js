const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const {
  plantIdParamSchema,
  commentIdParamSchema,
  createCommentSchema,
} = require('../validations/communityValidation');

const buildFriendNetwork = async (currentUserId) => {
  const { data, error } = await supabase
    .from('amistades')
    .select('usuario_a, usuario_b, fecha_creacion')
    .or(`usuario_a.eq.${currentUserId},usuario_b.eq.${currentUserId}`);

  if (error) {
    throw toHttpError(error, 'No se pudieron obtener las amistades para el mural comunitario.');
  }

  const friendsMap = new Map();

  (data || []).forEach((friendship) => {
    if (!friendship) return;

    const { usuario_a: userA, usuario_b: userB, fecha_creacion: joinedAt } = friendship;

    if (userA === currentUserId && userB) {
      friendsMap.set(userB, joinedAt || null);
    } else if (userB === currentUserId && userA) {
      friendsMap.set(userA, joinedAt || null);
    }
  });

  const friendIds = Array.from(friendsMap.keys());
  return { friendIds, friendsMap };
};

const fetchPositiveEventTypes = async () => {
  const { data, error } = await supabase.from('event_types').select('code, plant_delta');

  if (error) {
    throw toHttpError(error, 'No se pudieron obtener los tipos de evento para el mural comunitario.');
  }

  const positiveCodes = (data || [])
    .filter((type) => typeof type?.plant_delta === 'number' && type.plant_delta > 0 && type?.code)
    .map((type) => type.code);

  return positiveCodes;
};

const fetchNetworkUsers = async (userIds) => {
  if (!userIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_usuario, foto_perfil, fecha_creacion')
    .in('id', userIds);

  if (error) {
    throw toHttpError(error, 'No se pudo obtener la información de la comunidad.');
  }

  return new Map((data || []).map((user) => [user.id, user]));
};

const RECENCY_WINDOW_DAYS = 45;

const filterByRecency = (items, property) => {
  if (!Array.isArray(items) || !property) {
    return [];
  }

  const now = Date.now();
  const windowMs = RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return items.filter((item) => {
    const value = item?.[property];
    if (!value) return false;
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return false;
    return now - timestamp <= windowMs;
  });
};

const ensureFriendship = async (currentUserId, targetUserId) => {
  if (!targetUserId) {
    const error = new Error('El evento solicitado no tiene un propietario asociado.');
    error.status = 404;
    throw error;
  }

  if (currentUserId === targetUserId) {
    return true;
  }

  const sortedIds = [currentUserId, targetUserId].sort();
  const { data: friendship, error: friendshipError } = await supabase
    .from('amistades')
    .select('id')
    .eq('usuario_a', sortedIds[0])
    .eq('usuario_b', sortedIds[1])
    .maybeSingle();

  if (friendshipError) {
    throw toHttpError(friendshipError, 'No se pudo verificar la amistad requerida.');
  }

  if (!friendship) {
    const error = new Error('Solo puedes interactuar con eventos de tus amigos.');
    error.status = 403;
    throw error;
  }

  return true;
};

const fetchPlantWithOwner = async (plantId) => {
  const { data: plant, error: plantError } = await supabase
    .from('plantas')
    .select('id, jardin_id, nombre, categoria, tipo, fecha_plantado, descripcion, jardines ( usuario_id )')
    .eq('id', plantId)
    .maybeSingle();

  if (plantError) {
    throw toHttpError(plantError, 'No se pudo obtener el evento seleccionado.');
  }

  if (!plant) {
    const error = new Error('El evento solicitado no existe.');
    error.status = 404;
    throw error;
  }

  const ownerRelationship = Array.isArray(plant.jardines)
    ? plant.jardines[0]
    : plant.jardines;
  const ownerId = ownerRelationship?.usuario_id || null;
  return { plant, ownerId };
};

const ensurePlantAccess = async (plantId, currentUserId) => {
  const { plant, ownerId } = await fetchPlantWithOwner(plantId);
  await ensureFriendship(currentUserId, ownerId);
  return { plant, ownerId };
};

exports.togglePlantLike = async (req, res, next) => {
  try {
    const { value, error } = plantIdParamSchema.validate(req.params, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const plantId = value.plantId;
    await ensurePlantAccess(plantId, req.user.id);

    const { data: existingLike, error: likeError } = await supabase
      .from('plantas_likes')
      .select('id')
      .eq('planta_id', plantId)
      .eq('usuario_id', req.user.id)
      .maybeSingle();

    if (likeError) {
      throw toHttpError(likeError, 'No se pudo verificar el estado del me gusta.');
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('plantas_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        throw toHttpError(deleteError, 'No se pudo retirar el me gusta del evento.');
      }
    } else {
      const { error: insertError } = await supabase
        .from('plantas_likes')
        .insert({ planta_id: plantId, usuario_id: req.user.id });

      if (insertError) {
        throw toHttpError(insertError, 'No se pudo registrar el me gusta del evento.');
      }
    }

    const { count, error: countError } = await supabase
      .from('plantas_likes')
      .select('*', { count: 'exact', head: true })
      .eq('planta_id', plantId);

    if (countError) {
      throw toHttpError(countError, 'No se pudo actualizar el contador de me gusta del evento.');
    }

    return res.json({ liked: !existingLike, total: count || 0, plantaId: plantId });
  } catch (err) {
    return next(err);
  }
};

exports.createPlantComment = async (req, res, next) => {
  try {
    const { value: params, error: paramsError } = plantIdParamSchema.validate(req.params, {
      abortEarly: false,
    });
    if (paramsError) {
      paramsError.status = 400;
      throw paramsError;
    }

    const { value: body, error: bodyError } = createCommentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (bodyError) {
      bodyError.status = 400;
      throw bodyError;
    }

    const plantId = params.plantId;
    await ensurePlantAccess(plantId, req.user.id);

    const { data: insertedComment, error: insertError } = await supabase
      .from('plantas_comentarios')
      .insert({
        planta_id: plantId,
        usuario_id: req.user.id,
        contenido: body.contenido,
      })
      .select('id, planta_id, usuario_id, contenido, fecha_creacion, usuarios ( nombre_usuario, foto_perfil )')
      .single();

    if (insertError) {
      throw toHttpError(insertError, 'No se pudo registrar el comentario para el evento.');
    }

    const comentario = {
      id: insertedComment.id,
      planta_id: insertedComment.planta_id,
      usuario_id: insertedComment.usuario_id,
      contenido: insertedComment.contenido,
      fecha_creacion: insertedComment.fecha_creacion,
      autor: insertedComment.usuarios?.nombre_usuario || null,
      autor_avatar: insertedComment.usuarios?.foto_perfil || null,
      likes: { total: 0, likedByMe: false },
    };

    return res.status(201).json({ comentario, plantaId: plantId });
  } catch (err) {
    return next(err);
  }
};

const fetchCommentWithPlant = async (commentId) => {
  const { data: comment, error: commentError } = await supabase
    .from('plantas_comentarios')
    .select('id, planta_id, usuario_id, contenido, fecha_creacion')
    .eq('id', commentId)
    .maybeSingle();

  if (commentError) {
    throw toHttpError(commentError, 'No se pudo obtener el comentario solicitado.');
  }

  if (!comment) {
    const error = new Error('El comentario solicitado no existe.');
    error.status = 404;
    throw error;
  }

  return comment;
};

exports.toggleCommentLike = async (req, res, next) => {
  try {
    const { value, error } = commentIdParamSchema.validate(req.params, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const commentId = value.commentId;
    const comment = await fetchCommentWithPlant(commentId);
    await ensurePlantAccess(comment.planta_id, req.user.id);

    const { data: existingLike, error: likeError } = await supabase
      .from('comentarios_likes')
      .select('id')
      .eq('comentario_id', commentId)
      .eq('usuario_id', req.user.id)
      .maybeSingle();

    if (likeError) {
      throw toHttpError(likeError, 'No se pudo verificar el estado del me gusta en el comentario.');
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('comentarios_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        throw toHttpError(deleteError, 'No se pudo retirar el me gusta del comentario.');
      }
    } else {
      const { error: insertError } = await supabase
        .from('comentarios_likes')
        .insert({ comentario_id: commentId, usuario_id: req.user.id });

      if (insertError) {
        throw toHttpError(insertError, 'No se pudo registrar el me gusta del comentario.');
      }
    }

    const { count, error: countError } = await supabase
      .from('comentarios_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comentario_id', commentId);

    if (countError) {
      throw toHttpError(countError, 'No se pudo actualizar el contador de me gusta del comentario.');
    }

    return res.json({ liked: !existingLike, total: count || 0, comentarioId: commentId, plantaId: comment.planta_id });
  } catch (err) {
    return next(err);
  }
};

exports.getCommunityHighlights = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const [{ friendIds, friendsMap }, positiveEventTypes] = await Promise.all([
      buildFriendNetwork(currentUserId),
      fetchPositiveEventTypes(),
    ]);

    const networkIds = Array.from(new Set([currentUserId, ...friendIds]));

    if (!positiveEventTypes.length || !networkIds.length) {
      return res.json({
        highlights: [],
        stats: {
          totalAmigos: friendIds.length,
          totalMomentos: 0,
          categoriasDestacadas: [],
        },
        generatedAt: new Date().toISOString(),
        criteria: {
          positiveEventTypes,
          windowDays: RECENCY_WINDOW_DAYS,
        },
      });
    }

    const [usersMap, gardensResult] = await Promise.all([
      fetchNetworkUsers(networkIds),
      supabase
        .from('jardines')
        .select('id, usuario_id, estado_salud, ultima_modificacion')
        .in('usuario_id', networkIds),
    ]);

    if (gardensResult.error) {
      throw toHttpError(gardensResult.error, 'No se pudieron obtener los jardines para el mural comunitario.');
    }

    const gardens = gardensResult.data || [];
    const gardenMap = new Map();
    const gardenIds = [];

    gardens.forEach((garden) => {
      if (!garden?.id) return;
      gardenMap.set(garden.id, garden);
      gardenIds.push(garden.id);
    });

    if (!gardenIds.length) {
      return res.json({
        highlights: [],
        stats: {
          totalAmigos: friendIds.length,
          totalMomentos: 0,
          categoriasDestacadas: [],
        },
        generatedAt: new Date().toISOString(),
        criteria: {
          positiveEventTypes,
          windowDays: RECENCY_WINDOW_DAYS,
        },
      });
    }

    const plantsResult = await supabase
      .from('plantas')
      .select('id, jardin_id, nombre, categoria, tipo, fecha_plantado, descripcion, foto')
      .in('jardin_id', gardenIds)
      .in('tipo', positiveEventTypes)
      .order('fecha_plantado', { ascending: false })
      .limit(60);

    if (plantsResult.error) {
      throw toHttpError(plantsResult.error, 'No se pudieron obtener los eventos positivos para el mural comunitario.');
    }

    const recentPositivePlants = filterByRecency(plantsResult.data || [], 'fecha_plantado');

    if (!recentPositivePlants.length) {
      return res.json({
        highlights: [],
        stats: {
          totalAmigos: friendIds.length,
          totalMomentos: 0,
          categoriasDestacadas: [],
        },
        generatedAt: new Date().toISOString(),
        criteria: {
          positiveEventTypes,
          windowDays: RECENCY_WINDOW_DAYS,
        },
      });
    }

    const plantIds = recentPositivePlants.map((plant) => plant.id);

    const [likesResult, commentsResult] = await Promise.all([
      supabase.from('plantas_likes').select('planta_id, usuario_id').in('planta_id', plantIds),
      supabase
        .from('plantas_comentarios')
        .select('id, planta_id, usuario_id, contenido, fecha_creacion, usuarios ( nombre_usuario, foto_perfil )')
        .in('planta_id', plantIds)
        .order('fecha_creacion', { ascending: false }),
    ]);

    if (likesResult.error) {
      throw toHttpError(likesResult.error, 'No se pudieron obtener los aplausos para el mural comunitario.');
    }

    if (commentsResult.error) {
      throw toHttpError(commentsResult.error, 'No se pudieron obtener los comentarios para el mural comunitario.');
    }

    const likesByPlant = new Map();
    (likesResult.data || []).forEach((like) => {
      if (!like?.planta_id) return;
      const entry = likesByPlant.get(like.planta_id) || { total: 0, likedByMe: false };
      entry.total += 1;
      if (like.usuario_id === currentUserId) {
        entry.likedByMe = true;
      }
      likesByPlant.set(like.planta_id, entry);
    });

    const commentsByPlant = new Map();
    const latestCommentByPlant = new Map();

    (commentsResult.data || []).forEach((comment) => {
      if (!comment?.planta_id) return;
      const count = commentsByPlant.get(comment.planta_id) || 0;
      commentsByPlant.set(comment.planta_id, count + 1);
      if (!latestCommentByPlant.has(comment.planta_id)) {
        const author = comment.usuarios || null;
        latestCommentByPlant.set(comment.planta_id, {
          id: comment.id,
          contenido: comment.contenido,
          fecha_creacion: comment.fecha_creacion,
          autor: author
            ? {
                id: comment.usuario_id,
                nombre_usuario: author.nombre_usuario || null,
                foto_perfil: author.foto_perfil || null,
              }
            : {
                id: comment.usuario_id,
                nombre_usuario: null,
                foto_perfil: null,
              },
        });
      }
    });

    const categoriesCount = new Map();

    const highlights = recentPositivePlants
      .map((plant) => {
        if (!plant?.id) return null;

        const garden = gardenMap.get(plant.jardin_id) || null;
        if (!garden?.usuario_id) return null;

        const author = usersMap.get(garden.usuario_id) || null;
        if (!author) return null;

        const likesInfo = likesByPlant.get(plant.id) || { total: 0, likedByMe: false };
        const commentCount = commentsByPlant.get(plant.id) || 0;
        const featuredComment = latestCommentByPlant.get(plant.id) || null;

        const healthScore = typeof garden.estado_salud === 'number' ? garden.estado_salud : 0;
        const photoBonus = plant.foto ? 2 : 0;
        const energyScore = likesInfo.total * 2 + commentCount + Math.round(healthScore / 20) + photoBonus;

        const friendshipSince = friendsMap.get(author.id) || null;

        if (plant.categoria) {
          const current = categoriesCount.get(plant.categoria) || 0;
          categoriesCount.set(plant.categoria, current + 1);
        }

        return {
          id: plant.id,
          nombre: plant.nombre,
          descripcion: plant.descripcion,
          categoria: plant.categoria,
          tipo: plant.tipo,
          fecha_plantado: plant.fecha_plantado,
          foto: plant.foto,
          likes: likesInfo,
          comentarios_total: commentCount,
          comentario_destacado: featuredComment,
          energia: energyScore,
          autor: {
            id: author.id,
            nombre_usuario: author.nombre_usuario,
            foto_perfil: author.foto_perfil || null,
          },
          amistad: friendshipSince
            ? {
                fecha_union: friendshipSince,
              }
            : null,
          jardin: {
            id: garden.id,
            estado_salud: garden.estado_salud,
            ultima_modificacion: garden.ultima_modificacion,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.energia !== a.energia) {
          return b.energia - a.energia;
        }
        return new Date(b.fecha_plantado).getTime() - new Date(a.fecha_plantado).getTime();
      })
      .slice(0, 6);

    const categoriasDestacadas = Array.from(categoriesCount.entries())
      .map(([categoria, count]) => ({ categoria, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.json({
      highlights,
      stats: {
        totalAmigos: friendIds.length,
        totalMomentos: recentPositivePlants.length,
        categoriasDestacadas,
      },
      generatedAt: new Date().toISOString(),
      criteria: {
        positiveEventTypes,
        windowDays: RECENCY_WINDOW_DAYS,
      },
    });
  } catch (err) {
    return next(err);
  }
};
