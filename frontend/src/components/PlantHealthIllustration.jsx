import React, { useMemo } from 'react';

const clampHealth = (value) => {
  if (Number.isNaN(Number(value))) return 0;
  return Math.min(100, Math.max(0, Math.round(Number(value))));
};

const createLeafPair = (pair) => {
  const cy = 120 - pair.offset;
  const spread = pair.spread ?? 18;
  const tilt = pair.tilt ?? 28;
  const base = 80;
  return [
    {
      cx: base - spread,
      cy,
      rx: pair.rx,
      ry: pair.ry,
      rotation: -tilt,
      color: pair.color,
      opacity: pair.opacity,
    },
    {
      cx: base + spread,
      cy,
      rx: pair.rx,
      ry: pair.ry,
      rotation: tilt,
      color: pair.color,
      opacity: pair.opacity,
    },
  ];
};

const createStarPoints = (cx, cy, spikes, outerRadius, innerRadius) => {
  const points = [];
  const step = Math.PI / spikes;
  let angle = -Math.PI / 2;

  for (let i = 0; i < spikes; i += 1) {
    const outerX = cx + Math.cos(angle) * outerRadius;
    const outerY = cy + Math.sin(angle) * outerRadius;
    points.push(`${outerX},${outerY}`);
    angle += step;

    const innerX = cx + Math.cos(angle) * innerRadius;
    const innerY = cy + Math.sin(angle) * innerRadius;
    points.push(`${innerX},${innerY}`);
    angle += step;
  }

  return points.join(' ');
};

const plantStages = [
  {
    range: '0-9%',
    background: 'from-amber-100 via-lime-50 to-white',
    stemHeight: 22,
    stemColor: '#15803d',
    leafPairs: [
      { offset: 12, rx: 8, ry: 4.8, spread: 10, tilt: 28, color: '#bef264' },
    ],
    buds: [{ cx: 80, cy: 104, r: 4, color: '#facc15', opacity: 0.9 }],
    soilColor: '#854d0e',
  },
  {
    range: '10-19%',
    background: 'from-lime-100 via-emerald-50 to-white',
    stemHeight: 30,
    stemColor: '#15803d',
    leafPairs: [
      { offset: 12, rx: 9, ry: 5, spread: 12, tilt: 30, color: '#bbf7d0' },
      { offset: 24, rx: 8.6, ry: 4.8, spread: 14, tilt: 28, color: '#86efac' },
    ],
    topLeaf: { offset: 6, rx: 8, ry: 4.5, color: '#4ade80', opacity: 0.95 },
    soilColor: '#854d0e',
  },
  {
    range: '20-29%',
    background: 'from-lime-100 via-emerald-100 to-sky-50',
    stemHeight: 38,
    stemColor: '#166534',
    leafPairs: [
      { offset: 12, rx: 10, ry: 5.2, spread: 14, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 9.4, ry: 5.1, spread: 16, tilt: 28, color: '#86efac' },
      { offset: 34, rx: 8.8, ry: 4.8, spread: 18, tilt: 26, color: '#4ade80' },
    ],
    topLeaf: { offset: 6, rx: 9, ry: 4.6, color: '#22c55e', opacity: 0.95 },
    branches: [
      { startY: 106, length: 18, angle: -35, thickness: 3 },
      { startY: 98, length: 18, angle: 35, thickness: 3 },
    ],
    soilColor: '#854d0e',
  },
  {
    range: '30-39%',
    background: 'from-emerald-100 via-teal-50 to-sky-100',
    stemHeight: 46,
    stemColor: '#166534',
    leafPairs: [
      { offset: 12, rx: 10, ry: 5.2, spread: 14, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 10, ry: 5.2, spread: 18, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 9.2, ry: 5, spread: 20, tilt: 26, color: '#4ade80' },
      { offset: 46, rx: 8.8, ry: 4.8, spread: 22, tilt: 24, color: '#22c55e' },
    ],
    topLeaf: { offset: 6, rx: 8.6, ry: 4.4, color: '#16a34a', opacity: 0.95 },
    branches: [
      { startY: 104, length: 22, angle: -32, thickness: 3.4 },
      { startY: 94, length: 22, angle: 32, thickness: 3.4 },
    ],
    soilColor: '#854d0e',
  },
  {
    range: '40-49%',
    background: 'from-emerald-100 via-teal-100 to-sky-100',
    stemHeight: 54,
    stemColor: '#15803d',
    leafPairs: [
      { offset: 12, rx: 10, ry: 5.2, spread: 16, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 10, ry: 5.2, spread: 20, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 9.6, ry: 5.1, spread: 22, tilt: 26, color: '#4ade80' },
      { offset: 46, rx: 9.2, ry: 5, spread: 24, tilt: 24, color: '#22c55e' },
      { offset: 54, rx: 8.8, ry: 4.8, spread: 22, tilt: 22, color: '#16a34a' },
    ],
    topLeaf: { offset: 8, rx: 8.2, ry: 4.2, color: '#15803d', opacity: 0.95 },
    branches: [
      { startY: 104, length: 26, angle: -32, thickness: 3.4 },
      { startY: 94, length: 26, angle: 32, thickness: 3.4 },
      { startY: 86, length: 20, angle: -28, thickness: 3.1 },
      { startY: 78, length: 20, angle: 28, thickness: 3.1 },
    ],
    soilColor: '#713f12',
  },
  {
    range: '50-59%',
    background: 'from-emerald-100 via-teal-200 to-sky-100',
    stemHeight: 62,
    stemColor: '#15803d',
    leafPairs: [
      { offset: 12, rx: 10.2, ry: 5.4, spread: 16, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 10, ry: 5.3, spread: 22, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 9.6, ry: 5.1, spread: 24, tilt: 26, color: '#4ade80' },
      { offset: 48, rx: 9.2, ry: 5, spread: 26, tilt: 24, color: '#22c55e' },
      { offset: 58, rx: 8.8, ry: 4.8, spread: 24, tilt: 22, color: '#16a34a' },
    ],
    topLeaf: { offset: 10, rx: 8.6, ry: 4.4, color: '#0f766e', opacity: 0.95 },
    branches: [
      { startY: 104, length: 28, angle: -30, thickness: 3.4 },
      { startY: 94, length: 28, angle: 30, thickness: 3.4 },
      { startY: 86, length: 22, angle: -26, thickness: 3.1 },
      { startY: 78, length: 22, angle: 26, thickness: 3.1 },
    ],
    flowers: [
      { cx: 80, cy: 62, radius: 9, petalSize: 4, petalCount: 5, petalColor: '#f472b6', centerColor: '#facc15' },
      { cx: 96, cy: 74, radius: 7, petalSize: 3.4, petalCount: 5, petalColor: '#fb7185', centerColor: '#fde68a' },
    ],
    soilColor: '#713f12',
  },
  {
    range: '60-69%',
    background: 'from-emerald-200 via-teal-200 to-sky-200',
    stemHeight: 70,
    stemColor: '#0f766e',
    leafPairs: [
      { offset: 12, rx: 11, ry: 5.6, spread: 18, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 10.6, ry: 5.4, spread: 24, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 10.2, ry: 5.2, spread: 26, tilt: 26, color: '#4ade80' },
      { offset: 48, rx: 9.8, ry: 5, spread: 28, tilt: 24, color: '#22c55e' },
      { offset: 60, rx: 9.4, ry: 4.9, spread: 26, tilt: 22, color: '#16a34a' },
      { offset: 68, rx: 9, ry: 4.8, spread: 24, tilt: 20, color: '#0d9488' },
    ],
    topLeaf: { offset: 10, rx: 9, ry: 4.6, color: '#0f766e', opacity: 0.95 },
    branches: [
      { startY: 102, length: 30, angle: -28, thickness: 3.4 },
      { startY: 92, length: 30, angle: 28, thickness: 3.4 },
      { startY: 84, length: 24, angle: -26, thickness: 3.1 },
      { startY: 74, length: 24, angle: 26, thickness: 3.1 },
      { startY: 66, length: 22, angle: -24, thickness: 2.9 },
      { startY: 58, length: 22, angle: 24, thickness: 2.9 },
    ],
    flowers: [
      { cx: 76, cy: 54, radius: 8, petalSize: 3.6, petalCount: 5, petalColor: '#f472b6', centerColor: '#fde68a' },
      { cx: 96, cy: 64, radius: 7.2, petalSize: 3.4, petalCount: 5, petalColor: '#fb7185', centerColor: '#fef08a' },
      { cx: 68, cy: 70, radius: 7.2, petalSize: 3.4, petalCount: 5, petalColor: '#c084fc', centerColor: '#fde68a' },
    ],
    soilColor: '#713f12',
  },
  {
    range: '70-79%',
    background: 'from-emerald-200 via-cyan-100 to-sky-200',
    stemHeight: 78,
    stemColor: '#0d9488',
    leafPairs: [
      { offset: 12, rx: 11.2, ry: 5.8, spread: 18, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 11, ry: 5.6, spread: 26, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 10.6, ry: 5.4, spread: 28, tilt: 26, color: '#4ade80' },
      { offset: 48, rx: 10.2, ry: 5.2, spread: 30, tilt: 24, color: '#22c55e' },
      { offset: 60, rx: 9.8, ry: 5.1, spread: 28, tilt: 22, color: '#16a34a' },
      { offset: 72, rx: 9.4, ry: 4.9, spread: 26, tilt: 20, color: '#0f766e' },
    ],
    topLeaf: { offset: 12, rx: 9.2, ry: 4.6, color: '#0f766e', opacity: 0.95 },
    branches: [
      { startY: 102, length: 32, angle: -26, thickness: 3.4 },
      { startY: 92, length: 32, angle: 26, thickness: 3.4 },
      { startY: 84, length: 26, angle: -24, thickness: 3.1 },
      { startY: 74, length: 26, angle: 24, thickness: 3.1 },
      { startY: 66, length: 24, angle: -22, thickness: 2.9 },
      { startY: 56, length: 24, angle: 22, thickness: 2.9 },
      { startY: 48, length: 20, angle: -20, thickness: 2.7 },
      { startY: 40, length: 20, angle: 20, thickness: 2.7 },
    ],
    flowers: [
      { cx: 80, cy: 46, radius: 9, petalSize: 3.8, petalCount: 6, petalColor: '#f472b6', centerColor: '#fde68a' },
      { cx: 98, cy: 58, radius: 8.2, petalSize: 3.6, petalCount: 6, petalColor: '#fb7185', centerColor: '#fef3c7' },
      { cx: 62, cy: 62, radius: 8.2, petalSize: 3.6, petalCount: 6, petalColor: '#c084fc', centerColor: '#fde68a' },
    ],
    soilColor: '#713f12',
  },
  {
    range: '80-89%',
    background: 'from-emerald-200 via-cyan-200 to-sky-200',
    stemHeight: 86,
    stemColor: '#0f766e',
    leafPairs: [
      { offset: 12, rx: 11.4, ry: 6, spread: 20, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 11, ry: 5.8, spread: 28, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 10.6, ry: 5.6, spread: 30, tilt: 26, color: '#4ade80' },
      { offset: 48, rx: 10.2, ry: 5.4, spread: 32, tilt: 24, color: '#22c55e' },
      { offset: 60, rx: 9.8, ry: 5.2, spread: 30, tilt: 22, color: '#16a34a' },
      { offset: 72, rx: 9.6, ry: 5, spread: 28, tilt: 20, color: '#0d9488' },
      { offset: 82, rx: 9.2, ry: 4.9, spread: 26, tilt: 18, color: '#0f766e' },
    ],
    topLeaf: { offset: 14, rx: 9.4, ry: 4.8, color: '#0e7490', opacity: 0.95 },
    branches: [
      { startY: 102, length: 34, angle: -24, thickness: 3.4 },
      { startY: 92, length: 34, angle: 24, thickness: 3.4 },
      { startY: 84, length: 30, angle: -22, thickness: 3.1 },
      { startY: 74, length: 30, angle: 22, thickness: 3.1 },
      { startY: 64, length: 26, angle: -20, thickness: 2.9 },
      { startY: 54, length: 26, angle: 20, thickness: 2.9 },
      { startY: 46, length: 24, angle: -18, thickness: 2.7 },
      { startY: 38, length: 24, angle: 18, thickness: 2.7 },
    ],
    flowers: [
      { cx: 80, cy: 38, radius: 10, petalSize: 4, petalCount: 6, petalColor: '#f472b6', centerColor: '#fde68a' },
      { cx: 100, cy: 50, radius: 8.4, petalSize: 3.6, petalCount: 6, petalColor: '#fb7185', centerColor: '#fef3c7' },
      { cx: 60, cy: 52, radius: 8.4, petalSize: 3.6, petalCount: 6, petalColor: '#c084fc', centerColor: '#fde68a' },
      { cx: 92, cy: 66, radius: 7.4, petalSize: 3.2, petalCount: 5, petalColor: '#f97316', centerColor: '#fde68a' },
    ],
    sparkles: [
      { cx: 56, cy: 34, r: 2.4, color: '#fef3c7', opacity: 0.7 },
      { cx: 108, cy: 42, r: 2, color: '#bfdbfe', opacity: 0.6 },
      { cx: 94, cy: 30, r: 2.6, color: '#fef3c7', opacity: 0.7 },
    ],
    soilColor: '#713f12',
  },
  {
    range: '90-99%',
    background: 'from-emerald-300 via-cyan-200 to-sky-300',
    stemHeight: 94,
    stemColor: '#0e7490',
    leafPairs: [
      { offset: 12, rx: 12, ry: 6.2, spread: 22, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 11.6, ry: 6, spread: 30, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 11.2, ry: 5.8, spread: 32, tilt: 26, color: '#4ade80' },
      { offset: 48, rx: 10.8, ry: 5.6, spread: 34, tilt: 24, color: '#22c55e' },
      { offset: 60, rx: 10.4, ry: 5.4, spread: 32, tilt: 22, color: '#16a34a' },
      { offset: 72, rx: 10, ry: 5.2, spread: 30, tilt: 20, color: '#0d9488' },
      { offset: 84, rx: 9.6, ry: 5, spread: 28, tilt: 18, color: '#0e7490' },
      { offset: 92, rx: 9.2, ry: 4.8, spread: 26, tilt: 16, color: '#155e75' },
    ],
    topLeaf: { offset: 16, rx: 9.4, ry: 4.6, color: '#155e75', opacity: 0.95 },
    branches: [
      { startY: 102, length: 36, angle: -24, thickness: 3.5 },
      { startY: 92, length: 36, angle: 24, thickness: 3.5 },
      { startY: 84, length: 32, angle: -22, thickness: 3.2 },
      { startY: 74, length: 32, angle: 22, thickness: 3.2 },
      { startY: 66, length: 28, angle: -20, thickness: 3 },
      { startY: 56, length: 28, angle: 20, thickness: 3 },
      { startY: 48, length: 26, angle: -18, thickness: 2.8 },
      { startY: 40, length: 26, angle: 18, thickness: 2.8 },
      { startY: 32, length: 22, angle: -16, thickness: 2.6 },
      { startY: 24, length: 22, angle: 16, thickness: 2.6 },
    ],
    flowers: [
      { cx: 78, cy: 30, radius: 10, petalSize: 4.2, petalCount: 7, petalColor: '#f472b6', centerColor: '#fde68a' },
      { cx: 102, cy: 44, radius: 9, petalSize: 3.8, petalCount: 6, petalColor: '#fb7185', centerColor: '#fef3c7' },
      { cx: 58, cy: 46, radius: 9, petalSize: 3.8, petalCount: 6, petalColor: '#c084fc', centerColor: '#fde68a' },
      { cx: 94, cy: 60, radius: 8, petalSize: 3.5, petalCount: 6, petalColor: '#f97316', centerColor: '#fde68a' },
      { cx: 66, cy: 64, radius: 8, petalSize: 3.5, petalCount: 6, petalColor: '#34d399', centerColor: '#fef3c7' },
    ],
    sparkles: [
      { cx: 54, cy: 24, r: 2.4, color: '#fef3c7', opacity: 0.75 },
      { cx: 108, cy: 28, r: 2.6, color: '#bfdbfe', opacity: 0.65 },
      { cx: 118, cy: 52, r: 2.2, color: '#fef3c7', opacity: 0.7 },
      { cx: 44, cy: 42, r: 2, color: '#bae6fd', opacity: 0.6 },
    ],
    fruits: [
      { cx: 86, cy: 70, r: 4.4, color: '#f97316', stroke: '#fb923c', strokeWidth: 1 },
      { cx: 72, cy: 74, r: 4, color: '#fb7185', stroke: '#fda4af', strokeWidth: 1 },
    ],
    soilColor: '#713f12',
  },
  {
    range: '100%',
    background: 'from-emerald-300 via-cyan-300 to-sky-300',
    stemHeight: 100,
    stemColor: '#155e75',
    leafPairs: [
      { offset: 12, rx: 12, ry: 6.4, spread: 24, tilt: 28, color: '#bbf7d0' },
      { offset: 24, rx: 11.8, ry: 6.2, spread: 32, tilt: 28, color: '#86efac' },
      { offset: 36, rx: 11.4, ry: 6, spread: 34, tilt: 26, color: '#4ade80' },
      { offset: 48, rx: 11, ry: 5.8, spread: 36, tilt: 24, color: '#22c55e' },
      { offset: 60, rx: 10.6, ry: 5.6, spread: 34, tilt: 22, color: '#16a34a' },
      { offset: 72, rx: 10.2, ry: 5.4, spread: 32, tilt: 20, color: '#0d9488' },
      { offset: 84, rx: 9.8, ry: 5.2, spread: 30, tilt: 18, color: '#0e7490' },
      { offset: 94, rx: 9.4, ry: 5, spread: 28, tilt: 16, color: '#155e75' },
      { offset: 102, rx: 9, ry: 4.8, spread: 26, tilt: 14, color: '#0f766e' },
    ],
    topLeaf: { offset: 18, rx: 9.6, ry: 4.6, color: '#134e4a', opacity: 0.95 },
    branches: [
      { startY: 102, length: 38, angle: -24, thickness: 3.5 },
      { startY: 92, length: 38, angle: 24, thickness: 3.5 },
      { startY: 84, length: 34, angle: -22, thickness: 3.2 },
      { startY: 74, length: 34, angle: 22, thickness: 3.2 },
      { startY: 66, length: 30, angle: -20, thickness: 3 },
      { startY: 56, length: 30, angle: 20, thickness: 3 },
      { startY: 48, length: 28, angle: -18, thickness: 2.8 },
      { startY: 40, length: 28, angle: 18, thickness: 2.8 },
      { startY: 32, length: 26, angle: -16, thickness: 2.6 },
      { startY: 24, length: 26, angle: 16, thickness: 2.6 },
      { startY: 16, length: 24, angle: -14, thickness: 2.4 },
      { startY: 8, length: 24, angle: 14, thickness: 2.4 },
    ],
    flowers: [
      { cx: 80, cy: 24, radius: 11, petalSize: 4.2, petalCount: 7, petalColor: '#f472b6', centerColor: '#fde68a' },
      { cx: 104, cy: 38, radius: 9.2, petalSize: 3.8, petalCount: 6, petalColor: '#fb7185', centerColor: '#fef3c7' },
      { cx: 56, cy: 38, radius: 9.2, petalSize: 3.8, petalCount: 6, petalColor: '#c084fc', centerColor: '#fde68a' },
      { cx: 96, cy: 56, radius: 8.6, petalSize: 3.4, petalCount: 6, petalColor: '#f97316', centerColor: '#fde68a' },
      { cx: 64, cy: 56, radius: 8.6, petalSize: 3.4, petalCount: 6, petalColor: '#34d399', centerColor: '#fef3c7' },
      { cx: 88, cy: 72, radius: 7.6, petalSize: 3.2, petalCount: 5, petalColor: '#22d3ee', centerColor: '#fef3c7' },
      { cx: 72, cy: 74, radius: 7.6, petalSize: 3.2, petalCount: 5, petalColor: '#a855f7', centerColor: '#fef3c7' },
    ],
    sparkles: [
      { cx: 50, cy: 20, r: 2.6, color: '#fef3c7', opacity: 0.75 },
      { cx: 110, cy: 22, r: 3, color: '#bae6fd', opacity: 0.65 },
      { cx: 120, cy: 48, r: 2.6, color: '#fef3c7', opacity: 0.7 },
      { cx: 42, cy: 42, r: 2.4, color: '#bae6fd', opacity: 0.65 },
      { cx: 66, cy: 18, r: 2.4, color: '#fef3c7', opacity: 0.7 },
    ],
    fruits: [
      { cx: 86, cy: 70, r: 4.6, color: '#f97316', stroke: '#fb923c', strokeWidth: 1 },
      { cx: 70, cy: 76, r: 4.2, color: '#fb7185', stroke: '#fda4af', strokeWidth: 1 },
      { cx: 94, cy: 84, r: 4, color: '#facc15', stroke: '#fde68a', strokeWidth: 1 },
    ],
    crown: { cx: 80, cy: 12, r: 5, color: '#fef08a', glow: '#fde047', spikes: 6 },
    soilColor: '#713f12',
  },
];

const PlantHealthIllustration = ({
  health = 0,
  dimension = 208,
  className = '',
  showStageLabel = false,
  accessories = [],
}) => {
  const normalizedHealth = clampHealth(health);
  const stageIndex = Math.min(10, Math.floor(normalizedHealth / 10));

  const stage = plantStages[stageIndex];

  const accessorySlots = useMemo(
    () => [
      { x: 20, y: 42 },
      { x: 140, y: 40 },
      { x: 30, y: 84 },
      { x: 130, y: 86 },
      { x: 48, y: 26 },
      { x: 112, y: 28 },
      { x: 18, y: 126 },
      { x: 142, y: 124 },
      { x: 54, y: 144 },
      { x: 108, y: 144 },
    ],
    []
  );

  const accessoryDecorations = useMemo(() => {
    if (!Array.isArray(accessories) || !accessories.length) {
      return [];
    }

    const owned = accessories.filter((item) => item?.cantidad > 0 && item?.icono);
    if (!owned.length) {
      return [];
    }

    return owned.map((item, index) => {
      const slot = accessorySlots[index % accessorySlots.length];
      return {
        key: `${item.id}-${index}`,
        icon: item.icono,
        nombre: item.nombre,
        ...slot,
      };
    });
  }, [accessories, accessorySlots]);

  const leaves = useMemo(() => {
    const result = [];
    stage.leafPairs?.forEach((pair, idx) => {
      createLeafPair(pair).forEach((leaf) => {
        result.push({ ...leaf, key: `pair-${idx}-${leaf.rotation < 0 ? 'L' : 'R'}` });
      });
    });
    if (stage.topLeaf) {
      result.push({
        key: 'top',
        cx: 80,
        cy: 120 - stage.stemHeight + (stage.topLeaf.offset ?? 0),
        rx: stage.topLeaf.rx,
        ry: stage.topLeaf.ry,
        rotation: stage.topLeaf.rotation ?? 0,
        color: stage.topLeaf.color,
        opacity: stage.topLeaf.opacity ?? 0.95,
      });
    }
    if (stage.extraLeaves) {
      stage.extraLeaves.forEach((leaf, idx) => {
        result.push({ ...leaf, key: `extra-${idx}` });
      });
    }
    return result;
  }, [stage]);

  const starPoints = useMemo(() => {
    if (!stage.crown) return null;
    return createStarPoints(
      stage.crown.cx,
      stage.crown.cy,
      stage.crown.spikes ?? 5,
      stage.crown.r,
      stage.crown.r * 0.45
    );
  }, [stage]);

  const ariaLabel = `Planta representando salud ${stage.range}`;

  return (
    <div className={`flex flex-col items-center ${className}`} aria-label={ariaLabel} role="img">
      <div
        className={`flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br ${stage.background} p-4 shadow-inner`}
        style={{ width: dimension, height: dimension }}
      >
        <svg viewBox="0 0 160 160" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="soilGradient" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#a16207" stopOpacity="0.9" />
              <stop offset="100%" stopColor={stage.soilColor || '#713f12'} stopOpacity="1" />
            </radialGradient>
          </defs>

          <ellipse cx="80" cy="120" rx="26" ry="9" fill="url(#soilGradient)" opacity="0.95" />
          <rect x="50" y="118" width="60" height="14" rx="7" fill="#fb923c" opacity="0.9" />
          <rect x="54" y="130" width="52" height="26" rx="12" fill="#ea580c" />
          <rect x="57" y="130" width="46" height="24" rx="10" fill="#f97316" opacity="0.8" />

          <rect
            x="77"
            y={120 - stage.stemHeight}
            width="6"
            height={stage.stemHeight}
            rx="3"
            fill={stage.stemColor}
          />

          {stage.branches?.map((branch, idx) => {
            const angleRad = (branch.angle * Math.PI) / 180;
            const x2 = 80 + Math.cos(angleRad) * branch.length;
            const y2 = branch.startY - Math.sin(angleRad) * branch.length;
            return (
              <line
                // eslint-disable-next-line react/no-array-index-key
                key={`branch-${idx}`}
                x1={80}
                y1={branch.startY}
                x2={x2}
                y2={y2}
                stroke={branch.color || stage.stemColor}
                strokeWidth={branch.thickness ?? 3}
                strokeLinecap="round"
                opacity={branch.opacity ?? 0.85}
              />
            );
          })}

          {leaves.map((leaf) => (
            <ellipse
              key={leaf.key}
              cx={leaf.cx}
              cy={leaf.cy}
              rx={leaf.rx}
              ry={leaf.ry}
              fill={leaf.color}
              opacity={leaf.opacity ?? 0.95}
              transform={`rotate(${leaf.rotation} ${leaf.cx} ${leaf.cy})`}
            />
          ))}

          {stage.flowers?.map((flower, idx) => {
            const petalCount = flower.petalCount ?? 5;
            const radius = flower.radius ?? 8;
            const petalSize = flower.petalSize ?? 3.5;
            return (
              <g
                // eslint-disable-next-line react/no-array-index-key
                key={`flower-${idx}`}
                transform={`translate(${flower.cx}, ${flower.cy}) rotate(${flower.rotation ?? 0})`}
              >
                {Array.from({ length: petalCount }).map((_, petalIndex) => {
                  const angle = ((Math.PI * 2) / petalCount) * petalIndex;
                  const px = Math.cos(angle) * radius;
                  const py = Math.sin(angle) * radius;
                  return (
                    <circle
                      // eslint-disable-next-line react/no-array-index-key
                      key={`petal-${petalIndex}`}
                      cx={px}
                      cy={py}
                      r={petalSize}
                      fill={flower.petalColor}
                      opacity={flower.petalOpacity ?? 0.9}
                    />
                  );
                })}
                <circle cx={0} cy={0} r={flower.centerSize ?? 3.2} fill={flower.centerColor ?? '#facc15'} />
              </g>
            );
          })}

          {stage.fruits?.map((fruit, idx) => (
            <circle
              // eslint-disable-next-line react/no-array-index-key
              key={`fruit-${idx}`}
              cx={fruit.cx}
              cy={fruit.cy}
              r={fruit.r}
              fill={fruit.color}
              opacity={fruit.opacity ?? 0.95}
              stroke={fruit.stroke}
              strokeWidth={fruit.strokeWidth ?? 0}
            />
          ))}

          {stage.buds?.map((bud, idx) => (
            <circle
              // eslint-disable-next-line react/no-array-index-key
              key={`bud-${idx}`}
              cx={bud.cx}
              cy={bud.cy}
              r={bud.r}
              fill={bud.color}
              opacity={bud.opacity ?? 0.95}
              stroke={bud.stroke}
              strokeWidth={bud.strokeWidth ?? 0}
            />
          ))}

          {stage.sparkles?.map((sparkle, idx) => (
            <circle
              // eslint-disable-next-line react/no-array-index-key
              key={`sparkle-${idx}`}
              cx={sparkle.cx}
              cy={sparkle.cy}
              r={sparkle.r}
              fill={sparkle.color}
              opacity={sparkle.opacity ?? 0.65}
            />
          ))}

          {accessoryDecorations.map((decoration) => (
            <text
              key={decoration.key}
              x={decoration.x}
              y={decoration.y}
              fontSize={14}
              textAnchor="middle"
              dominantBaseline="middle"
              aria-label={decoration.nombre}
            >
              {decoration.icon}
            </text>
          ))}

          {starPoints && stage.crown && (
            <g>
              <circle cx={stage.crown.cx} cy={stage.crown.cy} r={stage.crown.r + 3} fill={stage.crown.glow} opacity={0.35} />
              <polygon points={starPoints} fill={stage.crown.color} opacity={0.95} />
            </g>
          )}
        </svg>
      </div>
      {showStageLabel && (
        <p className="mt-2 text-sm font-semibold text-gardenGreen">Salud {stage.range}</p>
      )}
    </div>
  );
};

export default PlantHealthIllustration;
