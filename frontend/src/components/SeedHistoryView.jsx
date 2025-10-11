import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const SeedHistoryView = () => {
  const { getSeedTransferHistory, user } = useAuth();
  const { t, locale } = useLanguage();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDateTime = useCallback(
    (value) =>
      value
        ? new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
        : '',
    [locale]
  );

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
  }, [loadHistory]);

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

  const getStatusLabel = useCallback(
    (status) => statusLabels[status] || t('economySeedHistoryStatusUnknown'),
    [statusLabels, t]
  );

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
            onClick={loadHistory}
            className="self-start rounded-full bg-gardenGreen px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
          >
            {t('economySeedHistoryRefresh')}
          </button>
        </div>
      </header>

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
