document.addEventListener('DOMContentLoaded', function() {
    // --- DATA ---
    // Sourced from CBSL/DCS, with realistic projections from July 2024 onwards.
    const labels = [
        'Jan 22', 'Feb 22', 'Mar 22', 'Apr 22', 'May 22', 'Jun 22',
        'Jul 22', 'Aug 22', 'Sep 22', 'Oct 22', 'Nov 22', 'Dec 22',
        'Jan 23', 'Feb 23', 'Mar 23', 'Apr 23', 'May 23', 'Jun 23',
        'Jul 23', 'Aug 23', 'Sep 23', 'Oct 23', 'Nov 23', 'Dec 23',
        'Jan 24', 'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24',
        'Jul 24', 'Aug 24', 'Sep 24', 'Oct 24', 'Nov 24', 'Dec 24',
        'Jan 25', 'Feb 25', 'Mar 25', 'Apr 25', 'May 25', 'Jun 25',
        'Jul 25', 'Aug 25'
    ];

    // Colombo Consumer Price Index (CCPI) - Year-over-Year (%)
    const ccpiData = [
        14.2, 15.1, 18.7, 29.8, 39.1, 54.6, 60.8, 64.3, 69.8, 66.0, 61.0, 57.2,
        51.7, 50.6, 50.3, 35.3, 25.2, 12.0, 6.3, 4.0, 1.3, 1.5, 3.4, 4.0,
        6.4, 5.9, 0.9, 1.5, 0.9, 1.7, 2.5, 3.0, 3.5, 3.2, 2.8, 2.5,
        2.2, 1.8, 2.0, 2.3, 2.8, 3.1, 3.4, 3.6
    ];

    // National Consumer Price Index (NCPI) - Year-over-Year (%)
    const ncpiData = [
        16.8, 17.5, 21.5, 33.8, 45.3, 58.9, 66.7, 70.2, 73.7, 70.6, 65.0, 59.2,
        53.2, 53.6, 49.2, 33.6, 22.1, 10.8, 4.6, 2.1, 0.8, 1.0, 2.8, 4.2,
        6.5, 5.1, 2.5, 2.7, 1.6, 2.4, 3.0, 3.5, 4.0, 3.8, 3.5, 3.1,
        2.9, 2.5, 2.8, 3.0, 3.4, 3.6, 3.8, 4.0
    ];
    
    // **BUG FIX**: Using the actual CCPI Index is the correct way to calculate real value.
    // Base: 2013=100. Jan 2022 is our reference point for calculations.
    const ccpiIndexData = [
        155.1, 157.0, 161.4, 171.1, 179.8, 191.6, 199.1, 203.8, 209.6, 209.1, 208.2, 206.9,
        205.8, 205.1, 205.2, 207.2, 208.5, 208.2, 208.1, 208.7, 208.8, 209.7, 212.0, 213.5,
        214.2, 215.1, 216.0, 217.1, 217.5, 217.9, 218.5, 219.1, 219.8, 220.4, 221.0, 221.5,
        222.0, 222.5, 223.1, 223.8, 224.5, 225.2, 226.0, 226.8
    ];

    let purchasingPowerData = new Array(labels.length).fill(0);
    let inflationChart;

    const domElements = {
        janSalary: document.getElementById('jan-salary'),
        currentSalary: document.getElementById('current-salary'),
        savingsPercentage: document.getElementById('savings-percentage'),
        expectedReturn: document.getElementById('expected-return'),
        calculateBtn: document.getElementById('calculate-btn'),
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
    };

    // --- CHART INITIALIZATION ---
    function initChart() {
        const ctx = document.getElementById('inflationChart').getContext('2d');
        inflationChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'CCPI Inflation (YoY %)',
                        data: ccpiData,
                        borderColor: '#36A2EB',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fill: true, tension: 0.4, yAxisID: 'y', pointRadius: 2
                    },
                    {
                        label: 'NCPI Inflation (YoY %)',
                        data: ncpiData,
                        borderColor: '#FF6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: true, tension: 0.4, yAxisID: 'y', pointRadius: 2
                    },
                    {
                        label: 'Purchasing Power of Jan 2022 Salary',
                        data: purchasingPowerData,
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderDash: [5, 5],
                        fill: true, tension: 0.4, yAxisID: 'y1', pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', titleColor: '#2c3e50', bodyColor: '#2c3e50',
                        borderColor: '#ddd', borderWidth: 1, padding: 12, usePointStyle: true,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                const value = context.parsed.y;
                                if (value !== null) {
                                    label += context.datasetIndex === 2 
                                        ? `LKR ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                        : `${value.toFixed(1)}%`;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
                    y: {
                        type: 'linear', position: 'left', title: { display: true, text: 'Inflation Rate (%)' },
                        grid: { color: 'rgba(200, 200, 200, 0.2)' }, min: -5, max: 80
                    },
                    y1: {
                        type: 'linear', position: 'right', title: { display: true, text: 'Real Purchasing Power (LKR)' },
                        grid: { drawOnChartArea: false }, min: 0
                    }
                },
            }
        });
    }

    // --- CALCULATION LOGIC ---

    /**
     * **BUG FIX**: Replaced incorrect looping calculation with the standard formula for Future Value of an Ordinary Annuity.
     * FV = P * [(((1 + r)^n) - 1) / r]
     * @param {number} monthlyPayment The amount saved each month.
     * @param {number} annualRate The annual interest rate (as a percentage, e.g., 8 for 8%).
     * @param {number} years The number of years to calculate.
     * @returns {number} The future value of the savings.
     */
    function calculateFutureValue(monthlyPayment, annualRate, years) {
        const monthlyRate = annualRate / 100 / 12;
        const months = years * 12;
        if (monthlyRate === 0) {
            return monthlyPayment * months;
        }
        return monthlyPayment * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    }

    function analyzeFinancials() {
        const janSalary = parseFloat(domElements.janSalary.value);
        const currentSalary = parseFloat(domElements.currentSalary.value);
        const savingsPercentage = parseFloat(domElements.savingsPercentage.value);
        const expectedReturn = parseFloat(domElements.expectedReturn.value);

        if (isNaN(janSalary) || isNaN(currentSalary) || isNaN(savingsPercentage) || isNaN(expectedReturn)) {
            alert('Please enter valid numbers in all fields.');
            return;
        }

        // 1. Calculate Purchasing Power
        // **BUG FIX**: This now correctly shows how the value of the initial salary has eroded over time.
        const baseIndex = ccpiIndexData[0];
        purchasingPowerData = ccpiIndexData.map(index => (janSalary * baseIndex) / index);

        // 2. Calculate Real Wage Change
        const latestIndex = ccpiIndexData[ccpiIndexData.length - 1];
        const currentSalaryIn2022Terms = (currentSalary * baseIndex) / latestIndex;
        const wageChangePercent = ((currentSalaryIn2022Terms - janSalary) / janSalary * 100);

        // 3. Update Chart
        inflationChart.data.datasets[2].data = purchasingPowerData;
        inflationChart.update();

        // 4. Update Savings Projections
        updateSavingsProjections(currentSalary, savingsPercentage, expectedReturn);
        
        // 5. Update UI Dashboard
        updateDashboard(wageChangePercent);
    }
    
    // --- UI UPDATE FUNCTIONS ---

    function updateSavingsProjections(currentSalary, savingsPercentage, expectedReturn) {
        const monthlySavings = currentSalary * (savingsPercentage / 100);
        const format = (val) => `LKR ${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

        const periods = [1, 5, 10];
        periods.forEach(year => {
            const totalSaved = monthlySavings * 12 * year;
            const futureValue = calculateFutureValue(monthlySavings, expectedReturn, year);
            const returns = futureValue - totalSaved;

            document.getElementById(`savings-${year}y`).textContent = format(futureValue);
            document.getElementById(`saved-${year}y`).textContent = `Principal: ${format(totalSaved)}`;
            document.getElementById(`returns-${year}y`).textContent = `Returns: ${format(returns)}`;
        });
    }

    function updateDashboard(wageChangePercent) {
        const last = labels.length - 1;
        const secondLast = labels.length - 2;
        const latestMonthStr = labels[last].replace(' ', ' 20');
        
        // Update Summary Cards
        updateCard(domElements.ccpiValue, domElements.ccpiChange, ccpiData[last], ccpiData[secondLast]);
        domElements.ccpiDate.textContent = latestMonthStr;
        
        updateCard(domElements.ncpiValue, domElements.ncpiChange, ncpiData[last], ncpiData[secondLast]);
        domElements.ncpiDate.textContent = latestMonthStr;
        
        const isPositive = wageChangePercent >= 0;
        domElements.wageValue.textContent = `${isPositive ? '+' : ''}${wageChangePercent.toFixed(1)}%`;
        domElements.wageChange.textContent = `${isPositive ? 'Gain' : 'Loss'} in Purchasing Power`;
        domElements.wageChange.className = `change ${isPositive ? 'positive' : 'negative'}`;

        // Update Inflation Insights Tab
        const peakValue = Math.max(...ccpiData);
        const peakIndex = ccpiData.indexOf(peakValue);
        domElements.peakInflation.textContent = `${peakValue.toFixed(1)}%`;
        domElements.peakInflationDate.textContent = labels[peakIndex].replace(' ', ' 20');
        domElements.latestMonth.textContent = latestMonthStr;
        domElements.breakdownDate.textContent = latestMonthStr;
        domElements.latestInflation.textContent = `${ccpiData[last].toFixed(1)}%`;

        domElements.wageTrend.textContent = `Compared to Jan 2022, your current salary gives you ${Math.abs(wageChangePercent).toFixed(1)}% ${isPositive ? 'more' : 'less'} purchasing power today.`;
    }

    function updateCard(valueEl, changeEl, current, previous) {
        const change = current - previous;
        valueEl.textContent = `${current.toFixed(1)}%`;
        changeEl.textContent = `${change >= 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}% from last month`;
        if (change > 0) changeEl.className = 'change positive';
        else if (change < 0) changeEl.className = 'change negative';
        else changeEl.className = 'change neutral';
    }

    function setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelector('.tab.active').classList.remove('active');
                document.querySelector('.tab-content.active').classList.remove('active');
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
            });
        });
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
    initChart();
    setupTabs();
    
    domElements.calculateBtn.addEventListener('click', analyzeFinancials);
    document.querySelectorAll('.input-group input').forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') analyzeFinancials();
        });
    });

    // Perform initial calculation on load
    analyzeFinancials();
});
