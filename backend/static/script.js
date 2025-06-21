// Variables globales
let currentAnalysis = null;

// Elementos del DOM
const analysisForm = document.getElementById('analysisForm');
const doiInput = document.getElementById('doiInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');

// Elementos de resultados
const riskGauge = document.getElementById('riskGauge');
const riskScore = document.getElementById('riskScore');
const riskLevel = document.getElementById('riskLevel');
const paperDoi = document.getElementById('paperDoi');
const paperTitle = document.getElementById('paperTitle');
const paperAuthors = document.getElementById('paperAuthors');
const paperJournal = document.getElementById('paperJournal');
const riskFactorsList = document.getElementById('riskFactorsList');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    analysisForm.addEventListener('submit', handleAnalysis);
    
    // Validación en tiempo real del DOI
    doiInput.addEventListener('input', validateDOI);
    
    // Smooth scrolling para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Validar formato de DOI
function validateDOI() {
    const doi = doiInput.value.trim();
    const doiPattern = /^10\.\d{4,}(?:\.\d+)*\/\S+(?:\S+)?$/;
    
    if (doi && !doiPattern.test(doi)) {
        doiInput.classList.add('is-invalid');
        analyzeBtn.disabled = true;
    } else {
        doiInput.classList.remove('is-invalid');
        analyzeBtn.disabled = false;
    }
}

// Manejar el análisis
async function handleAnalysis(e) {
    e.preventDefault();
    
    const doi = doiInput.value.trim();
    if (!doi) {
        showError('Por favor ingresa un DOI válido');
        return;
    }
    
    // Mostrar estado de carga
    showLoading(true);
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ doi: doi })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            currentAnalysis = data;
            displayResults(data);
        } else {
            showError(data.error || 'Error al analizar el paper');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Verifica tu conexión a internet.');
    } finally {
        showLoading(false);
    }
}

// Mostrar estado de carga
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('d-none');
        analyzeBtn.disabled = true;
        doiInput.disabled = true;
    } else {
        loadingState.classList.add('d-none');
        analyzeBtn.disabled = false;
        doiInput.disabled = false;
    }
}

// Mostrar error
function showError(message) {
    // Crear alerta de error
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insertar después del formulario
    const formCard = analysisForm.closest('.card');
    formCard.parentNode.insertBefore(alertDiv, formCard.nextSibling);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Mostrar resultados
function displayResults(data) {
    // Actualizar información del paper
    paperDoi.textContent = data.paper_info.doi;
    paperTitle.textContent = data.paper_info.title;
    paperAuthors.textContent = data.paper_info.authors;
    paperJournal.textContent = data.paper_info.journal;
    
    // Actualizar score de riesgo
    riskScore.textContent = data.risk_score;
    riskLevel.textContent = data.risk_level;
    
    // Actualizar colores del gauge
    updateRiskGauge(data.risk_score, data.risk_color);
    
    // Mostrar factores de riesgo
    displayRiskFactors(data.risk_factors);
    
    // Mostrar sección de resultados
    resultsSection.classList.remove('d-none');
    resultsSection.classList.add('fade-in-up');
    
    // Scroll suave a los resultados
    setTimeout(() => {
        resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 100);
}

// Actualizar el gauge de riesgo
function updateRiskGauge(score, color) {
    // Remover clases anteriores
    riskGauge.classList.remove('low-risk', 'moderate-risk', 'high-risk');
    
    // Agregar clase apropiada
    if (score < 30) {
        riskGauge.classList.add('low-risk');
    } else if (score < 70) {
        riskGauge.classList.add('moderate-risk');
    } else {
        riskGauge.classList.add('high-risk');
    }
    
    // Animar el score
    animateNumber(riskScore, 0, score, 1000);
}

// Animar números
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    const difference = end - start;
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Función de easing
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (difference * easeOutQuart));
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Mostrar factores de riesgo
function displayRiskFactors(factors) {
    if (!factors || factors.length === 0) {
        riskFactorsList.innerHTML = '<p class="text-muted">No se identificaron factores de riesgo específicos.</p>';
        return;
    }
    
    const factorsHTML = factors.map(factor => `
        <div class="risk-factor-item">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${factor}</span>
        </div>
    `).join('');
    
    riskFactorsList.innerHTML = factorsHTML;
}

// Resetear análisis
function resetAnalysis() {
    // Ocultar resultados
    resultsSection.classList.add('d-none');
    resultsSection.classList.remove('fade-in-up');
    
    // Limpiar formulario
    analysisForm.reset();
    doiInput.classList.remove('is-invalid');
    analyzeBtn.disabled = false;
    
    // Resetear variables
    currentAnalysis = null;
    
    // Scroll al inicio
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Función para obtener información adicional del paper desde OpenAlex
async function fetchPaperDetails(doi) {
    try {
        const response = await fetch(`https://api.openalex.org/works/doi:${doi}`);
        const data = await response.json();
        
        if (data) {
            return {
                title: data.title || 'Título no disponible',
                authors: extractAuthors(data.authorships),
                journal: extractJournal(data.primary_location)
            };
        }
    } catch (error) {
        console.error('Error obteniendo detalles del paper:', error);
    }
    
    return {
        title: 'Título no disponible',
        authors: 'Autores no disponibles',
        journal: 'Revista no disponible'
    };
}

// Extraer autores
function extractAuthors(authorships) {
    if (!authorships || authorships.length === 0) {
        return 'Autores no disponibles';
    }
    
    const authors = authorships.map(auth => {
        const author = auth.author;
        if (author && author.display_name) {
            return author.display_name;
        }
        return 'Autor desconocido';
    });
    
    if (authors.length <= 3) {
        return authors.join(', ');
    } else {
        return `${authors.slice(0, 2).join(', ')} et al.`;
    }
}

// Extraer información de la revista
function extractJournal(primaryLocation) {
    if (!primaryLocation || !primaryLocation.source) {
        return 'Revista no disponible';
    }
    
    const source = primaryLocation.source;
    return source.display_name || 'Revista no disponible';
}

// Función para copiar DOI al portapapeles
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Mostrar notificación
        showNotification('DOI copiado al portapapeles', 'success');
    }).catch(() => {
        showNotification('Error al copiar', 'error');
    });
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Función para exportar resultados
function exportResults() {
    if (!currentAnalysis) return;
    
    const data = {
        timestamp: new Date().toISOString(),
        doi: currentAnalysis.paper_info.doi,
        risk_score: currentAnalysis.risk_score,
        risk_level: currentAnalysis.risk_level,
        risk_factors: currentAnalysis.risk_factors,
        paper_info: currentAnalysis.paper_info
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paperlens-analysis-${currentAnalysis.paper_info.doi.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Función para compartir en redes sociales
function shareResults() {
    if (!currentAnalysis) return;
    
    const text = `Análisis de PaperLens: ${currentAnalysis.paper_info.doi} - Riesgo: ${currentAnalysis.risk_score}/100 (${currentAnalysis.risk_level})`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'Análisis PaperLens',
            text: text,
            url: url
        });
    } else {
        // Fallback: copiar al portapapeles
        copyToClipboard(`${text}\n${url}`);
    }
} 