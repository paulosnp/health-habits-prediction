document.addEventListener('DOMContentLoaded', () => {
    // Registra o plugin de rótulos
    Chart.register(ChartDataLabels);

    let myChart = null;
    let fullData = [];

    // --- Pega todos os elementos do HTML ---
    const metricSelector = document.getElementById('metric-selector');
    const genderFilter = document.getElementById('gender-filter');
    const chartTypeSelector = document.getElementById('chart-type-selector');
    const minAgeInput = document.getElementById('min-age');
    const maxAgeInput = document.getElementById('max-age');
    const minHeightInput = document.getElementById('min-height');
    const maxHeightInput = document.getElementById('max-height');
    const minWeightInput = document.getElementById('min-weight');
    const maxWeightInput = document.getElementById('max-weight');
    const minSbpInput = document.getElementById('min-sbp');
    const maxSbpInput = document.getElementById('max-sbp');
    const minWaistlineInput = document.getElementById('min-waistline');
    const maxWaistlineInput = document.getElementById('max-waistline');
    const minSightLeftInput = document.getElementById('min-sight-left');
    const maxSightLeftInput = document.getElementById('max-sight-left');
    const minSightRightInput = document.getElementById('min-sight-right');
    const maxSightRightInput = document.getElementById('max-sight-right');
    const hearLeftFilter = document.getElementById('hear-left-filter');
    const hearRightFilter = document.getElementById('hear-right-filter');
    const ctx = document.getElementById('myChart').getContext('2d');
    const chartContainer = document.querySelector('.chart-container');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.querySelector('.filter-sidebar');
    const overlay = document.querySelector('.overlay');

    // --- Lógica do menu lateral ---
    function openSidebar() {
        sidebar.classList.remove('sidebar-closed');
        overlay.classList.add('active');
    }
    function closeSidebar() {
        sidebar.classList.add('sidebar-closed');
        overlay.classList.remove('active');
    }
    hamburgerBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    
    // --- Carregamento de dados via CSV ---
    async function loadData() {
        const loader = document.getElementById('loader');
        loader.style.display = 'flex';
        chartContainer.style.display = 'none';

        const csvUrl = 'https://pub-30aea22574314423a80babb2f0c54df3.r2.dev/smoking_driking_dataset_Ver01.csv';

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error(`Erro ao buscar o arquivo CSV: ${response.statusText}`);
            
            const csvText = await response.text();
            const jsonData = await new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => results.errors.length ? reject(new Error(results.errors[0].message)) : resolve(results.data),
                    error: (error) => reject(error)
                });
            });

            fullData = jsonData;
            updateChart();

        } catch (error) {
            console.error("Não foi possível carregar ou processar os dados:", error);
            ctx.font = "16px Arial";
            ctx.fillStyle = "#e0e0e0";
            ctx.textAlign = "center";
            ctx.fillText("Falha ao carregar os dados. Verifique a URL e o console.", ctx.canvas.width / 2, 50);
        } finally {
            loader.style.display = 'none';
            chartContainer.style.display = 'block';
        }
    }

    function updateChart() {
        // --- Leitura dos valores dos filtros ---
        const chartType = chartTypeSelector.value;
        const selectedMetric = metricSelector.value;
        const selectedGender = genderFilter.value;
        const minAge = parseFloat(minAgeInput.value);
        const maxAge = parseFloat(maxAgeInput.value);
        const minHeight = parseFloat(minHeightInput.value);
        const maxHeight = parseFloat(maxHeightInput.value);
        const minWeight = parseFloat(minWeightInput.value);
        const maxWeight = parseFloat(maxWeightInput.value);
        const minSbp = parseFloat(minSbpInput.value);
        const maxSbp = parseFloat(maxSbpInput.value);
        const minWaistline = parseFloat(minWaistlineInput.value);
        const maxWaistline = parseFloat(maxWaistlineInput.value);
        const minSightLeft = parseFloat(minSightLeftInput.value);
        const maxSightLeft = parseFloat(maxSightLeftInput.value);
        const minSightRight = parseFloat(minSightRightInput.value);
        const maxSightRight = parseFloat(maxSightRightInput.value);
        const selectedHearLeft = hearLeftFilter.value;
        const selectedHearRight = hearRightFilter.value;

        // Ajusta o tamanho do container para gráficos de pizza/rosca
        if (chartType === 'pie' || chartType === 'doughnut') {
            chartContainer.classList.add('small-chart');
        } else {
            chartContainer.classList.remove('small-chart');
        }
        
        // --- Filtragem dos dados com base nos inputs ---
        const filteredData = fullData.filter(person => {
            const passesGender = selectedGender === 'Todos' || person.sex === selectedGender;
            const passesAge = (isNaN(minAge) || person.age >= minAge) && (isNaN(maxAge) || person.age <= maxAge);
            const passesHeight = (isNaN(minHeight) || person.height_cm >= minHeight) && (isNaN(maxHeight) || person.height_cm <= maxHeight);
            const passesWeight = (isNaN(minWeight) || person.weight_kg >= minWeight) && (isNaN(maxWeight) || person.weight_kg <= maxWeight);
            const passesSbp = (isNaN(minSbp) || person.SBP >= minSbp) && (isNaN(maxSbp) || person.SBP <= maxSbp);
            const passesWaistline = (isNaN(minWaistline) || person.waistline_cm >= minWaistline) && (isNaN(maxWaistline) || person.waistline_cm <= maxWaistline);
            const passesSightLeft = (isNaN(minSightLeft) || person.sight_left >= minSightLeft) && (isNaN(maxSightLeft) || person.sight_left <= maxSightLeft);
            const passesSightRight = (isNaN(minSightRight) || person.sight_right >= minSightRight) && (isNaN(maxSightRight) || person.sight_right <= maxSightRight);
            const passesHearLeft = selectedHearLeft === 'Todos' || person.hear_left == selectedHearLeft;
            const passesHearRight = selectedHearRight === 'Todos' || person.hear_right == selectedHearRight;
            return passesGender && passesAge && passesHeight && passesWeight && passesSbp && passesWaistline && passesSightLeft && passesSightRight && passesHearLeft && passesHearRight;
        });

        // --- Preparação dos dados para o gráfico ---
        let labels, data, backgroundColors, borderColors, chartTitle;

        if (selectedMetric === 'smokers') {
            const smokerCount = filteredData.filter(p => p.SMK_stat_type_cd === 1).length;
            const nonSmokerCount = filteredData.length - smokerCount;
            
            labels = ['Fumantes', 'Não Fumantes'];
            data = [smokerCount, nonSmokerCount];
            backgroundColors = ['#8C1007', '#6E9234'];
            borderColors = ['#3E0703', '#3E591E'];
            chartTitle = 'Distribuição de Fumantes (Com base nos filtros aplicados)';

        } else if (selectedMetric === 'drinkers') {
            const drinkerCount = filteredData.filter(p => p.DRK_YN === 'Y').length;
            const nonDrinkerCount = filteredData.length - drinkerCount;
            
            labels = ['Alcoólatras', 'Não Alcoólatras'];
            data = [drinkerCount, nonDrinkerCount];
            backgroundColors = ['#0A4F8A', '#F7B801'];
            borderColors = ['#052A4A', '#C08F00'];
            chartTitle = 'Distribuição de Alcoólatras (Com base nos filtros aplicados)';
        }

        const chartData = {
            labels: labels,
            datasets: [{
                label: 'População', 
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        };

        // --- Renderização do gráfico ---
        if (myChart) { myChart.destroy(); }
        
        myChart = new Chart(ctx, {
            type: chartType, 
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    title: { 
                        display: true, 
                        text: chartTitle,
                        color: '#ffffff'
                    },
                    legend: {
                        onClick: (e, legendItem, legend) => {
                            Chart.defaults.plugins.legend.onClick.call(this, e, legendItem, legend);
                            legend.chart.update();
                        },
                        labels: {
                            generateLabels: function(chart) {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: label,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor[i],
                                    lineWidth: data.datasets[0].borderWidth,
                                    hidden: !chart.getDataVisibility(i),
                                    index: i,
                                    // ===============================================
                                    // A CORREÇÃO DEFINITIVA ESTÁ NESTA LINHA:
                                    fontColor: '#ffffff'
                                    // ===============================================
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1a1a1a',
                        titleColor: '#ffffff',
                        bodyColor: '#e0e0e0',
                        footerColor: '#b0b0b0',
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return ` Pessoas: ${value} (${percentage}%)`;
                            },
                            footer: function(tooltipItems) {
                                const total = tooltipItems[0].chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                return `\nTotal (nos filtros): ${total}`;
                            }
                        }
                    },
                    datalabels: {
                        formatter: (value, context) => {
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            if (total === 0) return '';
                            const percentage = (value / total) * 100;
                            if (percentage < 3) return '';
                            return percentage.toFixed(1) + '%';
                        },
                        color: '#ffffff',
                        font: {
                            weight: 'bold',
                            size: 16,
                        }
                    }
                }
            }
        });
    }

    // --- Adiciona os event listeners para todos os filtros ---
    const allFilters = [
        genderFilter, chartTypeSelector, metricSelector,
        minAgeInput, maxAgeInput, minHeightInput, maxHeightInput,
        minWeightInput, maxWeightInput, minSbpInput, maxSbpInput,
        minWaistlineInput, maxWaistlineInput, minSightLeftInput, maxSightLeftInput,
        minSightRightInput, maxSightRightInput, hearLeftFilter, hearRightFilter
    ];

    allFilters.forEach(filter => {
        const eventType = filter.tagName.toLowerCase() === 'select' ? 'change' : 'input';
        filter.addEventListener(eventType, updateChart);
    });

    // --- Inicia o carregamento dos dados ---
    loadData();
});