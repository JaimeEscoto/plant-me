const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const {
  plantIdParamSchema,
  commentIdParamSchema,
  createCommentSchema,
} = require('../validations/communityValidation');

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
      .select('id, planta_id, usuario_id, contenido, fecha_creacion, usuarios ( nombre_usuario )')
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
