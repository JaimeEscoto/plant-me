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

const ScatterPlot = ({ data, colors, legend, xLabel, yLabel, formatX, formatY, emptyLabel }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>;
  }

  const xValues = data.map((item) => Number.parseFloat(item.antiguedad_dias) || 0);
  const yValues = data.map((item) => Number.parseFloat(item.semillas) || 0);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;
  const margin = 10;

  const points = data.map((item, index) => {
    const rawX = Number.parseFloat(item.antiguedad_dias) || 0;
    const rawY = Number.parseFloat(item.semillas) || 0;
    const x = margin + ((rawX - minX) / xSpan) * (100 - margin * 2);
    const y = 100 - (margin + ((rawY - minY) / ySpan) * (100 - margin * 2));
    const color = colors[item.rol] || colors.default;
    const tooltip = `${item.nombre_usuario || ''} • ${formatX(rawX)} · ${formatY(rawY)}`;
    return { key: `${item.id}-${index}`, x, y, color, tooltip };
  });

  return (
    <div>
      <div className="relative h-48">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <line x1="10" y1="90" x2="90" y2="90" stroke="#cbd5f5" strokeWidth="0.5" />
          <line x1="10" y1="10" x2="10" y2="90" stroke="#cbd5f5" strokeWidth="0.5" />
          {points.map((point) => (
            <circle key={point.key} cx={point.x} cy={point.y} r={2.8} fill={point.color}>
              <title>{point.tooltip}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{formatX(minX)}</span>
        <span className="font-medium text-slate-600">{xLabel}</span>
        <span>{formatX(maxX)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{formatY(minY)}</span>
        <span className="font-medium text-slate-600">{yLabel}</span>
        <span>{formatY(maxY)}</span>
      </div>
      {Array.isArray(legend) && legend.length ? (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {legend.map((entry) => (
            <span key={entry.key} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[entry.key] || colors.default }}
              />
              {entry.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const VerticalBarChart = ({ data, getLabel, getValue, formatValue, emptyLabel }) => {
  const items = Array.isArray(data) ? data : [];
  if (!items.length) {
    return <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>;
  }

  const maxValue = Math.max(...items.map((item) => getValue(item))) || 1;

  return (
    <div className="flex h-48 items-end gap-4">
      {items.map((item, index) => {
        const value = getValue(item);
        const height = Math.max(6, Math.round((value / maxValue) * 100));
        return (
          <div key={`${getLabel(item)}-${index}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end justify-center rounded-t-xl bg-emerald-100/30">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 via-emerald-400 to-sky-400"
                style={{ height: `${height}%` }}
              >
                <span className="sr-only">{formatValue(value)}</span>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600 text-center leading-tight">{getLabel(item)}</span>
            <span className="text-xs text-slate-500">{formatValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

const LineTrendChart = ({ data, getLabel, getValue, formatValue, emptyLabel }) => {
  const items = Array.isArray(data) ? data : [];
  if (!items.length) {
    return <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>;
  }

  const values = items.map((item) => getValue(item));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || 1;

  const points = items.map((item, index) => {
    const value = getValue(item);
    const x = (index / (items.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / span) * 100;
    return { key: `${getLabel(item)}-${index}`, x, y, value, label: getLabel(item) };
  });

  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`).join(' ');
  const areaPath = `${linePath} L 100,100 L 0,100 Z`;

  return (
    <div>
      <div className="relative h-48 overflow-hidden rounded-xl border border-slate-200/60 bg-slate-50">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="healthTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#dcfce7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#healthTrend)" />
          <path
            d={linePath}
            fill="none"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{items[0] ? getLabel(items[0]) : ''}</span>
        <span>{items[items.length - 1] ? getLabel(items[items.length - 1]) : ''}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{formatValue(minValue)}</span>
        <span>{formatValue(maxValue)}</span>
      </div>
    </div>
  );
};

const BubbleChart = ({ data, colors, legend, xLabel, yLabel, formatX, formatY, emptyLabel }) => {
  if (!Array.isArray(data) || data.length === 0) {
    return <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>;
  }

  const xValues = data.map((item) => Number.parseFloat(item.comentarios) || 0);
  const yValues = data.map((item) => Number.parseFloat(item.likes) || 0);
  const sizeValues = data.map((item) => Number.parseFloat(item.totalInteracciones) || 0);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const minSize = Math.min(...sizeValues);
  const maxSize = Math.max(...sizeValues);
  const xSpan = maxX - minX || 1;
  const ySpan = maxY - minY || 1;
  const sizeSpan = maxSize - minSize || 1;
  const margin = 10;

  const points = data.map((item, index) => {
    const rawX = Number.parseFloat(item.comentarios) || 0;
    const rawY = Number.parseFloat(item.likes) || 0;
    const rawSize = Number.parseFloat(item.totalInteracciones) || 0;
    const x = margin + ((rawX - minX) / xSpan) * (100 - margin * 2);
    const y = 100 - (margin + ((rawY - minY) / ySpan) * (100 - margin * 2));
    const radius = 2.5 + ((rawSize - minSize) / sizeSpan) * 6;
    const color = colors[item.rol_transferencias] || colors.default;
    const tooltip = `${item.nombre_usuario || ''} • ${formatX(rawX)} · ${formatY(rawY)} · ${formatY(rawSize)}`;
    return { key: `${item.id}-${index}`, x, y, radius: Number.isFinite(radius) ? radius : 4, color, tooltip };
  });

  return (
    <div>
      <div className="relative h-48">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <line x1="10" y1="90" x2="90" y2="90" stroke="#cbd5f5" strokeWidth="0.5" />
          <line x1="10" y1="10" x2="10" y2="90" stroke="#cbd5f5" strokeWidth="0.5" />
          {points.map((point) => (
            <circle key={point.key} cx={point.x} cy={point.y} r={point.radius} fill={point.color} opacity="0.85">
              <title>{point.tooltip}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{formatX(minX)}</span>
        <span className="font-medium text-slate-600">{xLabel}</span>
        <span>{formatX(maxX)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{formatY(minY)}</span>
        <span className="font-medium text-slate-600">{yLabel}</span>
        <span>{formatY(maxY)}</span>
      </div>
      {Array.isArray(legend) && legend.length ? (
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          {legend.map((entry) => (
            <span key={entry.key} className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[entry.key] || colors.default }}
              />
              {entry.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const RingProgress = ({ percentage, withCount, withoutCount, labelWith, labelWithout, helper }) => {
  const clampedPercentage = Math.max(0, Math.min(percentage || 0, 100));
  const angle = (clampedPercentage / 100) * 360;
  const withoutPercentage = 100 - clampedPercentage;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        aria-hidden="true"
        className="relative h-36 w-36 rounded-full"
        style={{
          background: `conic-gradient(#0f766e 0deg ${angle}deg, #e2e8f0 ${angle}deg 360deg)`,
        }}
      >
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
          <p className="text-xs font-medium text-slate-500">{labelWith}</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{clampedPercentage.toFixed(1)}%</p>
        </div>
      </div>
      <div className="space-y-2 text-xs text-slate-500">
        <p className="font-medium text-slate-700">
          {labelWith}: {withCount}
        </p>
        <p>
          {labelWithout}: {withoutCount} ({withoutPercentage.toFixed(1)}%)
        </p>
        {helper ? <p>{helper}</p> : null}
      </div>
    </div>
  );
};

const FunnelStages = ({ stages, stageLabels, formatNumber, emptyLabel, baseTotal, formatPercentage }) => {
  const items = Array.isArray(stages) ? stages : [];
  if (!items.length) {
    return <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>;
  }

  const maxTotal = Math.max(...items.map((stage) => stage.total || 0)) || 1;

  return (
    <ol className="mt-4 space-y-4">
      {items.map((stage) => {
        const value = stage.total || 0;
        const width = Math.max(15, Math.round((value / maxTotal) * 100));
        const percentage = baseTotal ? (value / baseTotal) * 100 : 0;
        return (
          <li key={stage.etapa} className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium text-slate-700">
              <span>{stageLabels[stage.etapa] || stage.etapa}</span>
              <span>{formatNumber(value)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
                style={{ width: `${width}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{formatPercentage(Math.max(0, percentage))}%</p>
          </li>
        );
      })}
    </ol>
  );
};

const SimpleTable = ({ title, columns, rows, emptyLabel, footer }) => (
  <section className="rounded-2xl bg-white/70 p-5 shadow-sm ring-1 ring-white/60">
    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
    {rows.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>
    ) : (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              {columns.map((column) => (
                <th key={column.key} className={`pb-2 ${column.align === 'right' ? 'text-right' : ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id || row.key} className="text-slate-700">
                {columns.map((column) => (
                  <td key={column.key} className={`py-2 ${column.align === 'right' ? 'text-right' : ''}`}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {footer ? <p className="mt-4 text-xs text-slate-500">{footer}</p> : null}
  </section>
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
  const decimalFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    [locale]
  );
  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale]
  );
  const percentageFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale]
  );
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
  const salud = data?.salud || {};
  const usuarios = data?.usuarios || {};

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

  const seedsDistribution = Array.isArray(usuarios.distribucionSemillas)
    ? usuarios.distribucionSemillas
    : [];
  const communityActivity = Array.isArray(usuarios.actividadComunidad)
    ? usuarios.actividadComunidad
    : [];
  const accessoriesSummary = usuarios.accesorios || {};
  const funnelData = Array.isArray(usuarios.embudo) ? usuarios.embudo : [];
  const averageDaysToFirstPlant = usuarios.promedioDiasPrimeraPlanta;
  const healthTimeline = Array.isArray(salud.promedioTemporal) ? salud.promedioTemporal : [];
  const eventsByCategory = Array.isArray(eventos.porCategoria) ? eventos.porCategoria : [];
  const eventsByType = Array.isArray(eventos.porTipo) ? eventos.porTipo : [];
  const featuredUsersRows = Array.isArray(eventos.usuariosDestacadosTabla)
    ? eventos.usuariosDestacadosTabla
    : Array.isArray(eventos.usuariosDestacados)
    ? eventos.usuariosDestacados
    : [];
  const topFriends = Array.isArray(usuarios.topAmigos) ? usuarios.topAmigos : [];
  const transferRows = Array.isArray(semillas.transferenciasRecientes)
    ? semillas.transferenciasRecientes
    : [];

  const funnelBase = funnelData.length ? funnelData[0].total || 0 : 0;

  const scatterColors = {
    admin: '#4c1d95',
    usuario: '#047857',
    default: '#0ea5e9',
  };

  const scatterLegend = [
    { key: 'usuario', label: t('adminRoleUser') },
    { key: 'admin', label: t('adminRoleAdmin') },
  ];

  const transferRoleColors = {
    remitente: '#0ea5e9',
    destinatario: '#f97316',
    mixto: '#6366f1',
    sin_movimientos: '#94a3b8',
    default: '#0f172a',
  };

  const transferRoleLegend = [
    { key: 'remitente', label: t('adminTransferRoleSender') },
    { key: 'destinatario', label: t('adminTransferRoleReceiver') },
    { key: 'mixto', label: t('adminTransferRoleBoth') },
    { key: 'sin_movimientos', label: t('adminTransferRoleNone') },
  ];

  const funnelLabels = {
    registrados: t('adminFunnelStageRegistered'),
    con_jardin: t('adminFunnelStageGarden'),
    con_planta: t('adminFunnelStagePlant'),
  };

  const eventsByTypeChart = eventsByType.map((item) => ({
    ...item,
    label: translateEventType(item.tipo),
  }));

  const eventsByCategoryChart = eventsByCategory.map((item) => ({
    ...item,
    label: getLabelForCategory(item.categoria) || item.categoria,
  }));

  const featuredTableRows = featuredUsersRows.map((item, index) => ({
    id: item.id || index,
    position: index + 1,
    nombre_usuario: item.nombre_usuario || t('adminUnknownUser'),
    total: item.total || 0,
  }));

  const friendsTableRows = topFriends.map((item, index) => ({
    id: item.id || index,
    position: index + 1,
    nombre_usuario: item.nombre_usuario || t('adminUnknownUser'),
    total: item.total || 0,
  }));

  const transfersTableRows = transferRows.map((transfer, index) => {
    const fromName = transfer.remitente?.nombre_usuario || t('adminUnknownUser');
    const toName = transfer.destinatario?.nombre_usuario || t('adminUnknownUser');
    const statusKey = `adminTransferStatus_${transfer.estado || ''}`;
    const statusLabel = t(statusKey);
    const createdAt = transfer.fecha_creacion ? new Date(transfer.fecha_creacion) : null;
    return {
      id: transfer.id || index,
      fecha: createdAt && !Number.isNaN(createdAt.getTime()) ? dateTimeFormatter.format(createdAt) : '',
      remitente: fromName,
      destinatario: toName,
      cantidad: `${numberFormatter.format(transfer.cantidad || 0)} 🌱`,
      estadoLabel,
    };
  });

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
        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminSeedsScatterTitle')}</h3>
          <p className="mt-2 text-xs text-slate-500">{t('adminSeedsScatterHelper')}</p>
          <div className="mt-6">
            <ScatterPlot
              data={seedsDistribution}
              colors={scatterColors}
              legend={scatterLegend}
              xLabel={t('adminSeedsScatterXAxis')}
              yLabel={t('adminSeedsScatterYAxis')}
              formatX={(value) => decimalFormatter.format(value)}
              formatY={(value) => numberFormatter.format(value)}
              emptyLabel={t('adminSeedsScatterEmpty')}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminAccessoriesAdoptionTitle')}</h3>
          <p className="mt-2 text-xs text-slate-500">{t('adminAccessoriesAdoptionHelper')}</p>
          <div className="mt-6 flex justify-center">
            <RingProgress
              percentage={accessoriesSummary.porcentajeUsuariosConAccesorios || 0}
              withCount={numberFormatter.format(accessoriesSummary.totalUsuariosConAccesorios || 0)}
              withoutCount={numberFormatter.format(
                Math.max(0, (accessoriesSummary.totalUsuarios || 0) - (accessoriesSummary.totalUsuariosConAccesorios || 0))
              )}
              labelWith={t('adminAccessoriesAdoptionWith')}
              labelWithout={t('adminAccessoriesAdoptionWithout')}
              helper={t('adminAccessoriesAdoptionTotal', {
                total: numberFormatter.format(accessoriesSummary.totalUsuarios || 0),
              })}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminFunnelTitle')}</h3>
          <p className="mt-2 text-xs text-slate-500">{t('adminFunnelHelper')}</p>
          <FunnelStages
            stages={funnelData}
            stageLabels={funnelLabels}
            formatNumber={(value) => numberFormatter.format(value || 0)}
            formatPercentage={(value) => percentageFormatter.format(value || 0)}
            emptyLabel={t('adminNoData')}
            baseTotal={funnelBase}
          />
          {typeof averageDaysToFirstPlant === 'number' ? (
            <p className="mt-4 text-xs text-slate-500">
              {t('adminFunnelAverageTime', { value: decimalFormatter.format(averageDaysToFirstPlant) })}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminHealthTrendTitle')}</h3>
          <p className="mt-2 text-xs text-slate-500">{t('adminHealthTrendHelper')}</p>
          <div className="mt-6">
            <LineTrendChart
              data={healthTimeline}
              getLabel={(item) =>
                item?.fecha ? shortDateFormatter.format(new Date(item.fecha)) : ''
              }
              getValue={(item) => item?.promedio || 0}
              formatValue={(value) => `${decimalFormatter.format(value)}%`}
              emptyLabel={t('adminHealthTrendEmpty')}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminEventsByTypeChartTitle')}</h3>
          <VerticalBarChart
            data={eventsByTypeChart}
            getLabel={(item) => item.label}
            getValue={(item) => item.cantidad || 0}
            formatValue={(value) => numberFormatter.format(value)}
            emptyLabel={t('adminEventsChartEmpty')}
          />
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminEventsByCategoryChartTitle')}</h3>
          <VerticalBarChart
            data={eventsByCategoryChart}
            getLabel={(item) => item.label}
            getValue={(item) => item.cantidad || 0}
            formatValue={(value) => numberFormatter.format(value)}
            emptyLabel={t('adminEventsChartEmpty')}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">{t('adminCommunityActivityTitle')}</h3>
          <p className="mt-2 text-xs text-slate-500">{t('adminCommunityActivityHelper')}</p>
          <div className="mt-6">
            <BubbleChart
              data={communityActivity}
              colors={transferRoleColors}
              legend={transferRoleLegend}
              xLabel={t('adminCommunityActivityXAxis')}
              yLabel={t('adminCommunityActivityYAxis')}
              formatX={(value) => numberFormatter.format(value)}
              formatY={(value) => numberFormatter.format(value)}
              emptyLabel={t('adminCommunityActivityEmpty')}
            />
          </div>
        </div>

        <div className="space-y-6">
          <SimpleTable
            title={t('adminFeaturedUsersEventsTitle')}
            columns={[
              { key: 'position', header: t('adminTablePosition') },
              { key: 'nombre_usuario', header: t('adminTableUser') },
              {
                key: 'total',
                header: t('adminTableTotal'),
                align: 'right',
                render: (row) => numberFormatter.format(row.total || 0),
              },
            ]}
            rows={featuredTableRows}
            emptyLabel={t('adminNoData')}
          />
          <SimpleTable
            title={t('adminFriendsLeaderboardTitle')}
            columns={[
              { key: 'position', header: t('adminTablePosition') },
              { key: 'nombre_usuario', header: t('adminTableUser') },
              {
                key: 'total',
                header: t('adminTableTotal'),
                align: 'right',
                render: (row) => numberFormatter.format(row.total || 0),
              },
            ]}
            rows={friendsTableRows}
            emptyLabel={t('adminNoData')}
          />
        </div>
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

        <SimpleTable
          title={t('adminTransfersTableTitle')}
          columns={[
            { key: 'fecha', header: t('adminTransfersColumnDate') },
            { key: 'remitente', header: t('adminTransfersColumnSender') },
            { key: 'destinatario', header: t('adminTransfersColumnReceiver') },
            { key: 'cantidad', header: t('adminTransfersColumnAmount'), align: 'right' },
            {
              key: 'estadoLabel',
              header: t('adminTransfersColumnStatus'),
              align: 'right',
              render: (row) => <StatusPill label={row.estadoLabel} />,
            },
          ]}
          rows={transfersTableRows}
          emptyLabel={t('adminTransfersEmpty')}
          footer={
            transferRows.length
              ? t('adminTransfersHelper', { count: numberFormatter.format(transferRows.length) })
              : null
          }
        />
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
