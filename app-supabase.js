// ============================================
// HOLIDAY PLANNING - SUPABASE INTEGRATION
// ============================================
// Ce fichier gère toute l'intégration avec Supabase :
// - Authentification email/password
// - Gestion des projets et activités
// - Partage de projets
// - Upload de fichiers vers Storage

// ============================================
// INITIALISATION SUPABASE CLIENT
// ============================================

const { createClient } = supabase;

const supabaseClient = createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    SUPABASE_CONFIG.options
);

// ============================================
// VARIABLES GLOBALES
// ============================================

let currentUser = null;
let projects = [];
let activities = [];
let currentProject = null;

// ============================================
// AUTHENTIFICATION
// ============================================

/**
 * Inscription d'un nouvel utilisateur
 */
async function signup(email, password) {
    try {
        // Validation
        if (!email || !password) {
            throw new Error('Email et mot de passe requis');
        }

        if (password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }

        // Signup via Supabase
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (error) throw error;

        return { success: true, data };

    } catch (error) {
        console.error('Erreur signup:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Connexion d'un utilisateur existant
 */
async function login(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email et mot de passe requis');
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        currentUser = data.user;
        return { success: true, user: data.user };

    } catch (error) {
        console.error('Erreur login:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Déconnexion
 */
async function logout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        currentUser = null;
        projects = [];
        activities = [];

        return { success: true };

    } catch (error) {
        console.error('Erreur logout:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Vérifier la session au chargement
 */
async function checkSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (session) {
            currentUser = session.user;
            return { success: true, user: session.user };
        }

        return { success: false };

    } catch (error) {
        console.error('Erreur checkSession:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// GESTION DES PROJETS
// ============================================

/**
 * Charger tous les projets (propres + partagés)
 */
async function loadProjects() {
    try {
        // Utiliser la fonction SQL qui charge les projets propres + partagés
        const { data, error } = await supabaseClient
            .rpc('get_all_user_projects');

        if (error) throw error;

        projects = data || [];
        return { success: true, projects };

    } catch (error) {
        console.error('Erreur loadProjects:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Créer un nouveau projet
 */
async function createProject(name, description, travelers) {
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .insert({
                user_id: currentUser.id,
                name,
                description: description || '',
                travelers: travelers || []
            })
            .select()
            .single();

        if (error) throw error;

        projects.push(data);
        return { success: true, project: data };

    } catch (error) {
        console.error('Erreur createProject:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour un projet
 */
async function updateProject(projectId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;

        // Mettre à jour dans le cache local
        const index = projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...data };
        }

        return { success: true, project: data };

    } catch (error) {
        console.error('Erreur updateProject:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer un projet
 */
async function deleteProject(projectId) {
    try {
        const { error } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (error) throw error;

        projects = projects.filter(p => p.id !== projectId);
        return { success: true };

    } catch (error) {
        console.error('Erreur deleteProject:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// PARTAGE DE PROJETS
// ============================================

/**
 * Partager un projet avec un utilisateur
 */
async function shareProject(projectId, email, permission = 'read') {
    try {
        // Utiliser la fonction SQL qui gère les permissions correctement
        const { data, error } = await supabaseClient
            .rpc('share_project_as_collaborator', {
                p_project_id: projectId,
                p_shared_with_email: email,
                p_permission: permission
            });

        if (error) throw error;

        return { success: true, share: { id: data } };

    } catch (error) {
        console.error('Erreur shareProject:', error);

        if (error.message.includes('duplicate')) {
            return { success: false, error: 'Déjà partagé avec cet utilisateur' };
        }

        return { success: false, error: error.message };
    }
}

/**
 * Charger les partages d'un projet
 */
async function loadProjectShares(projectId) {
    try {
        const { data, error } = await supabaseClient
            .from('project_shares')
            .select('*')
            .eq('project_id', projectId);

        if (error) throw error;

        return { success: true, shares: data || [] };

    } catch (error) {
        console.error('Erreur loadProjectShares:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer un partage
 */
async function removeProjectShare(shareId) {
    try {
        // Utiliser la fonction SQL qui gère les permissions correctement
        const { data, error } = await supabaseClient
            .rpc('remove_project_share_as_collaborator', {
                p_share_id: shareId
            });

        if (error) throw error;

        return { success: true };

    } catch (error) {
        console.error('Erreur removeProjectShare:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Vérifier si l'utilisateur est le propriétaire du projet
 */
function isProjectOwner(projectId) {
    if (!currentUser) return false;
    const project = projects.find(p => p.id === projectId);
    return project && project.user_id === currentUser.id;
}

/**
 * Vérifier si l'utilisateur peut modifier un projet
 */
async function canEditProject(projectId) {
    if (!currentUser) return false;

    try {
        // Vérifier si propriétaire
        if (isProjectOwner(projectId)) {
            return true;
        }

        // Vérifier si collaborateur avec permission 'write'
        const { data, error } = await supabaseClient
            .from('project_shares')
            .select('permission')
            .eq('project_id', projectId)
            .or(`shared_with_user_id.eq.${currentUser.id},shared_with_email.eq.${currentUser.email}`)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erreur canEditProject:', error);
            return false;
        }

        return data && data.permission === 'write';

    } catch (error) {
        console.error('Erreur canEditProject:', error);
        return false;
    }
}

// ============================================
// GESTION DES ACTIVITÉS
// ============================================

/**
 * Charger les activités d'un projet
 */
async function loadActivities(projectId) {
    try {
        const { data, error } = await supabaseClient
            .from('activities')
            .select('*')
            .eq('project_id', projectId)
            .order('date', { ascending: true });

        if (error) throw error;

        // Convertir snake_case (Supabase) vers camelCase (app)
        activities = (data || []).map(activity => ({
            ...activity,
            projectId: activity.project_id  // Ajouter projectId pour compatibilité
        }));

        return { success: true, activities };

    } catch (error) {
        console.error('Erreur loadActivities:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Créer une activité
 */
async function createActivity(activityData) {
    try {
        const { data, error } = await supabaseClient
            .from('activities')
            .insert(activityData)
            .select()
            .single();

        if (error) throw error;

        // Convertir pour compatibilité
        const activity = { ...data, projectId: data.project_id };
        activities.push(activity);
        return { success: true, activity };

    } catch (error) {
        console.error('Erreur createActivity:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Mettre à jour une activité
 */
async function updateActivity(activityId, updates) {
    try {
        const { data, error } = await supabaseClient
            .from('activities')
            .update(updates)
            .eq('id', activityId)
            .select()
            .single();

        if (error) throw error;

        // Convertir pour compatibilité
        const activity = { ...data, projectId: data.project_id };

        const index = activities.findIndex(a => a.id === activityId);
        if (index !== -1) {
            activities[index] = { ...activities[index], ...activity };
        }

        return { success: true, activity };

    } catch (error) {
        console.error('Erreur updateActivity:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer une activité
 */
async function deleteActivity(activityId) {
    try {
        const { error } = await supabaseClient
            .from('activities')
            .delete()
            .eq('id', activityId);

        if (error) throw error;

        activities = activities.filter(a => a.id !== activityId);
        return { success: true };

    } catch (error) {
        console.error('Erreur deleteActivity:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// GESTION DES FICHIERS (STORAGE)
// ============================================

/**
 * Uploader un fichier vers Supabase Storage
 */
async function uploadFile(file, activityId) {
    try {
        // Valider le fichier
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Créer le chemin du fichier : {user_id}/{activity_id}_{timestamp}_{filename}
        const timestamp = Date.now();
        const fileName = `${currentUser.id}/${activityId}_${timestamp}_${file.name}`;

        // Upload vers Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        return { success: true, path: data.path };

    } catch (error) {
        console.error('Erreur uploadFile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtenir l'URL d'un fichier
 */
function getFileUrl(filePath) {
    const { data } = supabaseClient.storage
        .from('attachments')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Télécharger un fichier
 */
async function downloadFile(filePath) {
    try {
        const { data, error } = await supabaseClient.storage
            .from('attachments')
            .download(filePath);

        if (error) throw error;

        // Créer un lien de téléchargement
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop();
        a.click();

        URL.revokeObjectURL(url);

        return { success: true };

    } catch (error) {
        console.error('Erreur downloadFile:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer un fichier
 */
async function deleteFile(filePath) {
    try {
        const { error } = await supabaseClient.storage
            .from('attachments')
            .remove([filePath]);

        if (error) throw error;

        return { success: true };

    } catch (error) {
        console.error('Erreur deleteFile:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// LISTENER DE CHANGEMENT D'AUTH
// ============================================

// Écouter les changements d'authentification
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);

    if (event === 'SIGNED_IN') {
        currentUser = session.user;
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        projects = [];
        activities = [];
    }
});

// ============================================
// DAY CUSTOMIZATIONS (Label, Location)
// ============================================

/**
 * Load day customizations for a project
 */
async function loadDayCustomizations(projectId) {
    try {
        const { data, error } = await supabaseClient
            .from('day_customizations')
            .select('*')
            .eq('project_id', projectId);

        if (error) throw error;

        // Convert to object keyed by date_key for easy lookup
        const customizations = {};
        (data || []).forEach(item => {
            customizations[item.date_key] = {
                label: item.custom_label,
                location: item.custom_location
            };
        });

        return { success: true, customizations };
    } catch (error) {
        console.error('Erreur loadDayCustomizations:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save/update day customization
 */
async function saveDayCustomization(projectId, dateKey, { label, location }) {
    try {
        const { data, error } = await supabaseClient
            .from('day_customizations')
            .upsert({
                user_id: currentUser.id,
                project_id: projectId,
                date_key: dateKey,
                custom_label: label || null,
                custom_location: location || null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,project_id,date_key'
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Erreur saveDayCustomization:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// GEOCODING FUNCTIONS
// ============================================

/**
 * Géocode une adresse en coordonnées lat/lng
 * Utilise Nominatim (OpenStreetMap) - 100% gratuit, pas de token
 * @param {string} address - Adresse à géocoder
 * @returns {Promise<{success: boolean, coordinates?: {lat: number, lng: number}, error?: string}>}
 */
async function geocodeAddress(address, returnMultiple = false) {
    if (!address || address.trim() === '') {
        return { success: false, error: 'Adresse vide' };
    }

    try {
        // Encoder l'adresse pour l'URL
        const encodedAddress = encodeURIComponent(address.trim());

        // Appel API Nominatim (OpenStreetMap)
        // User-Agent requis par Nominatim
        // Demander 5 résultats pour pouvoir choisir
        const limit = returnMultiple ? 5 : 1;
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=${limit}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'HolidayPlanningApp/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Erreur API Nominatim: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            if (returnMultiple) {
                // Retourner tous les résultats avec leurs détails
                return {
                    success: true,
                    multiple: true,
                    results: data.map(result => ({
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon),
                        display_name: result.display_name,
                        type: result.type,
                        importance: result.importance
                    }))
                };
            } else {
                // Retourner le premier résultat
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                return {
                    success: true,
                    coordinates: { lat, lng },
                    display_name: data[0].display_name
                };
            }
        } else {
            return { success: false, error: 'Adresse introuvable' };
        }
    } catch (error) {
        console.error('Erreur géocodage:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Géocode une activité et met à jour ses coordonnées dans Supabase
 * @param {string} activityId - ID de l'activité
 * @param {string} location - Adresse à géocoder
 * @returns {Promise<{success: boolean, coordinates?: {lat: number, lng: number}, error?: string}>}
 */
async function geocodeActivity(activityId, location) {
    try {
        // Géocoder l'adresse
        const result = await geocodeAddress(location);

        if (!result.success) {
            return result;
        }

        // Mettre à jour l'activité avec les coordonnées
        const { error } = await supabaseClient
            .from('activities')
            .update({
                latitude: result.coordinates.lat,
                longitude: result.coordinates.lng,
                geocoded: true
            })
            .eq('id', activityId);

        if (error) throw error;

        return { success: true, coordinates: result.coordinates };
    } catch (error) {
        console.error('Erreur geocodeActivity:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Géocode toutes les activités d'un projet qui n'ont pas encore été géocodées
 * @param {string} projectId - ID du projet
 * @returns {Promise<{success: boolean, geocoded: number, failed: number}>}
 */
async function geocodeProjectActivities(projectId) {
    try {
        // Récupérer toutes les activités du projet non géocodées avec une location
        const { data: activities, error } = await supabaseClient
            .from('activities')
            .select('id, location')
            .eq('project_id', projectId)
            .not('location', 'is', null)
            .neq('location', '')
            .or('geocoded.is.null,geocoded.eq.false');

        if (error) throw error;

        let geocoded = 0;
        let failed = 0;

        // Géocoder chaque activité (avec délai pour respecter les limites de l'API)
        for (const activity of activities || []) {
            const result = await geocodeActivity(activity.id, activity.location);
            if (result.success) {
                geocoded++;
            } else {
                failed++;
                console.warn(`Échec géocodage pour ${activity.location}:`, result.error);
            }

            // Délai de 100ms entre chaque requête pour éviter rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { success: true, geocoded, failed };
    } catch (error) {
        console.error('Erreur geocodeProjectActivities:', error);
        return { success: false, geocoded: 0, failed: 0, error: error.message };
    }
}
