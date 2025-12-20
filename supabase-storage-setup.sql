-- ============================================
-- SETUP SUPABASE STORAGE - Holiday Planning
-- ============================================
-- Configuration du bucket pour les pièces jointes
-- Exécutez ce script dans le SQL Editor de Supabase

-- ============================================
-- 1. POLICIES POUR LE BUCKET "attachments"
-- ============================================

-- Policy : Les utilisateurs peuvent uploader des fichiers dans leur propre dossier
-- Format du chemin : {user_id}/{filename}
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy : Les utilisateurs peuvent lire leurs propres fichiers
CREATE POLICY "Users can view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy : Les utilisateurs peuvent mettre à jour leurs propres fichiers
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy : Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- ✅ SETUP STORAGE TERMINÉ !
-- ============================================
-- Structure des fichiers dans le bucket :
-- attachments/
--   ├── {user_id_1}/
--   │   ├── billet-avion.pdf
--   │   └── reservation-hotel.jpg
--   └── {user_id_2}/
--       └── photo-passeport.png
--
-- Chaque utilisateur ne peut accéder qu'à son propre dossier
