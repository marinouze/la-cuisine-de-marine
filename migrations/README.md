# Database Migration: Tags System

## Instructions pour exécuter la migration dans Supabase

1. **Connectez-vous à votre projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Ouvrez votre projet `mes-recettes`

2. **Ouvrez le SQL Editor**
   - Dans le menu de gauche, cliquez sur "SQL Editor"

3. **Exécutez le script de migration**
   - Créez une nouvelle query
   - Copiez tout le contenu du fichier `migrations/tags_schema.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

4. **Vérifiez que les tables ont été créées**
   - Allez dans "Database" > "Tables"
   - Vous devriez voir les nouvelles tables :
     - `tags` (avec 10 tags de base)
     - `recipe_tags` (table de liaison)

5. **Vérifiez les données de base**
   - Exécutez cette requête pour voir les tags créés :
     ```sql
     SELECT * FROM tags ORDER BY name;
     ```
   - Vous devriez voir les 10 tags de base

## Tags de base créés

Le script crée automatiquement ces 10 tags :
- Entrée
- Plat principal
- Dessert
- Apéritif
- Végétarien
- Vegan
- Sans gluten
- Rapide (moins de 30 min)
- Économique
- Gourmand

## Troubleshooting

Si vous rencontrez des erreurs :

1. **Erreur "table already exists"** : Les tables existent déjà, vous pouvez ignorer cette erreur ou supprimer les tables existantes d'abord
2. **Erreur "permission denied"** : Vérifiez que vous avez les droits d'administration sur le projet Supabase

## Back-office

Après la migration, seul l'utilisateur dont l'email est configuré dans `VITE_ADMIN_EMAIL` pourra gérer les tags dans le back-office à l'adresse `/admindesrecettes`.
