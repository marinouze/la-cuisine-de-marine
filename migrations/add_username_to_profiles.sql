-- Migration pour ajouter le support du pseudo/username

-- Ajouter la colonne username à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Créer un index pour les recherches de username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- Mettre à jour le trigger pour demander le username à la première connexion
-- (Le username sera NULL initialement et l'utilisateur devra le définir)
