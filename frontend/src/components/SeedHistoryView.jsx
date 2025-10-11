import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const emptySeedOverview = {
  semillas: 0,
  transferencias: [],
};

const SeedHistoryView = () => {
  const {
    getSeedTransferHistory,
    getEconomyOverview,
    transferSeeds,
    acceptSeedTransfer,
    rejectSeedTransfer,
    user,
  } = useAuth();
  const { t, locale } = useLanguage();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seedOverview, setSeedOverview] = useState(emptySeedOverview);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);
  const [seedAction, setSeedAction] = useState(null);
  const [seedFeedback, setSeedFeedback] = useState(null);
  const [seedGiftForm, setSeedGiftForm] = useState({ destinatario: '', cantidad: 1, mensaje: '' });

  const formatDateTime = useCallback(
    (value) =>
      value
        ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
        : '',
    [locale]
  );

  const loadSeedOverview = useCallback(async () => {
    if (!getEconomyOverview) return;
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await getEconomyOverview();
      setSeedOverview({
        semillas: data?.semillas ?? 0,
        transferencias: Array.isArray(data?.transferencias?.semillas)
          ? data.transferencias.semillas
          : [],
      });
    } catch (err) {
      setSeedOverview(emptySeedOverview);
      setOverviewError(t('economyOverviewError'));
    } finally {
      setOverviewLoading(false);
    }
  }, [getEconomyOverview, t]);

  const loadHistory = useCallback(async () => {
    if (!getSeedTransferHistory) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSeedTransferHistory();
      setHistory(Array.isArray(data?.transferencias) ? data.transferencias : []);
    } catch (err) {
      setError(t('economySeedHistoryError'));
    } finally {
      setLoading(false);
    }
  }, [getSeedTransferHistory, t]);

  useEffect(() => {
    loadHistory();
    loadSeedOverview();
  }, [loadHistory, loadSeedOverview]);

  const statusLabels = useMemo(
    () => ({
      pendiente: t('economySeedHistoryStatusPending'),
      aceptado: t('economySeedHistoryStatusAccepted'),
      rechazado: t('economySeedHistoryStatusRejected'),
    }),
    [t]
  );

  const resolvedHistory = useMemo(() => {
    const storeName = t('economySeedHistoryStoreName');

    return history.map((transfer) => {
      const isStoreEvent = transfer.remitente_id && transfer.destinatario_id
        ? transfer.remitente_id === transfer.destinatario_id
        : false;

      let isSender = transfer.remitente_id === user?.id;
      let counterpartName = isSender
        ? transfer.destinatario?.nombre_usuario
        : transfer.remitente?.nombre_usuario;
      let message = transfer.mensaje;

      if (isStoreEvent) {
        counterpartName = storeName;

        if (typeof transfer.mensaje === 'string') {
          if (transfer.mensaje.startsWith('[compra]')) {
            isSender = true;
            message = transfer.mensaje.replace('[compra]', '').trim();
          } else if (transfer.mensaje.startsWith('[venta]')) {
            isSender = false;
            message = transfer.mensaje.replace('[venta]', '').trim();
          }
        }
      }

      if (!counterpartName) {
        counterpartName = t('communityUnknownUser');
      }

      return {
        ...transfer,
        isSender,
        counterpartName,
        mensaje: message,
      };
    });
  }, [history, t, user?.id]);

  const seedTransfers = useMemo(
    () => (Array.isArray(seedOverview.transferencias) ? seedOverview.transferencias : []),
    [seedOverview.transferencias]
  );

  const incomingSeedTransfers = useMemo(
    () => seedTransfers.filter((transfer) => transfer.destinatario_id === user?.id),
    [seedTransfers, user?.id]
  );

  const outgoingSeedTransfers = useMemo(
    () => seedTransfers.filter((transfer) => transfer.remitente_id === user?.id),
    [seedTransfers, user?.id]
  );

  const getStatusLabel = useCallback(
    (status) => statusLabels[status] || t('economySeedHistoryStatusUnknown'),
    [statusLabels, t]
  );

  const handleSeedGiftChange = (event) => {
    const { name, value } = event.target;
    setSeedGiftForm((prev) => ({ ...prev, [name]: value }));
  };

  const refreshData = useCallback(() => {
    loadHistory();
    loadSeedOverview();
  }, [loadHistory, loadSeedOverview]);

  const handleSeedTransfer = async (event) => {
    event.preventDefault();
    const cantidad = Number.parseInt(seedGiftForm.cantidad, 10);
    if (!seedGiftForm.destinatario.trim() || Number.isNaN(cantidad) || cantidad <= 0) {
      setOverviewError(t('economySeedTransferError'));
      return;
    }

    setSeedAction('seed-transfer');
    setOverviewError(null);
    setSeedFeedback(null);
    try {
      await transferSeeds({
        destinatario: seedGiftForm.destinatario.trim(),
        cantidad,
        mensaje: seedGiftForm.mensaje.trim(),
      });
      setSeedGiftForm({ destinatario: '', cantidad: 1, mensaje: '' });
      setSeedFeedback(t('economySeedTransferSuccess'));
    } catch (err) {
      setOverviewError(err.response?.data?.error || t('economySeedTransferError'));
    } finally {
      setSeedAction(null);
      await loadSeedOverview();
      await loadHistory();
    }
  };

  const handleAcceptSeedTransfer = async (transferId) => {
    setSeedAction(`accept-seed-${transferId}`);
    setOverviewError(null);
    setSeedFeedback(null);
    try {
      await acceptSeedTransfer(transferId);
      setSeedFeedback(t('economyAcceptTransferSuccess'));
    } catch (err) {
      setOverviewError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setSeedAction(null);
      await loadSeedOverview();
      await loadHistory();
    }
  };

  const handleRejectSeedTransfer = async (transferId) => {
    setSeedAction(`reject-seed-${transferId}`);
    setOverviewError(null);
    setSeedFeedback(null);
    try {
      await rejectSeedTransfer(transferId);
      setSeedFeedback(t('economyRejectTransferSuccess'));
    } catch (err) {
      setOverviewError(err.response?.data?.error || t('economyTransferUpdateError'));
    } finally {
      setSeedAction(null);
      await loadSeedOverview();
      await loadHistory();
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-3xl bg-white/90 p-6 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gardenGreen">{t('economySeedHistoryTitle')}</h2>
            <p className="mt-1 text-sm text-slate-600">{t('economySeedHistorySubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={refreshData}
            className="self-start rounded-full bg-gardenGreen px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            {t('economySeedHistoryRefresh')}
          </button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-bold text-gardenGreen">{t('economySeedTransferTitle')}</h3>
            {overviewLoading && (
              <span className="text-xs font-semibold text-slate-500">{t('economyLoading')}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{t('economySeedTransferSubtitle')}</p>
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('economySeedsLabel')}
            </p>
            <p className="mt-1 text-2xl font-bold text-gardenGreen">
              {overviewLoading ? t('economyLoading') : seedOverview.semillas}
            </p>
          </div>

          {overviewError && (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600" role="alert">
              {overviewError}
            </p>
          )}
          {seedFeedback && !overviewError && (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600">{seedFeedback}</p>
          )}

          <form className="mt-4 space-y-3" onSubmit={handleSeedTransfer}>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="destinatario">
                {t('economySeedTransferRecipient')}
              </label>
              <input
                id="destinatario"
                name="destinatario"
                value={seedGiftForm.destinatario}
                onChange={handleSeedGiftChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow focus:border-gardenGreen focus:outline-none focus:ring-2 focus:ring-gardenGreen/40"
                placeholder={t('economySeedTransferRecipientPlaceholder')}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="cantidad">
                  {t('economySeedTransferAmount')}
                </label>
                <input
                  id="cantidad"
                  name="cantidad"
                  type="number"
                  min="1"
                  value={seedGiftForm.cantidad}
                  onChange={handleSeedGiftChange}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow focus:border-gardenGreen focus:outline-none focus:ring-2 focus:ring-gardenGreen/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="mensaje">
                  {t('economySeedTransferMessage')}
                </label>
                <input
                  id="mensaje"
                  name="mensaje"
                  value={seedGiftForm.mensaje}
                  onChange={handleSeedGiftChange}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm shadow focus:border-gardenGreen focus:outline-none focus:ring-2 focus:ring-gardenGreen/40"
                  placeholder={t('economySeedTransferMessagePlaceholder')}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={seedAction === 'seed-transfer' || overviewLoading}
              className="w-full rounded-full bg-gardenGreen px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 disabled:bg-emerald-200"
            >
              {seedAction === 'seed-transfer' ? t('economyProcessing') : t('economySeedTransferSubmit')}
            </button>
          </form>

        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gardenGreen">{t('economyPendingSeedsLabel')}</h3>
          {overviewLoading && (
            <p className="mt-1 text-sm text-slate-600">{t('economySeedHistoryLoading')}</p>
          )}
          {!overviewLoading && incomingSeedTransfers.length === 0 && outgoingSeedTransfers.length === 0 && (
            <p className="mt-1 text-sm text-slate-600">{t('economyNoPendingSeeds')}</p>
          )}
          <div className="mt-4 space-y-4">
            {incomingSeedTransfers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gardenSoil">
                  {t('economyPendingSeedsIncomingLabel')}
                </h4>
                <ul className="space-y-2">
                  {incomingSeedTransfers.map((transfer) => (
                    <li key={transfer.id} className="rounded-2xl bg-emerald-50 p-3 shadow-sm">
                      <p className="text-sm font-semibold text-emerald-700">
                        {t('economySeedTransferFromLabel', {
                          name: transfer.remitente?.nombre_usuario || t('communityUnknownUser'),
                          amount: transfer.cantidad,
                        })}
                      </p>
                      <p className="mt-1 text-xs text-emerald-700">{formatDateTime(transfer.fecha_creacion)}</p>
                      {transfer.mensaje && (
                        <p className="mt-1 text-xs text-emerald-700">{transfer.mensaje}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptSeedTransfer(transfer.id)}
                          disabled={seedAction === `accept-seed-${transfer.id}`}
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-emerald-600 disabled:bg-emerald-200"
                        >
                          {seedAction === `accept-seed-${transfer.id}`
                            ? t('economyProcessing')
                            : t('economyAcceptButton')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectSeedTransfer(transfer.id)}
                          disabled={seedAction === `reject-seed-${transfer.id}`}
                          className="rounded-full bg-rose-400 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-rose-500 disabled:bg-rose-200"
                        >
                          {seedAction === `reject-seed-${transfer.id}`
                            ? t('economyProcessing')
                            : t('economyRejectButton')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {outgoingSeedTransfers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gardenSoil">
                  {t('economyPendingSeedsOutgoingLabel')}
                </h4>
                <ul className="space-y-2">
                  {outgoingSeedTransfers.map((transfer) => (
                    <li key={transfer.id} className="rounded-2xl bg-slate-50 p-3 shadow-sm">
                      <p className="text-sm font-semibold text-slate-700">
                        {t('economySeedTransferToLabel', {
                          name: transfer.destinatario?.nombre_usuario || t('communityUnknownUser'),
                          amount: transfer.cantidad,
                        })}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{formatDateTime(transfer.fecha_creacion)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-6 shadow-lg">
        {loading && <p className="text-sm text-slate-600">{t('economySeedHistoryLoading')}</p>}
        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && resolvedHistory.length === 0 && (
          <p className="text-sm text-slate-600">{t('economySeedHistoryEmpty')}</p>
        )}

        <ul className="space-y-4">
          {resolvedHistory.map((transfer) => {
            const amountPrefix = transfer.isSender ? '-' : '+';
            const amountClass = transfer.isSender ? 'text-rose-600' : 'text-emerald-600';

            return (
              <li key={transfer.id} className="rounded-2xl bg-white p-4 shadow">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gardenSoil">
                      {transfer.isSender
                        ? t('economySeedHistorySent', {
                            amount: transfer.cantidad,
                            name: transfer.counterpartName,
                          })
                        : t('economySeedHistoryReceived', {
                            amount: transfer.cantidad,
                            name: transfer.counterpartName,
                          })}
                    </p>
                    <p className={`text-sm font-semibold ${amountClass}`}>
                      {amountPrefix}
                      {transfer.cantidad} 🌱
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold">{t('economySeedHistoryDateLabel')}:</span>{' '}
                      {formatDateTime(transfer.fecha_creacion)}
                    </p>
                    {transfer.mensaje && (
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold">{t('economySeedHistoryMessageLabel')}:</span>{' '}
                        {transfer.mensaje}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex h-8 items-center justify-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700">
                    {getStatusLabel(transfer.estado)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default SeedHistoryView;
