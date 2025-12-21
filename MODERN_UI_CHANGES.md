# Guide de Refonte UI Moderne

## Résumé
Ce document liste les changements à apporter à `index.html` pour créer une interface moderne, minimaliste et optimisée mobile.

## Changements CSS Principaux

### 1. Variables CSS à ajouter (remplacer les couleurs hard-codées)

```css
:root {
    /* Couleurs */
    --primary: #6366F1;
    --primary-dark: #4F46E5;
    --accent: #EC4899;
    --success: #10B981;
    --warning: #F59E0B;
    --error: #EF4444;

    /* Neutres */
    --gray-50: #F9FAFB;
    --gray-100: #F3F4F6;
    --gray-200: #E5E7EB;
    --gray-300: #D1D5DB;
    --gray-600: #4B5563;
    --gray-700: #374151;
    --gray-900: #111827;

    /* Espacement */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 32px;

    /* Rayon */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;

    /* Ombres */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

    /* Transitions */
    --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 2. Nouveau CSS pour Bottom Navigation

```css
.bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: white;
    border-top: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 100;
    padding-bottom: env(safe-area-inset-bottom); /* iOS notch */
}

.nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: none;
    background: none;
    color: var(--gray-600);
    cursor: pointer;
    transition: var(--transition);
    min-width: 80px;
}

.nav-item.active {
    color: var(--primary);
}

.nav-item svg,
.nav-item .icon {
    width: 24px;
    height: 24px;
}

.nav-item span {
    font-size: 11px;
    font-weight: 500;
}

@media (min-width: 768px) {
    .bottom-nav {
        display: none;
    }
}
```

### 3. Nouveau Topbar Mobile

```css
.topbar {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: white;
    border-bottom: 1px solid var(--gray-200);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--space-md);
    z-index: 50;
}

.topbar-left {
    flex: 1;
}

.project-selector {
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-900);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.btn-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--gray-100);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
}

.btn-icon:hover {
    background: var(--gray-200);
}

.user-avatar {
    background: var(--primary);
    color: white;
    font-weight: 600;
    font-size: 14px;
}
```

### 4. Cartes d'Activités Modernes

```css
.activity-card {
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
    cursor: pointer;
}

.activity-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
}

.activity-card-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
}

.activity-card-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary);
}

.activity-card-content {
    padding: var(--space-md);
}

.activity-card-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.activity-card-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--gray-600);
}

.activity-card-meta svg {
    width: 16px;
    height: 16px;
}

.activity-card-description {
    font-size: 14px;
    color: var(--gray-600);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
```

### 5. Layout Responsive

```css
.app-container {
    min-height: 100vh;
    background: var(--gray-50);
    padding-bottom: 80px; /* Space for bottom nav */
}

@media (min-width: 768px) {
    .app-container {
        display: flex;
        padding-bottom: 0;
    }

    .sidebar {
        width: 280px;
        height: 100vh;
        position: sticky;
        top: 0;
        background: white;
        border-right: 1px solid var(--gray-200);
    }

    .main-content {
        flex: 1;
        padding: var(--space-xl);
    }
}
```

## Changements HTML Principaux

### 1. Ajouter le Topbar

```html
<header class="topbar">
    <div class="topbar-left">
        <div class="project-selector" onclick="toggleProjectDropdown()">
            <span id="currentProjectName">Mes Projets</span>
            <span>▼</span>
        </div>
    </div>
    <div class="topbar-right">
        <button class="btn-icon user-avatar" id="userAvatar" onclick="showUserMenu()">U</button>
    </div>
</header>
```

### 2. Ajouter le Bottom Nav

```html
<nav class="bottom-nav">
    <button class="nav-item active" onclick="showView('calendar')">
        <svg><!-- Calendar icon --></svg>
        <span>Calendrier</span>
    </button>
    <button class="nav-item" onclick="showView('list')">
        <svg><!-- List icon --></svg>
        <span>Liste</span>
    </button>
    <button class="nav-item" onclick="showView('projects')">
        <svg><!-- Projects icon --></svg>
        <span>Projets</span>
    </button>
</nav>
```

### 3. Structure des Vues

```html
<div class="app-container">
    <!-- Vue Calendrier -->
    <div id="calendarView" class="view active">
        <div class="calendar-compact">
            <!-- Mini calendrier -->
        </div>
        <div class="activities-list">
            <!-- Liste des activités en cartes -->
        </div>
    </div>

    <!-- Vue Liste -->
    <div id="listView" class="view">
        <div class="filters">
            <!-- Filtres catégorie/date -->
        </div>
        <div class="activities-grid">
            <!-- Grille de cartes -->
        </div>
    </div>

    <!-- Vue Projets -->
    <div id="projectsView" class="view">
        <div class="projects-grid">
            <!-- Cartes de projets -->
        </div>
    </div>
</div>
```

## JavaScript à Ajouter

### Gestion des Vues

```javascript
function showView(viewName) {
    // Cacher toutes les vues
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Afficher la vue sélectionnée
    document.getElementById(viewName + 'View').classList.add('active');
    event.currentTarget.classList.add('active');
}
```

### Rendu des Cartes

```javascript
function renderActivityCard(activity) {
    return `
        <div class="activity-card" onclick="editActivity('${activity.id}')">
            <div class="activity-card-image" style="background-image: url(${activity.imageUrl || ''})">
                <div class="activity-card-badge">${activity.category}</div>
            </div>
            <div class="activity-card-content">
                <h3 class="activity-card-title">${activity.title}</h3>
                <div class="activity-card-meta">
                    <span>📅 ${activity.date}</span>
                    <span>🕐 ${activity.time}</span>
                </div>
                <p class="activity-card-description">${activity.description || ''}</p>
            </div>
        </div>
    `;
}
```

## Icônes SVG (à ajouter)

```html
<!-- Calendar Icon -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
</svg>

<!-- List Icon -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
</svg>

<!-- Projects Icon -->
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
</svg>
```

## Prochaines Étapes

1. Remplacer le CSS dans index.html (lignes 7-1131) par les nouveaux styles
2. Modifier le HTML layout (lignes 1136-1297) avec la nouvelle structure
3. Ajouter les fonctions JavaScript pour les vues
4. Tester sur mobile et desktop
5. Ajuster les micro-animations

**Note**: Cette refonte est volumineuse. Voulez-vous que je crée le fichier complet maintenant ou préférez-vous d'abord voir un prototype/démo?
