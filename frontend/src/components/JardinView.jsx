import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';

const moodStyles = [
  { limit: 33, bg: 'from-red-100 via-orange-100 to-yellow-100', message: 'Tu jardín necesita cuidados.' },
  { limit: 66, bg: 'from-emerald-100 via-lime-100 to-teal-100', message: 'Tu jardín está en equilibrio.' },
  { limit: 100, bg: 'from-emerald-200 via-teal-200 to-sky-200', message: '¡Tu jardín florece con fuerza!' },
];

const getMood = (health) => moodStyles.find((m) => health <= m.limit) || moodStyles[2];

const categoriasSugeridas = [
  'Trabajo',
  'Relaciones',
  'Autocuidado',
  'Salud',
  'Aprendizaje',
  'Otro',
];

const formBase = () => ({ nombre: '', categoria: categoriasSugeridas[0], tipo: 'positivo', descripcion: '' });

const JardinView = () => {
  const { garden, fetchGarden, api, authHeaders, setGarden } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(() => formBase());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const gardenRef = useRef(null);

  const health = garden?.estado_salud ?? 50;
  const mood = useMemo(() => getMood(health), [health]);

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, [garden, fetchGarden]);

  useEffect(() => {
    if (gardenRef.current) {
      const shade = Math.min(9, Math.floor(health / 10));
      gsap.to(gardenRef.current, {
        background: `linear-gradient(135deg, rgba(34,197,94,0.${shade}), rgba(56,189,248,0.${shade}))`,
        duration: 1,
      });
    }
  }, [health]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post('/jardin/planta', form, { headers: authHeaders });
      setGarden((prev) => ({
        ...(prev || {}),
        ...data.jardin,
        plantas: [data.plant, ...((prev && prev.plantas) || [])],
      }));
      setForm(formBase());
      setFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar la planta.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (plant) => {
    setEditingPlant(plant);
    setEditDescription(plant.descripcion || '');
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!editingPlant) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.put(
        `/jardin/planta/${editingPlant.id}`,
        { descripcion: editDescription },
        { headers: authHeaders }
      );
      setGarden((prev) => ({
        ...(prev || {}),
        plantas: (prev?.plantas || []).map((plant) =>
          plant.id === editingPlant.id ? { ...plant, descripcion: data.plant.descripcion } : plant
        ),
      }));
      setEditingPlant(null);
    } catch (err) {
      setError('No se pudo actualizar la planta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plantId) => {
    setSubmitting(true);
    setError(null);
    try {
      await api.delete(`/jardin/planta/${plantId}`, { headers: authHeaders });
      setGarden((prev) => ({
        ...(prev || {}),
        plantas: (prev?.plantas || []).filter((plant) => plant.id !== plantId),
      }));
    } catch (err) {
      setError('No se pudo eliminar la planta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!garden) {
    return <p className="text-center text-lg text-slate-500">Cargando tu jardín...</p>;
  }

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${mood.bg} p-8 shadow-lg`}>
        <div ref={gardenRef} className="absolute inset-0 opacity-30" aria-hidden />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-gardenGreen">Salud del jardín: {health}%</h2>
          <p className="mt-2 text-lg text-slate-700">{mood.message}</p>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Cada emoción que registres representa un riego o una sequía para tu planta interior. Usa las categorías para detectar
            patrones y equilibrar tu día a día.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-full bg-gardenGreen px-6 py-2 font-semibold text-white shadow hover:bg-emerald-600"
            >
              Registrar evento emocional
            </button>
          </div>
        </div>
        <div className="relative z-0 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {garden.plantas?.map((plant) => (
            <article key={plant.id} className="rounded-2xl bg-white/80 p-4 shadow">
              <h3 className="text-lg font-semibold text-gardenSoil">{plant.nombre}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gardenGreen">
                {plant.categoria || 'Sin categoría'}
              </p>
              <span
                className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${
                  plant.tipo === 'positivo'
                    ? 'bg-emerald-500'
                    : plant.tipo === 'negativo'
                    ? 'bg-rose-500'
                    : 'bg-slate-500'
                }`}
              >
                {plant.tipo}
              </span>
              <p className="mt-2 text-sm text-slate-700">{plant.descripcion || 'Sin descripción'}</p>
              <time className="mt-3 block text-xs text-slate-500">
                {new Date(plant.fecha_plantado).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </time>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  onClick={() => startEditing(plant)}
                >
                  Editar
                </button>
                <button
                  className="rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-200"
                  onClick={() => handleDelete(plant.id)}
                  disabled={submitting}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
          {garden.plantas?.length === 0 && (
            <p className="text-sm text-slate-600">
              Aún no tienes eventos registrados. Cada emoción que registres nutrirá o agotará tu planta según cómo te haya
              impactado.
            </p>
          )}
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gardenGreen">Registrar emoción</h3>
            <p className="mt-2 text-sm text-slate-600">
              Describe lo que sucedió, clasifícalo y cuéntanos cómo impactó tu día. Así veremos crecer o decaer el jardín.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="nombre">
                  Nombre
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="categoria">
                  Categoría
                </label>
                <input
                  id="categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  list="categorias-sugeridas"
                  placeholder="Ej. Trabajo, Relaciones, Autocuidado"
                  required
                />
                <datalist id="categorias-sugeridas">
                  {categoriasSugeridas.map((categoria) => (
                    <option key={categoria} value={categoria} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="tipo">
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                >
                  <option value="positivo">Positivo</option>
                  <option value="negativo">Negativo</option>
                  <option value="neutro">Neutro</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="descripcion">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  placeholder="Describe qué sucedió o cómo te sentiste"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => setFormOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gardenGreen">Actualizar descripción</h3>
            <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="descripcionEditar">
                  Descripción
                </label>
                <textarea
                  id="descripcionEditar"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  className="h-32 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => setEditingPlant(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JardinView;
