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
      .select('id, nombre_usuario, fecha_creacion')
      .in('id', friendIds),
    supabase
      .from('jardines')
      .select(
        'id, usuario_id, estado_salud, ultima_modificacion, plantas (id, nombre, tipo, fecha_plantado, descripcion)'
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

const fetchUserProfile = async (userId) => {
  const [{ data: user, error: userError }, { data: garden, error: gardenError }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id, nombre_usuario, fecha_creacion')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('jardines')
      .select(
        'id, usuario_id, estado_salud, ultima_modificacion, plantas (id, nombre, categoria, tipo, fecha_plantado, descripcion)'
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

  return {
    usuario: user,
    jardin: garden
      ? {
          id: garden.id,
          estado_salud: garden.estado_salud,
          ultima_modificacion: garden.ultima_modificacion,
          plantas: Array.isArray(garden.plantas) ? garden.plantas : [],
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

    const perfil = await fetchUserProfile(profileId);

    if (!perfil) {
      return res.status(404).json({ error: 'El perfil solicitado no existe.' });
    }

    return res.json(perfil);
  } catch (err) {
    return next(err);
  }
};
