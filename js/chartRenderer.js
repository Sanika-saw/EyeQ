/**
 * StorePulse AI - Interactive Footfall Chart Renderer
 */

export class ChartRenderer {
  constructor() {
    this.chartContainer = document.getElementById('footfallChartContainer');
    this.tooltip = document.getElementById('chartTooltip');
    this.peakTag = document.getElementById('chartPeakTag');
    this.chartDeltaBadge = document.getElementById('chartDeltaBadge');
    this.chartTimeToggleBtns = document.querySelectorAll('[data-chart-range]');

    this.dataSets = {
      today: {
        label: '+14.2% Today',
        peakText: 'Peak: 312 / hr at 13:00',
        points: [
          { hour: '09:00', x: 0, y: 110, count: 85 },
          { hour: '10:00', x: 30, y: 105, count: 110 },
          { hour: '11:00', x: 70, y: 95, count: 145 },
          { hour: '12:00', x: 110, y: 80, count: 195 },
          { hour: '12:30', x: 150, y: 55, count: 260 },
          { hour: '13:00', x: 230, y: 30, count: 312, isPeak: true },
          { hour: '15:00', x: 270, y: 42, count: 280 },
          { hour: '17:00', x: 310, y: 65, count: 235 },
          { hour: '19:00', x: 350, y: 85, count: 170 },
          { hour: '21:00', x: 400, y: 95, count: 125 }
        ]
      },
      yesterday: {
        label: '-2.4% Yesterday',
        peakText: 'Peak: 268 / hr at 14:00',
        points: [
          { hour: '09:00', x: 0, y: 115, count: 70 },
          { hour: '10:00', x: 30, y: 110, count: 95 },
          { hour: '11:00', x: 70, y: 102, count: 130 },
          { hour: '12:00', x: 110, y: 90, count: 170 },
          { hour: '13:00', x: 150, y: 70, count: 215 },
          { hour: '14:00', x: 230, y: 45, count: 268, isPeak: true },
          { hour: '16:00', x: 270, y: 55, count: 240 },
          { hour: '18:00', x: 310, y: 75, count: 195 },
          { hour: '20:00', x: 350, y: 95, count: 135 },
          { hour: '21:00', x: 400, y: 105, count: 95 }
        ]
      }
    };

    this.currentView = 'today';

    this.init();
  }

  init() {
    this.render();
    this.setupListeners();
  }

  setupListeners() {
    this.chartTimeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const range = btn.getAttribute('data-chart-range');
        if (this.dataSets[range]) {
          this.currentView = range;
          this.chartTimeToggleBtns.forEach(b => {
            b.classList.remove('bg-primary', 'text-surface');
            b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
          });
          btn.classList.add('bg-primary', 'text-surface');
          btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
          this.render();
        }
      });
    });
  }

  render() {
    const dataset = this.dataSets[this.currentView];
    if (!dataset || !this.chartContainer) return;

    if (this.chartDeltaBadge) {
      this.chartDeltaBadge.textContent = dataset.label;
      this.chartDeltaBadge.className = this.currentView === 'today'
        ? 'font-label-sm text-label-sm text-on-tertiary-container font-medium'
        : 'font-label-sm text-label-sm text-[#92400E] font-medium';
    }

    if (this.peakTag) {
      this.peakTag.textContent = dataset.peakText;
    }

    // Generate Points & Hover Targets
    const points = dataset.points;
    const svgEl = this.chartContainer.querySelector('svg');
    if (!svgEl) return;

    // Remove existing interactive points
    svgEl.querySelectorAll('.chart-interactive-point').forEach(p => p.remove());

    points.forEach(pt => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', pt.isPeak ? '4.5' : '3');
      circle.setAttribute('fill', pt.isPeak ? '#0f172a' : '#515f74');
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '1.5');
      circle.setAttribute('class', 'chart-interactive-point chart-point');

      circle.addEventListener('mouseenter', (e) => {
        if (this.tooltip) {
          this.tooltip.innerHTML = `<strong>${pt.hour}</strong>: ${pt.count} shoppers/hr`;
          this.tooltip.style.opacity = '1';
          const rect = this.chartContainer.getBoundingClientRect();
          const pointX = (pt.x / 400) * rect.width;
          const pointY = (pt.y / 120) * rect.height;
          this.tooltip.style.left = `${pointX - 45}px`;
          this.tooltip.style.top = `${pointY - 35}px`;
        }
      });

      circle.addEventListener('mouseleave', () => {
        if (this.tooltip) {
          this.tooltip.style.opacity = '0';
        }
      });

      svgEl.appendChild(circle);
    });
  }
}
