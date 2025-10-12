import React, { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEventTypes } from '../context/EventTypeContext';
import { useEventCategories } from '../context/EventCategoryContext';

const SummaryCard = ({ title, value, helper, accent }) => (
  <div className="relative overflow-hidden rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5">
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
    />
    <div className="flex items-start justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {accent ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-lg">
          {accent}
        </span>
      ) : null}
    </div>
    <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
    {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
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
          {items.map((item, index) => {
            const value = getValue(item);
            const percentage = maxValue ? Math.round((value / maxValue) * 100) : 0;
            const width = value > 0 ? Math.max(8, Math.min(100, percentage)) : 0;
            return (
              <li key={`${getLabel(item)}-${index}`} className="space-y-1">
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

const TrendSparkline = ({ data, colorFrom, colorTo, lineColor }) => {
  const gradientId = useId();
  const safeData = data.length <= 1 ? [...data, ...data] : data;
  const dataset = safeData.length ? safeData : [0, 0];
  const minValue = Math.min(...dataset);
  const maxValue = Math.max(...dataset);
  const verticalRange = maxValue - minValue || 1;

  const points = dataset.map((value, index) => {
    const x = (index / (dataset.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / verticalRange) * 100;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorFrom} stopOpacity="0.45" />
          <stop offset="100%" stopColor={colorTo} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const DonutChart = ({ seedsAngle, accessoriesAngle, hasData, centerLabel, centerValue }) => (
  <div className="relative mx-auto h-40 w-40">
    <div
      aria-hidden="true"
      className="absolute inset-0 rounded-full shadow-inner"
      style={{
        background: hasData
          ? `conic-gradient(#047857 0deg ${seedsAngle}deg, #10b981 ${seedsAngle}deg ${seedsAngle + accessoriesAngle}deg, rgba(226,232,240,1) ${seedsAngle + accessoriesAngle}deg 360deg)`
          : 'conic-gradient(rgba(226,232,240,1) 0deg 360deg)',
      }}
    />
    <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
      <p className="text-xs font-medium text-slate-500">{centerLabel}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{centerValue}</p>
    </div>
  </div>
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
  const percentageFormatter = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }), [locale]);
  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
      }),
    [locale]
  );
  const weekdayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'short',
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

  const resumen = data?.resumen || {};
  const semillas = data?.semillas || {};
  const eventos = data?.eventos || {};

  const transferTrend = useMemo(() => {
    if (!Array.isArray(semillas.transferenciasRecientes)) {
      return [];
    }

    const grouped = new Map();

    semillas.transferenciasRecientes.forEach((transfer) => {
      if (!transfer?.fecha_creacion) return;
      const date = new Date(transfer.fecha_creacion);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      const currentValue = grouped.get(key) || 0;
      grouped.set(key, currentValue + (transfer.cantidad || 0));
    });

    return Array.from(grouped.entries())
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7)
      .map(([key, total]) => {
        const parsedDate = new Date(key);
        return {
          key,
          total,
          label: `${weekdayFormatter.format(parsedDate)} ${shortDateFormatter.format(parsedDate)}`,
        };
      });
  }, [semillas.transferenciasRecientes, shortDateFormatter, weekdayFormatter]);

  const eventTrend = useMemo(() => {
    if (!Array.isArray(eventos.recientes)) {
      return [];
    }

    const grouped = new Map();

    eventos.recientes.forEach((event) => {
      if (!event?.fecha_plantado) return;
      const date = new Date(event.fecha_plantado);
      if (Number.isNaN(date.getTime())) return;
      const key = date.toISOString().slice(0, 10);
      const currentValue = grouped.get(key) || 0;
      grouped.set(key, currentValue + 1);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7)
      .map(([key, total]) => {
        const parsedDate = new Date(key);
        return {
          key,
          total,
          label: `${weekdayFormatter.format(parsedDate)} ${shortDateFormatter.format(parsedDate)}`,
        };
      });
  }, [eventos.recientes, shortDateFormatter, weekdayFormatter]);

  const transferSparklineData = transferTrend.map((item) => item.total);
  const eventSparklineData = eventTrend.map((item) => item.total);
  const transferTotal = transferTrend.reduce((sum, item) => sum + item.total, 0);
  const eventsTotal = eventTrend.reduce((sum, item) => sum + item.total, 0);
  const lastTransferEntry = transferTrend[transferTrend.length - 1];
  const lastEventEntry = eventTrend[eventTrend.length - 1];

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

  const totalSeedsMoved = resumen.totalSemillasTransferidas || 0;
  const totalAccessoriesMoved = resumen.totalAccesoriosTransferidos || 0;
  const totalResources = totalSeedsMoved + totalAccessoriesMoved;
  const hasResourceData = totalResources > 0;
  const seedsAngle = hasResourceData ? (totalSeedsMoved / totalResources) * 360 : 0;
  const accessoriesAngle = hasResourceData ? (totalAccessoriesMoved / totalResources) * 360 : 0;
  const seedsPercentage = hasResourceData ? (totalSeedsMoved / totalResources) * 100 : 0;
  const accessoriesPercentage = hasResourceData ? (totalAccessoriesMoved / totalResources) * 100 : 0;
  const seedsPercentageLabel = `${percentageFormatter.format(seedsPercentage)}%`;
  const accessoriesPercentageLabel = `${percentageFormatter.format(accessoriesPercentage)}%`;
  const resourcesHelperText = hasResourceData
    ? t('adminResourceDistributionHelper')
    : t('adminResourceNoMovement');
  const transferHelperText = transferTrend.length
    ? t('adminTrendWindowLabel', { count: transferTrend.length })
    : t('adminTrendInsufficientData');
  const eventHelperText = eventTrend.length
    ? t('adminTrendWindowLabel', { count: eventTrend.length })
    : t('adminTrendInsufficientData');
  const transferTotalText = t('adminTrendTotalSeeds', {
    value: numberFormatter.format(transferTotal),
  });
  const eventTotalText = t('adminTrendTotalEvents', {
    value: numberFormatter.format(eventsTotal),
  });
  const transferLastText = lastTransferEntry
    ? t('adminTrendLastTransfer', {
        value: numberFormatter.format(lastTransferEntry.total || 0),
        date: lastTransferEntry.label,
      })
    : null;
  const eventLastText = lastEventEntry
    ? t('adminTrendLastEventCount', {
        value: numberFormatter.format(lastEventEntry.total || 0),
        date: lastEventEntry.label,
      })
    : null;
  const resourceCenterValue = numberFormatter.format(totalResources);
  const resourceCenterLabel = t('adminResourceTotal');
  const seedsLegendText = t('adminResourceSeedsLabel', {
    value: numberFormatter.format(totalSeedsMoved),
    percentage: seedsPercentageLabel,
  });
  const accessoriesLegendText = t('adminResourceAccessoriesLabel', {
    value: numberFormatter.format(totalAccessoriesMoved),
    percentage: accessoriesPercentageLabel,
  });
  const renderAccent = (classes) => (
    <span aria-hidden="true" className={`block h-5 w-5 rounded-full bg-gradient-to-br ${classes} shadow`} />
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">{t('adminDashboardTitle')}</h2>
        <p className="text-sm text-slate-600">{t('adminDashboardSubtitle')}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title={t('adminStatsUsers')}
          value={numberFormatter.format(resumen.totalUsuarios || 0)}
          accent={renderAccent('from-emerald-400 via-emerald-500 to-teal-500')}
        />
        <SummaryCard
          title={t('adminStatsSeeds')}
          value={`${numberFormatter.format(resumen.totalSemillas || 0)} 🌱`}
          accent={renderAccent('from-teal-400 via-emerald-500 to-lime-400')}
        />
        <SummaryCard
          title={t('adminStatsHealth')}
          value={`${decimalFormatter.format(resumen.saludPromedioJardines || 0)}%`}
          accent={renderAccent('from-amber-300 via-orange-400 to-rose-400')}
        />
        <SummaryCard
          title={t('adminStatsEvents')}
          value={numberFormatter.format(resumen.totalEventos || 0)}
          accent={renderAccent('from-sky-400 via-emerald-400 to-indigo-400')}
        />
        <SummaryCard
          title={t('adminStatsTransfers')}
          value={`${numberFormatter.format(resumen.totalSemillasTransferidas || 0)} 🌱`}
          accent={renderAccent('from-emerald-500 via-teal-500 to-emerald-600')}
        />
        <SummaryCard
          title={t('adminStatsAccessories')}
          value={numberFormatter.format(resumen.totalAccesoriosTransferidos || 0)}
          accent={renderAccent('from-purple-400 via-violet-500 to-sky-400')}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-white p-6 shadow-sm ring-1 ring-emerald-100">
          <h3 className="text-sm font-semibold text-emerald-700">{t('adminResourceDistribution')}</h3>
          <p className="mt-2 text-sm text-slate-600">{resourcesHelperText}</p>
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
            <DonutChart
              seedsAngle={seedsAngle}
              accessoriesAngle={accessoriesAngle}
              hasData={hasResourceData}
              centerLabel={resourceCenterLabel}
              centerValue={resourceCenterValue}
            />
            <div className="flex-1 space-y-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <div>
                  <p className="font-medium text-slate-700">{seedsLegendText}</p>
                  <p className="text-xs text-slate-500">{t('adminTrendTotalSeeds', { value: numberFormatter.format(totalSeedsMoved) })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                <div>
                  <p className="font-medium text-slate-700">{accessoriesLegendText}</p>
                  <p className="text-xs text-slate-500">{t('adminResourceAccessoriesTotal', { value: numberFormatter.format(totalAccessoriesMoved) })}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-slate-700">{t('adminSeedsOverview')}</h3>
            <p className="text-xs text-slate-500">{transferHelperText}</p>
          </div>
          <div className="relative mt-6 h-32 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:16px_16px]" />
            {transferTrend.length ? (
              <TrendSparkline
                data={transferSparklineData}
                colorFrom="#34d399"
                colorTo="#dcfce7"
                lineColor="#047857"
              />
            ) : (
              <div className="relative z-10 flex h-full items-center justify-center text-xs font-medium text-slate-400">
                {t('adminTrendInsufficientData')}
              </div>
            )}
          </div>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>{transferTotalText}</li>
            {transferLastText ? <li>{transferLastText}</li> : null}
          </ul>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-slate-700">{t('adminEventsActivityTitle')}</h3>
            <p className="text-xs text-slate-500">{eventHelperText}</p>
          </div>
          <div className="relative mt-6 h-32 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:16px_16px]" />
            {eventTrend.length ? (
              <TrendSparkline
                data={eventSparklineData}
                colorFrom="#c4b5fd"
                colorTo="#ede9fe"
                lineColor="#7c3aed"
              />
            ) : (
              <div className="relative z-10 flex h-full items-center justify-center text-xs font-medium text-slate-400">
                {t('adminTrendInsufficientData')}
              </div>
            )}
          </div>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>{eventTotalText}</li>
            {eventLastText ? <li>{eventLastText}</li> : null}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-slate-900">{t('adminSeedsLeaderboard')}</h3>
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
