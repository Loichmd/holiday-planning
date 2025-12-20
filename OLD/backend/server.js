import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client (avec service role pour opérations admin)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    abortOnLimit: true
}));

// ============================
// HEALTH CHECK
// ============================

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================
// MIDDLEWARE: Verify Supabase JWT
// ============================

async function verifyAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

// ============================
// UPLOAD ENDPOINT (Optionnel)
// Alternative à l'upload direct depuis le frontend
// ============================

app.post('/api/upload', verifyAuth, async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file;
        const { projectId, activityId } = req.body;

        if (!projectId || !activityId) {
            return res.status(400).json({ error: 'Missing projectId or activityId' });
        }

        // Vérifier que l'user a accès au projet
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .or(`owner_id.eq.${req.user.id},id.in.(select project_id from project_shares where user_id = ${req.user.id})`)
            .single();

        if (projectError || !project) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }

        // Upload vers Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `projects/${projectId}/activities/${activityId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('activity-attachments')
            .upload(filePath, file.data, {
                contentType: file.mimetype,
                cacheControl: '3600'
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({ error: 'Upload failed' });
        }

        // Créer l'entrée dans activity_attachments
        const { data: attachment, error: dbError } = await supabase
            .from('activity_attachments')
            .insert({
                activity_id: activityId,
                filename: file.name,
                file_path: filePath,
                file_type: file.mimetype,
                file_size: file.size
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ error: 'Failed to save attachment metadata' });
        }

        res.json({
            success: true,
            attachment,
            url: supabase.storage.from('activity-attachments').getPublicUrl(filePath).data.publicUrl
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================
// MIGRATION ENDPOINT (Optionnel)
// Pour migrer les données localStorage vers Supabase
// ============================

app.post('/api/migrate', verifyAuth, async (req, res) => {
    try {
        const { projects, activities, regions } = req.body;

        // Créer les projets
        const createdProjects = [];
        for (const project of projects || []) {
            const { data, error } = await supabase
                .from('projects')
                .insert({
                    owner_id: req.user.id,
                    name: project.name,
                    description: project.description || '',
                    travelers: project.travelers || []
                })
                .select()
                .single();

            if (error) {
                console.error('Project migration error:', error);
                continue;
            }

            createdProjects.push({ oldId: project.id, newId: data.id });
        }

        // Créer les activités
        const activitiesMap = new Map(createdProjects.map(p => [p.oldId, p.newId]));

        for (const activity of activities || []) {
            const newProjectId = activitiesMap.get(activity.projectId);
            if (!newProjectId) continue;

            const { error } = await supabase
                .from('activities')
                .insert({
                    project_id: newProjectId,
                    title: activity.title,
                    date: activity.date,
                    time: activity.time || null,
                    duration: activity.duration || null,
                    category: activity.category,
                    location: activity.location || '',
                    url: activity.url || '',
                    notes: activity.notes || '',
                    travelers: activity.travelers || []
                });

            if (error) {
                console.error('Activity migration error:', error);
            }
        }

        // Créer les régions
        for (const [dateKey, region] of Object.entries(regions || {})) {
            // dateKey format: YYYY-MM-DD
            // Trouver le projet associé (on prend le premier pour simplifier)
            const projectId = createdProjects[0]?.newId;
            if (!projectId) continue;

            const { error } = await supabase
                .from('day_regions')
                .insert({
                    project_id: projectId,
                    date: dateKey,
                    region: region
                });

            if (error) {
                console.error('Region migration error:', error);
            }
        }

        res.json({
            success: true,
            message: 'Migration completed',
            projectsCreated: createdProjects.length
        });

    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: 'Migration failed' });
    }
});

// ============================
// BULK OPERATIONS (Optionnel)
// Pour des opérations complexes qui nécessitent plusieurs requêtes
// ============================

app.post('/api/projects/:projectId/duplicate', verifyAuth, async (req, res) => {
    try {
        const { projectId } = req.params;

        // Vérifier accès
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('owner_id', req.user.id)
            .single();

        if (projectError || !project) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Dupliquer le projet
        const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
                owner_id: req.user.id,
                name: `${project.name} (Copie)`,
                description: project.description,
                travelers: project.travelers
            })
            .select()
            .single();

        if (createError) {
            return res.status(500).json({ error: 'Failed to duplicate project' });
        }

        // Dupliquer les activités
        const { data: activities } = await supabase
            .from('activities')
            .select('*')
            .eq('project_id', projectId);

        if (activities && activities.length > 0) {
            const duplicatedActivities = activities.map(a => ({
                project_id: newProject.id,
                title: a.title,
                date: a.date,
                time: a.time,
                duration: a.duration,
                category: a.category,
                location: a.location,
                url: a.url,
                notes: a.notes,
                travelers: a.travelers
            }));

            await supabase.from('activities').insert(duplicatedActivities);
        }

        res.json({ success: true, project: newProject });

    } catch (error) {
        console.error('Duplication error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================
// ERROR HANDLER
// ============================

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ============================
// START SERVER
// ============================

app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║  Planning Vacances Backend Started   ║
    ║  Port: ${PORT}                         ║
    ║  Environment: ${process.env.NODE_ENV || 'development'} ║
    ╚═══════════════════════════════════════╝
    `);
});
