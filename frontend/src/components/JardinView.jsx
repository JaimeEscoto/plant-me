import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PlantHealthIllustration from './PlantHealthIllustration';

const moodStyles = [
  { limit: 33, bg: 'from-red-100 via-orange-100 to-yellow-100', messageKey: 'gardenMoodNeedsCare' },
  { limit: 66, bg: 'from-emerald-100 via-lime-100 to-teal-100', messageKey: 'gardenMoodBalanced' },
  { limit: 100, bg: 'from-emerald-200 via-teal-200 to-sky-200', messageKey: 'gardenMoodFlourishing' },
];

const categorySuggestionsMap = {
  es: ['Trabajo', 'Relaciones', 'Autocuidado', 'Salud', 'Aprendizaje', 'Otro'],
  en: ['Work', 'Relationships', 'Self-care', 'Health', 'Learning', 'Other'],
  fr: ['Travail', 'Relations', 'Auto-soin', 'Santé', 'Apprentissage', 'Autre'],
};

const getMood = (health) => moodStyles.find((mood) => health <= mood.limit) || moodStyles[2];

const buildEmptyForm = (defaultCategory = '') => ({
  nombre: '',
  categoria: defaultCategory,
  tipo: 'positivo',
  descripcion: '',
});

const getEventTypeLabel = (type, t) => {
  if (type === 'positivo') return t('gardenTypePositive');
  if (type === 'negativo') return t('gardenTypeNegative');
  return t('gardenTypeNeutral');
};

const JardinView = () => {
  const {
    garden,
    fetchGarden,
    api,
    authHeaders,
    setGarden,
    user,
    getEconomyOverview,
    purchaseAccessory,
    sellAccessory,
    transferSeeds,
    acceptSeedTransfer,
    rejectSeedTransfer,
    transferAccessory,
    acceptAccessoryTransfer,
    rejectAccessoryTransfer,
  } = useAuth();
  const { t, language, locale } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(() => buildEmptyForm(categorySuggestionsMap[language]?.[0] || ''));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [economy, setEconomy] = useState({
    semillas: 0,
    medalla_compras: 0,
    accesorios: [],
    transferencias: { semillas: [], accesorios: [] },
  });
  const [economyLoading, setEconomyLoading] = useState(false);
  const [economyError, setEconomyError] = useState(null);
  const [shopFeedback, setShopFeedback] = useState(null);
  const [shopAction, setShopAction] = useState(null);
  const [seedGiftForm, setSeedGiftForm] = useState({ destinatario: '', cantidad: 1, mensaje: '' });
  const gardenRef = useRef(null);

  const loadEconomy = useCallback(async () => {
    if (!getEconomyOverview) return;
    setEconomyLoading(true);
    setEconomyError(null);
    try {
      const data = await getEconomyOverview();
      setEconomy({
        semillas: data?.semillas ?? 0,
        medalla_compras: data?.medalla_compras ?? 0,
        accesorios: Array.isArray(data?.accesorios) ? data.accesorios : [],
        transferencias: {
          semillas: Array.isArray(data?.transferencias?.semillas)
            ? data.transferencias.semillas
            : [],
          accesorios: Array.isArray(data?.transferencias?.accesorios)
            ? data.transferencias.accesorios
            : [],
        },
      });
    } catch (err) {
      setEconomyError(t('economyOverviewError'));
    } finally {
      setEconomyLoading(false);
    }
  }, [getEconomyOverview, t]);

  const formatDateTime = useCallback(
    (value) =>
      value
        ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
        : '',
    [locale]
  );

  const categorySuggestions = useMemo(
    () => categorySuggestionsMap[language] || categorySuggestionsMap.es,
    [language]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      categoria: prev.categoria || categorySuggestions[0] || '',
    }));
  }, [categorySuggestions]);

  const health = garden?.estado_salud ?? 50;
  const mood = useMemo(() => getMood(health), [health]);

  useEffect(() => {
    if (!garden) {
      fetchGarden();
    }
  }, [garden, fetchGarden]);

  useEffect(() => {
    loadEconomy();
  }, [loadEconomy]);

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
      if (typeof data.semillas === 'number') {
        setEconomy((prev) => ({
          ...prev,
          semillas: data.semillas,
        }));
      }
      setForm(buildEmptyForm(categorySuggestions[0] || ''));
      setFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || t('formErrorRegisterPlant'));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (plant) => {
    setEditingPlant(plant);
    setEditDescription(plant.descripcion || '');
    setError(null);
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
      setError(t('formErrorUpdatePlant'));
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
      setError(t('formErrorDeletePlant'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSeedGiftChange = (event) => {
    const { name, value } = event.target;
    setSeedGiftForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePurchaseAccessory = async (accessoryId) => {
    setShopAction(accessoryId);
    setShopFeedback(null);
    setEconomyError(null);
    try {
      const data = await purchaseAccessory(accessoryId);
      if (data?.plant) {
        setGarden((prev) => {
          if (!prev) return prev;
          const existingPlants = Array.isArray(prev.plantas) ? prev.plantas : [];
          const updated = {
            ...prev,
            plantas: [data.plant, ...existingPlants],
          };
          if (data?.jardin?.estado_salud !== undefined) {
            updated.estado_salud = data.jardin.estado_salud;
          }
          if (data?.jardin?.ultima_modificacion) {
            updated.ultima_modificacion = data.jardin.ultima_modificacion;
          }
          return updated;
        });
      }
      if (typeof data?.semillas === 'number' || typeof data?.medalla_compras === 'number') {
        setEconomy((prev) => ({
          ...prev,
          semillas: typeof data.semillas === 'number' ? data.semillas : prev.semillas,
          medalla_compras:
            typeof data.medalla_compras === 'number' ? data.medalla_compras : prev.medalla_compras,
        }));
      }
      setShopFeedback(
        data?.accesorio?.nombre
          ? t('economyPurchaseSuccess', { name: data.accesorio.nombre })
          : t('economyPurchaseGenericSuccess')
      );
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economyPurchaseError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleSellAccessory = async (accessoryId) => {
    const actionKey = `sell-${accessoryId}`;
    setShopAction(actionKey);
    setShopFeedback(null);
    setEconomyError(null);
    try {
      const data = await sellAccessory(accessoryId);
      setShopFeedback(
        data?.accesorio?.nombre
          ? t('economySellSuccess', { name: data.accesorio.nombre })
          : t('economySellGenericSuccess')
      );
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economySellError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleAccessoryTransfer = async (accessoryId) => {
    const destinatario = window.prompt(t('economyAccessoryTransferPromptUser'));
    if (!destinatario) return;
    const quantityAnswer = window.prompt(t('economyAccessoryTransferPromptQuantity'));
    if (quantityAnswer === null) return;
    const cantidad = Number.parseInt(quantityAnswer || '1', 10) || 1;

    if (cantidad <= 0) {
      setEconomyError(t('economyAccessoryTransferError'));
      return;
    }

    const actionKey = `transfer-${accessoryId}`;
    setShopAction(actionKey);
    setEconomyError(null);
    setShopFeedback(null);
    try {
      await transferAccessory(accessoryId, { destinatario, cantidad });
      setShopFeedback(t('economyAccessoryTransferSuccess'));
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economyAccessoryTransferError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleSeedTransfer = async (event) => {
    event.preventDefault();
    const cantidad = Number.parseInt(seedGiftForm.cantidad, 10);
    if (!seedGiftForm.destinatario.trim() || Number.isNaN(cantidad) || cantidad <= 0) {
      setEconomyError(t('economySeedTransferError'));
      return;
    }
    setShopAction('seed-transfer');
    setEconomyError(null);
    setShopFeedback(null);
    try {
      await transferSeeds({
        destinatario: seedGiftForm.destinatario.trim(),
        cantidad,
        mensaje: seedGiftForm.mensaje.trim(),
      });
      setSeedGiftForm({ destinatario: '', cantidad: 1, mensaje: '' });
      setShopFeedback(t('economySeedTransferSuccess'));
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economySeedTransferError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleAcceptSeedTransfer = async (transferId) => {
    setShopAction(`accept-seed-${transferId}`);
    setEconomyError(null);
    setShopFeedback(null);
    try {
      await acceptSeedTransfer(transferId);
      setShopFeedback(t('economyAcceptTransferSuccess'));
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleRejectSeedTransfer = async (transferId) => {
    setShopAction(`reject-seed-${transferId}`);
    setEconomyError(null);
    setShopFeedback(null);
    try {
      await rejectSeedTransfer(transferId);
      setShopFeedback(t('economyRejectTransferSuccess'));
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleAcceptAccessoryTransfer = async (transferId) => {
    setShopAction(`accept-accessory-${transferId}`);
    setEconomyError(null);
    setShopFeedback(null);
    try {
      await acceptAccessoryTransfer(transferId);
      setShopFeedback(t('economyAcceptTransferSuccess'));
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const handleRejectAccessoryTransfer = async (transferId) => {
    setShopAction(`reject-accessory-${transferId}`);
    setEconomyError(null);
    setShopFeedback(null);
    try {
      await rejectAccessoryTransfer(transferId);
      setShopFeedback(t('economyRejectTransferSuccess'));
    } catch (err) {
      setEconomyError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setShopAction(null);
      await loadEconomy();
    }
  };

  const accessoryList = Array.isArray(economy.accesorios) ? economy.accesorios : [];
  const seedTransfers = Array.isArray(economy.transferencias?.semillas)
    ? economy.transferencias.semillas
    : [];
  const accessoryTransfers = Array.isArray(economy.transferencias?.accesorios)
    ? economy.transferencias.accesorios
    : [];

  const incomingSeedTransfers = seedTransfers.filter((transfer) => transfer.destinatario_id === user?.id);
  const outgoingSeedTransfers = seedTransfers.filter((transfer) => transfer.remitente_id === user?.id);
  const incomingAccessoryTransfers = accessoryTransfers.filter(
    (transfer) => transfer.destinatario_id === user?.id
  );
  const outgoingAccessoryTransfers = accessoryTransfers.filter(
    (transfer) => transfer.remitente_id === user?.id
  );

  if (!garden) {
    return <p className="text-center text-lg text-slate-500">{t('gardenLoading')}</p>;
  }

  return (
    <div className="space-y-6">
      <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${mood.bg} p-8 shadow-lg`}>
        <div ref={gardenRef} className="absolute inset-0 opacity-30" aria-hidden />
        <div className="relative z-10 flex flex-col-reverse items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full text-center lg:w-auto lg:text-left">
            <h2 className="text-2xl font-bold text-gardenGreen">{t('gardenHealth', { health })}</h2>
            <p className="mt-2 text-lg text-slate-700">{t(mood.messageKey)}</p>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{t('gardenMoodDescription')}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-left shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('economySeedsLabel')}
                </p>
                <p className="mt-1 text-2xl font-bold text-gardenGreen">
                  {economyLoading ? t('economyLoading') : economy.semillas}
                </p>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 text-left shadow">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t('economyMedalLabel')}
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-500">
                  🏅 {economyLoading ? t('economyLoading') : economy.medalla_compras}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t('economyMedalDescription')}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              <button
                onClick={() => setFormOpen(true)}
                className="rounded-full bg-gardenGreen px-6 py-2 font-semibold text-white shadow hover:bg-emerald-600"
              >
                {t('gardenRecordEvent')}
              </button>
            </div>
          </div>
          <PlantHealthIllustration
            health={health}
            dimension={220}
            className="w-full max-w-xs"
            accessories={accessoryList}
          />
        </div>
        <div className="relative z-10 mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-bold text-gardenGreen">{t('economyShopTitle')}</h3>
              {economyLoading && <span className="text-xs font-semibold text-slate-500">{t('economyLoading')}</span>}
            </div>
            {economyError && (
              <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{economyError}</p>
            )}
            {shopFeedback && !economyError && (
              <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{shopFeedback}</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {accessoryList.map((item) => {
                const canAfford = economy.semillas >= item.precio;
                const purchaseLoading = shopAction === item.id;
                const sellKey = `sell-${item.id}`;
                const transferKey = `transfer-${item.id}`;
                const selling = shopAction === sellKey;
                const transferring = shopAction === transferKey;
                const sellValue = Math.floor((item.precio || 0) / 2);
                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-3xl" aria-hidden>
                        {item.icono}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600">
                        {item.precio} 🌱
                      </span>
                    </div>
                    <h4 className="mt-3 text-lg font-semibold text-gardenSoil">{item.nombre}</h4>
                    <p className="mt-1 text-sm text-slate-600">{item.descripcion}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {t('economyAccessoryOwnedLabel', { count: item.cantidad || 0 })}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handlePurchaseAccessory(item.id)}
                        disabled={purchaseLoading || economyLoading || !canAfford}
                        className={`rounded-full px-4 py-1 text-sm font-semibold text-white shadow transition ${
                          purchaseLoading || economyLoading
                            ? 'bg-emerald-200'
                            : canAfford
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-slate-300 cursor-not-allowed'
                        }`}
                      >
                        {purchaseLoading ? t('economyProcessing') : t('economyBuyButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSellAccessory(item.id)}
                        disabled={selling || economyLoading || (item.cantidad || 0) === 0}
                        className={`rounded-full px-4 py-1 text-sm font-semibold shadow transition ${
                          selling || economyLoading
                            ? 'bg-amber-100 text-amber-400'
                            : (item.cantidad || 0) === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-200 text-amber-700 hover:bg-amber-300'
                        }`}
                      >
                        {selling ? t('economyProcessing') : t('economySellButton', { value: sellValue })}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAccessoryTransfer(item.id)}
                        disabled={transferring || economyLoading || (item.cantidad || 0) === 0}
                        className={`rounded-full px-4 py-1 text-sm font-semibold shadow transition ${
                          transferring || economyLoading
                            ? 'bg-sky-100 text-sky-400'
                            : (item.cantidad || 0) === 0
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-sky-200 text-sky-700 hover:bg-sky-300'
                        }`}
                      >
                        {transferring ? t('economyProcessing') : t('economyGiftButton')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gardenGreen">{t('economySeedTransferTitle')}</h3>
              <p className="mt-1 text-sm text-slate-600">{t('economySeedTransferSubtitle')}</p>
              <form className="mt-4 space-y-3" onSubmit={handleSeedTransfer}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="seed-destinatario">
                    {t('economySeedTransferRecipient')}
                  </label>
                  <input
                    id="seed-destinatario"
                    name="destinatario"
                    value={seedGiftForm.destinatario}
                    onChange={handleSeedGiftChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                    placeholder={t('economySeedTransferRecipientPlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="seed-cantidad">
                    {t('economySeedTransferAmount')}
                  </label>
                  <input
                    id="seed-cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    value={seedGiftForm.cantidad}
                    onChange={handleSeedGiftChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="seed-mensaje">
                    {t('economySeedTransferMessage')}
                  </label>
                  <textarea
                    id="seed-mensaje"
                    name="mensaje"
                    value={seedGiftForm.mensaje}
                    onChange={handleSeedGiftChange}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                    rows={2}
                  />
                </div>
                <button
                  type="submit"
                  disabled={shopAction === 'seed-transfer' || economyLoading}
                  className="w-full rounded-full bg-gardenGreen px-4 py-2 font-semibold text-white shadow hover:bg-emerald-600 disabled:bg-emerald-200"
                >
                  {shopAction === 'seed-transfer' ? t('economyProcessing') : t('economySeedTransferSubmit')}
                </button>
              </form>
            </div>
            <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gardenGreen">{t('economyPendingGiftsTitle')}</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-600">{t('economyPendingSeedsLabel')}</h4>
                  {incomingSeedTransfers.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">{t('economyNoPendingSeeds')}</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {incomingSeedTransfers.map((transfer) => (
                        <li key={transfer.id} className="rounded-2xl bg-emerald-50 p-3 shadow-sm">
                          <p className="text-sm font-semibold text-emerald-800">
                            {t('economyTransferFromLabel', {
                              name: transfer.remitente?.nombre_usuario || t('communityUnknownUser'),
                              amount: transfer.cantidad,
                            })}
                          </p>
                          {transfer.mensaje && (
                            <p className="mt-1 text-xs text-emerald-700">{transfer.mensaje}</p>
                          )}
                          <p className="mt-1 text-xs text-emerald-700">{formatDateTime(transfer.fecha_creacion)}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptSeedTransfer(transfer.id)}
                              disabled={shopAction === `accept-seed-${transfer.id}`}
                              className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-600 disabled:bg-emerald-200"
                            >
                              {shopAction === `accept-seed-${transfer.id}`
                                ? t('economyProcessing')
                                : t('economyAcceptButton')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectSeedTransfer(transfer.id)}
                              disabled={shopAction === `reject-seed-${transfer.id}`}
                              className="rounded-full bg-rose-400 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-rose-500 disabled:bg-rose-200"
                            >
                              {shopAction === `reject-seed-${transfer.id}`
                                ? t('economyProcessing')
                                : t('economyRejectButton')}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {outgoingSeedTransfers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('economyPendingSeedsOutgoingLabel')}
                      </h5>
                      {outgoingSeedTransfers.map((transfer) => (
                        <p key={transfer.id} className="text-xs text-slate-600">
                          {t('economyTransferToLabel', {
                            name: transfer.destinatario?.nombre_usuario || t('communityUnknownUser'),
                            amount: transfer.cantidad,
                          })}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-600">{t('economyPendingAccessoriesLabel')}</h4>
                  {incomingAccessoryTransfers.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">{t('economyNoPendingAccessories')}</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {incomingAccessoryTransfers.map((transfer) => {
                        const accessoryInfo = accessoryList.find((item) => item.id === transfer.accesorio_id);
                        return (
                          <li key={transfer.id} className="rounded-2xl bg-sky-50 p-3 shadow-sm">
                            <p className="text-sm font-semibold text-sky-700">
                              {t('economyAccessoryTransferFromLabel', {
                                name: transfer.remitente?.nombre_usuario || t('communityUnknownUser'),
                                item: accessoryInfo?.nombre || transfer.accesorio_id,
                                amount: transfer.cantidad,
                              })}
                            </p>
                            <p className="mt-1 text-xs text-sky-700">{formatDateTime(transfer.fecha_creacion)}</p>
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleAcceptAccessoryTransfer(transfer.id)}
                                disabled={shopAction === `accept-accessory-${transfer.id}`}
                                className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-sky-600 disabled:bg-sky-200"
                              >
                                {shopAction === `accept-accessory-${transfer.id}`
                                  ? t('economyProcessing')
                                  : t('economyAcceptButton')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectAccessoryTransfer(transfer.id)}
                                disabled={shopAction === `reject-accessory-${transfer.id}`}
                                className="rounded-full bg-rose-400 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-rose-500 disabled:bg-rose-200"
                              >
                                {shopAction === `reject-accessory-${transfer.id}`
                                  ? t('economyProcessing')
                                  : t('economyRejectButton')}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {outgoingAccessoryTransfers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t('economyPendingAccessoriesOutgoingLabel')}
                      </h5>
                      {outgoingAccessoryTransfers.map((transfer) => {
                        const accessoryInfo = accessoryList.find((item) => item.id === transfer.accesorio_id);
                        return (
                          <p key={transfer.id} className="text-xs text-slate-600">
                            {t('economyAccessoryTransferToLabel', {
                              name: transfer.destinatario?.nombre_usuario || t('communityUnknownUser'),
                              item: accessoryInfo?.nombre || transfer.accesorio_id,
                              amount: transfer.cantidad,
                            })}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-0 mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {garden.plantas?.map((plant) => {
            const typeLabel = getEventTypeLabel(plant.tipo, t);
            return (
              <article key={plant.id} className="rounded-2xl bg-white/80 p-4 shadow">
                <h3 className="text-lg font-semibold text-gardenSoil">{plant.nombre}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gardenGreen">
                  {plant.categoria || t('gardenNoCategory')}
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
                  {typeLabel}
                </span>
                <p className="mt-2 text-sm text-slate-700">{plant.descripcion || t('gardenNoDescription')}</p>
                <time className="mt-3 block text-xs text-slate-500">
                  {new Date(plant.fecha_plantado).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </time>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    onClick={() => startEditing(plant)}
                  >
                    {t('gardenEditButton')}
                  </button>
                  <button
                    className="rounded-full bg-rose-100 px-4 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-200"
                    onClick={() => handleDelete(plant.id)}
                    disabled={submitting}
                  >
                    {t('gardenDeleteButton')}
                  </button>
                </div>
              </article>
            );
          })}
          {garden.plantas?.length === 0 && (
            <p className="text-sm text-slate-600">{t('gardenNoEvents')}</p>
          )}
        </div>
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gardenGreen">{t('gardenFormTitle')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('gardenFormDescription')}</p>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="nombre">
                  {t('gardenFormName')}
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
                  {t('gardenFormCategory')}
                </label>
                <input
                  id="categoria"
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  list="categorias-sugeridas"
                  placeholder={t('gardenFormCategoryPlaceholder')}
                  required
                />
                <datalist id="categorias-sugeridas">
                  {categorySuggestions.map((categoria) => (
                    <option key={categoria} value={categoria} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="tipo">
                  {t('gardenFormType')}
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                >
                  <option value="positivo">{t('gardenTypePositive')}</option>
                  <option value="negativo">{t('gardenTypeNegative')}</option>
                  <option value="neutro">{t('gardenTypeNeutral')}</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="descripcion">
                  {t('gardenFormDescriptionLabel')}
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="h-24 w-full rounded-2xl border border-slate-200 px-4 py-2 focus:border-gardenGreen focus:outline-none"
                  placeholder={t('gardenFormDescriptionPlaceholder')}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={() => setFormOpen(false)}
                >
                  {t('gardenFormCancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? t('gardenFormSaving') : t('gardenFormSave')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gardenGreen">{t('gardenEditTitle')}</h3>
            <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600" htmlFor="descripcionEditar">
                  {t('gardenFormDescriptionLabel')}
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
                  {t('gardenEditCancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-gardenGreen px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? t('gardenFormSaving') : t('gardenEditUpdate')}
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
