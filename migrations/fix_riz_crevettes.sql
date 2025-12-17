-- Script de diagnostic et réparation pour "Riz aux Crevettes et à la Citronnelle"
-- Ce script va vérifier et corriger le statut et la propriété de la recette

-- 1. DIAGNOSTIC: Vérifier l'état actuel de la recette
SELECT 
    id,
    title,
    status,
    user_id,
    CASE 
        WHEN user_id IS NULL THEN 'Pas de propriétaire'
        ELSE (SELECT email FROM auth.users WHERE id = user_id LIMIT 1)
    END as proprietaire
FROM recipes 
WHERE title LIKE '%Riz aux Crevettes%' OR title LIKE '%Citronnelle%';

-- 2. RÉPARATION: S'assurer que la recette est publiée ET assignée à l'admin
UPDATE recipes 
SET 
    status = 'published',
    user_id = (SELECT id FROM auth.users WHERE email = 'aboo2003@hotmail.com' LIMIT 1)
WHERE title LIKE '%Riz aux Crevettes%' OR title LIKE '%Citronnelle%';

-- 3. VÉRIFICATION: Afficher l'état après correction
SELECT 
    id,
    title,
    status,
    user_id,
    (SELECT email FROM auth.users WHERE id = user_id LIMIT 1) as proprietaire
FROM recipes 
WHERE title LIKE '%Riz aux Crevettes%' OR title LIKE '%Citronnelle%';

-- 4. BONUS: Afficher toutes les recettes non publiées (pour vérifier s'il y en a d'autres)
SELECT id, title, status, user_id
FROM recipes
WHERE status != 'published' OR status IS NULL;
