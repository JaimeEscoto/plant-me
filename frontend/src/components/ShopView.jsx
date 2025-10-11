import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const emptyEconomy = {
  semillas: 0,
  medalla_compras: 0,
  accesorios: [],
  transferencias: { semillas: [], accesorios: [] },
};

const ShopView = () => {
  const {
    garden,
    getEconomyOverview,
    purchaseAccessory,
    sellAccessory,
    transferAccessory,
    setGarden,
    user,
  } = useAuth();
  const { t } = useLanguage();

  const [economy, setEconomy] = useState(emptyEconomy);
  const [economyLoading, setEconomyLoading] = useState(false);
  const [economyError, setEconomyError] = useState(null);
  const [shopFeedback, setShopFeedback] = useState(null);
  const [shopAction, setShopAction] = useState(null);

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
      setEconomy(emptyEconomy);
    } finally {
      setEconomyLoading(false);
    }
  }, [getEconomyOverview, t]);

  useEffect(() => {
    loadEconomy();
  }, [loadEconomy]);

  const accessoryList = useMemo(
    () => (Array.isArray(economy.accesorios) ? economy.accesorios : []),
    [economy.accesorios]
  );

  const localizedAccessoryList = useMemo(
    () =>
      accessoryList.map((item) => {
        const nameKey = `economyAccessory_${item.id}_name`;
        const descriptionKey = `economyAccessory_${item.id}_description`;
        const translatedName = t(nameKey);
        const translatedDescription = t(descriptionKey);
        return {
          ...item,
          nombre: translatedName === nameKey ? item.nombre : translatedName,
          descripcion:
            translatedDescription === descriptionKey ? item.descripcion : translatedDescription,
        };
      }),
    [accessoryList, t]
  );

  const accessoryTransfers = useMemo(
    () =>
      Array.isArray(economy.transferencias?.accesorios)
        ? economy.transferencias.accesorios
        : [],
    [economy.transferencias?.accesorios]
  );

  const outgoingAccessoryTransfers = useMemo(
    () => accessoryTransfers.filter((transfer) => transfer.remitente_id === user?.id),
    [accessoryTransfers, user?.id]
  );

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
          const updatedAccessories = Array.isArray(data?.accesorios)
            ? data.accesorios
            : Array.isArray(data?.jardin?.accesorios)
            ? data.jardin.accesorios
            : null;
          if (updatedAccessories) {
            updated.accesorios = updatedAccessories;
          }
          return updated;
        });
      }
      if (typeof data?.semillas === 'number' || typeof data?.medalla_compras === 'number') {
        setEconomy((prev) => ({
          ...prev,
          semillas: typeof data.semillas === 'number' ? data.semillas : prev.semillas,
          medalla_compras:
            typeof data.medalla_compras === 'number'
              ? data.medalla_compras
              : prev.medalla_compras,
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

  if (!garden) {
    return <p className="text-center text-lg text-slate-500">{t('gardenLoading')}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white/90 p-6 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gardenGreen">{t('economyShopTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('economyMedalDescription')}</p>
          </div>
          {economyLoading && (
            <span className="text-xs font-semibold text-slate-500">{t('economyLoading')}</span>
          )}
        </div>
        {economyError && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">{economyError}</p>
        )}
        {shopFeedback && !economyError && (
          <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{shopFeedback}</p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('economySeedsLabel')}
            </p>
            <p className="mt-1 text-2xl font-bold text-gardenGreen">
              {economyLoading ? t('economyLoading') : economy.semillas}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 px-4 py-3 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
              {t('economyMedalLabel')}
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-500">
              🏅 {economyLoading ? t('economyLoading') : economy.medalla_compras}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-bold text-gardenGreen">{t('economyShopTitle')}</h3>
            {economyLoading && (
              <span className="text-xs font-semibold text-slate-500">{t('economyLoading')}</span>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {localizedAccessoryList.map((item) => {
              const canAfford = economy.semillas >= item.precio;
              const purchaseLoading = shopAction === item.id;
              const sellKey = `sell-${item.id}`;
              const transferKey = `transfer-${item.id}`;
              const selling = shopAction === sellKey;
              const transferring = shopAction === transferKey;
              const sellValue = Math.floor((item.precio || 0) / 2);
              return (
                <article key={item.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
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
                      disabled={selling || economyLoading}
                      className={`rounded-full px-4 py-1 text-sm font-semibold text-amber-600 shadow transition ${
                        selling || economyLoading ? 'bg-amber-200' : 'bg-amber-100 hover:bg-amber-200'
                      }`}
                    >
                      {selling ? t('economyProcessing') : t('economySellButton', { value: sellValue })}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccessoryTransfer(item.id)}
                      disabled={transferring || economyLoading}
                      className={`rounded-full px-4 py-1 text-sm font-semibold text-sky-600 shadow transition ${
                        transferring || economyLoading ? 'bg-sky-200' : 'bg-sky-100 hover:bg-sky-200'
                      }`}
                    >
                      {transferring ? t('economyProcessing') : t('economyAccessoryTransferButton')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
          <h4 className="text-lg font-semibold text-gardenSoil">{t('economyAccessoryTransfersTitle')}</h4>
          {outgoingAccessoryTransfers.length > 0 ? (
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
          ) : (
            <p className="mt-3 text-sm text-slate-600">{t('economyNoPendingAccessories')}</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ShopView;
