-- ============================================
-- FIX: Résolution du problème de récursion infinie
-- ============================================
-- Ce script corrige les policies qui causent une récursion infinie

-- ============================================
-- 1. SUPPRIMER TOUTES LES POLICIES PROBLÉMATIQUES
-- ============================================

DROP POLICY IF EXISTS "Users can share if owner or have write permission" ON project_shares;
DROP POLICY IF EXISTS "Users can delete shares if owner, have write permission, or removing themselves" ON project_shares;
DROP POLICY IF EXISTS "Users can update shares if owner or have write permission" ON project_shares;

-- ============================================
-- 2. RECRÉER LES POLICIES SANS RÉCURSION
-- ============================================

-- Policy INSERT : Plus simple - seul le propriétaire peut partager
-- (les collaborateurs avec 'write' pourront via une fonction SQL)
CREATE POLICY "Users can share their own projects"
ON project_shares
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_shares.project_id
        AND projects.user_id = auth.uid()
    )
);

-- Policy DELETE : Supprimer si propriétaire OU c'est son propre partage
CREATE POLICY "Users can delete shares of their projects or remove themselves"
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

-- Policy UPDATE : Seul le propriétaire peut modifier les permissions
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
-- 3. FONCTION POUR PARTAGER (CONTOURNE RLS)
-- ============================================

-- Cette fonction permet aux collaborateurs avec 'write' de partager
-- Elle s'exécute avec les privilèges du propriétaire (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION share_project_as_collaborator(
    p_project_id UUID,
    p_shared_with_email TEXT,
    p_permission TEXT DEFAULT 'read'
)
RETURNS UUID AS $$
DECLARE
    v_share_id UUID;
    v_can_share BOOLEAN;
BEGIN
    -- Vérifier si l'utilisateur peut partager ce projet
    SELECT (
        -- Propriétaire
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = p_project_id
            AND user_id = auth.uid()
        )
        OR
        -- Collaborateur avec permission 'write'
        EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_id = p_project_id
            AND permission = 'write'
            AND (
                shared_with_user_id = auth.uid()
                OR (
                    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                    AND shared_with_user_id IS NULL
                )
            )
        )
    ) INTO v_can_share;

    IF NOT v_can_share THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Créer le partage
    INSERT INTO project_shares (project_id, shared_with_email, shared_by_user_id, permission)
    VALUES (p_project_id, p_shared_with_email, auth.uid(), p_permission)
    RETURNING id INTO v_share_id;

    RETURN v_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FONCTION POUR RETIRER UN COLLABORATEUR
-- ============================================

CREATE OR REPLACE FUNCTION remove_project_share_as_collaborator(
    p_share_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_can_remove BOOLEAN;
    v_project_id UUID;
BEGIN
    -- Récupérer l'ID du projet
    SELECT project_id INTO v_project_id
    FROM project_shares
    WHERE id = p_share_id;

    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Share not found';
    END IF;

    -- Vérifier si l'utilisateur peut retirer ce partage
    SELECT (
        -- Propriétaire du projet
        EXISTS (
            SELECT 1 FROM projects
            WHERE id = v_project_id
            AND user_id = auth.uid()
        )
        OR
        -- Collaborateur avec permission 'write'
        EXISTS (
            SELECT 1 FROM project_shares
            WHERE project_id = v_project_id
            AND permission = 'write'
            AND (
                shared_with_user_id = auth.uid()
                OR (
                    shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
                    AND shared_with_user_id IS NULL
                )
            )
        )
        OR
        -- C'est son propre partage
        EXISTS (
            SELECT 1 FROM project_shares
            WHERE id = p_share_id
            AND (
                shared_with_user_id = auth.uid()
                OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            )
        )
    ) INTO v_can_remove;

    IF NOT v_can_remove THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Supprimer le partage
    DELETE FROM project_shares WHERE id = p_share_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ✅ FIX TERMINÉ !
-- ============================================
-- Les policies sont maintenant plus simples et ne causent plus de récursion.
-- Les collaborateurs avec 'write' peuvent partager via les fonctions SQL :
-- - share_project_as_collaborator()
-- - remove_project_share_as_collaborator()
