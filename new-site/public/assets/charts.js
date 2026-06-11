// Vue 3 chart components wrapping Chart.js (loaded globally via CDN)

const COLORS = {
  leaf:    { bg: 'rgba(63,148,81,0.15)', border: '#3f9451' },
  leafLight: { bg: 'rgba(63,148,81,0.08)', border: 'rgba(63,148,81,0.4)' },
  amber:   { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b' },
  sky:     { bg: 'rgba(14,165,233,0.15)', border: '#0ea5e9' },
  rose:    { bg: 'rgba(244,63,94,0.15)', border: '#f43f5e' },
  violet:  { bg: 'rgba(139,92,246,0.15)', border: '#8b5cf6' },
  teal:    { bg: 'rgba(20,184,166,0.15)', border: '#14b8a6' },
  slate:   { bg: 'rgba(100,116,139,0.15)', border: '#64748b' },
};

const CATEGORY_COLORS = [
  COLORS.leaf, COLORS.amber, COLORS.sky, COLORS.rose,
  COLORS.violet, COLORS.teal, COLORS.slate,
];

export const TrendChart = {
  props: {
    data: { type: Array, default: () => [] },
    label: { type: String, default: '减碳量 (kg CO₂e)' },
  },
  template: `<canvas ref="canvas"></canvas>`,
  mounted() { this.render(); },
  watch: { data() { this.render(); } },
  beforeUnmount() { this.chart?.destroy(); },
  methods: {
    render() {
      if (this.chart) this.chart.destroy();
      const ctx = this.$refs.canvas?.getContext('2d');
      if (!ctx) return;

      const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 200);
      gradient.addColorStop(0, 'rgba(63,148,81,0.25)');
      gradient.addColorStop(1, 'rgba(63,148,81,0.01)');

      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.data.map(d => {
            const dt = new Date(d.date);
            return `${dt.getMonth() + 1}/${dt.getDate()}`;
          }),
          datasets: [{
            label: this.label,
            data: this.data.map(d => d.carbon),
            borderColor: '#3f9451',
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: '#3f9451',
            pointBorderColor: '#fff',
            pointBorderWidth: 1.5,
            borderWidth: 2.5,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(30,41,59,0.9)',
              titleFont: { size: 12 },
              bodyFont: { size: 13, weight: '600' },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => `${ctx.parsed.y} kg CO₂e`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: '#94a3b8' },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 11 }, color: '#94a3b8' },
            },
          },
          interaction: { intersect: false, mode: 'index' },
        },
      });
    },
  },
};

export const CategoryDoughnut = {
  props: {
    items: { type: Array, default: () => [] },
  },
  template: `<canvas ref="canvas"></canvas>`,
  mounted() { this.render(); },
  watch: { items() { this.render(); } },
  beforeUnmount() { this.chart?.destroy(); },
  methods: {
    render() {
      if (this.chart) this.chart.destroy();
      const ctx = this.$refs.canvas?.getContext('2d');
      if (!ctx) return;

      const colors = this.items.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length].border);

      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.items.map(d => d.label),
          datasets: [{
            data: this.items.map(d => d.kg),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: {
              position: 'right',
              labels: { font: { size: 12 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 },
            },
            tooltip: {
              backgroundColor: 'rgba(30,41,59,0.9)',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.parsed} kg CO₂e`,
              },
            },
          },
        },
      });
    },
  },
};

export const CampusBar = {
  props: {
    items: { type: Array, default: () => [] },
  },
  template: `<canvas ref="canvas"></canvas>`,
  mounted() { this.render(); },
  watch: { items() { this.render(); } },
  beforeUnmount() { this.chart?.destroy(); },
  methods: {
    render() {
      if (this.chart) this.chart.destroy();
      const ctx = this.$refs.canvas?.getContext('2d');
      if (!ctx) return;

      this.chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.items.map(d => d.campus || '未知'),
          datasets: [{
            label: '减碳量 (kg CO₂e)',
            data: this.items.map(d => d.carbon),
            backgroundColor: ['rgba(63,148,81,0.7)', 'rgba(14,165,233,0.7)'],
            borderColor: ['#3f9451', '#0ea5e9'],
            borderWidth: 2,
            borderRadius: 8,
            maxBarThickness: 56,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(30,41,59,0.9)',
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.parsed.y} kg CO₂e`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 12 }, color: '#475569' },
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(0,0,0,0.04)' },
              ticks: { font: { size: 11 }, color: '#94a3b8' },
            },
          },
        },
      });
    },
  },
};
