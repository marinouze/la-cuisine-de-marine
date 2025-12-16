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
    tags: string[];
    is_custom: boolean;
    status: 'draft' | 'published';
    created_at?: string;
    updated_at?: string;
}

export interface DbTag {
    id: number;
    name: string;
    created_at?: string;
}

export interface DbIngredient {
    emoji: string;
    quantity: number | null;
    unit: string;
    ingredient: string;
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
    tags: string[];
    isCustom?: boolean;
    status?: 'draft' | 'published';
    comments?: Comment[];
}

export interface Tag {
    id: number;
    name: string;
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
        tags: dbRecipe.tags,
        isCustom: dbRecipe.is_custom,
        status: dbRecipe.status,
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
        tags: recipe.tags,
        is_custom: recipe.isCustom || false,
        status: recipe.status || 'draft'
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
        tags: recipe.tags,
        is_custom: recipe.isCustom || false,
        status: recipe.status || 'draft'
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
