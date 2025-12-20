-- ============================================
-- RESET COMPLET + FIX
-- ============================================
-- Ce script supprime TOUTES les policies existantes et repart de zéro

-- ============================================
-- 1. SUPPRIMER TOUTES LES POLICIES EXISTANTES
-- ============================================

-- Supprimer TOUTES les policies de project_shares
DROP POLICY IF EXISTS "Users can view shares of their projects or shares with them" ON project_shares;
DROP POLICY IF EXISTS "Users can share if owner or have write permission" ON project_shares;
DROP POLICY IF EXISTS "Users can delete shares if owner, have write permission, or removing themselves" ON project_shares;
DROP POLICY IF EXISTS "Users can update shares if owner or have write permission" ON project_shares;
DROP POLICY IF EXISTS "Users can share their own projects" ON project_shares;
DROP POLICY IF EXISTS "Users can delete shares of their projects or remove themselves" ON project_shares;
DROP POLICY IF EXISTS "Users can update shares of their projects" ON project_shares;
DROP POLICY IF EXISTS "Users can delete shares of their projects" ON project_shares;

-- Supprimer TOUTES les policies de projects
DROP POLICY IF EXISTS "Users can view their own projects or shared projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- ============================================
-- 2. RECRÉER LES POLICIES DE PROJECTS
-- ============================================

-- SELECT : Voir seulement mes propres projets
CREATE POLICY "Users can view their own projects"
ON projects
FOR SELECT
USING (user_id = auth.uid());

-- INSERT : Créer mes propres projets
CREATE POLICY "Users can create their own projects"
ON projects
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE : Modifier mes propres projets
CREATE POLICY "Users can update their own projects"
ON projects
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- DELETE : Supprimer mes propres projets
CREATE POLICY "Users can delete their own projects"
ON projects
FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 3. RECRÉER LES POLICIES DE project_shares
-- ============================================

-- SELECT : Voir les partages de mes projets OU les partages avec moi
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
    -- Le projet est partagé avec moi
    shared_with_user_id = auth.uid()
    OR
    (
        shared_with_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
        AND shared_with_user_id IS NULL
    )
);

-- INSERT : Seul le propriétaire peut partager directement
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

-- DELETE : Supprimer si propriétaire OU c'est son propre partage
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

-- UPDATE : Seul le propriétaire peut modifier les permissions
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
-- 4. SUPPRIMER LES ANCIENNES FONCTIONS
-- ============================================

DROP FUNCTION IF EXISTS get_all_user_projects();
DROP FUNCTION IF EXISTS share_project_as_collaborator(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS remove_project_share_as_collaborator(UUID);

-- ============================================
-- 5. FONCTION POUR CHARGER TOUS LES PROJETS
-- ============================================

CREATE OR REPLACE FUNCTION get_all_user_projects()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    travelers JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_shared BOOLEAN,
    permission TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Mes propres projets
    SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.travelers,
        p.created_at,
        p.updated_at,
        FALSE as is_shared,
        'owner'::TEXT as permission
    FROM projects p
    WHERE p.user_id = auth.uid()

    UNION

    -- Projets partagés avec moi
    SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.travelers,
        p.created_at,
        p.updated_at,
        TRUE as is_shared,
        ps.permission
    FROM projects p
    INNER JOIN project_shares ps ON ps.project_id = p.id
    WHERE (
        ps.shared_with_user_id = auth.uid()
        OR (
            ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND ps.shared_with_user_id IS NULL
        )
    )

    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. FONCTION POUR PARTAGER
-- ============================================

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
-- 7. FONCTION POUR RETIRER UN COLLABORATEUR
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
-- ✅ RESET ET FIX COMPLET TERMINÉ !
-- ============================================
-- Vos projets devraient maintenant s'afficher correctement.
-- Le partage fonctionnera sans erreur de récursion.
