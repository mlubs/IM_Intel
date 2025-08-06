// Global variables
let globalData = [];
let filteredData = [];
let charts = {};

// Função para mostrar o status do upload/carregamento
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

// Função para processar dados brutos do Excel
function processData(rawData) {
    const processedData = rawData.map(row => {
        let obj = { ...row };
        obj.Data = parseLocalDate(obj.Data);
        for (const key in obj) {
            if (key !== 'Data') {
                obj[key] = parseBrazilianNumber(obj[key]);
            }
        }
        return obj;
    }).filter(r => r.Data instanceof Date && !isNaN(r.Data));
    processedData.sort((a, b) => a.Data - b.Data);
    return processedData;
}

// Função para parse da data em formato BR (dd/mm/yyyy)
function parseLocalDate(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === 'number') {
        // Excel serial date to JS date
        return new Date((dateStr - 25569) * 86400 * 1000);
    }
    if (typeof dateStr === 'string') {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const [d, m, y] = parts.map(s => parseInt(s, 10));
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                return new Date(y, m - 1, d);
            }
        }
        // fallback try to parse ISO or others
        const parsed = new Date(dateStr);
        if (!isNaN(parsed)) return parsed;
    }
    return null;
}

// Parse número brasileiro (ex: "1.234,56" -> 1234.56)
function parseBrazilianNumber(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

// Função para atualizar dados após o carregamento
function afterDataLoaded(data) {
    globalData = processData(data);
    updateLastUploadInfo();
    updateDateFilters();
    updateDashboard();
    showUploadStatus(`Arquivo database carregado com sucesso! ${globalData.length} registros.`, 'success');
}

// Função para buscar e carregar o arquivo Excel automaticamente
function fetchAndLoadExcel(url) {
    showUploadStatus('Carregando arquivo database automaticamente...', 'processing');

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Erro ao carregar arquivo: ${response.statusText}`);
            return response.arrayBuffer();
        })
        .then(buffer => {
            const data = new Uint8Array(buffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            if (jsonData.length === 0) {
                showUploadStatus('Arquivo database vazio ou sem dados válidos', 'error');
                return;
            }
            afterDataLoaded(jsonData);
        })
        .catch(error => {
            console.error('Falha ao carregar database.xlsx:', error);
            showUploadStatus('Falha ao carregar arquivo database automaticamente. Use o upload manual.', 'error');
            // Permite upload manual continuar funcionando
        });
}

// Função para lidar com upload manual pelo usuário
function handleFileUpload(file) {
    if (!file) return showUploadStatus('Nenhum arquivo selecionado', 'error');
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
            afterDataLoaded(jsonData);
        } catch (err) {
            console.error('Erro ao processar arquivo:', err);
            showUploadStatus('Erro ao processar arquivo Excel.', 'error');
        }
    };
    reader.onerror = () => showUploadStatus('Erro ao ler arquivo', 'error');
    reader.readAsArrayBuffer(file);
}

// Função de inicialização do app
function initializeApp() {
    console.log('Inicializando app...');
    if (typeof XLSX === 'undefined') {
        showUploadStatus('Erro: Biblioteca XLSX não carregada', 'error');
        return;
    }
    if (typeof Chart === 'undefined') {
        showUploadStatus('Erro: Biblioteca Chart.js não carregada', 'error');
        return;
    }
    // Tenta carregar database.xlsx automaticamente da raiz
    fetchAndLoadExcel('./database.xlsx');
}

// Setup dos event listeners do upload, filtros, etc.
function setupEventListeners() {
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');

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

    if (uploadZone) {
        uploadZone.onclick = e => {
            e.preventDefault();
            if (fileInput) fileInput.click();
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

    // Date filter event listeners (exemplo simplificado)
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) {
        startDateInput.onblur = e => {
            updateDashboard();
        };
    }
    if (endDateInput) {
        endDateInput.onblur = e => {
            updateDashboard();
        };
    }
}

// Aguarda DOM estar pronto para inicializar app e listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeApp();
        setupEventListeners();
    });
} else {
    initializeApp();
    setupEventListeners();
}
