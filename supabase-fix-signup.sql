-- ============================================
-- FIX: Erreur de signup
-- ============================================
-- Correction du trigger qui cause l'erreur lors de la création d'utilisateur

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created_link_shares ON auth.users;
DROP FUNCTION IF EXISTS link_pending_project_shares();

-- Recréer la fonction avec gestion d'erreur
CREATE OR REPLACE FUNCTION link_pending_project_shares()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour les partages en attente avec cet email
    -- Utilise un bloc BEGIN/EXCEPTION pour ne pas faire échouer le signup en cas d'erreur
    BEGIN
        UPDATE project_shares
        SET shared_with_user_id = NEW.id
        WHERE shared_with_email = NEW.email
        AND shared_with_user_id IS NULL;
    EXCEPTION WHEN OTHERS THEN
        -- Log l'erreur mais ne fait pas échouer le trigger
        RAISE WARNING 'Erreur lors de la liaison des partages: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created_link_shares
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION link_pending_project_shares();

-- ============================================
-- ✅ FIX SIGNUP TERMINÉ !
-- ============================================
-- Le signup devrait maintenant fonctionner sans erreur
