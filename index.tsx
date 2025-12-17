import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { User, Session } from '@supabase/supabase-js';

import { supabase } from './src/supabaseClient';
import { dbRecipeToRecipe, recipeToDbRecipe, commentToDbComment, type DbRecipe, type DbComment } from './src/types';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BackOffice from './src/pages/BackOffice';
import Login from './src/pages/Login';
import { getIngredientEmoji } from './src/utils/ingredientEmoji';
import TagSelector from './src/components/TagSelector';

// --- Types ---
interface Ingredient {
  emoji: string;
  quantity: number | null;
  unit: string;
  ingredient: string;
}

interface Comment {
  id: number;
  user: string;
  rating: number;
  text: string;
  date: string;
}

interface Recipe {
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



// --- Helpers ---
const calculateAverageRating = (comments?: Comment[]) => {
  if (!comments || comments.length === 0) return 0;
  const sum = comments.reduce((acc, c) => acc + c.rating, 0);
  return (sum / comments.length).toFixed(1);
};

// --- Components ---

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className="search-wrapper">
    <div className="search-container">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder="Rechercher une recette..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

interface FilterPillsProps {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

const FilterPills = ({ allTags, selectedTags, onToggleTag }: FilterPillsProps) => (
  <div className="filter-pills-container">
    {allTags.map(tag => (
      <button
        key={tag}
        className={`filter-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
        onClick={() => onToggleTag(tag)}
      >
        {tag}
      </button>
    ))}
  </div>
);


interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  isYummed: boolean;
  onToggleYum: (id: number) => void;
}

const RecipeCard = ({ recipe, onClick, isYummed, onToggleYum }: RecipeCardProps) => {
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.imagePrompt)}?width=120&height=120&nologo=true`;
  const rating = calculateAverageRating(recipe.comments);

  return (
    <div className="recipe-card" onClick={onClick}>
      <img src={imageUrl} alt={recipe.title} className="recipe-card-thumb" loading="lazy" />
      <div className="recipe-card-info">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <div className="recipe-card-meta">
          <span>⏱️ {recipe.prepTime}</span>
          <span>🔥 {recipe.cookTime}</span>
          {Number(rating) > 0 && <span>⭐ {rating}</span>}
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-card-tags">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag-pill-small">{tag}</span>
            ))}
            {recipe.tags.length > 3 && <span className="tag-pill-more">+{recipe.tags.length - 3}</span>}
          </div>
        )}
      </div>
      <div className="recipe-card-actions">
        <button
          className={`yum-btn-mini ${isYummed ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleYum(recipe.id);
          }}
        >
          {isYummed ? '❤️' : '🤍'}
        </button>
        <div className="recipe-card-arrow">➔</div>
      </div>
    </div>
  );
};

// --- Recipe Detail Components ---

interface StarRatingProps {
  rating: number;
  setRating: (r: number) => void;
  readOnly?: boolean;
}

const StarRating = ({ rating, setRating, readOnly = false }: StarRatingProps) => {
  return (
    <div className={`star-rating ${readOnly ? 'readonly' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={() => !readOnly && setRating(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  isYummed: boolean;
  onToggleYum: (id: number) => void;
  onAddComment: (recipeId: number, comment: Omit<Comment, 'id'>) => void;
  currentUser: User | null;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

const RecipeDetail = ({ recipe, onBack, isYummed, onToggleYum, onAddComment, currentUser, onEdit, onDelete }: RecipeDetailProps) => {
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.imagePrompt)}?width=800&height=500&nologo=true`;
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentRating, setNewCommentRating] = useState(0);

  // Check if user is owner or admin
  const isAdmin = currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL;
  const isOwner = currentUser?.id === recipe.userId;
  const canEdit = isAdmin || isOwner;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCommentName && newCommentText && newCommentRating > 0) {
      onAddComment(recipe.id, {
        user: newCommentName,
        text: newCommentText,
        rating: newCommentRating,
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      });
      setNewCommentName("");
      setNewCommentText("");
      setNewCommentRating(0);
    }
  };

  const avgRating = calculateAverageRating(recipe.comments);

  return (
    <div className="detail-view fade-in">
      <button className="back-button" onClick={onBack}>
        ← Sommaire
      </button>

      <div className="detail-header">
        <div className="detail-image-container">
          <img src={imageUrl} alt={recipe.title} className="detail-image" />

          <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
            {canEdit && (
              <>
                <button
                  onClick={() => onEdit(recipe)}
                  style={{
                    background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                  title="Modifier"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    if (confirm('Supprimer cette recette ?')) onDelete(recipe);
                  }}
                  style={{
                    background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                  title="Supprimer"
                >
                  🗑️
                </button>
              </>
            )}
            <button
              className={`yum-fab ${isYummed ? 'active' : ''}`}
              style={{ position: 'static', margin: 0 }} // Override absolute positioning of yum-fab class
              onClick={() => onToggleYum(recipe.id)}
              aria-label={isYummed ? "Retirer des Miams" : "Ajouter aux Miams"}
            >
              {isYummed ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="detail-meta-overlay">
            <div className="meta-pill">👤 {recipe.servings} pers.</div>
            <div className="meta-pill">⏱️ {recipe.prepTime}</div>
            <div className="meta-pill">🔥 {recipe.cookTime}</div>
          </div>
        </div>

        <h1 className="detail-title">{recipe.title}</h1>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="detail-tags">
            {recipe.tags.map(tag => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        )}
        {Number(avgRating) > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold', color: '#666' }}>
            Note moyenne : ⭐ {avgRating} / 5
          </div>
        )}
      </div>

      <div className="detail-content">
        <section className="section-ingredients">
          <h3 className="section-title">Ingrédients</h3>
          <ul className="ingredients-grid">
            {recipe.ingredients.map((ing: Ingredient, idx: number) => (
              <li key={idx} className="ingredient-item">
                <span className="ingredient-emoji">{ing.emoji}</span>
                <span className="ingredient-text">
                  {ing.quantity ? `${ing.quantity} ` : ''}
                  {ing.unit ? `${ing.unit} ` : ''}
                  {ing.ingredient}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section-steps">
          <h3 className="section-title">Préparation</h3>
          <ol className="steps-list">
            {recipe.steps.map((step: string, idx: number) => (
              <li key={idx}>
                <span className="step-number">{idx + 1}</span>
                <p className="step-text">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Comments Section */}
        <section className="section-comments">
          <h3 className="section-title">Avis & Commentaires</h3>

          <div className="comments-list">
            {recipe.comments && recipe.comments.length > 0 ? (
              recipe.comments.map((comment: Comment) => (
                <div key={comment.id} className="comment-bubble">
                  <div className="comment-header">
                    <span className="comment-user">{comment.user}</span>
                    <span className="comment-date">{comment.date}</span>
                  </div>
                  <StarRating rating={comment.rating} setRating={() => { }} readOnly />
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))
            ) : (
              <p className="no-comments">Soyez le premier à donner votre avis !</p>
            )}
          </div>

          <form className="add-comment-form" onSubmit={handleSubmitComment}>
            <h4>Ajouter un avis</h4>
            <div className="form-group">
              <input
                className="comment-input"
                placeholder="Votre nom"
                value={newCommentName}
                onChange={e => setNewCommentName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555' }}>Votre note :</label>
              <StarRating rating={newCommentRating} setRating={setNewCommentRating} />
            </div>
            <div className="form-group">
              <textarea
                className="comment-input"
                placeholder="Votre commentaire..."
                rows={3}
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-comment-btn" disabled={!newCommentName || !newCommentText || newCommentRating === 0}>
              Envoyer
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};



// --- Add Recipe Form Component ---

interface AddRecipeFormProps {
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  availableTags: string[];
  user: User | null;
  initialRecipe?: Recipe;
}

const AddRecipeForm = ({ onSave, onCancel, availableTags, user, initialRecipe }: AddRecipeFormProps) => {
  const [title, setTitle] = useState(initialRecipe?.title || "");
  const [prepTime, setPrepTime] = useState(initialRecipe?.prepTime || "");
  const [cookTime, setCookTime] = useState(initialRecipe?.cookTime || "");
  const [servings, setServings] = useState(initialRecipe?.servings || 2);

  const UNIT_OPTIONS = ["(vide)", "g", "kg", "ml", "cl", "L", "c.à.s", "c.à.c", "pincée", "verre", "tasse"];

  // Ingredients: Separate fields
  const [ingredients, setIngredients] = useState<{ qty: string, unit: string, name: string }[]>(
    initialRecipe?.ingredients.map(i => ({
      qty: i.quantity?.toString() || "",
      unit: i.unit || "",
      name: i.ingredient
    })) || [{ qty: "", unit: "", name: "" }]
  );

  // Steps
  const [steps, setSteps] = useState<string[]>(initialRecipe?.steps || [""]);

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>(initialRecipe?.tags || []);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { qty: "", unit: "", name: "" }]);
  };

  const handleIngredientChange = (index: number, field: 'qty' | 'name' | 'unit', value: string) => {
    const newIngs = [...ingredients];
    newIngs[index][field] = value;
    setIngredients(newIngs);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddStep = () => {
    setSteps([...steps, ""]);
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddNewTag = (tagName: string) => {
    // Add to selected tags immediately (will be saved when recipe is submitted)
    if (!selectedTags.includes(tagName)) {
      setSelectedTags(prev => [...prev, tagName]);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Construct Recipe Object
    const newRecipe: Recipe = {
      id: initialRecipe?.id || Date.now(), // Use existing ID if editing
      title,
      imagePrompt: `${title} gourmet food warm photography`,
      ingredients: ingredients
        .filter(i => i.name.trim() !== "")
        .map(i => ({
          emoji: getIngredientEmoji(i.name),
          quantity: i.qty ? parseFloat(i.qty) : null,
          unit: i.unit && i.unit !== "(vide)" ? i.unit : "",
          ingredient: i.name.trim()
        })),
      steps: steps.filter(s => s.trim() !== ""),
      prepTime: prepTime || "10 min",
      cookTime: cookTime || "15 min",
      servings,
      tags: selectedTags,
      isCustom: true,
      status: initialRecipe?.status || 'published',
      userId: initialRecipe?.userId || user?.id, // Preserve original owner if editing (though usually only owner edits)
      comments: initialRecipe?.comments || []
    };

    onSave(newRecipe);
  };

  return (
    <div className="add-recipe-view fade-in">
      <button className="back-button" style={{ position: 'static', marginBottom: '20px' }} onClick={onCancel}>
        ⬅ Annuler
      </button>
      <h2 style={{ fontFamily: 'Pacifico, cursive', margin: '0 0 20px 0', color: 'var(--primary-color)', textAlign: 'center' }}>
        {initialRecipe ? 'Modifier la Recette' : 'Nouvelle Recette'}
      </h2>

      <form onSubmit={handleSubmit} className="add-recipe-form">

        <div className="form-section">
          <label className="form-label">Titre de la recette</label>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Tarte aux pommes..."
            required
          />
        </div>

        <div className="form-row">
          <div className="form-section half">
            <label className="form-label">Préparation</label>
            <input type="text" className="form-input" value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="10 min" />
          </div>
          <div className="form-section half">
            <label className="form-label">Cuisson</label>
            <input type="text" className="form-input" value={cookTime} onChange={e => setCookTime(e.target.value)} placeholder="20 min" />
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Personnes: {servings}</label>
          <input type="range" min="1" max="12" value={servings} onChange={e => setServings(parseInt(e.target.value))} className="form-range" />
        </div>

        <div className="form-section">
          <label className="form-label">Ingrédients</label>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="ingredient-input-row">
              <input
                type="text"
                className="form-input qty"
                placeholder="Qté"
                value={ing.qty}
                onChange={e => handleIngredientChange(idx, 'qty', e.target.value)}
              />
              <select
                className="form-input unit"
                value={ing.unit}
                onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
              >
                {UNIT_OPTIONS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <input
                type="text"
                className="form-input name"
                placeholder="Ingrédient"
                value={ing.name}
                onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
              />
              <button type="button" className="remove-btn" onClick={() => handleRemoveIngredient(idx)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={handleAddIngredient}>+ Ajouter un ingrédient</button>
        </div>

        <div className="form-section">
          <label className="form-label">Étapes</label>
          {steps.map((step, idx) => (
            <div key={idx} className="step-input-row">
              <span className="step-idx">{idx + 1}</span>
              <textarea
                className="form-input"
                placeholder="Décrivez l'étape..."
                value={step}
                onChange={e => handleStepChange(idx, e.target.value)}
                rows={2}
              />
              <button type="button" className="remove-btn" onClick={() => handleRemoveStep(idx)}>✕</button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={handleAddStep}>+ Ajouter une étape</button>
        </div>

        <div className="form-section">
          <label className="form-label">Tags</label>
          <TagSelector
            availableTags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onAddNewTag={handleAddNewTag}
          />
        </div>


        <button type="submit" className="submit-btn">ENREGISTRER LA RECETTE ✨</button>

      </form>
    </div>
  );
};




// --- Database Helper Functions ---

// Fetch all tags from Supabase
async function fetchTagsFromDB(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('name')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(tag => tag.name);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

// Save a new tag to Supabase
async function saveTagToDB(tagName: string, createdBy?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tags')
      .upsert(
        { name: tagName, created_by: createdBy || 'user' },
        { onConflict: 'name', ignoreDuplicates: true }
      );

    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error('Error saving tag:', error);
    return false;
  }
}

// Link tags to a recipe via recipe_tags junction table
async function linkTagsToRecipe(recipeId: number, tagNames: string[]): Promise<boolean> {
  try {
    // First, get tag IDs from tag names
    const { data: tagsData, error: tagsError } = await supabase
      .from('tags')
      .select('id, name')
      .in('name', tagNames);

    if (tagsError) throw tagsError;
    if (!tagsData || tagsData.length === 0) return true; // No tags to link

    // Delete existing tag associations for this recipe
    await supabase
      .from('recipe_tags')
      .delete()
      .eq('recipe_id', recipeId);

    // Insert new tag associations
    const recipeTags = tagsData.map(tag => ({
      recipe_id: recipeId,
      tag_id: tag.id
    }));

    const { error: insertError } = await supabase
      .from('recipe_tags')
      .insert(recipeTags);

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error('Error linking tags to recipe:', error);
    return false;
  }
}



// Fetch all recipes with their comments from Supabase
async function fetchRecipesFromDB(): Promise<Recipe[]> {
  try {
    // Fetch recipes
    const { data: recipesData, error: recipesError } = await supabase
      .from('recipes')
      .select('*')
      .eq('status', 'published') // Only fetch published recipes for the main app
      .order('created_at', { ascending: false });

    if (recipesError) throw recipesError;
    if (!recipesData) return [];

    // Fetch all comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (commentsError) throw commentsError;

    // Group comments by recipe_id
    const commentsByRecipe = new Map<number, DbComment[]>();
    (commentsData || []).forEach(comment => {
      const existing = commentsByRecipe.get(comment.recipe_id) || [];
      commentsByRecipe.set(comment.recipe_id, [...existing, comment]);
    });

    // Fetch all recipe tags
    const { data: recipeTagsData, error: recipeTagsError } = await supabase
      .from('recipe_tags')
      .select('recipe_id, tags!inner(name)');

    if (recipeTagsError) console.error('Error fetching recipe tags:', recipeTagsError);

    // Group tags by recipe_id
    const tagsByRecipe = new Map<number, string[]>();
    (recipeTagsData || []).forEach((rt: any) => {
      const existing = tagsByRecipe.get(rt.recipe_id) || [];
      tagsByRecipe.set(rt.recipe_id, [...existing, rt.tags.name]);
    });

    // Transform to Recipe format
    return recipesData.map(dbRecipe => {
      const recipe = dbRecipeToRecipe(dbRecipe as DbRecipe, commentsByRecipe.get(dbRecipe.id) || []);
      recipe.tags = tagsByRecipe.get(dbRecipe.id) || [];
      return recipe;
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}


// Update an existing recipe in Supabase
async function updateRecipeInDB(recipe: Recipe): Promise<boolean> {
  try {
    const dbRecipe = recipeToDbRecipe(recipe);
    // Remove fields that shouldn't be updated or cause issues if missing (though recipeToDbRecipe handles most)
    // We need to handle tags too.

    const { error } = await supabase
      .from('recipes')
      .update(dbRecipe)
      .eq('id', recipe.id);

    if (error) throw error;

    // Handle Tags
    if (recipe.tags) {
      // Ensure tags exist
      for (const tagName of recipe.tags) {
        await saveTagToDB(tagName);
      }
      await linkTagsToRecipe(recipe.id, recipe.tags);
    }

    return true;
  } catch (error) {
    console.error('Error updating recipe:', error);
    return false;
  }
}

// Delete a recipe
async function deleteRecipeFromDB(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return false;
  }
}

// Save a new recipe to Supabase
async function saveRecipeToDB(recipe: Omit<Recipe, 'id' | 'comments'>): Promise<Recipe | null> {
  try {
    const dbRecipe = recipeToDbRecipe(recipe);

    const { data, error } = await supabase
      .from('recipes')
      .insert([dbRecipe])
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    // Save tags if present
    if (recipe.tags && recipe.tags.length > 0) {
      // First, ensure all tags exist in the database
      for (const tagName of recipe.tags) {
        await saveTagToDB(tagName);
      }

      // Then link the tags to the recipe
      await linkTagsToRecipe(data.id, recipe.tags);
    }

    const newRecipe = dbRecipeToRecipe(data as DbRecipe, []);
    newRecipe.tags = recipe.tags || [];
    return newRecipe;
  } catch (error) {
    console.error('Error saving recipe:', error);
    return null;
  }
}

// Add a comment to a recipe in Supabase
async function addCommentToDB(recipeId: number, comment: Omit<Comment, 'id'>): Promise<Comment | null> {
  try {
    const dbComment = commentToDbComment(comment, recipeId);

    const { data, error } = await supabase
      .from('comments')
      .insert([dbComment])
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      user: data.user_name,
      rating: data.rating,
      text: data.text,
      date: data.date
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return null;
  }
}

const App = () => {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null); // For edit mode
  const [searchTerm, setSearchTerm] = useState("");
  const [yums, setYums] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'yums' | 'custom' | 'my_creations'>('all'); // Added 'my_creations'
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]); // For tag filtering
  const [user, setUser] = useState<User | null>(null);

  // Fetch recipes and tags from Supabase on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [recipes, tags] = await Promise.all([
          fetchRecipesFromDB(),
          fetchTagsFromDB()
        ]);
        setAllRecipes(recipes);
        setAllTags(tags);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Impossible de charger les recettes. Vérifiez votre connexion.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);


  const toggleYum = (id: number) => {
    setYums(prev =>
      prev.includes(id) ? prev.filter(y => y !== id) : [...prev, id]
    );
  };

  const handleTagFilterToggle = (tag: string) => {
    setSelectedFilterTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };




  const handleSaveRecipe = async (newRecipe: Recipe) => {
    if (editingRecipe) {
      // Update existing
      const success = await updateRecipeInDB(newRecipe);
      if (success) {
        setAllRecipes(prev => prev.map(r => r.id === newRecipe.id ? newRecipe : r));
        setIsAddMode(false);
        setEditingRecipe(null);
        // Stay on detail view or go back? Let's go to detail view of updated recipe
        setSelectedRecipeId(newRecipe.id);
      } else {
        alert('Erreur lors de la modification.');
      }
    } else {
      // Create new
      const savedRecipe = await saveRecipeToDB(newRecipe);
      if (savedRecipe) {
        setAllRecipes([savedRecipe, ...allRecipes]);
        setIsAddMode(false);
        setFilterType('custom'); // Switch to custom view to see the new recipe
      } else {
        alert('Erreur lors de la sauvegarde de la recette. Veuillez réessayer.');
      }
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsAddMode(true);
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    const success = await deleteRecipeFromDB(recipe.id);
    if (success) {
      setAllRecipes(prev => prev.filter(r => r.id !== recipe.id));
      setSelectedRecipeId(null); // Go back to list
    } else {
      alert('Erreur lors de la suppression.');
    }
  };

  const handleAddComment = async (recipeId: number, comment: Omit<Comment, 'id'>) => {
    const savedComment = await addCommentToDB(recipeId, comment);
    if (savedComment) {
      setAllRecipes(prevRecipes => prevRecipes.map(r => {
        if (r.id === recipeId) {
          return { ...r, comments: r.comments ? [savedComment, ...r.comments] : [savedComment] };
        }
        return r;
      }));
    } else {
      alert('Erreur lors de l\'ajout du commentaire. Veuillez réessayer.');
    }
  };


  const filteredRecipes = allRecipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(i => i?.ingredient?.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterType === 'yums') {
      matchesFilter = yums.includes(r.id);
    } else if (filterType === 'custom') {
      matchesFilter = !!r.isCustom;
    } else if (filterType === 'my_creations') {
      if (!user) return false;
      matchesFilter = r.userId === user.id;
    }

    // Tag filtering: show recipes that have ANY of the selected tags
    let matchesTags = true;
    matchesTags = r.tags?.some(tag => selectedFilterTags.includes(tag)) || false;

    return matchesSearch && matchesFilter && matchesTags;
  });

  const selectedRecipe = allRecipes.find(r => r.id === selectedRecipeId);

  return (
    <div className="app-container">
      {/* Loading State */}
      {isLoading && (
        <div className="loading-state" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '1.5rem',
          color: 'var(--primary-color)'
        }}>
          <div>🍳 Chargement des recettes...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state" style={{
          padding: '20px',
          textAlign: 'center',
          color: '#d32f2f'
        }}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '10px',
            padding: '10px 20px',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>Réessayer</button>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {isAddMode ? (
            <AddRecipeForm
              onSave={handleSaveRecipe}
              onCancel={() => {
                setIsAddMode(false);
                setEditingRecipe(null);
              }}
              availableTags={allTags}
              user={user}
              initialRecipe={editingRecipe || undefined}
            />
          ) : !selectedRecipe ? (
            <div className="list-view fade-in">
              <header className="main-header">
                <h1 className="main-title">Mes Recettes</h1>
                <button className="add-btn-header" onClick={() => setIsAddMode(true)}>+ Ajouter</button>
              </header>

              <SearchBar value={searchTerm} onChange={setSearchTerm} />

              {allTags.length > 0 && (
                <FilterPills
                  allTags={allTags}
                  selectedTags={selectedFilterTags}
                  onToggleTag={handleTagFilterToggle}
                />
              )}

              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Toutes
                </button>
                <button
                  className={`filter-tab ${filterType === 'yums' ? 'active' : ''}`}
                  onClick={() => setFilterType('yums')}
                >
                  Mes Miams ❤️
                </button>
                <button
                  className={`filter-tab ${filterType === 'custom' ? 'active' : ''}`}
                  onClick={() => setFilterType('custom')}
                >
                  Mes Créations 🎨
                </button>
              </div>

              <div className="recipe-list">
                {filteredRecipes.length > 0 ? (
                  filteredRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onClick={() => setSelectedRecipeId(recipe.id)}
                      isYummed={yums.includes(recipe.id)}
                      onToggleYum={toggleYum}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p>
                      {filterType === 'yums'
                        ? "Vous n'avez pas encore de Miams ! Ajoutez-en ❤️"
                        : filterType === 'custom'
                          ? "Pas encore de créations ! Lancez-vous 🍳"
                          : `Aucune recette trouvée pour "${searchTerm}"`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <RecipeDetail
              recipe={selectedRecipe}
              onBack={() => setSelectedRecipeId(null)}
              isYummed={selectedRecipe ? yums.includes(selectedRecipe.id) : false}
              onToggleYum={selectedRecipe ? toggleYum : () => { }}
              onAddComment={handleAddComment}
              currentUser={user}
              onEdit={handleEditRecipe}
              onDelete={handleDeleteRecipe}
            />
          )}


        </>
      )}
    </div>
  );
};

const RouterApp = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/admindesrecettes" element={<BackOffice />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  </BrowserRouter>
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<RouterApp />);