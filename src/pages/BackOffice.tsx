import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { dbRecipeToRecipe, recipeToDbRecipe, type Recipe, type DbRecipe, type Tag, type DbTag } from '../types';

const BackOffice: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'recipes' | 'tags'>('recipes');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Recipe Editing State
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    // Tag Editing State
    const [newTagName, setNewTagName] = useState('');
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

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
        await Promise.all([fetchRecipes(), fetchTags()]);
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
            .order('name');

        if (data) {
            setTags(data as Tag[]);
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

    // --- Tag Actions ---

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTagName.trim()) return;

        const { data, error } = await supabase
            .from('tags')
            .insert([{ name: newTagName.trim() }])
            .select()
            .single();

        if (!error && data) {
            setTags([...tags, data as Tag]);
            setNewTagName('');
        } else {
            alert('Erreur: ' + (error?.message || 'Inconnue'));
        }
    };

    const updateTag = async (tag: Tag, newName: string) => {
        const { error } = await supabase
            .from('tags')
            .update({ name: newName })
            .eq('id', tag.id);

        if (!error) {
            setTags(tags.map(t => t.id === tag.id ? { ...t, name: newName } : t));
            setEditingTag(null);
        } else {
            alert('Erreur: ' + error.message);
        }
    };

    const deleteTag = async (id: number) => {
        if (confirm('Supprimer ce tag ?')) {
            const { error } = await supabase.from('tags').delete().eq('id', id);
            if (!error) {
                setTags(tags.filter(t => t.id !== id));
            } else {
                alert('Erreur (peut-être utilisé ?): ' + error.message);
            }
        }
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
                        color: activeTab === 'recipes' ? 'var(--primary-color)' : '#999',
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
                        color: activeTab === 'tags' ? 'var(--primary-color)' : '#999',
                        borderBottom: activeTab === 'tags' ? '2px solid var(--primary-color)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Tags ({tags.length})
                </button>
            </div>

            {activeTab === 'recipes' && (
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
            )}

            {activeTab === 'tags' && (
                <div className="tags-manager">
                    <form onSubmit={handleAddTag} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            placeholder="Nouveau tag..."
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '300px' }}
                        />
                        <button type="submit" disabled={!newTagName} className="submit-btn" style={{ width: 'auto' }}>Ajouter</button>
                    </form>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {tags.map(tag => (
                            <div key={tag.id} style={{
                                background: 'white',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                {editingTag?.id === tag.id ? (
                                    <input
                                        autoFocus
                                        defaultValue={tag.name}
                                        onBlur={(e) => updateTag(tag, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') updateTag(tag, e.currentTarget.value);
                                            if (e.key === 'Escape') setEditingTag(null);
                                        }}
                                        style={{ padding: '5px', width: '100%' }}
                                    />
                                ) : (
                                    <span style={{ fontWeight: 600, color: '#555' }}>{tag.name}</span>
                                )}

                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => setEditingTag(tag)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✏️</button>
                                    <button onClick={() => deleteTag(tag.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackOffice;
