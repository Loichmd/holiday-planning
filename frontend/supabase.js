// Supabase Client pour Planning Vacances
// Remplace localStorage par Supabase Database

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_CONFIG, AUTH_CONFIG } from './config.js';

// Initialiser le client Supabase
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// ============================
// AUTHENTICATION
// ============================

export async function signInWithOAuth(provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider, // 'google', 'azure' (Microsoft), 'apple'
        options: {
            redirectTo: AUTH_CONFIG.redirectTo
        }
    });

    if (error) {
        console.error('OAuth error:', error);
        throw error;
    }

    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Get user error:', error);
        return null;
    }
    return user;
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// ============================
// PROJECTS
// ============================

export async function getProjects() {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Get projects error:', error);
        throw error;
    }

    return data;
}

export async function createProject(project) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('projects')
        .insert({
            owner_id: user.id,
            name: project.name,
            description: project.description || '',
            travelers: project.travelers || []
        })
        .select()
        .single();

    if (error) {
        console.error('Create project error:', error);
        throw error;
    }

    return data;
}

export async function updateProject(projectId, updates) {
    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

    if (error) {
        console.error('Update project error:', error);
        throw error;
    }

    return data;
}

export async function deleteProject(projectId) {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

    if (error) {
        console.error('Delete project error:', error);
        throw error;
    }
}

// ============================
// ACTIVITIES
// ============================

export async function getActivities(projectId) {
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    if (error) {
        console.error('Get activities error:', error);
        throw error;
    }

    return data;
}

export async function createActivity(activity) {
    const { data, error } = await supabase
        .from('activities')
        .insert(activity)
        .select()
        .single();

    if (error) {
        console.error('Create activity error:', error);
        throw error;
    }

    return data;
}

export async function updateActivity(activityId, updates) {
    const { data, error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', activityId)
        .select()
        .single();

    if (error) {
        console.error('Update activity error:', error);
        throw error;
    }

    return data;
}

export async function deleteActivity(activityId) {
    const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

    if (error) {
        console.error('Delete activity error:', error);
        throw error;
    }
}

// ============================
// ATTACHMENTS
// ============================

export async function uploadAttachment(activityId, projectId, file) {
    // Upload vers Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `projects/${projectId}/activities/${activityId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('activity-attachments')
        .upload(filePath, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
    }

    // Créer l'entrée dans la DB
    const { data, error } = await supabase
        .from('activity_attachments')
        .insert({
            activity_id: activityId,
            filename: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
        })
        .select()
        .single();

    if (error) {
        console.error('Create attachment error:', error);
        throw error;
    }

    return data;
}

export async function getAttachments(activityId) {
    const { data, error } = await supabase
        .from('activity_attachments')
        .select('*')
        .eq('activity_id', activityId);

    if (error) {
        console.error('Get attachments error:', error);
        throw error;
    }

    // Ajouter les URLs publiques
    return data.map(att => ({
        ...att,
        url: supabase.storage.from('activity-attachments').getPublicUrl(att.file_path).data.publicUrl
    }));
}

export async function deleteAttachment(attachmentId, filePath) {
    // Supprimer le fichier du storage
    const { error: storageError } = await supabase.storage
        .from('activity-attachments')
        .remove([filePath]);

    if (storageError) {
        console.error('Delete file error:', storageError);
    }

    // Supprimer l'entrée de la DB
    const { error } = await supabase
        .from('activity_attachments')
        .delete()
        .eq('id', attachmentId);

    if (error) {
        console.error('Delete attachment error:', error);
        throw error;
    }
}

// ============================
// DAY REGIONS
// ============================

export async function getDayRegions(projectId) {
    const { data, error } = await supabase
        .from('day_regions')
        .select('*')
        .eq('project_id', projectId);

    if (error) {
        console.error('Get regions error:', error);
        throw error;
    }

    // Convertir en format objet {date: region}
    return data.reduce((acc, item) => {
        acc[item.date] = item.region;
        return acc;
    }, {});
}

export async function saveDayRegion(projectId, date, region) {
    if (!region || region.trim() === '') {
        // Supprimer si vide
        const { error } = await supabase
            .from('day_regions')
            .delete()
            .eq('project_id', projectId)
            .eq('date', date);

        if (error) {
            console.error('Delete region error:', error);
            throw error;
        }
    } else {
        // Upsert (insert ou update)
        const { error } = await supabase
            .from('day_regions')
            .upsert({
                project_id: projectId,
                date: date,
                region: region.trim()
            }, {
                onConflict: 'project_id,date'
            });

        if (error) {
            console.error('Save region error:', error);
            throw error;
        }
    }
}

// ============================
// MIGRATION (depuis localStorage)
// ============================

export async function migrateFromLocalStorage(userId) {
    const storageKey = `planningVoyages_${userId}`;
    const regionsKey = `planningVoyages_${userId}_regions`;

    const oldData = localStorage.getItem(storageKey);
    const oldRegions = localStorage.getItem(regionsKey);

    if (!oldData) {
        console.log('No data to migrate');
        return { success: false, message: 'No data found' };
    }

    try {
        const { projects, activities } = JSON.parse(oldData);
        const regions = oldRegions ? JSON.parse(oldRegions) : {};

        // Créer les projets
        const projectMap = new Map();

        for (const oldProject of projects) {
            const newProject = await createProject({
                name: oldProject.name,
                description: oldProject.description || '',
                travelers: oldProject.travelers || []
            });

            projectMap.set(oldProject.id, newProject.id);
        }

        // Créer les activités
        for (const oldActivity of activities) {
            const newProjectId = projectMap.get(oldActivity.projectId);
            if (!newProjectId) continue;

            await createActivity({
                project_id: newProjectId,
                title: oldActivity.title,
                date: oldActivity.date,
                time: oldActivity.time || null,
                duration: oldActivity.duration || null,
                category: oldActivity.category,
                location: oldActivity.location || '',
                url: oldActivity.url || '',
                notes: oldActivity.notes || '',
                travelers: oldActivity.travelers || []
            });
        }

        // Créer les régions
        // On associe toutes les régions au premier projet pour simplifier
        const firstProjectId = Array.from(projectMap.values())[0];
        if (firstProjectId) {
            for (const [date, region] of Object.entries(regions)) {
                await saveDayRegion(firstProjectId, date, region);
            }
        }

        // Sauvegarder l'ancien data en backup avant de supprimer
        localStorage.setItem(`${storageKey}_backup`, oldData);
        if (oldRegions) {
            localStorage.setItem(`${regionsKey}_backup`, oldRegions);
        }

        // Supprimer l'ancien data
        localStorage.removeItem(storageKey);
        localStorage.removeItem(regionsKey);

        return {
            success: true,
            message: 'Migration completed successfully',
            projectsCreated: projectMap.size
        };

    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}
