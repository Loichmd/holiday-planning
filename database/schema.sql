-- ============================
-- SCHEMA DATABASE PLANNING VACANCES
-- Compatible Supabase PostgreSQL
-- ============================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- TABLE: users
-- Gérée automatiquement par Supabase Auth
-- On ajoute juste une table profiles pour les données custom
-- ============================

CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger pour auto-créer un profil quand un user se crée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================
-- TABLE: projects (Voyages)
-- ============================

CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    travelers TEXT[], -- Array de noms de voyageurs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_projects_owner ON projects(owner_id);


-- ============================
-- TABLE: project_shares (Partage de projets)
-- Pour permettre le partage entre utilisateurs
-- ============================

CREATE TYPE share_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE project_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    role share_role DEFAULT 'viewer' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id) -- Un user ne peut avoir qu'un seul rôle par projet
);

-- Index pour performances
CREATE INDEX idx_shares_project ON project_shares(project_id);
CREATE INDEX idx_shares_user ON project_shares(user_id);


-- ============================
-- TABLE: activities (Activités)
-- ============================

CREATE TYPE activity_category AS ENUM ('activite', 'avion', 'hotel', 'restaurant');

CREATE TABLE activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    duration NUMERIC(4,2), -- Ex: 2.5 heures
    category activity_category DEFAULT 'activite' NOT NULL,
    location TEXT,
    url TEXT,
    notes TEXT,
    travelers TEXT[], -- Array de noms de voyageurs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_activities_project ON activities(project_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_project_date ON activities(project_id, date);


-- ============================
-- TABLE: activity_attachments (Pièces jointes)
-- Migration de base64 → Supabase Storage
-- ============================

CREATE TABLE activity_attachments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Chemin dans Supabase Storage: projects/{projectId}/activities/{activityId}/{filename}
    file_type TEXT, -- MIME type (application/pdf, image/jpeg, etc.)
    file_size BIGINT, -- Taille en bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_attachments_activity ON activity_attachments(activity_id);


-- ============================
-- TABLE: day_regions (Régions par jour)
-- Stockage des lieux/étapes par date
-- ============================

CREATE TABLE day_regions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    region TEXT NOT NULL, -- Nom de la ville/région/étape
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, date) -- Une seule région par jour par projet
);

-- Index pour performances
CREATE INDEX idx_regions_project ON day_regions(project_id);
CREATE INDEX idx_regions_date ON day_regions(date);
CREATE INDEX idx_regions_project_date ON day_regions(project_id, date);


-- ============================
-- ROW LEVEL SECURITY (RLS)
-- Sécurité des données par utilisateur
-- ============================

-- Enable RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_regions ENABLE ROW LEVEL SECURITY;


-- POLICIES: profiles
-- Les users peuvent voir et modifier uniquement leur propre profil

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);


-- POLICIES: projects
-- Les users peuvent voir leurs projets OU les projets partagés avec eux

CREATE POLICY "Users can view own projects or shared projects"
    ON projects FOR SELECT
    USING (
        owner_id = auth.uid()
        OR id IN (
            SELECT project_id FROM project_shares WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create projects"
    ON projects FOR INSERT
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (owner_id = auth.uid());


-- POLICIES: project_shares
-- Les owners peuvent gérer les partages de leurs projets

CREATE POLICY "Users can view shares of their projects"
    ON project_shares FOR SELECT
    USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Owners can create shares"
    ON project_shares FOR INSERT
    WITH CHECK (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

CREATE POLICY "Owners can update shares"
    ON project_shares FOR UPDATE
    USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

CREATE POLICY "Owners can delete shares"
    ON project_shares FOR DELETE
    USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );


-- POLICIES: activities
-- Les users peuvent gérer les activités de leurs projets ou projets partagés (selon rôle)

CREATE POLICY "Users can view activities of accessible projects"
    ON activities FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create activities in accessible projects"
    ON activities FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Users can update activities in accessible projects"
    ON activities FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Users can delete activities in accessible projects"
    ON activities FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );


-- POLICIES: activity_attachments
-- Suivent les mêmes règles que les activities

CREATE POLICY "Users can view attachments of accessible activities"
    ON activity_attachments FOR SELECT
    USING (
        activity_id IN (
            SELECT id FROM activities WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_shares WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create attachments in accessible activities"
    ON activity_attachments FOR INSERT
    WITH CHECK (
        activity_id IN (
            SELECT id FROM activities WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_shares
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );

CREATE POLICY "Users can delete attachments in accessible activities"
    ON activity_attachments FOR DELETE
    USING (
        activity_id IN (
            SELECT id FROM activities WHERE project_id IN (
                SELECT id FROM projects WHERE owner_id = auth.uid()
                UNION
                SELECT project_id FROM project_shares
                WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
            )
        )
    );


-- POLICIES: day_regions
-- Suivent les mêmes règles que les activities

CREATE POLICY "Users can view regions of accessible projects"
    ON day_regions FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create regions in accessible projects"
    ON day_regions FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Users can update regions in accessible projects"
    ON day_regions FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Users can delete regions in accessible projects"
    ON day_regions FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE owner_id = auth.uid()
            UNION
            SELECT project_id FROM project_shares
            WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
        )
    );


-- ============================
-- TRIGGERS: updated_at
-- Auto-update des timestamps
-- ============================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_day_regions_updated_at BEFORE UPDATE ON day_regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================
-- SUPABASE STORAGE BUCKETS
-- Configuration pour les fichiers
-- ============================

-- À exécuter dans Supabase UI ou via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('activity-attachments', 'activity-attachments', false);

-- Policy pour le storage (à ajouter dans Supabase UI → Storage → Policies):
-- Lecture: Tous les users ayant accès au projet
-- Écriture: Editors et owners du projet
