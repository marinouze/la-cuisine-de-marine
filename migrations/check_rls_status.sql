-- Vérifier si RLS est activé sur la table recipes
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'recipes';

-- Si RLS est activé, le désactiver :
-- (Décommentez la ligne ci-dessous si besoin)
-- ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
