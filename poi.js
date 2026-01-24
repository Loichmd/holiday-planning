// ============================================
// POI (Points of Interest) Management
// ============================================

let currentPOIs = [];
let editingPOI = null;

// ============================================
// POI VIEW RENDERING
// ============================================

async function renderPOIView() {
    console.log('renderPOIView called');

    // Load POIs for current project
    const result = await loadPOIs(currentProject);
    currentPOIs = result.success ? result.pois : [];

    const poiContent = document.getElementById('poiContent');

    if (currentPOIs.length === 0) {
        poiContent.innerHTML = `
            <div class="poi-empty-state">
                <div class="poi-empty-state-icon">📍</div>
                <div class="poi-empty-state-title">Aucun point d'intérêt</div>
                <div class="poi-empty-state-text">Ajoutez des lieux à visiter pour organiser votre voyage</div>
                <button class="btn-primary" onclick="openPOIModal()">Ajouter un point d'intérêt</button>
            </div>
        `;
        return;
    }

    // Group POIs by assignment status
    const unassigned = currentPOIs.filter(poi => !poi.assigned_date);
    const assigned = currentPOIs.filter(poi => poi.assigned_date);

    let html = '';

    if (unassigned.length > 0) {
        html += `<div style="grid-column: 1 / -1; font-size: 16px; font-weight: 600; color: #495057; margin-bottom: 8px;">
            📋 À planifier (${unassigned.length})
        </div>`;
        unassigned.forEach(poi => {
            html += renderPOICard(poi);
        });
    }

    if (assigned.length > 0) {
        html += `<div style="grid-column: 1 / -1; font-size: 16px; font-weight: 600; color: #495057; margin: 32px 0 8px 0;">
            ✅ Planifiés (${assigned.length})
        </div>`;
        assigned.forEach(poi => {
            html += renderPOICard(poi);
        });
    }

    poiContent.innerHTML = html;
}

function renderPOICard(poi) {
    const categoryIcons = {
        'activite': '🎯',
        'restaurant': '🍽️',
        'visite': '🏛️',
        'hotel': '🏨',
        'transport': '🚗',
        'autre': '📌'
    };

    const icon = categoryIcons[poi.category] || '📌';
    const priorityLabel = {
        'incontournable': '⭐⭐⭐',
        'important': '⭐⭐',
        'normale': '⭐',
        'si_possible': ''
    }[poi.priority] || '⭐';

    const statusHtml = poi.assigned_date
        ? `<div class="poi-card-status assigned">Planifié le ${formatDate(poi.assigned_date)}</div>`
        : `<div class="poi-card-status">Non planifié</div>`;

    return `
        <div class="poi-card" onclick="editPOI('${poi.id}')">
            <div class="poi-card-header">
                <div class="poi-card-icon">${icon}</div>
                <div class="poi-card-priority ${poi.priority}">${priorityLabel} ${poi.priority.replace('_', ' ')}</div>
            </div>
            <div class="poi-card-name">${poi.name}</div>
            <div class="poi-card-address">
                <span>📍</span>
                <span>${poi.address}</span>
            </div>
            ${poi.notes ? `<div class="poi-card-notes">${poi.notes}</div>` : ''}
            <div class="poi-card-footer">
                ${statusHtml}
                <div class="poi-card-actions" onclick="event.stopPropagation()">
                    ${!poi.assigned_date ? `<button onclick="quickAssignPOI('${poi.id}')" title="Assigner à un jour">📅</button>` : ''}
                    <button onclick="deletePOI('${poi.id}')" title="Supprimer">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ============================================
// POI MODAL
// ============================================

function openPOIModal() {
    editingPOI = null;
    document.getElementById('poiModalTitle').textContent = 'Nouveau point d\'intérêt';
    document.getElementById('poiForm').reset();
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-category="activite"]').classList.add('active');
    document.getElementById('deletePOIBtn').style.display = 'none';
    document.getElementById('poiModal').classList.add('show');
}

function closePOIModal() {
    document.getElementById('poiModal').classList.remove('show');
    editingPOI = null;
}

async function editPOI(poiId) {
    const poi = currentPOIs.find(p => p.id === poiId);
    if (!poi) return;

    editingPOI = poi;
    document.getElementById('poiModalTitle').textContent = 'Modifier le point d\'intérêt';
    document.getElementById('poiName').value = poi.name;
    document.getElementById('poiAddress').value = poi.address;
    document.getElementById('poiPriority').value = poi.priority;
    document.getElementById('poiNotes').value = poi.notes || '';

    // Set category
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const categoryBtn = document.querySelector(`[data-category="${poi.category}"]`);
    if (categoryBtn) categoryBtn.classList.add('active');

    document.getElementById('deletePOIBtn').style.display = 'block';
    document.getElementById('poiModal').classList.add('show');
}

function selectPOICategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

async function savePOI() {
    const name = document.getElementById('poiName').value.trim();
    const address = document.getElementById('poiAddress').value.trim();
    const category = document.querySelector('.category-btn.active')?.dataset.category || 'activite';
    const priority = document.getElementById('poiPriority').value;
    const notes = document.getElementById('poiNotes').value.trim();

    if (!name || !address) {
        alert('Le nom et l\'adresse sont obligatoires');
        return;
    }

    const poiData = {
        project_id: currentProject,
        name,
        address,
        category,
        priority,
        notes
    };

    try {
        let result;
        if (editingPOI) {
            // Update existing POI
            result = await updatePOI(editingPOI.id, poiData);
        } else {
            // Create new POI
            result = await createPOI(poiData);
        }

        if (result.success) {
            // Géocoder automatiquement
            if (result.poi) {
                await geocodePOI(result.poi.id, address);
            }

            closePOIModal();
            renderPOIView();
        } else {
            alert('Erreur: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving POI:', error);
        alert('Erreur lors de la sauvegarde');
    }
}

async function deleteCurrentPOI() {
    if (!editingPOI) return;

    if (!confirm(`Supprimer "${editingPOI.name}" ?`)) return;

    const result = await deletePOI(editingPOI.id);
    if (result.success) {
        closePOIModal();
        renderPOIView();
    } else {
        alert('Erreur: ' + result.error);
    }
}

// Quick assign POI to a day (will be enhanced later with drag & drop)
async function quickAssignPOI(poiId) {
    const dateInput = prompt('Date d\'assignation (YYYY-MM-DD) :');
    if (!dateInput) return;

    const timeInput = prompt('Heure (HH:MM) [optionnel]:') || null;

    const result = await assignPOIToDay(poiId, dateInput, timeInput);
    if (result.success) {
        renderPOIView();
    } else {
        alert('Erreur: ' + result.error);
    }
}

// ============================================
// PROJECT DROPDOWN FOR POI VIEW
// ============================================

function toggleProjectDropdownPOI() {
    const dropdown = document.getElementById('projectDropdownPOI');
    dropdown.classList.toggle('show');

    if (dropdown.classList.contains('show')) {
        renderProjectDropdownPOI();
    }
}

async function renderProjectDropdownPOI() {
    const dropdown = document.getElementById('projectDropdownPOI');
    const result = await loadProjects();
    const projects = result.success ? result.projects : [];

    dropdown.innerHTML = projects.map(proj => `
        <div class="project-dropdown-item ${proj.id === currentProject ? 'active' : ''}"
             onclick="selectProjectPOI('${proj.id}')">
            <div class="project-dropdown-name">${proj.name}</div>
        </div>
    `).join('');
}

async function selectProjectPOI(projectId) {
    currentProject = projectId;
    document.getElementById('projectDropdownPOI').classList.remove('show');

    // Update project name display
    const result = await loadProjects();
    const project = result.projects?.find(p => p.id === projectId);
    if (project) {
        document.getElementById('currentProjectNamePOI').textContent = project.name;
    }

    // Reload POIs
    renderPOIView();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('projectDropdownPOI');
    const button = event.target.closest('.project-selector-planning .project-btn');

    if (!button && dropdown && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});
