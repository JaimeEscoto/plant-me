const supabase = require('../lib/supabaseClient');
const { toHttpError } = require('../utils/supabase');
const { buildAccessoryList } = require('../utils/accessories');
const {
  createPlantSchema,
  updatePlantSchema,
  historyQuerySchema,
} = require('../validations/gardenValidation');

const EVENT_SEED_REWARD = Number(process.env.EVENT_SEED_REWARD || 5);

const adjustGardenHealth = (currentHealth, delta = 0) => {
  const nextHealth = Math.max(0, Math.min(100, currentHealth + delta));
  return nextHealth;
};

exports.getGarden = async (req, res, next) => {
  try {
    const [{ data: garden, error }, { data: accessoryRows, error: accessoryError }] = await Promise.all([
      supabase
        .from('jardines')
        .select('id, usuario_id, estado_salud, ultima_modificacion, plantas:plantas(*)')
        .eq('usuario_id', req.user.id)
        .order('fecha_plantado', { referencedTable: 'plantas', ascending: false })
        .maybeSingle(),
      supabase
        .from('usuario_accesorios')
        .select('accesorio_id, cantidad')
        .eq('usuario_id', req.user.id),
    ]);

    if (error) {
      throw toHttpError(error, 'No se pudo obtener la información del jardín.');
    }

    if (accessoryError) {
      throw toHttpError(accessoryError, 'No se pudieron obtener los accesorios del jardín.');
    }

    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const sortedGarden = {
      ...garden,
      plantas: Array.isArray(garden.plantas)
        ? [...garden.plantas].sort(
            (a, b) => new Date(b.fecha_plantado).getTime() - new Date(a.fecha_plantado).getTime()
          )
        : [],
      accesorios: buildAccessoryList(accessoryRows || []),
    };

    return res.json(sortedGarden);
  } catch (err) {
    return next(err);
  }
};

exports.createPlant = async (req, res, next) => {
  try {
    const { value, error } = createPlantSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const { data: garden, error: gardenError } = await supabase
      .from('jardines')
      .select('*')
      .eq('usuario_id', req.user.id)
      .maybeSingle();

    if (gardenError) {
      throw toHttpError(gardenError, 'No se pudo obtener el jardín del usuario.');
    }

    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const { data: userRow, error: userError } = await supabase
      .from('usuarios')
      .select('id, semillas')
      .eq('id', req.user.id)
      .maybeSingle();

    if (userError) {
      throw toHttpError(userError, 'No se pudo obtener la información del usuario.');
    }

    if (!userRow) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const { data: eventType, error: eventTypeError } = await supabase
      .from('event_types')
      .select('id, code, plant_delta')
      .eq('code', value.tipo)
      .maybeSingle();

    if (eventTypeError) {
      throw toHttpError(eventTypeError, 'No se pudo validar el tipo de evento.');
    }

    if (!eventType) {
      return res.status(400).json({ error: 'Tipo de evento no válido.' });
    }

    const { data: plant, error: createError } = await supabase
      .from('plantas')
      .insert({
        jardin_id: garden.id,
        nombre: value.nombre,
        categoria: value.categoria,
        tipo: eventType.code,
        descripcion: value.descripcion,
      })
      .select()
      .single();

    if (createError) {
      throw toHttpError(createError, 'No se pudo crear la planta en Supabase.');
    }

    const updatedGardenHealth = adjustGardenHealth(garden.estado_salud, eventType.plant_delta);
    const now = new Date().toISOString();
    const { data: updatedGarden, error: updateGardenError } = await supabase
      .from('jardines')
      .update({ estado_salud: updatedGardenHealth, ultima_modificacion: now })
      .eq('id', garden.id)
      .select()
      .single();

    if (updateGardenError) {
      throw toHttpError(updateGardenError, 'No se pudo actualizar el estado del jardín.');
    }

    const nextSeedBalance = (userRow.semillas || 0) + EVENT_SEED_REWARD;
    const { data: updatedUser, error: updateUserError } = await supabase
      .from('usuarios')
      .update({ semillas: nextSeedBalance })
      .eq('id', req.user.id)
      .select('id, semillas, medalla_compras')
      .single();

    if (updateUserError) {
      throw toHttpError(updateUserError, 'No se pudo actualizar el saldo de semillas.');
    }

    const { data: accessoryRows, error: accessoryError } = await supabase
      .from('usuario_accesorios')
      .select('accesorio_id, cantidad')
      .eq('usuario_id', req.user.id);

    if (accessoryError) {
      throw toHttpError(accessoryError, 'No se pudieron obtener los accesorios del jardín.');
    }

    const enrichedGarden = {
      ...updatedGarden,
      accesorios: buildAccessoryList(accessoryRows || []),
    };

    return res.status(201).json({ plant, jardin: enrichedGarden, semillas: updatedUser.semillas });
  } catch (err) {
    return next(err);
  }
};

exports.updatePlant = async (req, res, next) => {
  try {
    const { value, error } = updatePlantSchema.validate(req.body, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const { data: garden, error: gardenError } = await supabase
      .from('jardines')
      .select('*')
      .eq('usuario_id', req.user.id)
      .maybeSingle();

    if (gardenError) {
      throw toHttpError(gardenError, 'No se pudo obtener el jardín del usuario.');
    }

    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const { data: plant, error: plantError } = await supabase
      .from('plantas')
      .select('*')
      .eq('id', req.params.id)
      .eq('jardin_id', garden.id)
      .maybeSingle();

    if (plantError) {
      throw toHttpError(plantError, 'No se pudo obtener la planta solicitada.');
    }

    if (!plant) {
      return res.status(404).json({ error: 'Planta no encontrada.' });
    }

    const { data: updatedPlant, error: updateError } = await supabase
      .from('plantas')
      .update({ descripcion: value.descripcion })
      .eq('id', plant.id)
      .select()
      .single();

    if (updateError) {
      throw toHttpError(updateError, 'No se pudo actualizar la planta en Supabase.');
    }

    const { error: updateGardenError } = await supabase
      .from('jardines')
      .update({ ultima_modificacion: new Date().toISOString() })
      .eq('id', garden.id);

    if (updateGardenError) {
      throw toHttpError(updateGardenError, 'No se pudo actualizar el jardín.');
    }

    return res.json({ plant: updatedPlant });
  } catch (err) {
    return next(err);
  }
};

exports.deletePlant = async (req, res, next) => {
  try {
    const { data: garden, error: gardenError } = await supabase
      .from('jardines')
      .select('*')
      .eq('usuario_id', req.user.id)
      .maybeSingle();

    if (gardenError) {
      throw toHttpError(gardenError, 'No se pudo obtener el jardín del usuario.');
    }

    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    const { data: plant, error: plantError } = await supabase
      .from('plantas')
      .select('*')
      .eq('id', req.params.id)
      .eq('jardin_id', garden.id)
      .maybeSingle();

    if (plantError) {
      throw toHttpError(plantError, 'No se pudo obtener la planta solicitada.');
    }

    if (!plant) {
      return res.status(404).json({ error: 'Planta no encontrada.' });
    }

    const { error: deleteError } = await supabase
      .from('plantas')
      .delete()
      .eq('id', plant.id);

    if (deleteError) {
      throw toHttpError(deleteError, 'No se pudo eliminar la planta en Supabase.');
    }

    const { data: eventType, error: eventTypeError } = await supabase
      .from('event_types')
      .select('remove_delta')
      .eq('code', plant.tipo)
      .maybeSingle();

    if (eventTypeError) {
      throw toHttpError(eventTypeError, 'No se pudo validar el tipo de evento.');
    }

    const delta = eventType?.remove_delta ?? 0;
    const updatedHealth = adjustGardenHealth(garden.estado_salud, delta);
    const { error: updateGardenError } = await supabase
      .from('jardines')
      .update({
        estado_salud: updatedHealth,
        ultima_modificacion: new Date().toISOString(),
      })
      .eq('id', garden.id);

    if (updateGardenError) {
      throw toHttpError(updateGardenError, 'No se pudo actualizar el jardín.');
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

exports.getEventTypes = async (req, res, next) => {
  try {
    const requestedLanguage =
      typeof req.query.lang === 'string' && req.query.lang.trim().length
        ? req.query.lang.trim().toLowerCase()
        : 'es';

    const { data, error } = await supabase
      .from('event_types')
      .select('id, code, plant_delta, remove_delta, position, event_type_translations(language, label)')
      .order('position', { ascending: true })
      .order('code', { ascending: true });

    if (error) {
      throw toHttpError(error, 'No se pudieron obtener los tipos de evento.');
    }

    const eventTypes = (data || []).map((item) => {
      const translations = Array.isArray(item.event_type_translations)
        ? item.event_type_translations
        : [];
      const preferred = translations.find((translation) => translation.language === requestedLanguage);
      const fallback = translations.find((translation) => translation.language === 'es');

      return {
        code: item.code,
        label: preferred?.label || fallback?.label || item.code,
        plantDelta: item.plant_delta,
        removeDelta: item.remove_delta,
        position: item.position,
      };
    });

    return res.json(eventTypes);
  } catch (err) {
    return next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { value, error } = historyQuerySchema.validate(req.query, { abortEarly: false });
    if (error) {
      error.status = 400;
      throw error;
    }

    const { data: garden, error: gardenError } = await supabase
      .from('jardines')
      .select('*')
      .eq('usuario_id', req.user.id)
      .maybeSingle();

    if (gardenError) {
      throw toHttpError(gardenError, 'No se pudo obtener el jardín del usuario.');
    }

    if (!garden) {
      return res.status(404).json({ error: 'Jardín no encontrado.' });
    }

    let query = supabase
      .from('plantas')
      .select('*')
      .eq('jardin_id', garden.id)
      .order('fecha_plantado', { ascending: false });

    if (value.fechaInicio) {
      query = query.gte('fecha_plantado', value.fechaInicio);
    }
    if (value.fechaFin) {
      query = query.lte('fecha_plantado', value.fechaFin);
    }

    const { data: plants, error: historyError } = await query;

    if (historyError) {
      throw toHttpError(historyError, 'No se pudo obtener el historial de plantas.');
    }

    return res.json({ historial: plants || [] });
  } catch (err) {
    return next(err);
  }
};
