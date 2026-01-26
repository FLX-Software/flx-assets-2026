-- ============================================================
-- FIX: Erstelle fehlende Profile für bestehende Auth-Users
-- ============================================================
-- Dieses Script erstellt Profile für alle Auth-Users, die noch kein Profil haben

INSERT INTO public.profiles (id, full_name)
SELECT 
  id,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    email
  ) as full_name
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Zeige Ergebnis
SELECT 
  '✅ Fehlende Profile erstellt' as status,
  COUNT(*) as anzahl_erstellt
FROM public.profiles p
WHERE p.id IN (
  SELECT id FROM auth.users 
  WHERE id NOT IN (SELECT id FROM public.profiles WHERE id = p.id)
);
