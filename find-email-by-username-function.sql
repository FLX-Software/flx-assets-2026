-- ============================================================
-- Funktion: Finde E-Mail-Adresse anhand Benutzername
-- ============================================================
-- Diese Funktion sucht die E-Mail-Adresse eines Users anhand seines Benutzernamens.
-- Der Benutzername ist normalerweise der Teil vor dem @ in der E-Mail.
-- 
-- Beispiel: Benutzername "max" -> E-Mail "max@flx-software.de"
-- ============================================================

CREATE OR REPLACE FUNCTION public.find_email_by_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  found_email text;
BEGIN
  -- Suche nach E-Mail, die mit dem Benutzernamen beginnt
  -- z.B. "max" -> "max@flx-software.de"
  SELECT email INTO found_email
  FROM auth.users
  WHERE email LIKE username_input || '@%'
  LIMIT 1;
  
  RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_email_by_username(text) TO authenticated;
