import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEventTypes } from '../context/EventTypeContext';
import { useEventCategories } from '../context/EventCategoryContext';

const SummaryCard = ({ title, value, helper }) => (
  <div className="rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-white/60">
    <p className="text-sm font-medium text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
  </div>
);

const HorizontalBarList = ({
  title,
  items,
  getLabel,
  getValue,
  formatNumber,
  emptyLabel,
}) => {
  const maxValue = items.length ? Math.max(...items.map((item) => getValue(item))) : 0;

  return (
    <section className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const value = getValue(item);
            const percentage = maxValue ? Math.round((value / maxValue) * 100) : 0;
            const width = value > 0 ? Math.max(8, Math.min(100, percentage)) : 0;
            return (
              <li key={getLabel(item)} className="space-y-1">
                <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>{getLabel(item)}</span>
                  <span>{formatNumber(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const StatusPill = ({ label }) => (
  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
    {label}
  </span>
);

const AdminDashboard = () => {
  const { getAdminDashboard } = useAuth();
  const { t, locale } = useLanguage();
  const { getLabelForType } = useEventTypes();
  const { getLabelForCategory } = useEventCategories();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const decimalFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale]);
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale]
  );

  const translateEventType = useCallback((tipo) => getLabelForType(tipo), [getLabelForType]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAdminDashboard();
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err?.response?.data?.error || t('adminDashboardError');
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [getAdminDashboard, t]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/70 p-10 text-center text-slate-600 shadow-sm ring-1 ring-white/60">
        {t('adminLoading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-center text-sm text-red-600 ring-1 ring-red-100">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-white/70 p-10 text-center text-slate-600 shadow-sm ring-1 ring-white/60">
        {t('adminNoData')}
      </div>
    );
  }

  const resumen = data.resumen || {};
  const semillas = data.semillas || {};
  const eventos = data.eventos || {};

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{t('adminDashboardTitle')}</h2>
        <p className="text-sm text-slate-600">{t('adminDashboardSubtitle')}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title={t('adminStatsUsers')} value={numberFormatter.format(resumen.totalUsuarios || 0)} />
        <SummaryCard
          title={t('adminStatsSeeds')}
          value={`${numberFormatter.format(resumen.totalSemillas || 0)} 🌱`}
        />
        <SummaryCard
          title={t('adminStatsHealth')}
          value={`${decimalFormatter.format(resumen.saludPromedioJardines || 0)}%`}
        />
        <SummaryCard title={t('adminStatsEvents')} value={numberFormatter.format(resumen.totalEventos || 0)} />
        <SummaryCard
          title={t('adminStatsTransfers')}
          value={`${numberFormatter.format(resumen.totalSemillasTransferidas || 0)} 🌱`}
        />
        <SummaryCard
          title={t('adminStatsAccessories')}
          value={numberFormatter.format(resumen.totalAccesoriosTransferidos || 0)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">{t('adminSeedsOverview')}</h3>
          <HorizontalBarList
            title={t('adminSeedsTopSenders')}
            items={semillas.topRemitentes || []}
            getLabel={(item) => item.nombre_usuario || t('adminUnknownUser')}
            getValue={(item) => item.total || 0}
            formatNumber={(value) => `${numberFormatter.format(value)} 🌱`}
            emptyLabel={t('adminNoData')}
          />
          <HorizontalBarList
            title={t('adminSeedsTopReceivers')}
            items={semillas.topDestinatarios || []}
            getLabel={(item) => item.nombre_usuario || t('adminUnknownUser')}
            getValue={(item) => item.total || 0}
            formatNumber={(value) => `${numberFormatter.format(value)} 🌱`}
            emptyLabel={t('adminNoData')}
          />
          <HorizontalBarList
            title={t('adminSeedsTopMovers')}
            items={semillas.topMovimientos || []}
            getLabel={(item) => item.nombre_usuario || t('adminUnknownUser')}
            getValue={(item) => item.total || 0}
            formatNumber={(value) => `${numberFormatter.format(value)} 🌱`}
            emptyLabel={t('adminNoData')}
          />
        </div>

        <section className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60">
          <h3 className="text-lg font-semibold text-slate-900">{t('adminSeedsRecent')}</h3>
          {Array.isArray(semillas.transferenciasRecientes) && semillas.transferenciasRecientes.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {semillas.transferenciasRecientes.map((transfer) => {
                const fromName = transfer.remitente?.nombre_usuario || t('adminUnknownUser');
                const toName = transfer.destinatario?.nombre_usuario || t('adminUnknownUser');
                const statusKey = `adminTransferStatus_${transfer.estado || ''}`;
                const statusLabel = t(statusKey);

                return (
                  <li key={transfer.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {t('adminRecentTransferLabel', { from: fromName, to: toName })}
                      </p>
                      <StatusPill label={statusLabel} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {numberFormatter.format(transfer.cantidad || 0)} 🌱 ·{' '}
                      {dateTimeFormatter.format(new Date(transfer.fecha_creacion))}
                    </p>
                    {transfer.mensaje ? (
                      <p className="mt-1 text-xs text-slate-500">{transfer.mensaje}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{t('adminNoData')}</p>
          )}
        </section>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <HorizontalBarList
          title={t('adminEventsByType')}
          items={eventos.porTipo || []}
          getLabel={(item) => translateEventType(item.tipo)}
          getValue={(item) => item.cantidad || 0}
          formatNumber={(value) => numberFormatter.format(value)}
          emptyLabel={t('adminNoData')}
        />
        <HorizontalBarList
          title={t('adminEventsTopUsers')}
          items={eventos.usuariosDestacados || []}
          getLabel={(item) => item.nombre_usuario || t('adminUnknownUser')}
          getValue={(item) => item.total || 0}
          formatNumber={(value) => numberFormatter.format(value)}
          emptyLabel={t('adminNoData')}
        />
        <HorizontalBarList
          title={t('adminEventsAccessoriesTop')}
          items={eventos.accesoriosDestacados || []}
          getLabel={(item) => item.nombre_usuario || t('adminUnknownUser')}
          getValue={(item) => item.total || 0}
          formatNumber={(value) => numberFormatter.format(value)}
          emptyLabel={t('adminNoData')}
        />
      </section>

      <section className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60">
        <h3 className="text-lg font-semibold text-slate-900">{t('adminEventsRecent')}</h3>
        {Array.isArray(eventos.recientes) && eventos.recientes.length > 0 ? (
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {eventos.recientes.map((event) => {
              const ownerName = event.usuario?.nombre_usuario || t('adminUnknownUser');
              const label = t('adminRecentEventLabel', {
                user: ownerName,
                event: event.nombre || translateEventType(event.tipo),
              });
              return (
                <li key={event.id} className="rounded-xl border border-slate-100 p-4">
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {translateEventType(event.tipo)} ·{' '}
                    {dateTimeFormatter.format(new Date(event.fecha_plantado))}
                  </p>
                  {event.categoria ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {getLabelForCategory(event.categoria)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">{t('adminNoData')}</p>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
