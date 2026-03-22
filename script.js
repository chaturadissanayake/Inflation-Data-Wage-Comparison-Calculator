document.addEventListener('DOMContentLoaded', () => {
  
  // --- Core Economic Data (2022 to 2026) ---
  const labels = ['Jan 22','Jun 22','Jan 23','Jun 23','Jan 24','Jun 24','Jan 25','Jun 25','Jan 26', 'Feb 26'];
  const ccpi_yoy = [14.2, 54.6, 54.2, 12.0, 6.4, 1.7, -4.0, -0.6, 2.3, 1.6];
  const ncpi_yoy = [16.8, 58.9, 53.2, 10.8, 6.5, 2.4, -4.0, 0.3, 2.4, 2.4]; 
  
  // Real index values required to calculate pure purchasing power drop from Jan 2022 base
  const ccpi_index = [100, 140, 195, 205, 215, 218, 208, 206, 210, 212];
  const ncpi_index = [100, 145, 200, 210, 220, 224, 214, 215, 220, 222];

  // Distinct Colors for Chart vs. Data to prevent clashing
  const colorPositive = '#27AE60'; // Emerald Green
  const colorNegative = '#C0392B'; // Muted Red
  const colorCcpiLine = '#2980B9'; // Bright Professional Blue
  const colorNcpiLine = '#D35400'; // Burnt Orange (Highly distinguishable)

  // --- Chart Initialization ---
  const ctx = document.getElementById('mainChart').getContext('2d');

  window.mainChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { 
          type: 'line', 
          label: 'Colombo Consumer Price Index (YoY %)', 
          data: ccpi_yoy, 
          borderColor: colorCcpiLine, 
          backgroundColor: colorCcpiLine,
          borderWidth: 2.5, 
          tension: 0.3,
          pointRadius: 3
        },
        { 
          type: 'line', 
          label: 'National Consumer Price Index (YoY %)', 
          data: ncpi_yoy, 
          borderColor: colorNcpiLine, 
          backgroundColor: colorNcpiLine,
          borderWidth: 2.5, 
          tension: 0.3,
          borderDash: [5, 5], // Dotted line helps visually separate it
          pointRadius: 3
        },
        { 
          type: 'bar', 
          label: 'Real Wage Index Component', 
          data: [], 
          backgroundColor: [], 
          borderRadius: 2
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { 
        legend: { 
          position: 'top', 
          labels: { 
            color: '#2c3e50', 
            usePointStyle: false, // Lines drawn in legend, not circles
            boxWidth: 40
          } 
        } 
      },
      scales: {
        x: { ticks: { color: '#7f8c8d' }, grid: { display: false } },
        y: { 
          ticks: { color: '#7f8c8d' }, 
          title: { display: true, text: 'Inflation %', color: '#7f8c8d' },
          border: { dash: [4, 4] } 
        }
      }
    }
  });

  // --- Calculator & Dynamic AI Logic ---
  function calculateFinancials() {
    const jan22Sal = parseFloat(document.getElementById('jan2022_salary').value) || 0;
    const currSal = parseFloat(document.getElementById('current_salary').value) || 0;
    const savePct = parseFloat(document.getElementById('savings_percent').value) || 0;
    const expRet = parseFloat(document.getElementById('expected_return').value) || 0;

    const latestCcpi = ccpi_index[ccpi_index.length - 1];
    const latestNcpi = ncpi_index[ncpi_index.length - 1];

    const wageImpactCcpi = (((currSal * (100 / latestCcpi)) - jan22Sal) / jan22Sal) * 100;
    const wageImpactNcpi = (((currSal * (100 / latestNcpi)) - jan22Sal) / jan22Sal) * 100;

    const ccpiEl = document.getElementById('wage_ccpi');
    const ncpiEl = document.getElementById('wage_ncpi');
    
    // Set text and assign semantic colors
    ccpiEl.textContent = `${wageImpactCcpi >= 0 ? '+' : ''}${wageImpactCcpi.toFixed(1)}%`;
    ccpiEl.style.color = wageImpactCcpi >= 0 ? colorPositive : colorNegative;
    
    ncpiEl.textContent = `${wageImpactNcpi >= 0 ? '+' : ''}${wageImpactNcpi.toFixed(1)}%`;
    ncpiEl.style.color = wageImpactNcpi >= 0 ? colorPositive : colorNegative;

    // Chart Data Generation
    let historicalWageData = [];
    let barColors = [];
    
    for(let i = 0; i < ccpi_index.length; i++) {
        let realWageIndex = (100 / ccpi_index[i]) * 100; 
        if(i === ccpi_index.length -1) {
             realWageIndex = realWageIndex * (currSal / jan22Sal);
        }
        historicalWageData.push(realWageIndex);
        barColors.push(realWageIndex < 100 ? colorNegative : colorPositive);
    }
    
    window.mainChart.data.datasets[2].data = historicalWageData;
    window.mainChart.data.datasets[2].backgroundColor = barColors;
    window.mainChart.update();

    // --- Dynamic AI Economic Impact Summary ---
    const monthlySavings = currSal * (savePct / 100);
    const projectedReturn = (monthlySavings * 12) * (expRet / 100);
    const summaryBox = document.getElementById('analysis-summary');
    
    // Calculate severity for dynamic text
    const isNegative = wageImpactCcpi < 0;
    const absImpact = Math.abs(wageImpactCcpi);
    let severity = "";
    if (absImpact < 5) severity = "marginal";
    else if (absImpact < 20) severity = "moderate";
    else severity = "significant";

    // Calculate real LKR value to make it tangible
    const currentRealValue = currSal * (100 / latestCcpi);

    let summaryText = `<strong>AI Economic Impact Summary:</strong><br><br>`;
    
    if (isNegative) {
      summaryText += `Our models indicate a <strong>${severity} contraction</strong> in your purchasing power. Although you are earning LKR ${currSal.toLocaleString()} today, ongoing inflationary pressure means this salary currently has the purchasing power of LKR ${currentRealValue.toLocaleString(undefined, {maximumFractionDigits:0})} in January 2022 terms. Effectively, you have experienced a <strong>${absImpact.toFixed(1)}% depreciation</strong> in your wage's real value.<br><br>`;
    } else {
      summaryText += `Our models indicate a <strong>${severity} appreciation</strong> in your purchasing power. Your current salary of LKR ${currSal.toLocaleString()} has successfully outpaced the baseline inflation metrics. Adjusted for inflation, your wage is effectively worth LKR ${currentRealValue.toLocaleString(undefined, {maximumFractionDigits:0})} in January 2022 terms, representing a <strong>${absImpact.toFixed(1)}% real growth</strong>.<br><br>`;
    }

    if (savePct > 0) {
      summaryText += `<strong>Strategic Allocation:</strong> By maintaining a ${savePct}% savings rate, you are securing LKR ${(monthlySavings * 12).toLocaleString(undefined, {maximumFractionDigits:0})} annually. Projecting this at your anticipated ${expRet}% yield, the portfolio is estimated to generate <strong>LKR ${projectedReturn.toLocaleString(undefined, {maximumFractionDigits:0})}</strong> in interest over the next year. This capital allocation provides a calculated buffer against future index volatility.`;
    } else {
       summaryText += `<strong>Strategic Allocation:</strong> The current model reflects a 0% savings allocation. Given the macroeconomic conditions, deploying capital into yield-bearing assets is highly recommended to offset systemic currency depreciation.`;
    }

    summaryBox.innerHTML = summaryText;
  }

  // Event Listeners
  document.getElementById('calculate-btn').addEventListener('click', calculateFinancials);
  
  // Enter key support for inputs
  document.querySelectorAll('input').forEach(input => {
      input.addEventListener('keypress', function(e) {
          if(e.key === 'Enter') calculateFinancials();
      });
  });

  // Initial Calculation
  calculateFinancials(); 
});
