-- SOLUTION TEMPORAIRE : Désactiver RLS si vous avez des problèmes d'affichage
-- Exécutez ceci SEULEMENT si aucune recette ne s'affiche après avoir activé RLS

ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;

-- Note: Vous pourrez réactiver RLS plus tard après avoir configuré les profiles:
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
