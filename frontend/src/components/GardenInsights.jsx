import React, { useMemo } from 'react';

const getWeekDifference = (date) => {
  if (!date) return Number.POSITIVE_INFINITY;
  const now = Date.now();
  const value = date.getTime();
  if (Number.isNaN(value)) {
    return Number.POSITIVE_INFINITY;
  }
  const difference = now - value;
  const weekInMs = 7 * 24 * 60 * 60 * 1000;
  return difference / weekInMs;
};

const GardenInsights = ({
  plants = [],
  locale,
  getLabelForCategory,
  getEventTypeByCode,
  t,
}) => {
  const insights = useMemo(() => {
    if (!Array.isArray(plants) || plants.length === 0) {
      return {
        totalEvents: 0,
        lastEvent: null,
        eventsThisWeek: 0,
        topCategory: null,
        positiveCount: 0,
        negativeCount: 0,
      };
    }

    let lastEvent = null;
    const categoryCounter = new Map();
    let positiveCount = 0;
    let negativeCount = 0;
    let eventsThisWeek = 0;

    plants.forEach((plant) => {
      const eventDate = plant?.fecha_plantado ? new Date(plant.fecha_plantado) : null;

      if (eventDate && !Number.isNaN(eventDate.getTime())) {
        if (!lastEvent || eventDate > new Date(lastEvent.fecha_plantado)) {
          lastEvent = plant;
        }

        if (getWeekDifference(eventDate) <= 1) {
          eventsThisWeek += 1;
        }
      }

      if (plant?.categoria) {
        const current = categoryCounter.get(plant.categoria) || 0;
        categoryCounter.set(plant.categoria, current + 1);
      }

      const typeInfo = typeof getEventTypeByCode === 'function' ? getEventTypeByCode(plant?.tipo) : null;
      const delta = Number(typeInfo?.plantDelta ?? 0);
      if (delta > 0) {
        positiveCount += 1;
      } else if (delta < 0) {
        negativeCount += 1;
      }
    });

    let topCategory = null;
    categoryCounter.forEach((count, code) => {
      if (!topCategory || count > topCategory.count) {
        topCategory = { code, count };
      }
    });

    return {
      totalEvents: plants.length,
      lastEvent,
      eventsThisWeek,
      topCategory,
      positiveCount,
      negativeCount,
    };
  }, [plants, getEventTypeByCode]);

  const lastEventDate = insights.lastEvent?.fecha_plantado
    ? new Date(insights.lastEvent.fecha_plantado)
    : null;

  const cards = [
    {
      title: t('gardenInsightsTotalEventsTitle'),
      description:
        insights.totalEvents > 0
          ? t('gardenInsightsTotalEventsValue', { count: insights.totalEvents })
          : t('gardenInsightsTotalEventsEmpty'),
    },
    {
      title: t('gardenInsightsLastEventTitle'),
      description:
        insights.lastEvent && lastEventDate && !Number.isNaN(lastEventDate.getTime())
          ? t('gardenInsightsLastEventValue', {
              name: insights.lastEvent?.nombre || t('gardenInsightsUnknownPlant'),
              date: lastEventDate.toLocaleString(locale, {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            })
          : t('gardenInsightsLastEventEmpty'),
    },
    {
      title: t('gardenInsightsEventsThisWeekTitle'),
      description:
        insights.eventsThisWeek > 0
          ? t('gardenInsightsEventsThisWeekValue', { count: insights.eventsThisWeek })
          : t('gardenInsightsEventsThisWeekEmpty'),
    },
    {
      title: t('gardenInsightsTopCategoryTitle'),
      description: insights.topCategory
        ? t('gardenInsightsTopCategoryValue', {
            category:
              (typeof getLabelForCategory === 'function'
                ? getLabelForCategory(insights.topCategory.code)
                : null) || t('gardenInsightsUnknownCategory'),
            count: insights.topCategory.count,
          })
        : t('gardenInsightsTopCategoryEmpty'),
    },
  ];

  const { positiveCount, negativeCount } = insights;
  let balanceDescription = t('gardenInsightsEnergyBalanceEmpty');
  if (positiveCount > 0 || negativeCount > 0) {
    if (positiveCount > negativeCount) {
      balanceDescription = t('gardenInsightsEnergyBalancePositive', {
        difference: positiveCount - negativeCount,
      });
    } else if (negativeCount > positiveCount) {
      balanceDescription = t('gardenInsightsEnergyBalanceNegative', {
        difference: negativeCount - positiveCount,
      });
    } else {
      balanceDescription = t('gardenInsightsEnergyBalanceNeutral');
    }
  }

  cards.push({
    title: t('gardenInsightsEnergyBalanceTitle'),
    description: balanceDescription,
  });

  return (
    <section className="rounded-3xl bg-white/90 p-6 shadow-lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gardenGreen">{t('gardenInsightsTitle')}</h3>
          <p className="text-sm text-slate-600">{t('gardenInsightsSubtitle')}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-slate-50/80 p-4 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {card.title}
            </h4>
            <p className="mt-2 text-base font-medium text-gardenSoil">{card.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GardenInsights;
