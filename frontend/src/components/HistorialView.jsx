import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEventTypes } from '../context/EventTypeContext';
import { useEventCategories } from '../context/EventCategoryContext';
import ImagePreviewModal from './ImagePreviewModal';

const ranges = [
  { id: '7', labelKey: 'historyRange7', days: 7 },
  { id: '30', labelKey: 'historyRange30', days: 30 },
  { id: 'all', labelKey: 'historyRangeAll', days: null },
];

const HistorialView = () => {
  const { api, authHeaders, garden, fetchGarden, setGarden } = useAuth();
  const { t, locale } = useLanguage();
  const { getLabelForType, getEventTypeByCode } = useEventTypes();
  const { getLabelForCategory } = useEventCategories();
  const [range, setRange] = useState(ranges[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
      setError(t('historyError'));
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
          <h2 className="text-2xl font-bold text-gardenGreen">{t('historyTitle')}</h2>
          <p className="text-sm text-slate-500">{t('historySubtitle')}</p>
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
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-slate-500">{t('historyLoading')}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {garden?.plantas?.length ? (
          garden.plantas.map((plant) => (
            <article
              key={plant.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                {plant.foto && (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({
                        src: plant.foto,
                        alt: t('gardenEventPhotoAlt', { name: plant.nombre }),
                      })
                    }
                    className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl focus:outline-none focus:ring-2 focus:ring-gardenGreen/60"
                  >
                    <img
                      src={plant.foto}
                      alt={t('gardenEventPhotoAlt', { name: plant.nombre })}
                      className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </button>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gardenSoil">{plant.nombre}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gardenGreen">
                    {getLabelForCategory(plant.categoria) || t('historyNoCategory')}
                  </p>
                  <p className="text-sm text-slate-600">{plant.descripcion || t('historyNoDescription')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${(() => {
                    const info = getEventTypeByCode(plant.tipo);
                    if (!info) return 'bg-slate-500';
                    if (info.plantDelta > 0) return 'bg-emerald-500';
                    if (info.plantDelta < 0) return 'bg-rose-500';
                    return 'bg-slate-500';
                  })()}`}
                >
                  {getLabelForType(plant.tipo)}
                </span>
                <time className="text-xs text-slate-500">
                  {new Date(plant.fecha_plantado).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-slate-600">{t('historyEmptyRange')}</p>
        )}
      </div>
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        src={previewImage?.src}
        alt={previewImage?.alt || ''}
        onClose={() => setPreviewImage(null)}
      />
    </section>
  );
};

export default HistorialView;
