-- ============================================
-- MIGRATION: PROJECT SHARING - Holiday Planning
-- ============================================
-- Ajout de la fonctionnalité de partage de projets
-- Exécutez ce script APRÈS avoir exécuté supabase-setup.sql

-- ============================================
-- 1. TABLE DE PARTAGE (project_shares)
-- ============================================

-- Table pour gérer le partage de projets entre utilisateurs
CREATE TABLE IF NOT EXISTS project_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    shared_with_email TEXT NOT NULL,
    shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    permission TEXT CHECK (permission IN ('read', 'write')) DEFAULT 'read',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Un projet ne peut être partagé qu'une seule fois avec le même email
    UNIQUE(project_id, shared_with_email)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_project_shares_project_id ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_shared_with_user ON project_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_shared_with_email ON project_shares(shared_with_email);

-- ============================================
-- 2. ACTIVER RLS SUR project_shares
-- ============================================

ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLICIES POUR project_shares
-- ============================================

-- Policy : Voir les partages de mes projets OU les projets partagés avec moi
CREATE POLICY "Users can view shares of their projects or shares with them"
ON project_shares
FOR SELECT
USING (
    -- Je suis le propriétaire du projet
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
    OR
    -- Le projet est partagé avec moi (par email ou user_id)
    shared_with_user_id = auth.uid()
    OR
    (
        shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
        AND shared_with_user_id IS NULL
    )
);

-- Policy : Créer des partages pour mes propres projets
CREATE POLICY "Users can share their own projects"
ON project_shares
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
    AND shared_by_user_id = auth.uid()
);

-- Policy : Supprimer les partages de mes projets
CREATE POLICY "Users can delete shares of their projects"
ON project_shares
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Policy : Modifier les partages de mes projets (changer les permissions)
CREATE POLICY "Users can update shares of their projects"
ON project_shares
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
);

-- ============================================
-- 4. MISE À JOUR DES POLICIES PROJECTS
-- ============================================

-- Supprimer l'ancienne policy de lecture
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

-- Nouvelle policy : Voir mes projets OU les projets partagés avec moi
CREATE POLICY "Users can view their own projects or shared projects"
ON projects
FOR SELECT
USING (
    -- Je suis le propriétaire
    user_id = auth.uid()
    OR
    -- Le projet est partagé avec moi
    EXISTS (
        SELECT 1 FROM project_shares
        WHERE project_shares.project_id = projects.id
        AND (
            project_shares.shared_with_user_id = auth.uid()
            OR (
                project_shares.shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND project_shares.shared_with_user_id IS NULL
            )
        )
    )
);

-- ============================================
-- 5. MISE À JOUR DES POLICIES ACTIVITIES
-- ============================================

-- Les anciennes policies pour activities fonctionnent déjà car elles vérifient
-- l'accès via la table projects. Pas besoin de les modifier !

-- ============================================
-- 6. FONCTION HELPER POUR VÉRIFIER LES PERMISSIONS
-- ============================================

-- Fonction pour vérifier si un utilisateur a la permission 'write' sur un projet
CREATE OR REPLACE FUNCTION user_can_write_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        -- L'utilisateur est le propriétaire
        SELECT 1 FROM projects
        WHERE id = project_uuid
        AND user_id = auth.uid()
    ) OR EXISTS (
        -- L'utilisateur a la permission 'write' via un partage
        SELECT 1 FROM project_shares
        WHERE project_id = project_uuid
        AND permission = 'write'
        AND (
            shared_with_user_id = auth.uid()
            OR (
                shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND shared_with_user_id IS NULL
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. MISE À JOUR POLICIES ACTIVITIES AVEC PERMISSIONS
-- ============================================

-- Supprimer les anciennes policies d'INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Users can create activities in their projects" ON activities;
DROP POLICY IF EXISTS "Users can update activities in their projects" ON activities;
DROP POLICY IF EXISTS "Users can delete activities in their projects" ON activities;

-- Nouvelle policy INSERT : Créer des activités si permission 'write'
CREATE POLICY "Users can create activities if they have write permission"
ON activities
FOR INSERT
WITH CHECK (
    user_can_write_project(project_id)
);

-- Nouvelle policy UPDATE : Modifier des activités si permission 'write'
CREATE POLICY "Users can update activities if they have write permission"
ON activities
FOR UPDATE
USING (
    user_can_write_project(project_id)
)
WITH CHECK (
    user_can_write_project(project_id)
);

-- Nouvelle policy DELETE : Supprimer des activités si permission 'write'
CREATE POLICY "Users can delete activities if they have write permission"
ON activities
FOR DELETE
USING (
    user_can_write_project(project_id)
);

-- ============================================
-- 8. FONCTION POUR LIER LES PARTAGES PAR EMAIL
-- ============================================

-- Quand un utilisateur s'inscrit, lier automatiquement les partages
-- qui ont été créés avec son email
CREATE OR REPLACE FUNCTION link_pending_project_shares()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les partages en attente avec cet email
    UPDATE project_shares
    SET shared_with_user_id = NEW.id
    WHERE shared_with_email = NEW.email
    AND shared_with_user_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users (se déclenche après insertion d'un nouvel utilisateur)
DROP TRIGGER IF EXISTS on_auth_user_created_link_shares ON auth.users;
CREATE TRIGGER on_auth_user_created_link_shares
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION link_pending_project_shares();

-- ============================================
-- ✅ MIGRATION TERMINÉE !
-- ============================================
-- Fonctionnalités ajoutées :
-- 1. Table project_shares pour gérer les partages
-- 2. Partage par email (même si l'utilisateur n'existe pas encore)
-- 3. Permissions read/write
-- 4. Liaison automatique quand un utilisateur s'inscrit
-- 5. Policies mises à jour pour respecter les permissions
--
-- Maintenant vous pouvez :
-- - Partager un projet avec un email
-- - Donner permission read (lecture seule) ou write (modification)
-- - Les utilisateurs verront automatiquement les projets partagés avec eux
