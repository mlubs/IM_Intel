// Global variables
let globalData = [];
let filteredData = [];
let charts = {};

// Sample data com datas corretas em 2023 - CAMPO TIO2_EUR CORRIGIDO
const sampleData = [
    {
        "Data": "01/01/2023",
        "Celulose_EUR": "1.286,35",
        "Celulose_USD": "1.379,95",
        "TIO2_EUR": "3.400,00",
        "Melamina_USD": "1.749,22",
        "Ureia_USD": "635,47",
        "Metanol_USD": "453,17",
        "Resina_UF_BRL": "2.985,00",
        "Resina_MF_BRL": "5.713,00",
        "USDBRL": "5,07",
        "EURBRL": "5,51",
        "CNYBRL": "0,75",
        "USDBRL_GPC": "5,24",
        "CNT_EU_EUR": "729,30",
        "CNT_CN_USD": "5.120,83",
        "CNT_GQ_USD": "3.323,50",
        "CNT_CG_USD": "3.250,00",
        "CNT_VC_USD": "4.773,00"
    },
    {
        "Data": "08/01/2023",
        "Celulose_EUR": "1.295,20",
        "Celulose_USD": "1.390,15",
        "TIO2_EUR": "3.450,00",
        "Melamina_USD": "1.760,30",
        "Ureia_USD": "642,15",
        "Metanol_USD": "458,90",
        "Resina_UF_BRL": "3.012,00",
        "Resina_MF_BRL": "5.745,00",
        "USDBRL": "5,12",
        "EURBRL": "5,56",
        "CNYBRL": "0,76",
        "USDBRL_GPC": "5,29",
        "CNT_EU_EUR": "735,45",
        "CNT_CN_USD": "5.145,20",
        "CNT_GQ_USD": "3.340,25",
        "CNT_CG_USD": "3.265,80",
        "CNT_VC_USD": "4.790,50"
    },
    {
        "Data": "15/01/2023",
        "Celulose_EUR": "1.275,80",
        "Celulose_USD": "1.365,40",
        "TIO2_EUR": "3.380,00",
        "Melamina_USD": "1.735,60",
        "Ureia_USD": "628,35",
        "Metanol_USD": "449,80",
        "Resina_UF_BRL": "2.958,00",
        "Resina_MF_BRL": "5.680,00",
        "USDBRL": "5,02",
        "EURBRL": "5,46",
        "CNYBRL": "0,74",
        "USDBRL_GPC": "5,19",
        "CNT_EU_EUR": "723,15",
        "CNT_CN_USD": "5.095,40",
        "CNT_GQ_USD": "3.305,75",
        "CNT_CG_USD": "3.235,20",
        "CNT_VC_USD": "4.755,25"
    },
    {
        "Data": "22/01/2023",
        "Celulose_EUR": "1.320,45",
        "Celulose_USD": "1.415,60",
        "TIO2_EUR": "3.425,00",
        "Melamina_USD": "1.785,40",
        "Ureia_USD": "658,90",
        "Metanol_USD": "475,20",
        "Resina_UF_BRL": "3.045,00",
        "Resina_MF_BRL": "5.798,00",
        "USDBRL": "5,18",
        "EURBRL": "5,62",
        "CNYBRL": "0,77",
        "USDBRL_GPC": "5,35",
        "CNT_EU_EUR": "745,80",
        "CNT_CN_USD": "5.178,90",
        "CNT_GQ_USD": "3.378,45",
        "CNT_CG_USD": "3.298,75",
        "CNT_VC_USD": "4.823,60"
    },
    {
        "Data": "01/07/2025",
        "Celulose_EUR": "1.456,78",
        "Celulose_USD": "1.589,23",
        "TIO2_EUR": "3.678,50",
        "Melamina_USD": "1.879,45",
        "Ureia_USD": "718,92",
        "Metanol_USD": "523,67",
        "Resina_UF_BRL": "3.456,00",
        "Resina_MF_BRL": "6.234,00",
        "USDBRL": "5,72",
        "EURBRL": "6,18",
        "CNYBRL": "0,82",
        "USDBRL_GPC": "5,89",
        "CNT_EU_EUR": "823,45",
        "CNT_CN_USD": "5.789,67",
        "CNT_GQ_USD": "3.756,25",
        "CNT_CG_USD": "3.689,50",
        "CNT_VC_USD": "5.123,75"
    }
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

// Utility functions
function parseBrazilianNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // Remove todos os pontos (separadores de milhares) e substitui vírgula por ponto decimal
        const clean = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle dd/mm/yyyy format (Brazilian format)
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            
            // Validate date parts
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                // Create date without timezone offset - use local timezone
                const date = new Date(year, month - 1, day);
                return date;
            }
        }
    }
    
    // Handle Excel serial number
    if (typeof dateStr === 'number') {
        const date = new Date((dateStr - 25569) * 86400 * 1000);
        // Convert to local date to avoid timezone issues
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return localDate;
    }
    
    // Handle ISO string or other formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        // Convert to local date to avoid timezone issues
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return localDate;
    }
    
    return null;
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
    
    // Remove any extra spaces and validate format
    const cleaned = dateStr.trim();
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = cleaned.match(datePattern);
    
    if (!match) return null;
    
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    
    // Validate date components
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
        return null;
    }
    
    // Create date object using local timezone
    const date = new Date(year, month - 1, day);
    
    // Verify the date is valid (handles cases like 31/02/2023)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        return null;
    }
    
    return date;
}

function validateDateInput(input) {
    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    return datePattern.test(input.trim());
}

function formatNumber(value) {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatCurrency(value, currency = '') {
    if (typeof value !== 'number' || isNaN(value)) return '--';
    return `${currency}${formatNumber(value)}`;
}

// Data processing com log específico para TIO2_EUR
function processData(rawData) {
    console.log('Processing data - inicial:', rawData.length, 'registros');
    
    const processedData = rawData.map((row, index) => {
        const processed = { ...row };
        
        processed.Data = parseLocalDate(processed.Data);
        
        Object.keys(processed).forEach(key => {
            if (key !== 'Data') {
                const originalValue = processed[key];
                processed[key] = parseBrazilianNumber(processed[key]);
                
                // Log específico para TIO2_EUR
                if (key === 'TIO2_EUR') {
                    console.log(`Linha ${index}: TIO2_EUR - Original: "${originalValue}" -> Processado: ${processed[key]}`);
                }
            }
        });
        
        return processed;
    }).filter(row => row.Data && row.Data instanceof Date && !isNaN(row.Data.getTime()));
    
    // Sort by date to ensure proper ordering
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

// Chart creation helper
function createLineChart(canvasId, datasets, scales = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const labels = filteredData.map(d => formatDateBR(d.Data));
    
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    const defaultScales = {
        y: { title: { display: true, text: 'Valor' } }
    };
    
    const chartConfig = {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const index = context[0].dataIndex;
                            const date = filteredData[index].Data;
                            return formatDateBR(date);
                        }
                    }
                }
            },
            scales: scales || defaultScales
        }
    };
    
    charts[canvasId] = new Chart(ctx, chartConfig);
}

// Chart functions
function createAllCharts() {
    if (filteredData.length === 0) return;
    
    console.log('Criando gráficos com', filteredData.length, 'registros');
    
    // 1. Celulose (dual axis)
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

    // 2. TIO2_EUR - CORREÇÃO ESPECÍFICA
    const tio2Data = filteredData.map(d => d.TIO2_EUR);
    console.log('Dados TIO2_EUR para gráfico:', tio2Data);
    
    createLineChart('tio2Chart', [
        {
            label: 'TIO2 EUR (€)',
            data: tio2Data,
            borderColor: chartColors.violet,
            backgroundColor: chartColors.violet + '30',
            tension: 0.1
        }
    ]);

    // 3. Insumos
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

    // 4. Resinas (dual axis) - USDBRL_GPC com linha tracejada
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
            borderDash: [5, 5]  // Linha tracejada
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

    // 5. Moedas (dual axis)
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

    // 6. Frete Importação (dual axis)
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

    // 7. Frete Exportação
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

// Update KPI boxes com log específico para TIO2_EUR
function updateKPIBoxes() {
    if (filteredData.length === 0) return;
    
    const latest = filteredData[filteredData.length - 1];
    const latestDate = formatDateBR(latest.Data);
    
    console.log('Atualizando KPIs - TIO2_EUR valor:', latest.TIO2_EUR);
    
    const priceTitle = document.getElementById('priceTitle');
    if (priceTitle) {
        priceTitle.textContent = `Preços - Última atualização: ${latestDate}`;
    }
    
    // Update all KPI values - CORREÇÃO ESPECÍFICA PARA TIO2_EUR
    const kpiMappings = {
        'celulose-eur': [latest.Celulose_EUR, '€'],
        'celulose-usd': [latest.Celulose_USD, '$'],
        'tio2-eur': [latest.TIO2_EUR, '€'],  // CORRIGIDO: usar TIO2_EUR
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
            const formattedValue = formatCurrency(value, currency);
            element.textContent = formattedValue;
            
            // Log específico para TIO2_EUR
            if (id === 'tio2-eur') {
                console.log(`KPI TIO2_EUR atualizado - Valor bruto: ${value}, Formatado: ${formattedValue}`);
            }
        }
    });
}

// Update date filters
function updateDateFilters() {
    if (globalData.length === 0) return;
    
    const dates = globalData.map(d => d.Data).sort((a, b) => a - b);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput && startDate) {
        startDateInput.value = formatDateBR(startDate);
    }
    if (endDateInput && endDate) {
        endDateInput.value = formatDateBR(endDate);
    }
}

// Upload status functions
function showUploadStatus(message, type) {
    const statusEl = document.getElementById('uploadStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `upload-status ${type}`;
        statusEl.classList.remove('hidden');
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 3000);
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

// Main update function
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

// File upload handling
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

// Initialize app
function initializeApp() {
    console.log('Initializing app...');
    
    // Check for required libraries
    if (typeof XLSX === 'undefined') {
        console.error('XLSX library not loaded');
        showUploadStatus('Erro: Biblioteca XLSX não carregada', 'error');
        return;
    }
    
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library not loaded');
        return;
    }
    
    // Initialize with sample data
    console.log('Carregando dados de exemplo...');
    globalData = processData(sampleData);
    
    // Update UI
    updateDateFilters();
    updateDashboard();
    
    console.log('App initialized successfully with', globalData.length, 'sample records');
}

// Robust event listeners setup
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Function to set up all event listeners
    function attachEventListeners() {
        console.log('Attaching event listeners...');
        
        // Upload button functionality
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('fileInput');
        const uploadZone = document.getElementById('uploadZone');
        
        if (uploadBtn && fileInput) {
            // Remove any existing event listeners
            uploadBtn.onclick = null;
            
            // Add new event listener
            uploadBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload button clicked - triggering file input');
                fileInput.click();
            };
            
            console.log('Upload button event listener attached');
        } else {
            console.error('Upload button or file input not found');
        }
        
        if (fileInput) {
            fileInput.onchange = function(e) {
                console.log('File input changed');
                const file = e.target.files[0];
                if (file) {
                    console.log('File selected:', file.name);
                    handleFileUpload(file);
                }
                e.target.value = ''; // Clear the input
            };
        }
        
        // Upload zone functionality
        if (uploadZone && fileInput) {
            uploadZone.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Upload zone clicked - triggering file input');
                fileInput.click();
            };
            
            // Drag and drop functionality
            uploadZone.ondragover = function(e) {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add('dragover');
            };
            
            uploadZone.ondragleave = function(e) {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('dragover');
            };
            
            uploadZone.ondrop = function(e) {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('dragover');
                
                console.log('File dropped');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUpload(files[0]);
                }
            };
            
            console.log('Upload zone event listeners attached');
        }
        
        // Prevent default drag behavior on document
        document.ondragover = function(e) {
            e.preventDefault();
        };
        
        document.ondrop = function(e) {
            e.preventDefault();
        };
        
        // Date filter functionality
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) {
            startDateInput.oninput = function(e) {
                const value = e.target.value;
                if (value && !validateDateInput(value)) {
                    e.target.style.borderColor = '#c0152f';
                } else {
                    e.target.style.borderColor = '';
                }
            };
            
            startDateInput.onblur = function(e) {
                const value = e.target.value;
                if (value) {
                    const date = parseDateBR(value);
                    if (date) {
                        e.target.value = formatDateBR(date);
                        e.target.style.borderColor = '';
                        updateDashboard();
                    } else {
                        e.target.style.borderColor = '#c0152f';
                    }
                } else {
                    e.target.style.borderColor = '';
                    updateDashboard();
                }
            };
            
            startDateInput.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            };
        }
        
        if (endDateInput) {
            endDateInput.oninput = function(e) {
                const value = e.target.value;
                if (value && !validateDateInput(value)) {
                    e.target.style.borderColor = '#c0152f';
                } else {
                    e.target.style.borderColor = '';
                }
            };
            
            endDateInput.onblur = function(e) {
                const value = e.target.value;
                if (value) {
                    const date = parseDateBR(value);
                    if (date) {
                        e.target.value = formatDateBR(date);
                        e.target.style.borderColor = '';
                        updateDashboard();
                    } else {
                        e.target.style.borderColor = '#c0152f';
                    }
                } else {
                    e.target.style.borderColor = '';
                    updateDashboard();
                }
            };
            
            endDateInput.onkeypress = function(e) {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            };
        }
        
        console.log('All event listeners attached successfully');
    }
    
    // Try to attach event listeners immediately
    attachEventListeners();
    
    // Also try again after a short delay to ensure DOM is ready
    setTimeout(attachEventListeners, 100);
    
    console.log('Event listeners setup completed');
}

// Wait for DOM to be ready then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
    });
} else {
    initializeApp();
    setupEventListeners();
}
