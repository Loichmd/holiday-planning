-- ============================================
-- FIX: Permissions des activités pour les collaborateurs
-- ============================================
-- Permet aux collaborateurs avec permission 'write' de modifier les activités

-- ============================================
-- 1. SUPPRIMER LES ANCIENNES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view activities in their projects" ON activities;
DROP POLICY IF EXISTS "Users can create activities in their projects" ON activities;
DROP POLICY IF EXISTS "Users can update activities in their projects" ON activities;
DROP POLICY IF EXISTS "Users can delete activities in their projects" ON activities;
DROP POLICY IF EXISTS "Users can create activities if they have write permission" ON activities;
DROP POLICY IF EXISTS "Users can update activities if they have write permission" ON activities;
DROP POLICY IF EXISTS "Users can delete activities if they have write permission" ON activities;

-- ============================================
-- 2. CRÉER UNE FONCTION HELPER
-- ============================================

-- Fonction pour vérifier si l'utilisateur peut lire un projet
CREATE OR REPLACE FUNCTION user_can_read_project(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        -- L'utilisateur est le propriétaire
        SELECT 1 FROM projects
        WHERE id = project_uuid
        AND user_id = auth.uid()
    ) OR EXISTS (
        -- L'utilisateur a un partage (read ou write)
        SELECT 1 FROM project_shares
        WHERE project_id = project_uuid
        AND (
            shared_with_user_id = auth.uid()
            OR (
                shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                AND shared_with_user_id IS NULL
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si l'utilisateur peut modifier un projet (déjà existe mais on la recrée)
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
                shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                AND shared_with_user_id IS NULL
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. RECRÉER LES POLICIES POUR activities
-- ============================================

-- SELECT : Voir les activités des projets accessibles (propres + partagés)
CREATE POLICY "Users can view activities in accessible projects"
ON activities
FOR SELECT
USING (
    user_can_read_project(project_id)
);

-- INSERT : Créer des activités si permission 'write'
CREATE POLICY "Users can create activities if they have write permission"
ON activities
FOR INSERT
WITH CHECK (
    user_can_write_project(project_id)
);

-- UPDATE : Modifier des activités si permission 'write'
CREATE POLICY "Users can update activities if they have write permission"
ON activities
FOR UPDATE
USING (
    user_can_write_project(project_id)
)
WITH CHECK (
    user_can_write_project(project_id)
);

-- DELETE : Supprimer des activités si permission 'write'
CREATE POLICY "Users can delete activities if they have write permission"
ON activities
FOR DELETE
USING (
    user_can_write_project(project_id)
);

-- ============================================
-- ✅ FIX TERMINÉ !
-- ============================================
-- Les collaborateurs avec permission 'write' peuvent maintenant :
-- - Voir toutes les activités du projet
-- - Créer de nouvelles activités
-- - Modifier les activités existantes
-- - Supprimer des activités
--
-- Les collaborateurs avec permission 'read' peuvent uniquement :
-- - Voir les activités
