-- ============================================
-- SETUP COMPLET SUPABASE - Holiday Planning
-- ============================================
-- Copiez et collez ce script dans le SQL Editor de Supabase
-- Il créera toutes les tables et configurera la sécurité RLS

-- ============================================
-- 1. CRÉATION DES TABLES
-- ============================================

-- Table des projets/voyages
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    travelers TEXT[], -- Array de noms de voyageurs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des activités
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME,
    duration NUMERIC,
    category TEXT CHECK (category IN ('activite', 'avion', 'hotel', 'restaurant')) NOT NULL,
    travelers TEXT[],
    location TEXT,
    url TEXT,
    notes TEXT,
    attachments JSONB, -- Métadonnées des fichiers
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. INDEX POUR PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);

-- ============================================
-- 3. ACTIVATION ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. POLICIES POUR LA TABLE PROJECTS
-- ============================================

-- Policy : L'utilisateur peut lire ses propres projets
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (auth.uid() = user_id);

-- Policy : L'utilisateur peut créer ses propres projets
CREATE POLICY "Users can create their own projects"
ON projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy : L'utilisateur peut modifier ses propres projets
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy : L'utilisateur peut supprimer ses propres projets
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 5. POLICIES POUR LA TABLE ACTIVITIES
-- ============================================

-- Policy : L'utilisateur peut lire les activités de ses projets
CREATE POLICY "Users can view activities in their projects"
ON activities
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Policy : L'utilisateur peut créer des activités dans ses projets
CREATE POLICY "Users can create activities in their projects"
ON activities
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Policy : L'utilisateur peut modifier les activités de ses projets
CREATE POLICY "Users can update activities in their projects"
ON activities
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Policy : L'utilisateur peut supprimer les activités de ses projets
CREATE POLICY "Users can delete activities in their projects"
ON activities
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = activities.project_id
        AND projects.user_id = auth.uid()
    )
);

-- ============================================
-- 6. FONCTION POUR AUTO-UPDATE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour activities
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ✅ SETUP TERMINÉ !
-- ============================================
-- Vous pouvez maintenant :
-- 1. Configurer l'authentification OAuth (Google, Microsoft, Apple)
-- 2. Tester l'application
-- 3. Vérifier que RLS fonctionne en créant 2 comptes différents
