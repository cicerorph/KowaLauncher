const { ipcRenderer } = require('electron')
const os = require('os')

let autoScroll = true
let startTime = Date.now()
let updateInterval = null
let logs = []

document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const logContainer = document.getElementById('logContainer')
    const clearBtn = document.getElementById('clearBtn')
    const scrollBtn = document.getElementById('scrollBtn')
    const exportBtn = document.getElementById('exportBtn')
    const statusEl = document.getElementById('status')
    const ramUsageEl = document.getElementById('ramUsage')
    const cpuUsageEl = document.getElementById('cpuUsage')
    const uptimeEl = document.getElementById('uptime')
    const ramBar = document.getElementById('ramBar')
    const cpuBar = document.getElementById('cpuBar')

    // Receber logs do processo principal
    ipcRenderer.on('console-log', (event, data) => {
        addLog(data.message, data.type || 'info')
    })

    // Receber métricas do sistema
    ipcRenderer.on('console-metrics', (event, metrics) => {
        updateMetrics(metrics)
    })

    // Receber status do jogo
    ipcRenderer.on('console-status', (event, status) => {
        updateStatus(status)
    })

    // Botão de limpar logs
    clearBtn.addEventListener('click', () => {
        logContainer.innerHTML = ''
        logs = []
        addLog('Logs limpos', 'info')
    })

    // Botão de auto-scroll
    scrollBtn.addEventListener('click', () => {
        autoScroll = !autoScroll
        scrollBtn.textContent = `Auto-Scroll: ${autoScroll ? 'ON' : 'OFF'}`
        if (autoScroll) {
            scrollToBottom()
        }
    })

    // Botão de exportar logs
    exportBtn.addEventListener('click', () => {
        const logsText = logs.join('\n')
        const blob = new Blob([logsText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `minecraft-logs-${new Date().toISOString().replace(/:/g, '-')}.txt`
        a.click()
        URL.revokeObjectURL(url)
        addLog('Logs exportados com sucesso', 'success')
    })

    // Função para adicionar log
    function addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('pt-BR')
        const logLine = document.createElement('div')
        logLine.className = `log-line ${type}`
        
        const timestampSpan = document.createElement('span')
        timestampSpan.className = 'log-timestamp'
        timestampSpan.textContent = `[${timestamp}]`
        
        logLine.appendChild(timestampSpan)
        logLine.appendChild(document.createTextNode(' ' + message))
        
        logContainer.appendChild(logLine)
        logs.push(`[${timestamp}] ${message}`)
        
        if (autoScroll) {
            scrollToBottom()
        }

        // Limitar número de logs exibidos (performance)
        if (logContainer.children.length > 1000) {
            logContainer.removeChild(logContainer.firstChild)
        }
    }

    // Função para rolar para o final
    function scrollToBottom() {
        logContainer.scrollTop = logContainer.scrollHeight
    }

    // Função para atualizar métricas
    function updateMetrics(metrics) {
        // Atualizar RAM
        const ramUsedMB = Math.round(metrics.memory.used / 1024 / 1024)
        const ramTotalMB = Math.round(metrics.memory.total / 1024 / 1024)
        const ramPercent = Math.round((metrics.memory.used / metrics.memory.total) * 100)
        
        ramUsageEl.innerHTML = `${ramUsedMB} MB / ${ramTotalMB} MB <span class="progress-bar"><span class="progress-fill ${getColorClass(ramPercent)}" id="ramBar" style="width: ${ramPercent}%"></span></span>`
        
        // Aplicar classe de cor ao valor
        ramUsageEl.className = 'stat-value ' + getColorClass(ramPercent)
        
        // Atualizar CPU
        const cpuPercent = Math.round(metrics.cpu)
        cpuUsageEl.innerHTML = `${cpuPercent}% <span class="progress-bar"><span class="progress-fill ${getColorClass(cpuPercent)}" id="cpuBar" style="width: ${cpuPercent}%"></span></span>`
        cpuUsageEl.className = 'stat-value ' + getColorClass(cpuPercent)
        
        // Atualizar tempo de execução
        const elapsed = Date.now() - startTime
        const hours = Math.floor(elapsed / 3600000)
        const minutes = Math.floor((elapsed % 3600000) / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        uptimeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    // Função para determinar classe de cor baseada na porcentagem
    function getColorClass(percent) {
        if (percent >= 90) return 'critical'
        if (percent >= 70) return 'warning'
        return 'good'
    }

    // Função para atualizar status
    function updateStatus(status) {
        statusEl.textContent = status
        
        // Definir cor baseada no status
        statusEl.className = 'stat-value'
        if (status.toLowerCase().includes('rodando') || status.toLowerCase().includes('ativo')) {
            statusEl.className = 'stat-value good'
        } else if (status.toLowerCase().includes('erro') || status.toLowerCase().includes('falha')) {
            statusEl.className = 'stat-value critical'
        } else if (status.toLowerCase().includes('iniciando') || status.toLowerCase().includes('carregando')) {
            statusEl.className = 'stat-value warning'
        }
    }

    // Iniciar com log de boas-vindas
    addLog('Console do Minecraft iniciado', 'success')
    addLog('Aguardando início do jogo...', 'info')

    // Atualizar tempo de execução a cada segundo
    updateInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const hours = Math.floor(elapsed / 3600000)
        const minutes = Math.floor((elapsed % 3600000) / 60000)
        const seconds = Math.floor((elapsed % 60000) / 1000)
        uptimeEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }, 1000)
})

// Limpar intervalo ao fechar
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval)
    }
})
