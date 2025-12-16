-- Migration: Add tags support to recipes
-- This script creates the tags infrastructure for the recipe application

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT
);

-- Create recipe_tags junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS recipe_tags (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);

-- Insert base tags
INSERT INTO tags (name, created_by) VALUES
    ('Entrée', 'system'),
    ('Plat principal', 'system'),
    ('Dessert', 'system'),
    ('Apéro ', 'system'),
    ('Végétarien', 'system'),
    ('Asiatique', 'system'),
    ('Italien', 'system'),
    ('Rapide', 'system'),
    ('Peu d’ingrédients', 'system'),
    ('Réconfortant', 'system')
ON CONFLICT (name) DO NOTHING;
