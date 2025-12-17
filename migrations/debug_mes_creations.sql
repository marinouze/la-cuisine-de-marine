-- SCRIPT DE DEBUG COMPLET
-- Ce script va afficher toutes les informations nécessaires pour comprendre le problème

-- 1. Votre ID utilisateur
SELECT id as user_id, email 
FROM auth.users 
WHERE email = 'aboo2003@hotmail.com';

-- 2. Info complète sur la recette "Riz aux Crevettes"
SELECT 
    id,
    title,
    status,
    user_id,
    created_at,
    updated_at
FROM recipes 
WHERE title LIKE '%Riz aux Crevettes%';

-- 3. Vérifier si le user_id correspond bien à votre ID
SELECT 
    r.id,
    r.title,
    r.user_id as recipe_user_id,
    u.email as owner_email,
    CASE 
        WHEN r.user_id = (SELECT id FROM auth.users WHERE email = 'aboo2003@hotmail.com') 
        THEN 'OUI - Match parfait ✅'
        ELSE 'NON - Pas de match ❌'
    END as match_status
FROM recipes r
LEFT JOIN auth.users u ON r.user_id = u.id
WHERE r.title LIKE '%Riz aux Crevettes%';

-- 4. Toutes vos recettes (pour vérifier si d'autres fonctionnent)
SELECT 
    r.id,
    r.title,
    r.status,
    r.user_id
FROM recipes r
WHERE r.user_id = (SELECT id FROM auth.users WHERE email = 'aboo2003@hotmail.com')
ORDER BY r.created_at DESC;
