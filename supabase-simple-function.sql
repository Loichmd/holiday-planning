-- ============================================
-- FONCTION SIMPLIFIÉE - À exécuter seule
-- ============================================
-- Exécutez UNIQUEMENT ce script pour recréer la fonction

DROP FUNCTION IF EXISTS get_all_user_projects();

CREATE OR REPLACE FUNCTION get_all_user_projects()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    description TEXT,
    travelers TEXT[],
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_shared BOOLEAN,
    permission TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    -- Mes propres projets
    SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.travelers,
        p.created_at,
        p.updated_at,
        FALSE,
        'owner'::TEXT
    FROM projects p
    WHERE p.user_id = auth.uid()

    UNION ALL

    -- Projets partagés avec moi
    SELECT
        p.id,
        p.user_id,
        p.name,
        p.description,
        p.travelers,
        p.created_at,
        p.updated_at,
        TRUE,
        ps.permission
    FROM projects p
    INNER JOIN project_shares ps ON ps.project_id = p.id
    WHERE ps.shared_with_user_id = auth.uid()
       OR (ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
           AND ps.shared_with_user_id IS NULL)

    ORDER BY 6 DESC;
$$;

-- ============================================
-- ✅ TEST
-- ============================================
-- Testez la fonction avec cette requête :
-- SELECT * FROM get_all_user_projects();
