-- ============================================
-- UPDATE: PROJECT SHARING - Collaborateurs
-- ============================================
-- Permet aux collaborateurs avec permission 'write' de :
-- - Ajouter d'autres collaborateurs
-- - Retirer des collaborateurs
-- - Se retirer eux-mêmes d'un projet

-- ============================================
-- 1. MISE À JOUR DES POLICIES project_shares
-- ============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can share their own projects" ON project_shares;
DROP POLICY IF EXISTS "Users can delete shares of their projects" ON project_shares;
DROP POLICY IF EXISTS "Users can update shares of their projects" ON project_shares;

-- Policy INSERT : Créer des partages si propriétaire OU collaborateur avec 'write'
CREATE POLICY "Users can share if owner or have write permission"
ON project_shares
FOR INSERT
WITH CHECK (
    -- Je suis le propriétaire
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
    OR
    -- J'ai la permission 'write' sur ce projet
    EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = project_shares.project_id
        AND ps.permission = 'write'
        AND (
            ps.shared_with_user_id = auth.uid()
            OR (
                ps.shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND ps.shared_with_user_id IS NULL
            )
        )
    )
);

-- Policy DELETE : Supprimer un partage si :
-- 1. Je suis le propriétaire du projet
-- 2. J'ai la permission 'write' sur ce projet
-- 3. C'est mon propre partage (je me retire)
CREATE POLICY "Users can delete shares if owner, have write permission, or removing themselves"
ON project_shares
FOR DELETE
USING (
    -- Je suis le propriétaire du projet
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
    OR
    -- J'ai la permission 'write' sur ce projet
    EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = project_shares.project_id
        AND ps.permission = 'write'
        AND (
            ps.shared_with_user_id = auth.uid()
            OR (
                ps.shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND ps.shared_with_user_id IS NULL
            )
        )
    )
    OR
    -- C'est mon propre partage (je me retire)
    (
        project_shares.shared_with_user_id = auth.uid()
        OR (
            project_shares.shared_with_email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
        )
    )
);

-- Policy UPDATE : Modifier les permissions si propriétaire OU collaborateur avec 'write'
CREATE POLICY "Users can update shares if owner or have write permission"
ON project_shares
FOR UPDATE
USING (
    -- Je suis le propriétaire du projet
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
    OR
    -- J'ai la permission 'write' sur ce projet
    EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = project_shares.project_id
        AND ps.permission = 'write'
        AND (
            ps.shared_with_user_id = auth.uid()
            OR (
                ps.shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND ps.shared_with_user_id IS NULL
            )
        )
    )
)
WITH CHECK (
    -- Même conditions
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM project_shares ps
        WHERE ps.project_id = project_shares.project_id
        AND ps.permission = 'write'
        AND (
            ps.shared_with_user_id = auth.uid()
            OR (
                ps.shared_with_email = (
                    SELECT email FROM auth.users WHERE id = auth.uid()
                )
                AND ps.shared_with_user_id IS NULL
            )
        )
    )
);

-- ============================================
-- ✅ MIGRATION TERMINÉE !
-- ============================================
-- Maintenant les collaborateurs avec permission 'write' peuvent :
-- - Ajouter d'autres collaborateurs au projet
-- - Retirer des collaborateurs
-- - Modifier les permissions des collaborateurs
-- - Se retirer eux-mêmes du projet
--
-- Les collaborateurs avec permission 'read' peuvent uniquement :
-- - Voir le projet et ses activités
-- - Se retirer eux-mêmes du projet
