// Global variables
let globalData = [];
let filteredData = [];
let charts = {};

// Sample data com datas corretas em 2023 - CAMPO TIO2_EUR CORRIGIDO
const sampleData = [
    {
        Data: "01/01/2023",
        Celulose_EUR: "1.286,35",
        Celulose_USD: "1.379,95",
        TIO2_EUR: "3.400,00",
        Melamina_USD: "1.749,22",
        Ureia_USD: "635,47",
        Metanol_USD: "453,17",
        Resina_UF_BRL: "2.985,00",
        Resina_MF_BRL: "5.713,00",
        USDBRL: "5,07",
        EURBRL: "5,51",
        CNYBRL: "0,75",
        USDBRL_GPC: "5,24",
        CNT_EU_EUR: "729,30",
        CNT_CN_USD: "5.120,83",
        CNT_GQ_USD: "3.323,50",
        CNT_CG_USD: "3.250,00",
        CNT_VC_USD: "4.773,00"
    },
    {
        Data: "08/01/2023",
        Celulose_EUR: "1.295,20",
        Celulose_USD: "1.390,15",
        TIO2_EUR: "3.450,00",
        Melamina_USD: "1.760,30",
        Ureia_USD: "642,15",
        Metanol_USD: "458,90",
        Resina_UF_BRL: "3.012,00",
        Resina_MF_BRL: "5.745,00",
        USDBRL: "5,12",
        EURBRL: "5,56",
        CNYBRL: "0,76",
        USDBRL_GPC: "5,29",
        CNT_EU_EUR: "735,45",
        CNT_CN_USD: "5.145,20",
        CNT_GQ_USD: "3.340,25",
        CNT_CG_USD: "3.265,80",
        CNT_VC_USD: "4.790,50"
    },
    // ... Mais entradas conforme o seu sampleData original
];

// NYRIA 2025 colors
const chartColors = {
    terracotta: '#B34A3A',
    terracottaLight: '#CD853F',
    violet: '#4A148C',
    violetMedium: '#7B1FA2',
    brown: '#8B4513',
    olive: '#6B8E23',
    stone: '#708090',
    beige: '#F5F5DC'
};

// --- Funções auxiliares ---

function parseBrazilianNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const clean = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;

    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                return new Date(year, month - 1, day);
            }
        }
    }

    if (typeof dateStr === 'number') { // Excel serial date
        return new Date((dateStr - 25569) * 86400 * 1000);
    }

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

function formatDateBR(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function parseDateBR(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleaned = dateStr.trim();
    const pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = cleaned.match(pattern);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;
    const date = new Date(year, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== (month - 1) || date.getFullYear() !== year) return null;
    return date;
}

function validateDateInput(input) {
    const pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    return pattern.test(input.trim());
}

function formatNumber(value) {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrency(value, currency = '') {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return `${currency}${formatNumber(value)}`;
}

function processData(rawData) {
    console.log('Processing data - inicial:', rawData.length, 'registros');
    const processedData = rawData.map((row, index) => {
        const processed = { ...row };
        processed.Data = parseLocalDate(processed.Data);
        Object.keys(processed).forEach(key => {
            if (key !== 'Data') {
                const originalValue = processed[key];
                processed[key] = parseBrazilianNumber(processed[key]);
                if (key === 'TIO2_EUR') {
                    console.log(`Linha ${index}: TIO2_EUR - Original: "${originalValue}" -> Processado: ${processed[key]}`);
                }
            }
        });
        return processed;
    }).filter(row => row.Data && row.Data instanceof Date && !isNaN(row.Data.getTime()));
    processedData.sort((a, b) => a.Data - b.Data);
    console.log('Processing data - final:', processedData.length, 'registros válidos');
    return processedData;
}

function filterDataByDate(data, startDate, endDate) {
    if (!startDate || !endDate) return data;
    return data.filter(row => {
        const date = row.Data;
        return date >= startDate && date <= endDate;
    });
}

// --- Funções principais do Dashboard ---

function createLineChart(canvasId, datasets, scales = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = filteredData.map(d => formatDateBR(d.Data));
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    const defaultScales = {
        y: { title: { display: true, text: 'Valor' } }
    };
    const config = {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        title: ctx => {
                            const index = ctx[0].dataIndex;
                            const date = filteredData[index].Data;
                            return formatDateBR(date);
                        }
                    }
                }
            },
            scales: scales || defaultScales
        }
    };
    charts[canvasId] = new Chart(ctx, config);
}

function createAllCharts() {
    if (filteredData.length === 0) return;

    console.log('Criando gráficos com', filteredData.length, 'registros');

    // Celulose (dual axis)
    createLineChart('celuloseChart', [
        {
            label: 'Celulose EUR (€)',
            data: filteredData.map(d => d.Celulose_EUR),
            borderColor: chartColors.terracotta,
            backgroundColor: chartColors.terracotta + '30',
            yAxisID: 'y',
            tension: 0.1
        },
        {
            label: 'Celulose USD ($)',
            data: filteredData.map(d => d.Celulose_USD),
            borderColor: chartColors.terracottaLight,
            backgroundColor: chartColors.terracottaLight + '30',
            yAxisID: 'y1',
            tension: 0.1
        }
    ], {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'EUR (€)', color: chartColors.terracotta },
            ticks: { color: chartColors.terracotta }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'USD ($)', color: chartColors.terracottaLight },
            ticks: { color: chartColors.terracottaLight },
            grid: { drawOnChartArea: false }
        }
    });

    // TIO2_EUR
    const tio2Data = filteredData.map(d => d.TIO2_EUR);
    console.log('Dados TIO2_EUR para gráfico:', tio2Data);
    createLineChart('tio2Chart', [{
        label: 'TIO2 EUR (€)',
        data: tio2Data,
        borderColor: chartColors.violet,
        backgroundColor: chartColors.violet + '30',
        tension: 0.1
    }]);

    // Insumos
    createLineChart('insumosChart', [
        {
            label: 'Melamina USD ($)',
            data: filteredData.map(d => d.Melamina_USD),
            borderColor: chartColors.brown,
            backgroundColor: chartColors.brown + '30',
            tension: 0.1
        },
        {
            label: 'Ureia USD ($)',
            data: filteredData.map(d => d.Ureia_USD),
            borderColor: chartColors.olive,
            backgroundColor: chartColors.olive + '30',
            tension: 0.1
        },
        {
            label: 'Metanol USD ($)',
            data: filteredData.map(d => d.Metanol_USD),
            borderColor: chartColors.stone,
            backgroundColor: chartColors.stone + '30',
            tension: 0.1
        }
    ]);

    // Resinas
    createLineChart('resinasChart', [
        {
            label: 'Resina UF BRL (R$)',
            data: filteredData.map(d => d.Resina_UF_BRL),
            borderColor: chartColors.terracotta,
            backgroundColor: chartColors.terracotta + '30',
            yAxisID: 'y',
            tension: 0.1
        },
        {
            label: 'Resina MF BRL (R$)',
            data: filteredData.map(d => d.Resina_MF_BRL),
            borderColor: chartColors.brown,
            backgroundColor: chartColors.brown + '30',
            yAxisID: 'y',
            tension: 0.1
        },
        {
            label: 'USDBRL_GPC',
            data: filteredData.map(d => d.USDBRL_GPC),
            borderColor: chartColors.violet,
            backgroundColor: chartColors.violet + '30',
            yAxisID: 'y1',
            tension: 0.1,
            borderDash: [5, 5]
        }
    ], {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'BRL (R$)', color: chartColors.terracotta },
            ticks: { color: chartColors.terracotta }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'USDBRL_GPC', color: chartColors.violet },
            ticks: { color: chartColors.violet },
            grid: { drawOnChartArea: false }
        }
    });

    // Moedas
    createLineChart('moedasChart', [
        {
            label: 'USDBRL',
            data: filteredData.map(d => d.USDBRL),
            borderColor: chartColors.stone,
            backgroundColor: chartColors.stone + '30',
            yAxisID: 'y',
            tension: 0.1
        },
        {
            label: 'EURBRL',
            data: filteredData.map(d => d.EURBRL),
            borderColor: chartColors.terracotta,
            backgroundColor: chartColors.terracotta + '30',
            yAxisID: 'y',
            tension: 0.1
        },
        {
            label: 'USDBRL_GPC',
            data: filteredData.map(d => d.USDBRL_GPC),
            borderColor: chartColors.violet,
            backgroundColor: chartColors.violet + '30',
            yAxisID: 'y',
            tension: 0.1,
            hidden: true
        },
        {
            label: 'CNYBRL',
            data: filteredData.map(d => d.CNYBRL),
            borderColor: chartColors.terracottaLight,
            backgroundColor: chartColors.terracottaLight + '30',
            yAxisID: 'y1',
            tension: 0.1
        }
    ], {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'USD/EUR BRL', color: chartColors.stone },
            ticks: { color: chartColors.stone }
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'CNY BRL', color: chartColors.terracottaLight },
            ticks: { color: chartColors.terracottaLight },
            grid: { drawOnChartArea: false }
        }
    });

    // Frete Importação
    createLineChart('freteImportChart', [
        {
            label: 'CNT Europa EUR (€)',
            data: filteredData.map(d => d.CNT_EU_EUR),
            borderColor: chartColors.violet,
            backgroundColor: chartColors.violet + '30',
            yAxisID: 'y',
            tension: 0.1
        },
        {
            label: 'CNT China USD ($)',
            data: filteredData.map(d => d.CNT_CN_USD),
            borderColor: chartColors.brown,
            backgroundColor: chartColors.brown + '30',
            yAxisID: 'y1',
            tension: 0.1
        }
    ], {
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'EUR (€)', color: chartColors.violet },
            ticks: { color: chartColors.violet }
        },
        y1: {
