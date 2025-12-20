// Planning Vacances - Application principale avec Supabase
// Conserve toute la logique UI de l'original, remplace localStorage par Supabase

import {
    supabase,
    signInWithOAuth,
    signOut,
    getCurrentUser,
    onAuthStateChange,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    uploadAttachment,
    getAttachments,
    deleteAttachment,
    getDayRegions,
    saveDayRegion,
    migrateFromLocalStorage
} from './supabase.js';

// Variables globales (identiques à l'original)
let currentUser = null;
let projects = [];
let currentProject = null;
let activities = [];
let currentDate = new Date();
let selectedDate = new Date();
let editingActivity = null;
let editingProjectId = null;
let currentAttachments = [];
let dayRegions = {}; // Cache des régions par jour

// Helper function to compare dates without timezone issues (identique)
function isSameDay(dateStr, dateObj) {
    if (!dateStr) return false;
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);

    return year === dateObj.getFullYear() &&
           month === dateObj.getMonth() &&
           day === dateObj.getDate();
}

const CATEGORIES = {
    activite: { icon: '🎯', color: '#51cf66', label: 'Activité' },
    avion: { icon: '✈️', color: '#339af0', label: 'Vol' },
    hotel: { icon: '🏨', color: '#ff922b', label: 'Hôtel' },
    restaurant: { icon: '🍽️', color: '#fa5252', label: 'Repas' }
};

// ============================
// AUTH FUNCTIONS (Supabase)
// ============================

window.loginWithProvider = async function(provider) {
    try {
        await signInWithOAuth(provider);
        // L'authentification redirige vers la page, onAuthStateChange s'occupe du reste
    } catch (error) {
        console.error('Login error:', error);
        alert('Erreur de connexion : ' + error.message);
    }
};

window.logout = async function() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        try {
            await signOut();
            currentUser = null;
            projects = [];
            activities = [];
            dayRegions = {};
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('appContainer').classList.remove('show');
            document.getElementById('addBtn').style.display = 'none';
        } catch (error) {
            console.error('Logout error:', error);
            alert('Erreur de déconnexion : ' + error.message);
        }
    }
};

async function checkAuth() {
    const user = await getCurrentUser();
    if (user) {
        currentUser = user;
        await showApp();
    }
}

async function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').classList.add('show');
    document.getElementById('addBtn').style.display = 'flex';

    // Update user info
    const metadata = currentUser.user_metadata || {};
    const name = metadata.full_name || metadata.name || currentUser.email.split('@')[0];
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = name;
    document.getElementById('userEmail').textContent = currentUser.email;

    // Afficher le bouton de migration si des données localStorage existent
    const hasLocalData = localStorage.getItem(`planningVoyages_${currentUser.id}`);
    if (hasLocalData) {
        document.getElementById('migrateBtn').style.display = 'block';
    }

    await loadData();
    renderCalendar();
    renderProjects();
}

// ============================
// MIGRATION
// ============================

window.startMigration = async function() {
    if (!currentUser) {
        alert('Vous devez être connecté pour migrer vos données');
        return;
    }

    if (!confirm('Voulez-vous migrer vos données localStorage vers Supabase ?')) {
        return;
    }

    try {
        const result = await migrateFromLocalStorage(currentUser.id);
        alert(`Migration réussie ! ${result.projectsCreated} projet(s) créé(s).`);
        await loadData();
        renderCalendar();
        renderProjects();
    } catch (error) {
        console.error('Migration error:', error);
        alert('Erreur lors de la migration : ' + error.message);
    }
};

// ============================
// DATA LOADING (Supabase)
// ============================

async function loadData() {
    try {
        // Charger les projets
        projects = await getProjects();

        if (projects.length === 0) {
            // Créer un premier projet par défaut
            const newProject = await createProject({
                name: 'Mon premier voyage',
                description: '',
                travelers: []
            });
            projects = [newProject];
        }

        currentProject = projects[0].id;

        // Charger les activités du projet courant
        activities = await getActivities(currentProject);

        // Charger les régions
        dayRegions = await getDayRegions(currentProject);

    } catch (error) {
        console.error('Load data error:', error);
        alert('Erreur de chargement des données : ' + error.message);
    }
}

// ============================
// CALENDAR FUNCTIONS (Identiques)
// ============================

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('currentDay').textContent = selectedDate.getDate();
    const monthNames = ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUN', 'JUL', 'AOÛ', 'SEP', 'OCT', 'NOV', 'DÉC'];
    document.getElementById('currentMonth').textContent = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = startDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, true);
        calendarDays.appendChild(dayEl);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const hasEvents = activities.some(a => isSameDay(a.date, date));

        const dayEl = createDayElement(day, false, isToday, isSelected, hasEvents);
        dayEl.addEventListener('click', () => selectDate(date));
        calendarDays.appendChild(dayEl);
    }

    const remainingDays = 42 - calendarDays.children.length;
    for (let day = 1; day <= remainingDays; day++) {
        const dayEl = createDayElement(day, true);
        calendarDays.appendChild(dayEl);
    }

    renderEvents();
}

function createDayElement(day, isOtherMonth, isToday = false, isSelected = false, hasEvents = false) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    if (isOtherMonth) div.classList.add('other-month');
    if (isToday) div.classList.add('today');
    if (isSelected) div.classList.add('selected');
    if (hasEvents) div.classList.add('has-events');
    div.textContent = day;
    return div;
}

function selectDate(date) {
    selectedDate = date;
    renderCalendar();
}

window.previousMonth = function() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

window.nextMonth = function() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

// ============================
// EVENTS RENDERING (Identique)
// ============================

function renderEvents() {
    const timeline = document.getElementById('eventsTimeline');
    const todayActivities = activities.filter(a => isSameDay(a.date, selectedDate));

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    document.getElementById('contentTitle').textContent =
        isToday ? 'Aujourd\'hui' : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    document.getElementById('contentSubtitle').textContent =
        todayActivities.length === 0 ? 'Aucune activité prévue' :
        `${todayActivities.length} activité${todayActivities.length > 1 ? 's' : ''}`;

    if (todayActivities.length === 0) {
        timeline.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <div class="empty-state-text">Aucune activité ce jour</div>
                <div class="empty-state-hint">Cliquez sur + pour ajouter une activité</div>
            </div>
        `;
        return;
    }

    todayActivities.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

    timeline.innerHTML = `
        <div class="day-section">
            <div class="day-header">${selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            ${todayActivities.map((activity, index) => renderEventCard(activity, index === 0)).join('')}
        </div>
    `;
}

function renderEventCard(activity, isFirst) {
    const cat = CATEGORIES[activity.category];
    const time = activity.time ? activity.time.substring(0, 5) : 'Journée';
    const endTime = activity.time && activity.duration ?
        calculateEndTime(activity.time, activity.duration) : null;

    return `
        <div class="event-card ${activity.category} ${isFirst ? 'first-of-day' : ''}" onclick="editActivity('${activity.id}')">
            <div class="event-time">${time}${endTime ? ' - ' + endTime : ''}</div>
            <div class="event-title">
                <span>${cat.icon}</span>
                <span>${activity.title}</span>
            </div>
            ${activity.location ? `<div class="event-location">📍 ${activity.location}</div>` : ''}
            <div class="event-meta">
                ${activity.duration ? `<div class="event-badge">⏱️ ${activity.duration}h</div>` : ''}
            </div>
            ${activity.travelers?.length ? `
                <div class="event-travelers">
                    ${activity.travelers.map(t => `<div class="traveler-badge">${t}</div>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (duration * 60);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

// ============================
// PROJECTS (Supabase)
// ============================

function renderProjects() {
    const dropdown = document.getElementById('projectDropdown');
    const currentProj = projects.find(p => p.id === currentProject);

    document.getElementById('currentProjectName').textContent = currentProj ? currentProj.name : 'Mes Projets';

    dropdown.innerHTML = projects.map(p => {
        const count = activities.filter(a => a.project_id === p.id).length;
        return `
            <div class="project-item ${p.id === currentProject ? 'active' : ''}" onclick="selectProject('${p.id}')">
                <div>
                    <div class="project-item-name">${p.name}</div>
                    <div class="project-item-count">${count} activité${count > 1 ? 's' : ''}</div>
                </div>
                <div class="project-actions" onclick="event.stopPropagation()">
                    <button class="project-action-btn" onclick="editProject('${p.id}')">✏️</button>
                    ${projects.length > 1 ? `<button class="project-action-btn delete" onclick="deleteProjectConfirm('${p.id}')">🗑️</button>` : ''}
                </div>
            </div>
        `;
    }).join('') + `
        <button class="project-add" onclick="openProjectModal()">
            <span>➕</span>
            <span>Nouveau voyage</span>
        </button>
    `;
}

window.toggleProjectDropdown = function() {
    document.getElementById('projectDropdown').classList.toggle('show');
};

window.selectProject = async function(id) {
    currentProject = id;
    window.toggleProjectDropdown();

    // Recharger les données du nouveau projet
    try {
        activities = await getActivities(currentProject);
        dayRegions = await getDayRegions(currentProject);
        renderProjects();
        renderCalendar();
        if (currentView === 'planning') {
            renderPlanningView();
        }
    } catch (error) {
        console.error('Select project error:', error);
        alert('Erreur de chargement du projet : ' + error.message);
    }
};

window.openProjectModal = function() {
    editingProjectId = null;
    document.getElementById('projectModalTitle').textContent = 'Nouveau voyage';
    document.getElementById('projectName').value = '';
    document.getElementById('projectDescription').value = '';
    document.getElementById('projectTravelers').value = '';
    document.getElementById('projectModal').classList.add('show');
};

window.editProject = function(id) {
    editingProjectId = id;
    const project = projects.find(p => p.id === id);
    document.getElementById('projectModalTitle').textContent = 'Modifier le voyage';
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectTravelers').value = (project.travelers || []).join(', ');
    document.getElementById('projectModal').classList.add('show');
};

window.closeProjectModal = function() {
    document.getElementById('projectModal').classList.remove('show');
};

window.saveProject = async function() {
    const name = document.getElementById('projectName').value.trim();
    if (!name) return alert('Le nom est obligatoire');

    const travelers = document.getElementById('projectTravelers').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

    try {
        if (editingProjectId) {
            await updateProject(editingProjectId, {
                name,
                description: document.getElementById('projectDescription').value.trim(),
                travelers
            });
        } else {
            await createProject({
                name,
                description: document.getElementById('projectDescription').value.trim(),
                travelers
            });
        }

        await loadData();
        renderProjects();
        window.closeProjectModal();
    } catch (error) {
        console.error('Save project error:', error);
        alert('Erreur de sauvegarde : ' + error.message);
    }
};

window.deleteProjectConfirm = async function(id) {
    if (projects.length === 1) {
        alert('Vous ne pouvez pas supprimer votre dernier projet');
        return;
    }

    const project = projects.find(p => p.id === id);
    if (confirm(`Supprimer "${project.name}" et toutes ses activités ?`)) {
        try {
            await deleteProject(id);
            if (currentProject === id) {
                currentProject = projects.find(p => p.id !== id).id;
            }
            await loadData();
            renderProjects();
            renderCalendar();
        } catch (error) {
            console.error('Delete project error:', error);
            alert('Erreur de suppression : ' + error.message);
        }
    }
};

// ============================
// ACTIVITIES (Supabase)
// ============================

window.openActivityModal = function() {
    editingActivity = null;
    currentAttachments = [];
    document.getElementById('modalTitle').textContent = 'Nouvelle activité';
    document.getElementById('activityForm').reset();

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    document.getElementById('activityDate').value = `${year}-${month}-${day}`;

    document.getElementById('deleteBtn').style.display = 'none';
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-category="activite"]').classList.add('active');
    document.getElementById('attachmentList').innerHTML = '';
    document.getElementById('activityModal').classList.add('show');
};

window.editActivity = async function(id) {
    editingActivity = activities.find(a => a.id === id);
    currentAttachments = [];

    // TODO: Charger les attachments depuis Supabase
    // currentAttachments = await getAttachments(id);

    document.getElementById('modalTitle').textContent = 'Modifier l\'activité';
    document.getElementById('activityTitle').value = editingActivity.title;
    document.getElementById('activityDate').value = editingActivity.date;
    document.getElementById('activityTime').value = editingActivity.time || '';
    document.getElementById('activityDuration').value = editingActivity.duration || 1;
    document.getElementById('activityTravelers').value = (editingActivity.travelers || []).join(', ');
    document.getElementById('activityLocation').value = editingActivity.location || '';
    document.getElementById('activityUrl').value = editingActivity.url || '';
    document.getElementById('activityNotes').value = editingActivity.notes || '';

    window.selectCategory(editingActivity.category);
    renderAttachments();

    document.getElementById('deleteBtn').style.display = 'block';
    document.getElementById('activityModal').classList.add('show');
};

window.closeActivityModal = function() {
    document.getElementById('activityModal').classList.remove('show');
};

window.selectCategory = function(category) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
};

window.handleFiles = function(files) {
    Array.from(files).forEach(file => {
        currentAttachments.push(file);
        renderAttachments();
    });
};

function renderAttachments() {
    const list = document.getElementById('attachmentList');
    list.innerHTML = currentAttachments.map((att, idx) => `
        <div class="attachment-item">
            <span class="attachment-icon">📎</span>
            <span class="attachment-name">${att.name || att.filename}</span>
            <button class="attachment-remove" onclick="removeAttachment(${idx})">✕</button>
        </div>
    `).join('');
}

window.removeAttachment = function(index) {
    currentAttachments.splice(index, 1);
    renderAttachments();
};

window.saveActivity = async function() {
    const title = document.getElementById('activityTitle').value.trim();
    const date = document.getElementById('activityDate').value;

    if (!title || !date) {
        alert('Le titre et la date sont obligatoires');
        return;
    }

    const category = document.querySelector('.category-btn.active').dataset.category;
    const travelers = document.getElementById('activityTravelers').value
        .split(',')
        .map(t => t.trim())
        .filter(t => t);

    const activityData = {
        project_id: currentProject,
        title,
        date,
        time: document.getElementById('activityTime').value || null,
        duration: parseFloat(document.getElementById('activityDuration').value) || null,
        category,
        travelers,
        location: document.getElementById('activityLocation').value.trim(),
        url: document.getElementById('activityUrl').value.trim(),
        notes: document.getElementById('activityNotes').value.trim()
    };

    try {
        if (editingActivity) {
            await updateActivity(editingActivity.id, activityData);
        } else {
            const newActivity = await createActivity(activityData);

            // Upload des fichiers si nouveaux attachments
            for (const file of currentAttachments) {
                if (file instanceof File) {
                    await uploadAttachment(newActivity.id, currentProject, file);
                }
            }
        }

        activities = await getActivities(currentProject);
        renderCalendar();
        if (currentView === 'planning') {
            renderPlanningView();
        }
        window.closeActivityModal();
    } catch (error) {
        console.error('Save activity error:', error);
        alert('Erreur de sauvegarde : ' + error.message);
    }
};

window.deleteCurrentActivity = async function() {
    if (confirm('Supprimer cette activité ?')) {
        try {
            await deleteActivity(editingActivity.id);
            activities = await getActivities(currentProject);
            renderCalendar();
            if (currentView === 'planning') {
                renderPlanningView();
            }
            window.closeActivityModal();
        } catch (error) {
            console.error('Delete activity error:', error);
            alert('Erreur de suppression : ' + error.message);
        }
    }
};

// ============================
// PLANNING VIEW (Identique avec Supabase pour les régions)
// ============================

let currentView = 'timeline';
let currentDisplayYear = new Date().getFullYear();

window.switchView = function(view) {
    currentView = view;

    document.querySelectorAll('.view-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.view-tab').forEach(tab => {
        if ((view === 'timeline' && tab.textContent.includes('Calendrier')) ||
            (view === 'planning' && tab.textContent.includes('Planning'))) {
            tab.classList.add('active');
        }
    });

    const sidebarContent = document.querySelector('.sidebar-content');
    const timelineContainer = document.getElementById('timelineContainer');
    const planningView = document.getElementById('planningView');
    const contentTitle = document.getElementById('contentTitle');
    const contentSubtitle = document.getElementById('contentSubtitle');

    if (view === 'timeline') {
        if (timelineContainer) timelineContainer.style.display = 'block';
        if (planningView) planningView.style.display = 'none';
        if (contentTitle) contentTitle.style.display = 'block';
        if (contentSubtitle) contentSubtitle.style.display = 'block';
        if (sidebarContent) sidebarContent.style.display = 'block';
    } else {
        if (timelineContainer) timelineContainer.style.display = 'none';
        if (planningView) planningView.style.display = 'block';
        if (contentTitle) contentTitle.style.display = 'none';
        if (contentSubtitle) contentSubtitle.style.display = 'none';
        if (sidebarContent) sidebarContent.style.display = 'none';
        renderPlanningView();
    }
};

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

window.changeYear = function(delta) {
    currentDisplayYear += delta;
    renderPlanningView();
    document.getElementById('planningView').scrollTop = 0;
};

// Sauvegarde des régions par jour (Supabase)
window.saveDayRegionToDb = async function(dayKey, value) {
    try {
        await saveDayRegion(currentProject, dayKey, value);
        dayRegions[dayKey] = value;
    } catch (error) {
        console.error('Save region error:', error);
    }
};

function renderPlanningView() {
    const yearToDisplay = currentDisplayYear;
    document.getElementById('currentYearDisplay').textContent = yearToDisplay;

    const firstDayOfYear = new Date(yearToDisplay, 0, 1);
    const lastDayOfYear = new Date(yearToDisplay, 11, 31);

    const firstWeekStart = getWeekStart(firstDayOfYear);
    const lastWeekStart = getWeekStart(lastDayOfYear);

    const weeks = [];
    let currentWeek = new Date(firstWeekStart);

    while (currentWeek <= lastWeekStart) {
        weeks.push(new Date(currentWeek));
        currentWeek.setDate(currentWeek.getDate() + 7);
    }

    const weeksHTML = weeks.map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        const weekNumber = getWeekNumber(weekStart);

        let weekTitle;
        if (weekStart.getMonth() === weekEnd.getMonth()) {
            weekTitle = `${weekStart.getDate()} - ${weekEnd.getDate()} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
        } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
            weekTitle = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;
        } else {
            weekTitle = `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]} ${weekStart.getFullYear()} - ${weekEnd.getDate()} ${monthNames[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
        }

        const today = new Date();
        const isCurrentWeek = weekStart <= today && weekEnd >= today;

        const daysHTML = Array.from({length: 7}, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);

            const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            const dayName = dayNames[date.getDay()];
            const dayNumber = date.getDate();

            const isToday = date.toDateString() === today.toDateString();

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dayKey = `${year}-${month}-${day}`;
            const savedRegion = dayRegions[dayKey] || '';

            const dayActivities = activities.filter(a => isSameDay(a.date, date));
            dayActivities.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

            const activitiesHTML = dayActivities.length === 0
                ? '<div class="planning-empty">-</div>'
                : dayActivities.map(a => renderPlanningActivity(a)).join('');

            return `
                <div class="day-column">
                    <div class="day-header">
                        <div class="day-name">${dayName}</div>
                        <div class="day-number ${isToday ? 'today' : ''}">${dayNumber}</div>
                        <input
                            type="text"
                            class="day-region-input"
                            placeholder="📍 Lieu..."
                            value="${savedRegion}"
                            onchange="saveDayRegionToDb('${dayKey}', this.value)"
                        >
                    </div>
                    <div class="day-content">
                        ${activitiesHTML}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="week-card" id="week-${weekNumber}" ${isCurrentWeek ? 'data-current-week="true"' : ''}>
                <div class="week-card-header">
                    <div class="week-title">
                        <span>📅</span>
                        <span>${weekTitle}</span>
                    </div>
                    <span class="week-number-badge">S${weekNumber}</span>
                </div>
                <div class="week-days-grid">
                    ${daysHTML}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('weeksContainer').innerHTML = weeksHTML;

    // Smart scroll
    setTimeout(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let targetWeek = null;

        if (activities.length > 0) {
            const dates = activities.map(a => {
                const d = new Date(a.date);
                d.setHours(0, 0, 0, 0);
                return d;
            });
            const firstActivityDate = new Date(Math.min(...dates));

            if (today < firstActivityDate) {
                const firstWeekStart = getWeekStart(firstActivityDate);
                const firstWeekNumber = getWeekNumber(firstWeekStart);
                targetWeek = document.getElementById(`week-${firstWeekNumber}`);
            } else {
                targetWeek = document.querySelector('[data-current-week="true"]');
            }
        } else {
            targetWeek = document.querySelector('[data-current-week="true"]');
        }

        if (targetWeek) {
            targetWeek.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

function renderPlanningActivity(activity) {
    const cat = CATEGORIES[activity.category];
    const time = activity.time ? activity.time.substring(0, 5) : '';

    return `
        <div class="planning-activity ${activity.category}" onclick="editActivity('${activity.id}')">
            <div class="planning-activity-title">
                <span>${cat.icon}</span>
                <span>${activity.title}</span>
            </div>
            ${time ? `<div class="planning-activity-time">${time}</div>` : ''}
            ${activity.location ? `<div class="planning-activity-location">${activity.location}</div>` : ''}
        </div>
    `;
}

// ============================
// INIT
// ============================

// Listen to auth state changes
onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event);

    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        await showApp();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appContainer').classList.remove('show');
        document.getElementById('addBtn').style.display = 'none';
    }
});

// Check auth on page load
checkAuth();
