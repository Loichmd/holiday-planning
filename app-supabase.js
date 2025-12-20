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
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

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
        const { data, error } = await supabaseClient
            .from('project_shares')
            .insert({
                project_id: projectId,
                shared_with_email: email,
                shared_by_user_id: currentUser.id,
                permission: permission
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, share: data };

    } catch (error) {
        console.error('Erreur shareProject:', error);

        if (error.code === '23505') {
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
        const { error } = await supabaseClient
            .from('project_shares')
            .delete()
            .eq('id', shareId);

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
