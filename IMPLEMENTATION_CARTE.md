# Guide d'implémentation - Vue Carte & Mode En Voyage

## ✅ Étapes complétées

### 1. Base de données
- ✅ Script SQL créé : `supabase-add-geocoding.sql`
- ✅ À exécuter dans Supabase pour ajouter les colonnes `latitude`, `longitude`, `geocoded`

### 2. Fonctions de géocodage
- ✅ `geocodeAddress(address)` - Convertit une adresse en coordonnées
- ✅ `geocodeActivity(activityId, location)` - Géocode et sauvegarde une activité
- ✅ `geocodeProjectActivities(projectId)` - Géocode toutes les activités d'un projet
- ✅ Utilise Mapbox Geocoding API (gratuit jusqu'à 100k requêtes/mois)

## 📋 Étapes à implémenter

### 3. Bottom Navigation Mobile (en cours)

**CSS à ajouter** (avant la fermeture du `</style>`):
```css
/* Bottom Navigation Mobile */
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 1000;
    padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: none;
    background: none;
    color: #868e96;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 80px;
    font-size: 11px;
    font-weight: 500;
}

.nav-item.active {
    color: #6366F1;
}

.nav-item svg,
.nav-item .icon {
    width: 24px;
    height: 24px;
    margin-bottom: 2px;
}

/* Hide bottom nav on desktop */
@media (min-width: 768px) {
    .bottom-nav {
        display: none;
    }
}

/* Add padding to main-content for bottom nav on mobile */
@media (max-width: 767px) {
    .main-content {
        padding-bottom: 80px;
    }
}
```

**HTML à ajouter** (avant la fermeture de `</div><!-- app-container -->`):
```html
<!-- Bottom Navigation (Mobile only) -->
<nav class="bottom-nav">
    <button class="nav-item active" onclick="switchMainView('calendar')" data-view="calendar">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Calendrier</span>
    </button>
    <button class="nav-item" onclick="switchMainView('planning')" data-view="planning">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <span>Planning</span>
    </button>
    <button class="nav-item" onclick="switchMainView('map')" data-view="map">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <span>Carte</span>
    </button>
</nav>
```

**JavaScript à ajouter**:
```javascript
// Gestion de la navigation principale
function switchMainView(viewName) {
    // Update bottom nav active state
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Hide all views
    document.getElementById('calendarView').style.display = 'none';
    document.getElementById('planningView').style.display = 'none';
    const mapView = document.getElementById('mapView');
    if (mapView) mapView.style.display = 'none';

    // Show selected view
    if (viewName === 'calendar') {
        document.getElementById('calendarView').style.display = 'block';
        currentView = 'timeline';
    } else if (viewName === 'planning') {
        document.getElementById('planningView').style.display = 'block';
        currentView = 'planning';
    } else if (viewName === 'map') {
        if (!mapView) {
            createMapView();
        }
        document.getElementById('mapView').style.display = 'block';
        currentView = 'map';
        initializeMap();
    }
}
```

### 4. Vue Carte avec Mapbox

**Ajouter Mapbox GL JS** (dans `<head>`):
```html
<link href='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css' rel='stylesheet' />
<script src='https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'></script>
```

**CSS pour la vue carte**:
```css
/* Map View */
.map-view {
    display: none;
    position: relative;
    height: calc(100vh - 64px);
    width: 100%;
}

.map-container {
    width: 100%;
    height: 100%;
    position: relative;
}

#map {
    width: 100%;
    height: 100%;
}

/* Day Selector Chips */
.day-selector {
    position: absolute;
    top: 16px;
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    gap: 8px;
    padding: 0 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.day-chip {
    flex-shrink: 0;
    padding: 8px 16px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.day-chip.active {
    background: #6366F1;
    color: white;
    border-color: #6366F1;
}

/* Bottom Sheet */
.bottom-sheet {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    z-index: 100;
    transition: transform 0.3s ease;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.bottom-sheet.collapsed {
    transform: translateY(calc(100% - 120px));
}

.bottom-sheet.semi-expanded {
    transform: translateY(50%);
}

.bottom-sheet.expanded {
    transform: translateY(0);
}

.bottom-sheet-handle {
    width: 40px;
    height: 4px;
    background: #d1d5db;
    border-radius: 2px;
    margin: 12px auto 16px;
    cursor: grab;
}

.bottom-sheet-header {
    padding: 0 24px 16px;
    border-bottom: 1px solid #e5e7eb;
}

.bottom-sheet-title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
}

.bottom-sheet-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin-top: 4px;
}

.bottom-sheet-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
}

/* Activity Timeline in Bottom Sheet */
.activity-timeline-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.activity-timeline-item:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}

.activity-timeline-item.active {
    border-left: 4px solid #6366F1;
    background: #f9fafb;
}

.activity-timeline-time {
    font-size: 11px;
    font-weight: 700;
    color: #6366F1;
    margin-bottom: 8px;
}

.activity-timeline-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
}

.activity-timeline-location {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
}

.activity-timeline-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.btn-directions {
    flex: 1;
    padding: 8px 16px;
    background: #6366F1;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.btn-directions:hover {
    background: #4f46e5;
}
```

### 5. JavaScript pour la carte

```javascript
let map = null;
let markers = [];
let selectedDay = null;

function createMapView() {
    const mapViewHTML = `
        <div class="map-view" id="mapView">
            <div class="day-selector" id="daySelector"></div>
            <div class="map-container">
                <div id="map"></div>
            </div>
            <div class="bottom-sheet collapsed" id="bottomSheet">
                <div class="bottom-sheet-handle"></div>
                <div class="bottom-sheet-header">
                    <div class="bottom-sheet-title" id="bottomSheetTitle">Activités du jour</div>
                    <div class="bottom-sheet-subtitle" id="bottomSheetSubtitle">5 activités • 8.2 km</div>
                </div>
                <div class="bottom-sheet-content" id="bottomSheetContent"></div>
            </div>
        </div>
    `;

    // Insert before scripts
    const appContainer = document.getElementById('appContainer');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = mapViewHTML;
    appContainer.appendChild(tempDiv.firstElementChild);
}

function initializeMap() {
    if (!map) {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [2.3522, 48.8566], // Paris par défaut
            zoom: 12
        });

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl());

        // Setup bottom sheet drag
        setupBottomSheet();
    }

    // Render day selector and load activities
    renderDaySelector();
}

function renderDaySelector() {
    // Group activities by date
    const activitiesByDate = {};
    activities.forEach(activity => {
        if (!activitiesByDate[activity.date]) {
            activitiesByDate[activity.date] = [];
        }
        activitiesByDate[activity.date].push(activity);
    });

    const sortedDates = Object.keys(activitiesByDate).sort();

    const chipsHTML = sortedDates.map((date, index) => {
        const isActive = index === 0 ? 'active' : '';
        return `<button class="day-chip ${isActive}" onclick="selectMapDay('${date}')" data-date="${date}">Jour ${index + 1}</button>`;
    }).join('');

    document.getElementById('daySelector').innerHTML = chipsHTML;

    // Select first day by default
    if (sortedDates.length > 0) {
        selectMapDay(sortedDates[0]);
    }
}

function selectMapDay(dateKey) {
    selectedDay = dateKey;

    // Update chips
    document.querySelectorAll('.day-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.date === dateKey) {
            chip.classList.add('active');
        }
    });

    // Filter activities for this day
    const dayActivities = activities.filter(a => a.date === dateKey);
    dayActivities.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    // Update map markers
    updateMapMarkers(dayActivities);

    // Update bottom sheet
    updateBottomSheet(dayActivities);
}

function updateMapMarkers(dayActivities) {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add new markers
    const bounds = new mapboxgl.LngLatBounds();

    dayActivities.forEach((activity, index) => {
        if (activity.latitude && activity.longitude) {
            // Create marker element
            const el = document.createElement('div');
            el.className = 'marker';
            el.innerHTML = `<div style="background: #6366F1; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${index + 1}</div>`;

            // Add marker to map
            const marker = new mapboxgl.Marker(el)
                .setLngLat([activity.longitude, activity.latitude])
                .addTo(map);

            markers.push(marker);
            bounds.extend([activity.longitude, activity.latitude]);

            // Add click handler
            el.onclick = () => focusActivity(activity.id);
        }
    });

    // Fit map to bounds
    if (markers.length > 0) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
}

function updateBottomSheet(dayActivities) {
    const content = dayActivities.map(activity => `
        <div class="activity-timeline-item" data-id="${activity.id}" onclick="focusActivity('${activity.id}')">
            ${activity.time ? `<div class="activity-timeline-time">${activity.time.substring(0, 5)}</div>` : ''}
            <div class="activity-timeline-title">${CATEGORIES[activity.category].icon} ${activity.title}</div>
            ${activity.location ? `<div class="activity-timeline-location">📍 ${activity.location}</div>` : ''}
            <div class="activity-timeline-actions">
                <button class="btn-directions" onclick="openDirections(event, '${activity.latitude}', '${activity.longitude}')">
                    🧭 Directions
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('bottomSheetContent').innerHTML = content;
}

function focusActivity(activityId) {
    const activity = activities.find(a => a.id === activityId);
    if (activity && activity.latitude && activity.longitude) {
        map.flyTo({
            center: [activity.longitude, activity.latitude],
            zoom: 15,
            duration: 1000
        });

        // Highlight in bottom sheet
        document.querySelectorAll('.activity-timeline-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === activityId) {
                item.classList.add('active');
            }
        });
    }
}

function openDirections(event, lat, lng) {
    event.stopPropagation();

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
        ? `https://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    window.open(url, '_blank');
}

function setupBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    const handle = sheet.querySelector('.bottom-sheet-handle');

    let startY = 0;
    let currentState = 'collapsed';

    handle.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    handle.addEventListener('touchmove', (e) => {
        const deltaY = e.touches[0].clientY - startY;
        // Add drag logic here
    });

    handle.addEventListener('touchend', () => {
        // Snap to nearest state
        if (currentState === 'collapsed') {
            sheet.classList.remove('collapsed');
            sheet.classList.add('semi-expanded');
            currentState = 'semi-expanded';
        } else if (currentState === 'semi-expanded') {
            sheet.classList.remove('semi-expanded');
            sheet.classList.add('expanded');
            currentState = 'expanded';
        } else {
            sheet.classList.remove('expanded');
            sheet.classList.add('collapsed');
            currentState = 'collapsed';
        }
    });
}
```

## 🚀 Instructions de déploiement

1. **Exécuter le script SQL dans Supabase**
   ```sql
   -- Copier-coller le contenu de supabase-add-geocoding.sql
   ```

2. **Géocoder les activités existantes**
   ```javascript
   // Dans la console du navigateur après connexion
   await geocodeProjectActivities(currentProject);
   ```

3. **Tester la vue carte**
   - Ouvrir l'app sur mobile
   - Cliquer sur l'onglet "Carte" dans la bottom nav
   - Sélectionner un jour dans les chips
   - Voir les marqueurs sur la carte
   - Tester le bottom sheet
   - Cliquer sur "Directions" pour ouvrir Maps

## 📱 Mode "En voyage" (Phase 2)

À implémenter après la vue carte de base. Voir spécifications complètes dans les messages précédents.

## ⚠️ Notes importantes

- Le token Mapbox utilisé est un token public de démo. Pour la production, créer un compte Mapbox gratuit et obtenir votre propre token.
- Le géocodage se fait automatiquement lors de la création/modification d'une activité avec location.
- Les coordonnées sont cachées si le géocodage échoue.
- Mode offline : à implémenter avec service worker + cache des tuiles.
