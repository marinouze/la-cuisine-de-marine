// Database types (matching Supabase schema - snake_case)
export interface DbRecipe {
    id: number;
    title: string;
    image_prompt: string;
    ingredients: DbIngredient[];
    steps: string[];
    prep_time: string;
    cook_time: string;
    servings: number;
    is_custom: boolean;
    status: 'draft' | 'published';
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}


export interface DbIngredient {
    emoji: string;
    quantity: number | null;
    unit: string;
    ingredient: string;
}

export interface DbTag {
    id: number;
    name: string;
    created_at?: string;
    created_by?: string;
}

export interface DbComment {
    id: number;
    recipe_id: number;
    user_name: string;
    rating: number;
    text: string;
    date: string;
    created_at?: string;
}

export interface DbProfile {
    id: string; // UUID
    email: string;
    username?: string;
    role: 'user' | 'admin';
    created_at?: string;
    updated_at?: string;
}

// Application types (already defined in index.tsx)
export interface Ingredient {
    emoji: string;
    quantity: number | null;
    unit: string;
    ingredient: string;
}

export interface Comment {
    id: number;
    user: string;
    rating: number;
    text: string;
    date: string;
}

export interface Recipe {
    id: number;
    title: string;
    imagePrompt: string;
    ingredients: Ingredient[];
    steps: string[];
    prepTime: string;
    cookTime: string;
    servings: number;
    tags?: string[];
    isCustom?: boolean;
    status?: 'draft' | 'published';
    userId?: string;
    comments?: Comment[];
}

export interface Tag {
    id: number;
    name: string;
    createdAt?: string;
    createdBy?: string;
}

export interface Profile {
    id: string;
    email: string;
    username?: string;
    role: 'user' | 'admin';
}


// Transformation functions
export function dbRecipeToRecipe(dbRecipe: DbRecipe, comments: DbComment[] = []): Recipe {
    return {
        id: dbRecipe.id,
        title: dbRecipe.title,
        imagePrompt: dbRecipe.image_prompt,
        ingredients: dbRecipe.ingredients,
        steps: dbRecipe.steps,
        prepTime: dbRecipe.prep_time,
        cookTime: dbRecipe.cook_time,
        servings: dbRecipe.servings,
        tags: [], // Tags will be populated separately from recipe_tags table
        isCustom: dbRecipe.is_custom,
        status: dbRecipe.status,
        userId: dbRecipe.user_id,
        comments: comments.map(dbCommentToComment)
    };
}

export function recipeToDbRecipe(recipe: Omit<Recipe, 'id' | 'comments'>): Omit<DbRecipe, 'id' | 'created_at' | 'updated_at'> {
    return {
        title: recipe.title,
        image_prompt: recipe.imagePrompt,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings,
        is_custom: recipe.isCustom || false,
        status: recipe.status || 'draft',
        user_id: recipe.userId
    };
}

// For updating an existing recipe (includes ID)
export function recipeToDbRecipeForUpdate(recipe: Recipe): Partial<DbRecipe> {
    return {
        title: recipe.title,
        image_prompt: recipe.imagePrompt,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        prep_time: recipe.prepTime,
        cook_time: recipe.cookTime,
        servings: recipe.servings,
        is_custom: recipe.isCustom || false,
        status: recipe.status || 'draft',
        user_id: recipe.userId
    };
}

export function dbCommentToComment(dbComment: DbComment): Comment {
    return {
        id: dbComment.id,
        user: dbComment.user_name,
        rating: dbComment.rating,
        text: dbComment.text,
        date: dbComment.date
    };
}

export function commentToDbComment(comment: Omit<Comment, 'id'>, recipeId: number): Omit<DbComment, 'id' | 'created_at'> {
    return {
        recipe_id: recipeId,
        user_name: comment.user,
        rating: comment.rating,
        text: comment.text,
        date: comment.date
    };
}

export function dbTagToTag(dbTag: DbTag): Tag {
    return {
        id: dbTag.id,
        name: dbTag.name,
        createdAt: dbTag.created_at,
        createdBy: dbTag.created_by
    };
}

export function tagToDbTag(tag: Omit<Tag, 'id' | 'createdAt'>): Omit<DbTag, 'id' | 'created_at'> {
    return {
        name: tag.name,
        created_by: tag.createdBy
    };
}

export function dbProfileToProfile(dbProfile: DbProfile): Profile {
    return {
        id: dbProfile.id,
        email: dbProfile.email,
        username: dbProfile.username,
        role: dbProfile.role
    };
}

