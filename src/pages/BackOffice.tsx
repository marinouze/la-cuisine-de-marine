import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { dbRecipeToRecipe, recipeToDbRecipeForUpdate, type Recipe, type DbRecipe } from '../types';
import RecipeEditForm from '../components/RecipeEditForm';

const BackOffice = () => {
    const [activeTab, setActiveTab] = useState<'recipes'>('recipes');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Recipe Editing State
    const [editMode, setEditMode] = useState<'list' | 'edit'>('list');
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    useEffect(() => {
        checkUser();
        fetchData();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.email !== 'aboo2003@hotmail.com') {
            navigate('/login');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await fetchRecipes();
        setLoading(false);
    };

    const fetchRecipes = async () => {
        const { data } = await supabase
            .from('recipes')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            // Map DbRecipe to Recipe (ignoring comments for list view for now)
            setRecipes(data.map(r => dbRecipeToRecipe(r as DbRecipe, [])));
        }
    };



    // --- Recipe Actions ---

    const toggleRecipeStatus = async (recipe: Recipe) => {
        const newStatus = recipe.status === 'published' ? 'draft' : 'published';

        const { error } = await supabase
            .from('recipes')
            .update({ status: newStatus })
            .eq('id', recipe.id);

        if (!error) {
            setRecipes(recipes.map(r => r.id === recipe.id ? { ...r, status: newStatus } : r));
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const deleteRecipe = async (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
            const { error } = await supabase.from('recipes').delete().eq('id', id);
            if (!error) {
                setRecipes(recipes.filter(r => r.id !== id));
            } else {
                alert('Erreur: ' + error.message);
            }
        }
    };

    const updateRecipe = async (updatedRecipe: Recipe) => {
        const dbRecipe = recipeToDbRecipeForUpdate(updatedRecipe);

        const { error } = await supabase
            .from('recipes')
            .update(dbRecipe)
            .eq('id', updatedRecipe.id);

        if (!error) {
            // Update local state
            setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
            // Return to list view
            setEditMode('list');
            setEditingRecipe(null);
            alert('Recette mise à jour avec succès !');
        } else {
            alert('Erreur lors de la mise à jour: ' + error.message);
        }
    };

    const startEditingRecipe = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setEditMode('edit');
    };

    const cancelEditing = () => {
        setEditMode('list');
        setEditingRecipe(null);
    };



    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;

    return (
        <div className="backoffice-container fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontFamily: 'Pacifico, cursive', color: 'var(--primary-color)', margin: 0 }}>Admin des Recettes</h1>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
                    Retour au site
                </button>
            </header>

            <div className="tabs" style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
                <button
                    onClick={() => setActiveTab('recipes')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        fontWeight: 'bold',
                        background: 'none',
                        color: 'var(--primary-color)',
                        borderBottom: '2px solid var(--primary-color)',
                        cursor: 'pointer'
                    }}
                >
                    Recettes ({recipes.length})
                </button>
            </div>

            {activeTab === 'recipes' && (
                <div>
                    {editMode === 'list' ? (
                        <div className="recipes-list">
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                                <thead style={{ background: '#f5f5f5' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Titre</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
                                        <th style={{ padding: '15px', textAlign: 'left' }}>Date</th>
                                        <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recipes.map(recipe => (
                                        <tr key={recipe.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{recipe.title}</td>
                                            <td style={{ padding: '15px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    background: recipe.status === 'published' ? '#e8f5e9' : '#fff3e0',
                                                    color: recipe.status === 'published' ? '#2e7d32' : '#ef6c00',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {recipe.status === 'published' ? 'PUBLIÉ' : 'BROUILLON'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '15px', fontSize: '0.9rem', color: '#666' }}>
                                                {/* Just displaying ID as placeholder for date if not available in View Model yet */}
                                                #{recipe.id}
                                            </td>
                                            <td style={{ padding: '15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                                <button
                                                    onClick={() => toggleRecipeStatus(recipe)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #ccc',
                                                        cursor: 'pointer',
                                                        background: 'white'
                                                    }}
                                                >
                                                    {recipe.status === 'published' ? 'Dépublier' : 'Publier'}
                                                </button>
                                                <button
                                                    onClick={() => startEditingRecipe(recipe)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #ccc',
                                                        cursor: 'pointer',
                                                        background: '#e3f2fd',
                                                        color: '#1976d2'
                                                    }}
                                                >
                                                    Modifier
                                                </button>
                                                <button
                                                    onClick={() => deleteRecipe(recipe.id)}
                                                    style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer' }}
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : editingRecipe && (
                        <RecipeEditForm
                            recipe={editingRecipe}
                            onSave={updateRecipe}
                            onCancel={cancelEditing}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default BackOffice;
