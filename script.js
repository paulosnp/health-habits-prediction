document.addEventListener('DOMContentLoaded', () => {
    let myChart = null;
    let fullData = [];

    // --- Pega TODOS os elementos de filtro do HTML ---
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
    const chartContainer = document.querySelector('.chart-container'); // NOVO: Pega o container do gráfico

    // --- NOVO: Lógica para controlar o menu lateral ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const sidebar = document.querySelector('.filter-sidebar');
    const overlay = document.querySelector('.overlay');

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
    // --- FIM DA NOVA LÓGICA ---


    async function loadData() {
        try {
            const response = await fetch('smoking_drinking_data.json');
            if (!response.ok) { throw new Error(`Erro HTTP! status: ${response.status}`); }
            fullData = await response.json();
            updateChart();
        } catch (error) {
            console.error("Não foi possível carregar os dados:", error);
            ctx.font = "16px Arial";
            ctx.fillText("Falha ao carregar os dados. Verifique o console.", 10, 50);
        }
    }

    function updateChart() {
        // --- 1. Lê o valor de TODOS os filtros ---
        const selectedGender = genderFilter.value;
        const chartType = chartTypeSelector.value;
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

        // --- NOVO: Adiciona/remove classe para ajustar o tamanho do gráfico ---
        if (chartType === 'pie' || chartType === 'doughnut') {
            chartContainer.classList.add('small-chart');
        } else {
            chartContainer.classList.remove('small-chart');
        }

        // --- 2. Filtra os dados em CADEIA ---
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

            return passesGender && passesAge && passesHeight && passesWeight && passesSbp && 
                   passesWaistline && passesSightLeft && passesSightRight && passesHearLeft && passesHearRight;
        });

        // --- 3. Processa os dados para o gráfico ---
        const smokerCount = filteredData.filter(p => p.SMK_stat_type_cd === 1.0).length;
        const nonSmokerCount = filteredData.filter(p => p.SMK_stat_type_cd !== 1.0).length;

        const chartData = {
            labels: ['Fumantes', 'Não Fumantes'],
            datasets: [{
                label: `Total de Pessoas: ${filteredData.length}`,
                data: [smokerCount, nonSmokerCount],
                backgroundColor: ['#8C1007', '#6E9234'],
                borderColor: ['#3E0703', '#3E591E'],
                borderWidth: 1
            }]
        };

        // --- 4. Destrói e Recria o gráfico ---
        if (myChart) { myChart.destroy(); }
        myChart = new Chart(ctx, {
            type: chartType, data: chartData,
            options: { responsive: true, plugins: { title: { display: true, text: 'Distribuição de Fumantes (Com base nos filtros aplicados)' } } }
        });
    }

    // --- Adiciona "escutadores" de eventos para TODOS os filtros ---
    const allFilters = [
        genderFilter, chartTypeSelector, minAgeInput, maxAgeInput, minHeightInput, maxHeightInput,
        minWeightInput, maxWeightInput, minSbpInput, maxSbpInput, 
        minWaistlineInput, maxWaistlineInput, minSightLeftInput, maxSightLeftInput,
        minSightRightInput, maxSightRightInput, hearLeftFilter, hearRightFilter
    ];

    allFilters.forEach(filter => {
        const eventType = filter.tagName.toLowerCase() === 'select' ? 'change' : 'input';
        filter.addEventListener(eventType, updateChart);
    });

    loadData();
});