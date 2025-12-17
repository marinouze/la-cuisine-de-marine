-- Script de ROLLBACK - À utiliser SEULEMENT en cas de problème
-- Désactive RLS sur toutes les tables

ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags DISABLE ROW LEVEL SECURITY;

-- Note: Gardez ce script sous la main au cas où vous auriez besoin 
-- de revenir en arrière rapidement
