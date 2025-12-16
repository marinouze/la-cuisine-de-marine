import { useState } from 'react';
import { getIngredientEmoji } from '../utils/ingredientEmoji';
import type { Recipe } from '../types';

interface RecipeEditFormProps {
    recipe: Recipe;
    onSave: (recipe: Recipe) => void;
    onCancel: () => void;
    availableTags: string[];
}

const RecipeEditForm = ({ recipe, onSave, onCancel, availableTags }: RecipeEditFormProps) => {
    // Initialize state with existing recipe data
    const [title, setTitle] = useState(recipe.title);
    const [prepTime, setPrepTime] = useState(recipe.prepTime);
    const [cookTime, setCookTime] = useState(recipe.cookTime);
    const [servings, setServings] = useState(recipe.servings);
    const [tags, setTags] = useState<string[]>(recipe.tags.filter(t => t !== 'Perso')); // Remove auto-added tags
    const [tagInput, setTagInput] = useState("");
    const [showTagInput, setShowTagInput] = useState(false);

    const UNIT_OPTIONS = ["(vide)", "g", "kg", "ml", "cl", "L", "c.à.s", "c.à.c", "pincée", "verre", "tasse"];

    // Initialize ingredients from recipe
    const [ingredients, setIngredients] = useState<{ qty: string, unit: string, name: string }[]>(
        recipe.ingredients.map(ing => ({
            qty: ing.quantity?.toString() || '',
            unit: ing.unit || '',
            name: ing.ingredient
        }))
    );

    // Initialize steps from recipe
    const [steps, setSteps] = useState<string[]>(recipe.steps);

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

        // Construct updated Recipe Object
        const updatedRecipe: Recipe = {
            ...recipe, // Keep id, status, etc.
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
            tags: recipe.isCustom ? [...tags, "Perso"] : tags
        };

        onSave(updatedRecipe);
    };

    return (
        <div className="add-recipe-view fade-in">
            <button className="back-button" style={{ position: 'static', marginBottom: '20px' }} onClick={onCancel}>
                ⬅ Annuler
            </button>
            <h2 style={{ fontFamily: 'Pacifico, cursive', margin: '0 0 20px 0', color: 'var(--primary-color)', textAlign: 'center' }}>
                Modifier la Recette
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

                    <div className="tags-selection-list" style={{ marginBottom: '15px' }}>
                        {availableTags.map((tag: string) => (
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

                <button type="submit" className="submit-btn">ENREGISTRER LES MODIFICATIONS ✨</button>

            </form>
        </div>
    );
};

export default RecipeEditForm;
