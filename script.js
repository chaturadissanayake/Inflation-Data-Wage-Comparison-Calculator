// script.js
document.addEventListener('DOMContentLoaded', () => {
  /* -----------------------------
   * THEME HELPERS (for charts too)
   * ----------------------------- */
  const THEME_KEY = 'irwc-theme';
  const rootEl = document.documentElement;
  const themeSwitch = document.getElementById('theme-switch');

  function getVar(name) {
    return getComputedStyle(rootEl).getPropertyValue(name).trim();
  }
  function hexToRgba(hex, alpha = 0.15) {
    // Accepts #RGB or #RRGGBB
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const num = parseInt(h, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function applyTheme(theme) {
    rootEl.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (themeSwitch) {
      themeSwitch.checked = theme === 'dark';
      // [ux-improve] Keep ARIA state in sync with visual switch
      const label = document.querySelector('label[for="theme-switch"]');
      if (label) label.setAttribute('aria-checked', String(theme === 'dark'));
      // swap icons via CSS (handled)
    }
    refreshChartColors(); // keep charts in sync with theme tokens
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    }
  }
  themeSwitch?.addEventListener('change', () => {
    applyTheme(themeSwitch.checked ? 'dark' : 'light');
  });
  // [ux-improve] Update if OS theme changes
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', e => {
    const saved = localStorage.getItem(THEME_KEY);
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* -----------------------------
   * DATA
   * ----------------------------- */
  const labels = [
    'Jan 22','Feb 22','Mar 22','Apr 22','May 22','Jun 22','Jul 22','Aug 22','Sep 22','Oct 22','Nov 22','Dec 22',
    'Jan 23','Feb 23','Mar 23','Apr 23','May 23','Jun 23','Jul 23','Aug 23','Sep 23','Oct 23','Nov 23','Dec 23',
    'Jan 24','Feb 24','Mar 24','Apr 24','May 24','Jun 24','Jul 24','Aug 24','Sep 24','Oct 24','Nov 24','Dec 24',
    'Jan 25','Feb 25','Mar 25','Apr 25','May 25','Jun 25','Jul 25','Aug 25'
  ];
  // YoY % (illustrative series consistent with your previous file)
  const ccpiData = [14.2,15.1,18.7,29.8,39.1,54.6,60.8,64.3,69.8,66.0,61.0,57.2,51.7,50.6,50.3,35.3,25.2,12.0,6.3,4.0,1.3,1.5,3.4,4.0,6.4,5.9,0.9,1.5,0.9,1.7,2.5,3.0,3.5,3.2,2.8,2.5,2.2,1.8,2.0,2.3,2.8,3.1,3.4,3.6];
  const ncpiData = [16.8,17.5,21.5,33.8,45.3,58.9,66.7,70.2,73.7,70.6,65.0,59.2,53.2,53.6,49.2,33.6,22.1,10.8,4.6,2.1,0.8,1.0,2.8,4.2,6.5,5.1,2.5,2.7,1.6,2.4,3.0,3.5,4.0,3.8,3.5,3.1,2.9,2.5,2.8,3.0,3.4,3.6,3.8,4.0];
  // CCPI Index (base=2013=100) — used for purchasing power calc
  const ccpiIndexData = [155.1,157.0,161.4,171.1,179.8,191.6,199.1,203.8,209.6,209.1,208.2,206.9,205.8,205.1,205.2,207.2,208.5,208.2,208.1,208.7,208.8,209.7,212.0,213.5,214.2,215.1,216.0,217.1,217.5,217.9,218.5,219.1,219.8,220.4,221.0,221.5,222.0,222.5,223.1,223.8,224.5,225.2,226.0,226.8];

  let purchasingPowerData = new Array(labels.length).fill(0);

  /* -----------------------------
   * ELEMENTS
   * ----------------------------- */
  const el = {
    janSalary: document.getElementById('jan-salary'),
    currentSalary: document.getElementById('current-salary'),
    savingsPercentage: document.getElementById('savings-percentage'),
    savingsSlider: document.getElementById('savings-slider'),
    expectedReturn: document.getElementById('expected-return'),
    returnSlider: document.getElementById('return-slider'),
    calculateBtn: document.getElementById('calculate-btn'),
    resetBtn: document.getElementById('reset-btn'),
    resultsSummary: document.getElementById('results-summary'),

    ccpiValue: document.getElementById('ccpi-value'),
    ccpiChange: document.getElementById('ccpi-change'),
    ccpiDate: document.getElementById('ccpi-date'),
    ncpiValue: document.getElementById('ncpi-value'),
    ncpiChange: document.getElementById('ncpi-change'),
    ncpiDate: document.getElementById('ncpi-date'),
    wageValue: document.getElementById('wage-value'),
    wageChange: document.getElementById('wage-change'),
    wageTrend: document.getElementById('wage-trend'),
    peakInflation: document.getElementById('peak-inflation'),
    peakInflationDate: document.getElementById('peak-inflation-date'),
    latestMonth: document.getElementById('latest-month'),
    latestInflation: document.getElementById('latest-inflation'),
    breakdownDate: document.getElementById('breakdown-date'),
    
    // Chart controls
    zoomIn: document.getElementById('zoom-in'),
    zoomOut: document.getElementById('zoom-out'),
    resetZoom: document.getElementById('reset-zoom'),
    downloadChart: document.getElementById('download-chart')
  };

  // Defaults derive from the DOM so Reset can restore them
  const defaultValues = {
    janSalary: parseFloat(el.janSalary.value) || 100000,
    currentSalary: parseFloat(el.currentSalary.value) || 150000,
    savingsPercentage: parseFloat(el.savingsPercentage.value) || 20,
    expectedReturn: parseFloat(el.expectedReturn.value) || 8,
  };

  /* -----------------------------
   * CHARTS
   * ----------------------------- */
  let inflationChart, savingsChart;
  let chartZoomLevel = 1;
  let chartStartIndex = 0;

  function buildInflationDatasets() {
    const blue = getVar('--blue') || '#36A2EB';
    const red = getVar('--red') || '#FF6384';
    const green = getVar('--green') || '#4CAF50';
    return [
      {
        label: 'CCPI Inflation (YoY %)',
        data: ccpiData,
        borderColor: blue,
        backgroundColor: hexToRgba(blue.startsWith('#') ? blue : '#36A2EB', 0.12),
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'NCPI Inflation (YoY %)',
        data: ncpiData,
        borderColor: red,
        backgroundColor: hexToRgba(red.startsWith('#') ? red : '#FF6384', 0.12),
        fill: true,
        tension: 0.35,
        yAxisID: 'y',
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Purchasing Power of Jan 2022 Salary',
        data: purchasingPowerData,
        borderColor: green,
        backgroundColor: 'transparent',
        fill: false,
        borderDash: [6, 6],
        tension: 0.35,
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      }
    ];
  }

  function initInflationChart() {
    const ctx = document.getElementById('inflationChart').getContext('2d');
    inflationChart = new Chart(ctx, {
      type: 'line',
      data: { 
        labels, 
        datasets: buildInflationDatasets() 
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { 
            display: false,
            position: 'top', 
            labels: { usePointStyle: true, padding: 16 } 
          },
          tooltip: {
            backgroundColor: getVar('--card') || '#fff',
            titleColor: getVar('--text') || '#111827',
            bodyColor: getVar('--text') || '#111827',
            borderColor: getVar('--muted') || '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || '';
                const val = ctx.parsed.y;
                if (ctx.dataset.yAxisID === 'y1') {
                  return `${label}: LKR ${Math.round(val).toLocaleString('en-US')}`;
                }
                return `${label}: ${val.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { 
              display: true,
              color: 'rgba(200,200,200,0.1)'
            }, 
            ticks: { 
              maxRotation: 45, 
              autoSkip: true, 
              maxTicksLimit: 12,
              color: getVar('--text') || '#1e293b',
              font: {
                size: 12
              }
            } 
          },
          y: {
            type: 'linear',
            position: 'left',
            title: { 
              display: true, 
              text: 'Inflation Rate (%)',
              color: getVar('--text') || '#1e293b',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: { 
              color: 'rgba(200,200,200,0.2)' 
            },
            ticks: {
              color: getVar('--text') || '#1e293b',
              font: {
                size: 12
              }
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { 
              display: true, 
              text: 'Real Purchasing Power (LKR)',
              color: getVar('--text') || '#1e293b',
              font: {
                size: 14,
                weight: 'bold'
              }
            },
            grid: { 
              drawOnChartArea: false 
            },
            ticks: {
              color: getVar('--text') || '#1e293b',
              font: {
                size: 12
              },
              callback: function(value) {
                if (value >= 1000000) {
                  return 'LKR ' + (value/1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return 'LKR ' + (value/1000).toFixed(0) + 'K';
                }
                return 'LKR ' + value;
              }
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeOutQuart'
        }
      }
    });
    updateInflationAxes();
  }

  function updateInflationAxes() {
    const y = inflationChart.options.scales.y;
    const minVal = Math.min(...ccpiData, ...ncpiData);
    const maxVal = Math.max(...ccpiData, ...ncpiData);
    y.min = niceFloor(minVal);
    y.max = niceCeil(maxVal);

    const y1 = inflationChart.options.scales.y1;
    const minPP = Math.min(...purchasingPowerData.filter(v => v > 0));
    const maxPP = Math.max(...purchasingPowerData);
    if (isFinite(minPP) && isFinite(maxPP)) {
      // Improved scaling for purchasing power
      y1.min = Math.max(0, Math.floor(minPP * 0.9));
      y1.max = Math.ceil(maxPP * 1.1);
    }
    inflationChart.update();
  }

  function niceCeil(v) {
    const step = v > 50 ? 10 : v > 10 ? 5 : 1;
    return Math.ceil((v + step) / step) * step;
  }
  function niceFloor(v) {
    const step = v > 50 ? 10 : v > 10 ? 5 : 1;
    return Math.floor((v - step) / step) * step;
  }

  function refreshChartColors() {
    if (!inflationChart) return;
    
    // Update tooltip colors
    inflationChart.options.plugins.tooltip.backgroundColor = getVar('--card') || '#fff';
    inflationChart.options.plugins.tooltip.titleColor = getVar('--text') || '#111827';
    inflationChart.options.plugins.tooltip.bodyColor = getVar('--text') || '#111827';
    inflationChart.options.plugins.tooltip.borderColor = getVar('--muted') || '#e5e7eb';
    
    // Update axis colors
    inflationChart.options.scales.x.ticks.color = getVar('--text') || '#1e293b';
    inflationChart.options.scales.y.ticks.color = getVar('--text') || '#1e293b';
    inflationChart.options.scales.y.title.color = getVar('--text') || '#1e293b';
    inflationChart.options.scales.y1.ticks.color = getVar('--text') || '#1e293b';
    inflationChart.options.scales.y1.title.color = getVar('--text') || '#1e293b';
    
    const [ds1, ds2, ds3] = buildInflationDatasets();
    inflationChart.data.datasets[0].borderColor = ds1.borderColor;
    inflationChart.data.datasets[0].backgroundColor = ds1.backgroundColor;
    inflationChart.data.datasets[1].borderColor = ds2.borderColor;
    inflationChart.data.datasets[1].backgroundColor = ds2.backgroundColor;
    inflationChart.data.datasets[2].borderColor = ds3.borderColor;
    inflationChart.update('none');
    
    if (savingsChart) {
      const accent = getVar('--accent') || '#B8001F';
      savingsChart.data.datasets[0].borderColor = accent;
      savingsChart.data.datasets[0].backgroundColor = hexToRgba((accent.startsWith('#') ? accent : '#B8001F'), 0.12);
      savingsChart.update('none');
    }
  }

  function initSavingsChart() {
    const canvas = document.getElementById('savingsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const accent = getVar('--accent') || '#B8001F';
    savingsChart = new Chart(ctx, {
      type: 'line',
      data: { 
        labels: [], 
        datasets: [{
          label: 'Savings Growth', 
          data: [], 
          borderColor: accent, 
          backgroundColor: hexToRgba(accent.startsWith('#') ? accent : '#B8001F', 0.12), 
          fill: true, 
          tension: 0.35,
          borderWidth: 2,
        }] 
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: getVar('--card') || '#fff',
            titleColor: getVar('--text') || '#111827',
            bodyColor: getVar('--text') || '#111827',
            borderColor: getVar('--muted') || '#e5e7eb',
            callbacks: {
              label: (ctx) => {
                return `Savings: LKR ${Math.round(ctx.parsed.y).toLocaleString('en-US')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: getVar('--text') || '#1e293b'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: getVar('--text') || '#1e293b',
              callback: (v) => 'LKR ' + (v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)
            },
            grid: {
              color: 'rgba(200,200,200,0.2)'
            }
          }
        }
      }
    });
  }

  function zoomChart(direction) {
    if (direction === 'in') {
      chartZoomLevel = Math.min(chartZoomLevel + 0.2, 3);
    } else if (direction === 'out') {
      chartZoomLevel = Math.max(chartZoomLevel - 0.2, 1);
    } else {
      chartZoomLevel = 1;
      chartStartIndex = 0;
    }
    
    const visiblePoints = Math.floor(labels.length / chartZoomLevel);
    chartStartIndex = Math.min(chartStartIndex, labels.length - visiblePoints);
    
    inflationChart.options.scales.x.min = chartStartIndex;
    inflationChart.options.scales.x.max = chartStartIndex + visiblePoints;
    inflationChart.update();
  }

  function downloadChart() {
    const link = document.createElement('a');
    link.download = 'sri-lanka-inflation-chart.png';
    link.href = document.getElementById('inflationChart').toDataURL('image/png');
    link.click();
  }

  /* -----------------------------
   * UTILS
   * ----------------------------- */
  function animateValue(element, start, end, duration, fmtFn) {
    let startTS = null;
    const step = (ts) => {
      if (!startTS) startTS = ts;
      const p = Math.min((ts - startTS) / duration, 1);
      const val = start + (end - start) * p;
      element.textContent = fmtFn(val);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function validateInputs() {
    let isValid = true;
    document.querySelectorAll('.input-group').forEach(group => {
      const input = group.querySelector('input');
      if (!input) return;
      const errorEl = group.querySelector('.error-message');
      const value = parseFloat(input.value);
      let message = '';
      if (isNaN(value)) message = 'Please enter a number.';
      else if (value < 0) message = 'Value cannot be negative.';
      else if (input.id === 'savings-percentage' && value > 100) message = 'Cannot exceed 100%.';
      if (message) {
        group.classList.add('error');
        if (errorEl) errorEl.textContent = message;
        isValid = false;
      } else {
        group.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
      }
    });
    return isValid;
  }

  // Real savings FV with monthly contributions
  function fvMonthly(monthlyPayment, annualRatePct, years) {
    const r = (annualRatePct / 100) / 12;
    const n = years * 12;
    if (!r) return monthlyPayment * n;
    return monthlyPayment * (Math.pow(1 + r, n) - 1) / r;
  }

  /* -----------------------------
   * CORE CALCULATIONS & UI UPDATE
   * ----------------------------- */
  function analyzeFinancials() {
    if (!validateInputs()) return;

    el.calculateBtn.classList.add('loading');
    el.calculateBtn.disabled = true;

    // Light delay so the loading spinner is perceivable
    setTimeout(() => {
      const janSalary = parseFloat(el.janSalary.value);
      const currentSalary = parseFloat(el.currentSalary.value);
      const savingsPct = parseFloat(el.savingsPercentage.value);
      const expectedReturn = parseFloat(el.expectedReturn.value);

      // Purchasing power vs CCPI index
      const baseIndex = ccpiIndexData[0]; // Jan 22
      purchasingPowerData = ccpiIndexData.map(index => (janSalary * baseIndex) / index);

      const latestIndex = ccpiIndexData[ccpiIndexData.length - 1];
      const currentSalaryIn2022Terms = (currentSalary * baseIndex) / latestIndex;
      const wageChangePercent = ((currentSalaryIn2022Terms - janSalary) / janSalary) * 100;

      // Update main chart
      inflationChart.data.datasets[2].data = purchasingPowerData;
      updateInflationAxes();

      // Savings and dashboard
      updateSavings(currentSalary, savingsPct, expectedReturn);
      updateDashboard(wageChangePercent);
      updateSummaryText(janSalary, currentSalary, wageChangePercent);

      el.calculateBtn.classList.remove('loading');
      el.calculateBtn.disabled = false;
    }, 250);
  }

  function updateSavings(currentSalary, savingsPct, expectedReturn) {
    const monthly = currentSalary * (savingsPct / 100);
    const periods = [1, 5, 10];
    const points = [];

    periods.forEach(years => {
      const totalSaved = monthly * 12 * years;
      const futureValue = fvMonthly(monthly, expectedReturn, years);
      const returns = futureValue - totalSaved;

      animateValue(
        document.getElementById(`savings-${years}y`),
        0, futureValue, 650,
        (v) => 'LKR ' + Math.round(v).toLocaleString('en-US')
      );
      document.getElementById(`saved-${years}y`).textContent = 'Principal: ' + 'LKR ' + Math.round(totalSaved).toLocaleString('en-US');
      document.getElementById(`returns-${years}y`).textContent = 'Returns: ' + 'LKR ' + Math.round(returns).toLocaleString('en-US');

      points.push({ label: years + 'Y', value: futureValue });
    });

    if (savingsChart) {
      savingsChart.data.labels = points.map(p => p.label);
      savingsChart.data.datasets[0].data = points.map(p => p.value);
      savingsChart.update();
    }
  }

  function updateDashboard(wageChangePercent) {
    const last = labels.length - 1;
    const prev = labels.length - 2;
    const latestMonthStr = labels[last].replace(' ', ' 20');

    updateCard(el.ccpiValue, el.ccpiChange, ccpiData[last], ccpiData[prev]);
    el.ccpiDate.textContent = latestMonthStr;

    updateCard(el.ncpiValue, el.ncpiChange, ncpiData[last], ncpiData[prev]);
    el.ncpiDate.textContent = latestMonthStr;

    const pos = wageChangePercent >= 0;
    el.wageValue.textContent = (pos ? '+' : '') + wageChangePercent.toFixed(1) + '%';
    el.wageChange.textContent = (pos ? 'Gain' : 'Loss') + ' in Purchasing Power';
    el.wageChange.className = 'change ' + (pos ? 'positive' : 'negative');

    const peak = Math.max(...ccpiData);
    const peakIdx = ccpiData.indexOf(peak);
    el.peakInflation.textContent = peak.toFixed(1) + '%';
    el.peakInflationDate.textContent = labels[peakIdx].replace(' ', ' 20');
    el.latestMonth.textContent = latestMonthStr;
    el.breakdownDate.textContent = latestMonthStr;
    el.latestInflation.textContent = ccpiData[last].toFixed(1) + '%';
    el.wageTrend.textContent = `Compared to Jan 2022, your current salary gives you ${Math.abs(wageChangePercent).toFixed(1)}% ${pos ? 'more' : 'less'} purchasing power today.`;
  }

  function updateCard(valueEl, changeEl, current, previous) {
    const change = current - previous;
    valueEl.textContent = current.toFixed(1) + '%';
    changeEl.textContent = (change >= 0 ? '↑ ' : '↓ ') + Math.abs(change).toFixed(1) + '% from last month';
    changeEl.className = 'change ' + (change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral');
  }

  function updateSummaryText(janSalary, currentSalary, wageChangePercent) {
    const salaryIncrease = ((currentSalary - janSalary) / janSalary) * 100;
    let summary = `Your nominal salary has increased by <strong>${salaryIncrease.toFixed(1)}%</strong> since January 2022. `;
    if (wageChangePercent >= 0) {
      summary += `After accounting for inflation, your real purchasing power has <strong>increased by ${wageChangePercent.toFixed(1)}%</strong>. Your salary growth has successfully outpaced inflation.`;
    } else {
      summary += `However, after accounting for inflation, your real purchasing power has <strong>decreased by ${Math.abs(wageChangePercent).toFixed(1)}%</strong>. The cost of living has risen faster than your salary.`;
    }
    el.resultsSummary.innerHTML = summary;
  }

  /* -----------------------------
   * TABS (click + keyboard)
   * ----------------------------- */
  function setupTabs() {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const panels = {
      inflation: document.getElementById('inflation-tab'),
      breakdown: document.getElementById('breakdown-tab'),
      savings: document.getElementById('savings-tab'),
    };

    function activate(tab) {
      tabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
        panels[t.dataset.tab].classList.toggle('active', isActive);
      });
    }

    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') tabs[(idx + 1) % tabs.length].focus();
        if (e.key === 'ArrowLeft') tabs[(idx - 1 + tabs.length) % tabs.length].focus();
        if (e.key === 'Enter' || e.key === ' ') activate(tab);
      });
    });
  }

  /* -----------------------------
   * SLIDER SYNCING
   * ----------------------------- */
  function setupSliders() {
    // Savings percentage slider
    el.savingsSlider.addEventListener('input', () => {
      el.savingsPercentage.value = el.savingsSlider.value;
    });
    
    el.savingsPercentage.addEventListener('input', () => {
      if (el.savingsPercentage.value > 100) el.savingsPercentage.value = 100;
      if (el.savingsPercentage.value < 0) el.savingsPercentage.value = 0;
      el.savingsSlider.value = el.savingsPercentage.value;
    });
    
    // Expected return slider
    el.returnSlider.addEventListener('input', () => {
      el.expectedReturn.value = el.returnSlider.value;
    });
    
    el.expectedReturn.addEventListener('input', () => {
      if (el.expectedReturn.value > 30) el.expectedReturn.value = 30;
      if (el.expectedReturn.value < 0) el.expectedReturn.value = 0;
      el.returnSlider.value = el.expectedReturn.value;
    });
  }

  /* -----------------------------
   * RESET
   * ----------------------------- */
  function resetCalculator() {
    el.janSalary.value = defaultValues.janSalary;
    el.currentSalary.value = defaultValues.currentSalary;
    el.savingsPercentage.value = defaultValues.savingsPercentage;
    el.savingsSlider.value = el.savingsPercentage.value;
    el.expectedReturn.value = defaultValues.expectedReturn;
    el.returnSlider.value = el.expectedReturn.value;

    // Clear validation
    document.querySelectorAll('.input-group').forEach(group => {
      group.classList.remove('error');
      const em = group.querySelector('.error-message');
      if (em) em.textContent = '';
    });

    // Clear quick stats while recomputing
    ['ccpi-value','ccpi-change','ccpi-date','ncpi-value','ncpi-change','ncpi-date','wage-value','wage-change']
      .forEach(id => { const n = document.getElementById(id); if (n) n.textContent = '--'; });
    el.resultsSummary.innerHTML = '';

    // Reset charts
    inflationChart.data.datasets[2].data = [];
    inflationChart.update();
    if (savingsChart) {
      savingsChart.data.labels = [];
      savingsChart.data.datasets[0].data = [];
      savingsChart.update();
    }

    // Reset zoom
    zoomChart('reset');

    // Recompute with defaults
    analyzeFinancials();
  }

  /* -----------------------------
   * INIT
   * ----------------------------- */
  initTheme();
  initInflationChart();
  initSavingsChart();
  setupTabs();
  setupSliders();

  // [ux-improve] Make toggle keyboard-friendly via label space/enter
  const toggleLabel = document.querySelector('label[for="theme-switch"]');
  toggleLabel?.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      themeSwitch.checked = !themeSwitch.checked;
      applyTheme(themeSwitch.checked ? 'dark' : 'light');
    }
  });
  toggleLabel?.setAttribute('tabindex', '0');

  // Chart controls
  el.zoomIn.addEventListener('click', () => zoomChart('in'));
  el.zoomOut.addEventListener('click', () => zoomChart('out'));
  el.resetZoom.addEventListener('click', () => zoomChart('reset'));
  el.downloadChart.addEventListener('click', downloadChart);

  // Live validation
  document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', validateInputs);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') analyzeFinancials(); });
  });

  el.calculateBtn.addEventListener('click', analyzeFinancials);
  el.resetBtn.addEventListener('click', resetCalculator);

  // First paint
  analyzeFinancials();
  
  // Setup info icon tooltips
  document.querySelectorAll('.info-icon').forEach(icon => {
    const label = icon.getAttribute('aria-label');
    icon.setAttribute('title', label);
  });
});
