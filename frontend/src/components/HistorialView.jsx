import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ranges = [
  { id: '7', label: 'Últimos 7 días', days: 7 },
  { id: '30', label: 'Últimos 30 días', days: 30 },
  { id: 'all', label: 'Todo el historial', days: null },
];

const HistorialView = () => {
  const { api, authHeaders, garden, fetchGarden, setGarden } = useAuth();
  const [range, setRange] = useState(ranges[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryParams = useMemo(() => {
    if (!range.days) return {};
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaFin.getDate() - range.days);
    return {
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
    };
  }, [range]);

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, [garden, fetchGarden]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/jardin/historial', {
        headers: authHeaders,
        params: queryParams,
      });
      setGarden((prev) => ({ ...(prev || {}), plantas: data.historial }));
    } catch (err) {
      setError('No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gardenGreen">Historial de emociones</h2>
          <p className="text-sm text-slate-500">Explora cómo ha evolucionado tu jardín mental.</p>
        </div>
        <div className="flex gap-2">
          {ranges.map((option) => (
            <button
              key={option.id}
              onClick={() => setRange(option)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                option.id === range.id
                  ? 'bg-gardenGreen text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">Cargando historial...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {garden?.plantas?.length ? (
          garden.plantas.map((plant) => (
            <article
              key={plant.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div>
                <h3 className="text-lg font-semibold text-gardenSoil">{plant.nombre}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-gardenGreen">
                  {plant.categoria || 'Sin categoría'}
                </p>
                <p className="text-sm text-slate-600">{plant.descripcion || 'Sin descripción'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${
                    plant.tipo === 'positivo'
                      ? 'bg-emerald-500'
                      : plant.tipo === 'negativo'
                      ? 'bg-rose-500'
                      : 'bg-slate-500'
                  }`}
                >
                  {plant.tipo}
                </span>
                <time className="text-xs text-slate-500">
                  {new Date(plant.fecha_plantado).toLocaleString('es-ES', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-600">No hay eventos registrados en este periodo.</p>
        )}
      </div>
    </section>
  );
};

export default HistorialView;
