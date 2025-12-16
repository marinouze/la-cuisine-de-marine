import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { dbRecipeToRecipe, recipeToDbRecipeForUpdate, type Recipe, type DbRecipe } from '../types';
import RecipeEditForm from '../components/RecipeEditForm';

const BackOffice = () => {
    const [activeTab, setActiveTab] = useState<'recipes' | 'tags'>('recipes');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Recipe Editing State
    const [editMode, setEditMode] = useState<'list' | 'edit'>('list');
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    // Tag Management State
    const [newTagName, setNewTagName] = useState('');
    const [editingTag, setEditingTag] = useState<{ id: number; name: string } | null>(null);

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
        await fetchTags();
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

    const fetchTags = async () => {
        const { data } = await supabase
            .from('tags')
            .select('*')
            .order('name', { ascending: true });

        if (data) {
            setTags(data);
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
            // Save tags if present
            if (updatedRecipe.tags && updatedRecipe.tags.length > 0) {
                // First ensure all tags exist
                for (const tagName of updatedRecipe.tags) {
                    try {
                        await supabase
                            .from('tags')
                            .upsert(
                                { name: tagName, created_by: 'admin' },
                                { onConflict: 'name', ignoreDuplicates: true }
                            )
                            .select()
                            .single();
                    } catch {
                        // Silently ignore conflicts (tag already exists)
                    }
                }

                // Get tag IDs
                const { data: tagData } = await supabase
                    .from('tags')
                    .select('id, name')
                    .in('name', updatedRecipe.tags);

                if (tagData) {
                    // Delete existing recipe_tags
                    await supabase
                        .from('recipe_tags')
                        .delete()
                        .eq('recipe_id', updatedRecipe.id);

                    // Insert new recipe_tags
                    const recipeTagsToInsert = tagData.map(tag => ({
                        recipe_id: updatedRecipe.id,
                        tag_id: tag.id
                    }));

                    await supabase
                        .from('recipe_tags')
                        .insert(recipeTagsToInsert);
                }
            } else {
                // If no tags, remove all existing associations
                await supabase
                    .from('recipe_tags')
                    .delete()
                    .eq('recipe_id', updatedRecipe.id);
            }

            // Update local state
            setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
            // Refresh tags list in case new ones were added
            await fetchTags();
            // Return to list view
            setEditMode('list');
            setEditingRecipe(null);
            alert('Recette mise à jour avec succès !');
        } else {
            alert('Erreur lors de la mise à jour: ' + error.message);
        }
    };

    const startEditingRecipe = async (recipe: Recipe) => {
        // Fetch tags for this recipe
        const { data: recipeTagsData } = await supabase
            .from('recipe_tags')
            .select('tags!inner(name)')
            .eq('recipe_id', recipe.id);

        const recipeTags = (recipeTagsData || []).map((rt: any) => rt.tags.name);

        setEditingRecipe({ ...recipe, tags: recipeTags });
        setEditMode('edit');
    };

    const cancelEditing = () => {
        setEditMode('list');
        setEditingRecipe(null);
    };

    // --- Tag Actions ---

    const createTag = async () => {
        if (!newTagName.trim()) return;

        const { error } = await supabase
            .from('tags')
            .insert([{ name: newTagName.trim(), created_by: 'admin' }]);

        if (!error) {
            setNewTagName('');
            await fetchTags();
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const updateTag = async () => {
        if (!editingTag || !editingTag.name.trim()) return;

        const { error } = await supabase
            .from('tags')
            .update({ name: editingTag.name.trim() })
            .eq('id', editingTag.id);

        if (!error) {
            setEditingTag(null);
            await fetchTags();
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const deleteTag = async (id: number) => {
        // Check if tag is in use
        const { data: usageData } = await supabase
            .from('recipe_tags')
            .select('id')
            .eq('tag_id', id)
            .limit(1);

        if (usageData && usageData.length > 0) {
            if (!confirm('Ce tag est utilisé par des recettes. Êtes-vous sûr de vouloir le supprimer ?')) {
                return;
            }
        } else {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) {
                return;
            }
        }

        const { error } = await supabase.from('tags').delete().eq('id', id);
        if (!error) {
            await fetchTags();
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };



    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;

    return (
        <div className="backoffice-container fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontFamily: 'Pacifico, cursive', color: 'var(--primary-color)', margin: 0 }}>Admin des Recettes</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #ccc', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
                        Retour au site
                    </button>
                    <button onClick={handleLogout} style={{ background: '#ffebee', border: '1px solid #c62828', color: '#c62828', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Déconnexion
                    </button>
                </div>
            </header>

            <div className="tabs" style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #eee' }}>
                <button
                    onClick={() => setActiveTab('recipes')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        fontWeight: 'bold',
                        background: 'none',
                        color: activeTab === 'recipes' ? 'var(--primary-color)' : '#888',
                        borderBottom: activeTab === 'recipes' ? '2px solid var(--primary-color)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Recettes ({recipes.length})
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        fontWeight: 'bold',
                        background: 'none',
                        color: activeTab === 'tags' ? 'var(--primary-color)' : '#888',
                        borderBottom: activeTab === 'tags' ? '2px solid var(--primary-color)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Tags ({tags.length})
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
                            availableTags={tags.map(t => t.name)}
                        />
                    )}
                </div>
            )}

            {activeTab === 'tags' && (
                <div>
                    {/* Create New Tag */}
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: 'var(--accent-color)' }}>Créer un nouveau tag</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Nom du tag..."
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '1rem'
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && createTag()}
                            />
                            <button
                                onClick={createTag}
                                style={{
                                    padding: '12px 24px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Créer
                            </button>
                        </div>
                    </div>

                    {/* Tags List */}
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f5f5f5' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Nom</th>
                                    <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tags.map(tag => (
                                    <tr key={tag.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '15px' }}>
                                            {editingTag && editingTag.id === tag.id ? (
                                                <input
                                                    type="text"
                                                    value={editingTag.name}
                                                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                                                    style={{
                                                        padding: '8px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '6px',
                                                        fontSize: '1rem'
                                                    }}
                                                    onKeyPress={(e) => e.key === 'Enter' && updateTag()}
                                                />
                                            ) : (
                                                <span style={{ fontWeight: '600', fontSize: '1rem' }}>{tag.name}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                            {editingTag && editingTag.id === tag.id ? (
                                                <>
                                                    <button
                                                        onClick={updateTag}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#4caf50',
                                                            color: 'white',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Sauvegarder
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingTag(null)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #ccc',
                                                            background: 'white',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Annuler
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setEditingTag({ id: tag.id, name: tag.name })}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #ccc',
                                                            background: '#e3f2fd',
                                                            color: '#1976d2',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTag(tag.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#ffebee',
                                                            color: '#c62828',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackOffice;
