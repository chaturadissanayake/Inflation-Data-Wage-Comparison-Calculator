// Updated inflation data (Jan 2022 - June 2025)
const labels = [
    'Jan 2022', 'Feb 2022', 'Mar 2022', 'Apr 2022', 'May 2022', 'Jun 2022',
    'Jul 2022', 'Aug 2022', 'Sep 2022', 'Oct 2022', 'Nov 2022', 'Dec 2022',
    'Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023',
    'Jul 2023', 'Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023',
    'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
    'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024',
    'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025'
];

const ccpiData = [
    // 2022
    14.2, 15.1, 18.7, 29.8, 39.1, 54.6,
    60.8, 64.3, 69.8, 66.0, 61.0, 57.2,
    // 2023
    51.7, 50.6, 50.3, 35.3, 25.2, 12.0,
    6.3, 4.0, 1.3, 1.5, 3.4, 4.0,
    // 2024
    6.4, 5.9, 0.9, 1.5, 0.9, 1.7,
    2.4, 0.5, -0.5, -0.8, -2.1, -1.7,
    // 2025
    -4.0, -4.2, -2.6, -2.0, -0.7, -0.6
];

const ncpiData = [
    // 2022
    9.9, 10.9, 13.0, 22.0, 28.4, 39.9,
    44.3, 46.6, 50.2, 49.7, 49.4, 47.7,
    // 2023
    53.2, 53.6, 49.2, 33.6, 22.1, 10.8,
    4.6, 2.1, 0.8, 1.0, 2.8, 4.2,
    // 2024
    6.5, 5.1, 2.5, 2.7, 1.6, 2.4,
    2.5, 1.1, -0.2, -0.7, -1.7, -2.0,
    // 2025
    -4.0, -3.9, -1.9, -0.8, 0.6, 0.3
];

let realWageData = new Array(labels.length).fill(0);
let cumulativeIndex = new Array(labels.length).fill(1);

// Initialize chart
const ctx = document.getElementById('inflationChart').getContext('2d');
let inflationChart;

function initChart() {
    inflationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Colombo CPI (CCPI)',
                    data: ccpiData,
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y',
                    pointRadius: 2,
                    pointBackgroundColor: '#36A2EB'
                },
                {
                    label: 'National CPI (NCPI)',
                    data: ncpiData,
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y',
                    pointRadius: 2,
                    pointBackgroundColor: '#FF6384'
                },
                {
                    label: 'Your Real Wage',
                    data: realWageData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true,
                    tension: 0.3,
                    yAxisID: 'y1',
                    pointRadius: 3,
                    pointBackgroundColor: '#4CAF50'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#2c3e50',
                    bodyColor: '#2c3e50',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 12,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.datasetIndex === 2) {
                                    label += 'Rs ' + context.parsed.y.toLocaleString('en-US', {maximumFractionDigits: 2});
                                } else {
                                    label += context.parsed.y.toFixed(1) + '%';
                                }
                            }
                            return label;
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
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Inflation Rate (%)',
                        color: '#666'
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    },
                    min: -10,
                    max: 80
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Real Wage (Rs)',
                        color: '#666'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    min: 0
                }
            },
            animation: {
                duration: 1000
            }
        }
    });
}

// Calculate future value of savings with compound interest
function calculateFutureValue(monthlyPayment, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const months = years * 12;
    let futureValue = 0;
    
    for (let i = 0; i < months; i++) {
        futureValue = (futureValue + monthlyPayment) * (1 + monthlyRate);
    }
    
    return futureValue;
}

// Update savings projections
function updateSavingsProjections(currentSalary, savingsPercentage, expectedReturn) {
    const monthlySavings = (currentSalary * savingsPercentage / 100);
    const totalSaved1Year = monthlySavings * 12;
    const totalSaved5Years = monthlySavings * 60;
    const totalSaved10Years = monthlySavings * 120;
    
    const withReturns1Year = calculateFutureValue(monthlySavings, expectedReturn, 1);
    const withReturns5Years = calculateFutureValue(monthlySavings, expectedReturn, 5);
    const withReturns10Years = calculateFutureValue(monthlySavings, expectedReturn, 10);
    
    // Format numbers for display
    const formatCurrency = value => value.toLocaleString('en-US', {maximumFractionDigits: 0});
    
    // Update the savings cards
    const savingsValues = document.querySelectorAll('.savings-value');
    const savingsDetails = document.querySelectorAll('.savings-detail');
    
    savingsValues[0].textContent = `Rs ${formatCurrency(withReturns1Year)}`;
    savingsDetails[0].textContent = `Total saved: Rs ${formatCurrency(totalSaved1Year)}`;
    savingsDetails[1].textContent = `With returns: Rs ${formatCurrency(withReturns1Year)}`;
    
    savingsValues[1].textContent = `Rs ${formatCurrency(withReturns5Years)}`;
    savingsDetails[2].textContent = `Total saved: Rs ${formatCurrency(totalSaved5Years)}`;
    savingsDetails[3].textContent = `With returns: Rs ${formatCurrency(withReturns5Years)}`;
    
    savingsValues[2].textContent = `Rs ${formatCurrency(withReturns10Years)}`;
    savingsDetails[4].textContent = `Total saved: Rs ${formatCurrency(totalSaved10Years)}`;
    savingsDetails[5].textContent = `With returns: Rs ${formatCurrency(withReturns10Years)}`;
}

// Calculate cumulative price index
function calculateCumulativeIndex() {
    // Start with base index of 100 for Jan 2022
    cumulativeIndex[0] = 100;
    
    for (let i = 1; i < ccpiData.length; i++) {
        // Calculate current price index based on previous month and inflation
        cumulativeIndex[i] = cumulativeIndex[i - 1] * (1 + ccpiData[i] / 100);
    }
}

// Real wage calculation
function calculateRealWage() {
    const janSalary = parseFloat(document.getElementById('jan-salary').value);
    const currentSalary = parseFloat(document.getElementById('current-salary').value);
    const savingsPercentage = parseFloat(document.getElementById('savings-percentage').value);
    const expectedReturn = parseFloat(document.getElementById('expected-return').value);
    
    if (isNaN(janSalary) || isNaN(currentSalary) || isNaN(savingsPercentage) || isNaN(expectedReturn)) {
        alert('Please enter all required fields.');
        return;
    }
    
    // Calculate cumulative price index
    calculateCumulativeIndex();
    
    // Calculate real wage for each month
    realWageData = cumulativeIndex.map((indexValue, idx) => {
        // Adjust current salary to base period (Jan 2022) purchasing power
        return (currentSalary * cumulativeIndex[0]) / indexValue;
    });
    
    // Update chart data
    inflationChart.data.datasets[2].data = realWageData;
    inflationChart.update();
    
    // Calculate wage change percentage
    const lastRealWage = realWageData[realWageData.length - 1];
    const wageChange = ((lastRealWage - janSalary) / janSalary * 100).toFixed(1);
    const isPositive = parseFloat(wageChange) >= 0;
    
    // Update summary
    document.getElementById('wage-value').textContent = `${isPositive ? '+' : ''}${wageChange}%`;
    document.getElementById('wage-change').className = `change ${isPositive ? 'positive' : 'negative'}`;
    document.getElementById('wage-change').textContent = `${isPositive ? '↑' : '↓'} since Jan 2022`;
    
    // Update inflation trend text
    document.getElementById('wage-trend').textContent = 
        `Real wages have ${isPositive ? 'increased' : 'decreased'} by ${Math.abs(wageChange)}% since Jan 2022 with your current salary`;
    
    // Update savings projections
    updateSavingsProjections(currentSalary, savingsPercentage, expectedReturn);
}

// Tab switching functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initChart();
    setupTabs();
    calculateCumulativeIndex();
    
    // Set up calculate button
    document.getElementById('calculate-btn').addEventListener('click', calculateRealWage);
    
    // Also calculate on Enter key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            calculateRealWage();
        }
    });
    
    // Perform initial calculation
    calculateRealWage();
});
