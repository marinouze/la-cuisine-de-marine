import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { supabase } from './src/supabaseClient';
import { dbRecipeToRecipe, recipeToDbRecipe, commentToDbComment, type DbRecipe, type DbComment } from './src/types';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BackOffice from './src/pages/BackOffice';
import Login from './src/pages/Login';

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
  tags: string[];
  isCustom?: boolean;
  comments?: Comment[];
}



// --- Helpers ---
const calculateAverageRating = (comments?: Comment[]) => {
  if (!comments || comments.length === 0) return 0;
  const sum = comments.reduce((acc, c) => acc + c.rating, 0);
  return (sum / comments.length).toFixed(1);
};

// --- Components ---

const SearchBar: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => (
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

const FilterPills: React.FC<{
  allTags: string[],
  selectedTags: string[],
  onToggleTag: (tag: string) => void
}> = ({ allTags, selectedTags, onToggleTag }) => (
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

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, isYummed, onToggleYum }) => {
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
        <div className="recipe-card-tags">
          {recipe.tags.map(tag => (
            <span key={tag} className="card-tag">{tag}</span>
          ))}
        </div>
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

const StarRating: React.FC<{ rating: number, setRating: (r: number) => void, readOnly?: boolean }> = ({ rating, setRating, readOnly = false }) => {
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
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onBack, isYummed, onToggleYum, onAddComment }) => {
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(recipe.imagePrompt)}?width=800&height=500&nologo=true`;
  const [newCommentName, setNewCommentName] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentRating, setNewCommentRating] = useState(0);

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

          <button
            className={`yum-fab ${isYummed ? 'active' : ''}`}
            onClick={() => onToggleYum(recipe.id)}
            aria-label={isYummed ? "Retirer des Miams" : "Ajouter aux Miams"}
          >
            {isYummed ? '❤️' : '🤍'}
          </button>

          <div className="detail-meta-overlay">
            <div className="meta-pill">👤 {recipe.servings} pers.</div>
            <div className="meta-pill">⏱️ {recipe.prepTime}</div>
            <div className="meta-pill">🔥 {recipe.cookTime}</div>
          </div>
        </div>

        <h1 className="detail-title">{recipe.title}</h1>
        {Number(avgRating) > 0 && (
          <div style={{ textAlign: 'center', marginBottom: '15px', fontWeight: 'bold', color: '#666' }}>
            Note moyenne : ⭐ {avgRating} / 5
          </div>
        )}

        <div className="detail-tags">
          {recipe.tags.map(tag => (
            <span key={tag} className="detail-tag">{tag}</span>
          ))}
        </div>
      </div>

      <div className="detail-content">
        <section className="section-ingredients">
          <h3 className="section-title">Ingrédients</h3>
          <ul className="ingredients-grid">
            {recipe.ingredients.map((ing, idx) => (
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
            {recipe.steps.map((step, idx) => (
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
              recipe.comments.map(comment => (
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

// --- Helper: Auto-select emoji based on ingredient name ---
const getIngredientEmoji = (ingredientName: string): string => {
  const name = ingredientName.toLowerCase().trim();

  // Viandes
  if (name.includes('poulet') || name.includes('volaille')) return '🍗';
  if (name.includes('bœuf') || name.includes('boeuf') || name.includes('steak')) return '🥩';
  if (name.includes('porc') || name.includes('jambon') || name.includes('lard')) return '🥓';
  if (name.includes('agneau')) return '🐑';

  // Poissons et fruits de mer
  if (name.includes('poisson') || name.includes('saumon') || name.includes('truite')) return '🐟';
  if (name.includes('crevette')) return '🦐';
  if (name.includes('crabe')) return '🦀';
  if (name.includes('homard')) return '🦞';
  if (name.includes('moule') || name.includes('huître')) return '🦪';

  // Légumes
  if (name.includes('tomate')) return '🍅';
  if (name.includes('carotte')) return '🥕';
  if (name.includes('brocoli')) return '🥦';
  if (name.includes('aubergine')) return '🍆';
  if (name.includes('poivron') || name.includes('piment')) return '🌶️';
  if (name.includes('maïs')) return '🌽';
  if (name.includes('champignon')) return '🍄';
  if (name.includes('pomme de terre') || name.includes('patate')) return '🥔';
  if (name.includes('concombre')) return '🥒';
  if (name.includes('laitue') || name.includes('salade')) return '🥬';
  if (name.includes('avocat')) return '🥑';
  if (name.includes('oignon')) return '🧅';
  if (name.includes('ail')) return '🧄';

  // Fruits
  if (name.includes('pomme')) return '🍎';
  if (name.includes('banane')) return '🍌';
  if (name.includes('orange') || name.includes('clémentine')) return '🍊';
  if (name.includes('citron')) return '🍋';
  if (name.includes('fraise')) return '🍓';
  if (name.includes('raisin')) return '🍇';
  if (name.includes('pastèque') || name.includes('melon')) return '🍉';
  if (name.includes('pêche') || name.includes('abricot')) return '🍑';
  if (name.includes('cerise')) return '🍒';
  if (name.includes('ananas')) return '🍍';
  if (name.includes('kiwi')) return '🥝';
  if (name.includes('mangue')) return '🥭';

  // Produits laitiers
  if (name.includes('lait')) return '🥛';
  if (name.includes('fromage')) return '🧀';
  if (name.includes('beurre')) return '🧈';
  if (name.includes('yaourt') || name.includes('yogourt')) return '🥛';
  if (name.includes('crème')) return '🥛';

  // Œufs
  if (name.includes('œuf') || name.includes('oeuf')) return '🥚';

  // Pains et céréales
  if (name.includes('pain')) return '🍞';
  if (name.includes('riz')) return '🍚';
  if (name.includes('pâtes') || name.includes('pates') || name.includes('spaghetti') || name.includes('macaroni')) return '🍝';
  if (name.includes('farine')) return '🌾';
  if (name.includes('croissant')) return '🥐';

  // Condiments et épices
  if (name.includes('sel')) return '🧂';
  if (name.includes('sucre')) return '🍬';
  if (name.includes('miel')) return '🍯';
  if (name.includes('huile')) return '🫗';

  // Noix
  if (name.includes('cacahuète') || name.includes('cacahouète') || name.includes('arachide')) return '🥜';
  if (name.includes('noix') || name.includes('noisette') || name.includes('amande')) return '🌰';

  // Boissons
  if (name.includes('vin')) return '🍷';
  if (name.includes('bière')) return '🍺';
  if (name.includes('café')) return '☕';
  if (name.includes('thé')) return '🍵';

  // Default
  return '🥘';
};

// --- Add Recipe Form Component ---

interface AddRecipeFormProps {
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
  availableTags: string[];
}

const AddRecipeForm: React.FC<AddRecipeFormProps> = ({ onSave, onCancel, availableTags }) => {
  const [title, setTitle] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState(2);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  const UNIT_OPTIONS = ["(vide)", "g", "kg", "ml", "cl", "L", "c.à.s", "c.à.c", "pincée", "verre", "tasse"];

  // Ingredients: Separate fields
  const [ingredients, setIngredients] = useState<{ qty: string, unit: string, name: string }[]>([{ qty: "", unit: "", name: "" }]);

  // Steps
  const [steps, setSteps] = useState<string[]>([""]);

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

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Construct Recipe Object
    const newRecipe: Recipe = {
      id: Date.now(), // Simple ID generation
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
      tags: [...tags, "Perso"],
      isCustom: true,
      comments: []
    };

    onSave(newRecipe);
  };

  return (
    <div className="add-recipe-view fade-in">
      <button className="back-button" style={{ position: 'static', marginBottom: '20px' }} onClick={onCancel}>
        ⬅ Annuler
      </button>
      <h2 style={{ fontFamily: 'Pacifico, cursive', margin: '0 0 20px 0', color: 'var(--primary-color)', textAlign: 'center' }}>Nouvelle Recette</h2>

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

          <div className="tags-selection-list" style={{ marginBottom: '15px' }}>
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                className={`filter-pill ${tags.includes(tag) ? 'active' : ''}`}
                onClick={() => {
                  if (tags.includes(tag)) {
                    setTags(tags.filter(t => t !== tag));
                  } else {
                    setTags([...tags, tag]);
                  }
                }}
                style={{ margin: '0 5px 5px 0', fontSize: '0.9rem' }}
              >
                {tag}
              </button>
            ))}
          </div>

          {!showTagInput ? (
            <button
              type="button"
              className="add-tag-toggle-btn"
              onClick={() => setShowTagInput(true)}
            >
              <span>+</span> Ajouter un nouveau tag
            </button>
          ) : (
            <div className="tag-input-wrapper fade-in">
              <input
                type="text"
                className="form-input"
                placeholder="Nouveau tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                autoFocus
              />
              <button type="button" className="add-tag-btn" onClick={handleAddTag}>OK</button>
            </div>
          )}

          <div className="tags-preview">
            {tags.map(t => (
              <span key={t} className="preview-tag">
                {t} <button type="button" onClick={() => handleRemoveTag(t)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn">ENREGISTRER LA RECETTE ✨</button>

      </form>
    </div>
  );
};




// --- Database Helper Functions ---

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

    // Transform to Recipe format
    return recipesData.map(dbRecipe =>
      dbRecipeToRecipe(dbRecipe as DbRecipe, commentsByRecipe.get(dbRecipe.id) || [])
    );
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
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

    return dbRecipeToRecipe(data as DbRecipe, []);
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [yums, setYums] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'yums' | 'custom'>('all'); // 'all', 'yums', 'custom'

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch recipes from Supabase on mount
  useEffect(() => {
    async function loadRecipes() {
      setIsLoading(true);
      setError(null);
      try {
        const recipes = await fetchRecipesFromDB();
        setAllRecipes(recipes);
      } catch (err) {
        console.error('Failed to load recipes:', err);
        setError('Impossible de charger les recettes. Vérifiez votre connexion.');
      } finally {
        setIsLoading(false);
      }
    }
    loadRecipes();
  }, []);

  const toggleYum = (id: number) => {
    setYums(prev =>
      prev.includes(id) ? prev.filter(y => y !== id) : [...prev, id]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveRecipe = async (newRecipe: Recipe) => {
    const savedRecipe = await saveRecipeToDB(newRecipe);
    if (savedRecipe) {
      setAllRecipes([savedRecipe, ...allRecipes]);
      setIsAddMode(false);
      setFilterType('custom'); // Switch to custom view to see the new recipe
    } else {
      alert('Erreur lors de la sauvegarde de la recette. Veuillez réessayer.');
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

  // Extract all unique tags
  const allTags = Array.from(new Set(allRecipes.flatMap(r => r.tags))).sort();

  const filteredRecipes = allRecipes.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some(i => i?.ingredient?.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesFilter = true;
    if (filterType === 'yums') matchesFilter = yums.includes(r.id);
    if (filterType === 'custom') matchesFilter = !!r.isCustom;

    // Recipe must contain ALL selected tags
    const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => r.tags.includes(tag));

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
            <AddRecipeForm onSave={handleSaveRecipe} onCancel={() => setIsAddMode(false)} availableTags={allTags} />
          ) : !selectedRecipe ? (
            <div className="list-view fade-in">
              <header className="main-header">
                <h1 className="main-title">Mes Recettes</h1>
                <button className="add-btn-header" onClick={() => setIsAddMode(true)}>+ Ajouter</button>
              </header>

              <SearchBar value={searchTerm} onChange={setSearchTerm} />

              <FilterPills
                allTags={allTags}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
              />

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
              isYummed={yums.includes(selectedRecipe.id)}
              onToggleYum={toggleYum}
              onAddComment={handleAddComment}
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