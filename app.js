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
    // ... outras entradas ...
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
        // Remove pontos (milhares) e troca vírgula por ponto decimal
        const clean = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;

    // Tratamento para string formato brasileiro dd/mm/aaaa
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
        return null;
    }

    // Tratamento para número serial Excel
    if (typeof dateStr === 'number') {
        const utc_days = Math.floor(dateStr - 25569);
        const utc_seconds = utc_days * 86400;
        const date = new Date(utc_seconds * 1000);
        return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    }

    // Para strings em outros formatos
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
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
    const defaultScales = { y: { title: { display: true, text: 'Valor' } } };
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
                            return formatDateBR(filteredData[index].Data);
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

    const tio2Data = filteredData.map(d => d.TIO2_EUR);
    createLineChart('tio2Chart', [{
        label: 'TIO2 EUR (€)',
        data: tio2Data,
        borderColor: chartColors.violet,
        backgroundColor: chartColors.violet + '30',
        tension: 0.1
    }]);

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
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'USD ($)', color: chartColors.brown },
            ticks: { color: chartColors.brown },
            grid: { drawOnChartArea: false }
        }
    });

    createLineChart('freteExportChart', [
        {
            label: 'CNT GQ USD ($)',
            data: filteredData.map(d => d.CNT_GQ_USD),
            borderColor: chartColors.olive,
            backgroundColor: chartColors.olive + '30',
            tension: 0.1
        },
        {
            label: 'CNT CG USD ($)',
            data: filteredData.map(d => d.CNT_CG_USD),
            borderColor: chartColors.brown,
            backgroundColor: chartColors.brown + '30',
            tension: 0.1
        },
        {
            label: 'CNT VC USD ($)',
            data: filteredData.map(d => d.CNT_VC_USD),
            borderColor: chartColors.terracotta,
            backgroundColor: chartColors.terracotta + '30',
            tension: 0.1
        }
    ]);
}

function updateKPIBoxes() {
    if (filteredData.length === 0) return;
    const latest = filteredData[filteredData.length - 1];
    const latestDate = formatDateBR(latest.Data);
    console.log('Atualizando KPIs - TIO2_EUR valor:', latest.TIO2_EUR);

    const priceTitle = document.getElementById('priceTitle');
    if (priceTitle) {
        priceTitle.textContent = `Preços - Última atualização: ${latestDate}`;
    }

    const kpiMappings = {
        'celulose-eur': [latest.Celulose_EUR, '€'],
        'celulose-usd': [latest.Celulose_USD, '$'],
        'tio2-eur': [latest.TIO2_EUR, '€'],
        'resina-uf': [latest.Resina_UF_BRL, 'R$'],
        'resina-mf': [latest.Resina_MF_BRL, 'R$'],
        'cnt-eu': [latest.CNT_EU_EUR, '€'],
        'cnt-cn': [latest.CNT_CN_USD, '$'],
        'cnt-gq': [latest.CNT_GQ_USD, '$'],
        'cnt-cg': [latest.CNT_CG_USD, '$'],
        'cnt-vc': [latest.CNT_VC_USD, '$']
    };

    Object.entries(kpiMappings).forEach(([id, [value, currency]]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = formatCurrency(value, currency);
            if (id === 'tio2-eur') {
                console.log(`KPI TIO2_EUR atualizado - Valor bruto: ${value}, Formatado: ${element.textContent}`);
            }
        }
    });
}

function updateDateFilters() {
    if (globalData.length === 0) return;
    const dates = globalData.map(d => d.Data).filter(d => d instanceof Date);
    if (dates.length === 0) return;

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) startDateInput.value = formatDateBR(minDate);
    if (endDateInput) endDateInput.value = formatDateBR(maxDate);
}

function showUploadStatus(message, type) {
    const statusEl = document.getElementById('uploadStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `upload-status ${type}`;
        statusEl.classList.remove('hidden');
        if (type === 'success') {
            setTimeout(() => statusEl.classList.add('hidden'), 3000);
        }
    }
}

function updateLastUploadInfo() {
    const infoEl = document.getElementById('lastUploadInfo');
    if (infoEl) {
        const now = new Date();
        infoEl.textContent = `Último upload: ${formatDateBR(now)} às ${now.toLocaleTimeString('pt-BR')}`;
    }
}

function updateDashboard() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    let startDate = null;
    let endDate = null;

    if (startDateInput && startDateInput.value) {
        startDate = parseDateBR(startDateInput.value);
        if (!startDate) {
            showUploadStatus('Data de início inválida. Use o formato dd/mm/aaaa', 'error');
            return;
        }
    }

    if (endDateInput && endDateInput.value) {
        endDate = parseDateBR(endDateInput.value);
        if (!endDate) {
            showUploadStatus('Data de fim inválida. Use o formato dd/mm/aaaa', 'error');
            return;
        }
        endDate.setHours(23, 59, 59, 999);
    }

    filteredData = filterDataByDate(globalData, startDate, endDate);
    console.log('Dashboard atualizado - registros filtrados:', filteredData.length);

    updateKPIBoxes();

    setTimeout(() => {
        createAllCharts();
    }, 100);
}

function handleFileUpload(file) {
    if (!file) {
        console.error('No file provided');
        return;
    }
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showUploadStatus('Formato de arquivo inválido. Use .xlsx ou .xls', 'error');
        return;
    }
    showUploadStatus('Processando arquivo...', 'processing');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                showUploadStatus('Arquivo vazio ou sem dados válidos', 'error');
                return;
            }

            console.log('Dados brutos carregados:', jsonData.length, 'registros');
            console.log('Primeiro registro:', jsonData[0]);

            const processedData = processData(jsonData);

            if (processedData.length === 0) {
                showUploadStatus('Nenhum dado válido encontrado no arquivo', 'error');
                return;
            }

            globalData = processedData;
            updateLastUploadInfo();
            updateDateFilters();
            updateDashboard();

            showUploadStatus(`Arquivo processado com sucesso! ${processedData.length} registros carregados.`, 'success');
        } catch (error) {
            console.error('Error processing file:', error);
            showUploadStatus(`Erro ao processar arquivo: ${error.message}`, 'error');
        }
    };
    reader.onerror = function() {
        showUploadStatus('Erro ao ler arquivo', 'error');
    };

    reader.readAsArrayBuffer(file);
}

function fetchAndLoadExcel(url) {
    showUploadStatus('Carregando arquivo database automaticamente...', 'processing');

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar arquivo: ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                showUploadStatus('Arquivo database vazio ou sem dados válidos', 'error');
                return;
            }

            globalData = processData(jsonData);
            updateLastUploadInfo();
            updateDateFilters();
            updateDashboard();

            showUploadStatus(`Arquivo database carregado com sucesso! ${globalData.length} registros.`, 'success');
        })
        .catch(error => {
            console.error('Falha ao carregar database.xlsx:', error);
            showUploadStatus('Falha ao carregar arquivo database automaticamente. Use o upload manual.', 'error');
        });
}

function initializeApp() {
    console.log('Inicializando app...');
    if (typeof XLSX === 'undefined') {
        showUploadStatus('Erro: Biblioteca XLSX não carregada', 'error');
        console.error('XLSX library not loaded');
        return;
    }
    if (typeof Chart === 'undefined') {
        showUploadStatus('Erro: Biblioteca Chart.js não carregada', 'error');
        console.error('Chart.js library not loaded');
        return;
    }
    // Inicia com dados de exemplo
    console.log('Carregando dados de exemplo...');
    globalData = processData(sampleData);
    updateDateFilters();
    updateDashboard();

    // Tenta carregar arquivo database.xlsx automaticamente
    fetchAndLoadExcel('database.xlsx');
}

function setupEventListeners() {
    console.log('Configurando event listeners...');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (uploadBtn && fileInput) {
        uploadBtn.onclick = e => {
            e.preventDefault();
            fileInput.click();
        };
        fileInput.onchange = e => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
                e.target.value = '';
            }
        };
    }

    if (uploadZone && fileInput) {
        uploadZone.onclick = e => {
            e.preventDefault();
            fileInput.click();
        };
        uploadZone.ondragover = e => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        };
        uploadZone.ondragleave = e => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        };
        uploadZone.ondrop = e => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        };
    }

    document.ondragover = e => e.preventDefault();
    document.ondrop = e => e.preventDefault();

    function setupDateInputHandlers(input) {
        if (!input) return;
        input.oninput = e => {
            if (!validateDateInput(e.target.value)) {
                e.target.style.borderColor = '#c0152f';
            } else {
                e.target.style.borderColor = '';
            }
        };
        input.onblur = e => {
            const date = parseDateBR(e.target.value);
            if (date) {
                e.target.value = formatDateBR(date);
                e.target.style.borderColor = '';
                updateDashboard();
            } else {
                e.target.style.borderColor = '#c0152f';
            }
        };
        input.onkeypress = e => {
            if (e.key === 'Enter') e.target.blur();
        };
    }

    setupDateInputHandlers(startDateInput);
    setupDateInputHandlers(endDateInput);

    console.log('Event listeners configurados.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        setupEventListeners();
    });
} else {
    initializeApp();
    setupEventListeners();
}
