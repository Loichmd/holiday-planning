// ============================================
// POI (Points of Interest) Management
// ============================================

let currentPOIs = [];
let editingPOI = null;
let poiMap = null;
let poiMarkers = [];

// ============================================
// POI VIEW RENDERING
// ============================================

async function renderPOIView() {
    console.log('renderPOIView called');

    // Load POIs for current project
    const result = await loadPOIs(currentProject);
    currentPOIs = result.success ? result.pois : [];

    // Render sidebar list
    renderPOISidebar();

    // Initialize map if not already done
    if (!poiMap) {
        initializePOIMap();
    }

    // Display POI markers on map
    displayPOIMarkers();
}

function renderPOISidebar() {
    const sidebarContent = document.getElementById('poiSidebarList');

    if (!currentPOIs || currentPOIs.length === 0) {
        sidebarContent.innerHTML = `
            <div class="poi-empty-state">
                <div class="poi-empty-state-icon">📍</div>
                <div class="poi-empty-state-title">Aucun point d'intérêt</div>
                <div class="poi-empty-state-text">Ajoutez des lieux à visiter pour préparer votre voyage</div>
            </div>
        `;
        return;
    }

    let html = '';
    currentPOIs.forEach(poi => {
        html += renderPOIListItem(poi);
    });

    sidebarContent.innerHTML = html;
}

function renderPOIListItem(poi) {
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

    return `
        <div class="poi-list-item" data-poi-id="${poi.id}" onclick="focusPOIOnMap('${poi.id}')">
            <div class="poi-list-item-header">
                <div class="poi-list-item-icon">${icon}</div>
                <div class="poi-list-item-priority ${poi.priority}">${priorityLabel}</div>
            </div>
            <div class="poi-list-item-name">${poi.name}</div>
            <div class="poi-list-item-address">
                <span>📍</span>
                <span>${poi.address}</span>
            </div>
            <div class="poi-list-item-actions" onclick="event.stopPropagation()">
                <button onclick="editPOI('${poi.id}')" title="Modifier">✏️ Éditer</button>
                <button onclick="openPlanifierModal('${poi.id}')" title="Planifier à un jour">📅 Planifier</button>
                <button onclick="confirmDeletePOI('${poi.id}')" title="Supprimer">🗑️</button>
            </div>
        </div>
    `;
}

// ============================================
// POI MAP
// ============================================

function initializePOIMap() {
    console.log('Initializing POI map');

    if (poiMap) {
        poiMap.remove();
    }

    // Initialize Leaflet map
    poiMap = L.map('poiMap').setView([48.8566, 2.3522], 12); // Paris par défaut

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(poiMap);

    // Force map resize after a short delay
    setTimeout(() => {
        if (poiMap) {
            poiMap.invalidateSize();
        }
    }, 200);
}

function displayPOIMarkers() {
    if (!poiMap) return;

    // Clear existing markers
    poiMarkers.forEach(marker => marker.remove());
    poiMarkers = [];

    // Add markers for each POI with coordinates
    const poisWithCoords = currentPOIs.filter(poi => poi.latitude && poi.longitude);

    if (poisWithCoords.length === 0) {
        console.log('No POIs with coordinates to display');
        return;
    }

    poisWithCoords.forEach(poi => {
        // Color by priority
        const markerColors = {
            'incontournable': '#fa5252',
            'important': '#fd7e14',
            'normale': '#228be6',
            'si_possible': '#868e96'
        };

        const color = markerColors[poi.priority] || '#228be6';

        // Create custom marker HTML
        const markerHtml = `
            <div style="
                background: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span style="transform: rotate(45deg); font-size: 16px;">${poi.category === 'restaurant' ? '🍽️' : '📍'}</span>
            </div>
        `;

        const icon = L.divIcon({
            html: markerHtml,
            className: 'custom-poi-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        const marker = L.marker([poi.latitude, poi.longitude], { icon })
            .addTo(poiMap)
            .bindPopup(`
                <div style="min-width: 200px;">
                    <strong style="font-size: 16px;">${poi.name}</strong><br>
                    <span style="color: #868e96; font-size: 13px;">${poi.address}</span><br>
                    ${poi.notes ? `<p style="margin: 8px 0; font-size: 13px;">${poi.notes}</p>` : ''}
                    <div style="margin-top: 10px; display: flex; gap: 8px;">
                        <button onclick="editPOI('${poi.id}')" class="btn btn-secondary" style="flex: 1; padding: 6px 12px; font-size: 12px;">Éditer</button>
                        <button onclick="openPlanifierModal('${poi.id}')" class="btn btn-primary" style="flex: 1; padding: 6px 12px; font-size: 12px;">Planifier</button>
                    </div>
                </div>
            `);

        poiMarkers.push(marker);
    });

    // Fit map to show all markers
    if (poisWithCoords.length > 0) {
        const bounds = L.latLngBounds(poisWithCoords.map(poi => [poi.latitude, poi.longitude]));
        poiMap.fitBounds(bounds, { padding: [50, 50] });
    }
}

function focusPOIOnMap(poiId) {
    const poi = currentPOIs.find(p => p.id === poiId);
    if (poi && poi.latitude && poi.longitude && poiMap) {
        poiMap.flyTo([poi.latitude, poi.longitude], 15, {
            duration: 1
        });

        // Open popup for this POI
        const marker = poiMarkers.find(m => {
            const latlng = m.getLatLng();
            return latlng.lat === poi.latitude && latlng.lng === poi.longitude;
        });

        if (marker) {
            marker.openPopup();
        }
    }
}

// ============================================
// POI FILTERS
// ============================================

function filterPOIs() {
    const searchTerm = document.getElementById('poiFilterSearch').value.toLowerCase();
    const priorityFilter = document.getElementById('poiFilterPriority').value;
    const categoryFilter = document.getElementById('poiFilterCategory').value;
    const statusFilter = document.getElementById('poiFilterStatus').value;

    const items = document.querySelectorAll('.poi-list-item');

    items.forEach(item => {
        const poiId = item.dataset.poiId;
        const poi = currentPOIs.find(p => p.id === poiId);

        if (!poi) {
            item.style.display = 'none';
            return;
        }

        // Check filters
        const matchesSearch = !searchTerm ||
            poi.name.toLowerCase().includes(searchTerm) ||
            poi.address.toLowerCase().includes(searchTerm);

        const matchesPriority = !priorityFilter || poi.priority === priorityFilter;
        const matchesCategory = !categoryFilter || poi.category === categoryFilter;

        const matchesStatus = !statusFilter ||
            (statusFilter === 'assigned' && poi.assigned_date) ||
            (statusFilter === 'unassigned' && !poi.assigned_date);

        // Show/hide based on all filters
        if (matchesSearch && matchesPriority && matchesCategory && matchesStatus) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// ============================================
// POI MODAL
// ============================================

function openPOIModal() {
    editingPOI = null;
    document.getElementById('poiModalTitle').textContent = 'Nouveau point d\'intérêt';
    document.getElementById('poiForm').reset();
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    const firstCategoryBtn = document.querySelector('[data-category]');
    if (firstCategoryBtn) firstCategoryBtn.classList.add('active');
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

async function confirmDeletePOI(poiId) {
    const poi = currentPOIs.find(p => p.id === poiId);
    if (!poi) return;

    if (!confirm(`Supprimer "${poi.name}" ?`)) return;

    const result = await deletePOI(poiId);
    if (result.success) {
        renderPOIView();
    } else {
        alert('Erreur: ' + result.error);
    }
}

// Open the planifier modal for a POI
function openPlanifierModal(poiId) {
    const modal = document.getElementById('planifierModal');
    const dateInput = document.getElementById('planifierDate');
    const hourSelect = document.getElementById('planifierHour');
    const minuteSelect = document.getElementById('planifierMinute');

    // Set today as default
    const today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    hourSelect.value = '09';
    minuteSelect.value = '00';

    modal.dataset.poiId = poiId;
    modal.classList.add('show');
}

function closePlanifierModal() {
    document.getElementById('planifierModal').classList.remove('show');
}

async function confirmPlanifier() {
    const modal = document.getElementById('planifierModal');
    const poiId = modal.dataset.poiId;
    const dateValue = document.getElementById('planifierDate').value;
    const hour = document.getElementById('planifierHour').value;
    const minute = document.getElementById('planifierMinute').value;

    if (!dateValue) {
        alert('Veuillez sélectionner une date.');
        return;
    }

    const timeValue = `${hour}:${minute}`;
    const result = await assignPOIToDay(poiId, dateValue, timeValue);
    if (result.success) {
        closePlanifierModal();
        renderPOIView();
    } else {
        alert('Erreur: ' + result.error);
    }
}
