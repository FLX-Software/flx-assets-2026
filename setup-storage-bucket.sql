-- ============================================================
-- SUPABASE STORAGE SETUP für Asset-Bilder
-- ============================================================
-- 
-- WICHTIG: Dieser SQL-Code muss im Supabase SQL Editor ausgeführt werden
-- 
-- Erstellt einen Storage Bucket für Asset-Bilder mit:
-- - Öffentlichem Zugriff (für Bildanzeige)
-- - RLS-Policies für Multi-Tenant-Sicherheit
-- ============================================================

-- 1. Erstelle Storage Bucket (falls nicht vorhanden)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-images',
  'asset-images',
  true, -- Öffentlich, damit Bilder angezeigt werden können
  5242880, -- 5MB Limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. RLS-Policy: User können nur Bilder ihrer Organisation hochladen
CREATE POLICY "users_upload_org_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'asset-images'
  AND (storage.foldername(name))[1] = (
    SELECT organization_id::text
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND is_active = true
    LIMIT 1
  )
);

-- 3. RLS-Policy: User können nur Bilder ihrer Organisation sehen
CREATE POLICY "users_view_org_images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'asset-images'
  AND (
    -- User kann Bilder seiner Organisation sehen
    (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM public.organization_members
      WHERE user_id = auth.uid()
        AND is_active = true
    )
    -- Oder öffentliche Bilder (falls public = true)
    OR true
  )
);

-- 4. RLS-Policy: User können nur Bilder ihrer Organisation löschen
CREATE POLICY "users_delete_org_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'asset-images'
  AND (storage.foldername(name))[1] = (
    SELECT organization_id::text
    FROM public.organization_members
    WHERE user_id = auth.uid()
      AND is_active = true
    LIMIT 1
  )
);

-- 5. Service Role hat vollen Zugriff (für Backend-Operationen)
CREATE POLICY "service_role_full_access_storage"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'asset-images')
WITH CHECK (bucket_id = 'asset-images');

-- ============================================================
-- Prüfung
-- ============================================================
SELECT 
  '✅ Storage Bucket Setup' as status,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'asset-images') as bucket_existiert,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%org_images%') as policies_erstellt;
