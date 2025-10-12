const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const { searchUsersSchema, userIdParamSchema } = require('../validations/userValidation');

const buildFriendEntries = (pairs, currentUserId) => {
  if (!Array.isArray(pairs)) return [];
  const entries = new Map();
  pairs.forEach((pair) => {
    let friendId = null;
    if (pair.usuario_a === currentUserId && pair.usuario_b) {
      friendId = pair.usuario_b;
    } else if (pair.usuario_b === currentUserId && pair.usuario_a) {
      friendId = pair.usuario_a;
    }

    if (friendId && !entries.has(friendId)) {
      entries.set(friendId, { id: friendId, fechaAmistad: pair.fecha_creacion });
    }
  });
  return Array.from(entries.values());
};

const fetchFriendPairs = async (userId) => {
  const { data, error } = await supabase
    .from('amistades')
    .select('usuario_a, usuario_b, fecha_creacion')
    .or(`usuario_a.eq.${userId},usuario_b.eq.${userId}`);

  if (error) {
    throw toHttpError(error, 'No se pudieron obtener las amistades.');
  }

  return data || [];
};

const fetchFriendsSummaries = async (friendEntries) => {
  if (!friendEntries.length) {
    return [];
  }

  const friendIds = friendEntries.map((entry) => entry.id);
  const [{ data: users, error: usersError }, { data: gardens, error: gardensError }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre_usuario, fecha_creacion, medalla_compras, semillas')
      .in('id', friendIds),
    supabase
      .from('jardines')
      .select(
        'id, usuario_id, estado_salud, ultima_modificacion, plantas (id, nombre, tipo, fecha_plantado, descripcion, foto)'
      )
      .in('usuario_id', friendIds)
      .order('fecha_plantado', { referencedTable: 'plantas', ascending: false })
      .limit(3, { foreignTable: 'plantas' }),
  ]);

  if (usersError) {
    throw toHttpError(usersError, 'No se pudo obtener la información de los usuarios.');
  }

  if (gardensError) {
    throw toHttpError(gardensError, 'No se pudieron obtener los jardines de los amigos.');
  }

  const usersById = new Map((users || []).map((user) => [user.id, user]));
  const gardensByUserId = new Map((gardens || []).map((garden) => [garden.usuario_id, garden]));

  return friendEntries
    .map((entry) => {
      const friendId = entry.id;
      const user = usersById.get(friendId);
      if (!user) return null;
      const garden = gardensByUserId.get(friendId);
      return {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        fecha_union: entry.fechaAmistad || null,
        medalla_compras: user.medalla_compras || 0,
        semillas: user.semillas || 0,
        jardin: garden
          ? {
              id: garden.id,
              estado_salud: garden.estado_salud,
              ultima_modificacion: garden.ultima_modificacion,
              plantas_recientes: Array.isArray(garden.plantas) ? garden.plantas : [],
            }
          : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nombre_usuario.localeCompare(b.nombre_usuario, 'es'));
};

const fetchUserProfile = async (userId, currentUserId) => {
  const [{ data: user, error: userError }, { data: garden, error: gardenError }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre_usuario, fecha_creacion, medalla_compras, semillas')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('jardines')
      .select(
        'id, usuario_id, estado_salud, ultima_modificacion, plantas (id, nombre, categoria, tipo, fecha_plantado, descripcion, foto)'
      )
      .eq('usuario_id', userId)
      .order('fecha_plantado', { referencedTable: 'plantas', ascending: false })
      .maybeSingle(),
  ]);

  if (userError) {
    throw toHttpError(userError, 'No se pudo obtener la información del usuario.');
  }

  if (!user) {
    return null;
  }

  if (gardenError) {
    throw toHttpError(gardenError, 'No se pudo obtener el jardín del usuario.');
  }

  const rawPlants = Array.isArray(garden?.plantas) ? garden.plantas : [];
  let enrichedPlants = rawPlants;

  if (rawPlants.length) {
    const plantIds = rawPlants.map((plant) => plant.id);
    const [plantLikesResult, commentsResult] = await Promise.all([
      supabase
        .from('plantas_likes')
        .select('planta_id, usuario_id')
        .in('planta_id', plantIds),
      supabase
        .from('plantas_comentarios')
        .select('id, planta_id, usuario_id, contenido, fecha_creacion, usuarios ( nombre_usuario )')
        .in('planta_id', plantIds)
        .order('fecha_creacion', { ascending: true }),
    ]);

    if (plantLikesResult.error) {
      throw toHttpError(plantLikesResult.error, 'No se pudieron obtener los me gusta de los eventos.');
    }

    if (commentsResult.error) {
      throw toHttpError(commentsResult.error, 'No se pudieron obtener los comentarios de los eventos.');
    }

    const plantLikes = plantLikesResult.data || [];
    const comments = commentsResult.data || [];

    let commentLikes = [];
    if (comments.length) {
      const commentIds = comments.map((comment) => comment.id);
      const commentLikesResult = await supabase
        .from('comentarios_likes')
        .select('comentario_id, usuario_id')
        .in('comentario_id', commentIds);

      if (commentLikesResult.error) {
        throw toHttpError(commentLikesResult.error, 'No se pudieron obtener los me gusta de los comentarios.');
      }

      commentLikes = commentLikesResult.data || [];
    }

    const plantLikesById = new Map();
    plantLikes.forEach((like) => {
      if (!like?.planta_id) return;
      const entry = plantLikesById.get(like.planta_id) || { count: 0, likedByMe: false };
      entry.count += 1;
      if (currentUserId && like.usuario_id === currentUserId) {
        entry.likedByMe = true;
      }
      plantLikesById.set(like.planta_id, entry);
    });

    const commentLikesById = new Map();
    commentLikes.forEach((like) => {
      if (!like?.comentario_id) return;
      const entry = commentLikesById.get(like.comentario_id) || { count: 0, likedByMe: false };
      entry.count += 1;
      if (currentUserId && like.usuario_id === currentUserId) {
        entry.likedByMe = true;
      }
      commentLikesById.set(like.comentario_id, entry);
    });

    const commentsByPlant = new Map();
    comments.forEach((comment) => {
      if (!comment?.planta_id) return;
      const likesInfo = commentLikesById.get(comment.id) || { count: 0, likedByMe: false };
      const normalizedComment = {
        id: comment.id,
        planta_id: comment.planta_id,
        usuario_id: comment.usuario_id,
        contenido: comment.contenido,
        fecha_creacion: comment.fecha_creacion,
        autor: comment.usuarios?.nombre_usuario || null,
        likes: { total: likesInfo.count, likedByMe: likesInfo.likedByMe },
      };

      if (!commentsByPlant.has(comment.planta_id)) {
        commentsByPlant.set(comment.planta_id, []);
      }
      commentsByPlant.get(comment.planta_id).push(normalizedComment);
    });

    enrichedPlants = rawPlants.map((plant) => {
      const likesInfo = plantLikesById.get(plant.id) || { count: 0, likedByMe: false };
      return {
        ...plant,
        likes: { total: likesInfo.count, likedByMe: likesInfo.likedByMe },
        comentarios: commentsByPlant.get(plant.id) || [],
      };
    });
  }

  return {
    usuario: user,
    jardin: garden
      ? {
          id: garden.id,
          estado_salud: garden.estado_salud,
          ultima_modificacion: garden.ultima_modificacion,
          plantas: enrichedPlants,
        }
      : null,
  };
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { value, error } = searchUsersSchema.validate(req.query, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const searchTerm = value.q;

    const friendPairs = await fetchFriendPairs(req.user.id);
    const friendEntries = buildFriendEntries(friendPairs, req.user.id);
    const friendIds = new Set(friendEntries.map((entry) => entry.id));

    const { data: users, error: usersError } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario')
      .ilike('nombre_usuario', `%${searchTerm}%`)
      .neq('id', req.user.id)
      .order('nombre_usuario', { ascending: true })
      .limit(20);

    if (usersError) {
      throw toHttpError(usersError, 'No se pudieron buscar usuarios.');
    }

    const resultados = (users || []).map((user) => ({
      id: user.id,
      nombre_usuario: user.nombre_usuario,
      es_amigo: friendIds.has(user.id),
    }));

    return res.json({ resultados });
  } catch (err) {
    return next(err);
  }
};

exports.addFriend = async (req, res, next) => {
  try {
    const { value, error } = userIdParamSchema.validate(req.params, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const friendId = value.id;

    if (friendId === req.user.id) {
      return res.status(400).json({ error: 'No puedes agregarte a ti mismo como amigo.' });
    }

    const sortedIds = [req.user.id, friendId].sort();

    if (sortedIds[0] === sortedIds[1]) {
      return res.status(400).json({ error: 'No puedes agregarte a ti mismo como amigo.' });
    }

    const [{ data: targetUser, error: targetError }, { data: existingFriendship, error: friendshipError }] =
      await Promise.all([
        supabase
          .from('usuarios')
          .select('id')
          .eq('id', friendId)
          .maybeSingle(),
        supabase
          .from('amistades')
          .select('id')
          .eq('usuario_a', sortedIds[0])
          .eq('usuario_b', sortedIds[1])
          .maybeSingle(),
      ]);

    if (targetError) {
      throw toHttpError(targetError, 'No se pudo verificar el usuario a agregar.');
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'El usuario que intentas agregar no existe.' });
    }

    if (friendshipError) {
      throw toHttpError(friendshipError, 'No se pudo verificar la relación de amistad.');
    }

    if (existingFriendship) {
      return res.status(409).json({ error: 'Ya tienes agregado a este usuario como amigo.' });
    }

    const { data: insertedFriendship, error: insertError } = await supabase
      .from('amistades')
      .insert({ usuario_a: sortedIds[0], usuario_b: sortedIds[1] })
      .select('usuario_a, usuario_b, fecha_creacion')
      .single();

    if (insertError) {
      throw toHttpError(insertError, 'No se pudo agregar al amigo.');
    }

    let friendEntry = { id: friendId, fechaAmistad: new Date().toISOString() };
    if (insertedFriendship) {
      const friendFromInsert = insertedFriendship.usuario_a === req.user.id
        ? insertedFriendship.usuario_b
        : insertedFriendship.usuario_a;
      friendEntry = { id: friendFromInsert, fechaAmistad: insertedFriendship.fecha_creacion };
    }

    const amigo = await fetchFriendsSummaries([friendEntry]);
    return res.status(201).json({ amigo: amigo[0] || null });
  } catch (err) {
    return next(err);
  }
};

exports.listFriends = async (req, res, next) => {
  try {
    const friendPairs = await fetchFriendPairs(req.user.id);
    const friendEntries = buildFriendEntries(friendPairs, req.user.id);
    const amigos = await fetchFriendsSummaries(friendEntries);
    return res.json({ amigos });
  } catch (err) {
    return next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const { value, error } = userIdParamSchema.validate(req.params, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const profileId = value.id;

    if (profileId !== req.user.id) {
      const sortedIds = [req.user.id, profileId].sort();
      const { data: friendship, error: friendshipError } = await supabase
        .from('amistades')
        .select('id')
        .eq('usuario_a', sortedIds[0])
        .eq('usuario_b', sortedIds[1])
        .maybeSingle();

      if (friendshipError) {
        throw toHttpError(friendshipError, 'No se pudo verificar la relación de amistad.');
      }

      if (!friendship) {
        return res
          .status(403)
          .json({ error: 'Solo puedes ver el perfil de tus amigos o tu propio perfil.' });
      }
    }

    const perfil = await fetchUserProfile(profileId, req.user.id);

    if (!perfil) {
      return res.status(404).json({ error: 'El perfil solicitado no existe.' });
    }

    return res.json(perfil);
  } catch (err) {
    return next(err);
  }
};
