import { useState } from 'react';

interface TagSelectorProps {
    availableTags: string[];
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    onAddNewTag: (tagName: string) => void;
}

const TagSelector = ({ availableTags, selectedTags, onToggleTag, onAddNewTag }: TagSelectorProps) => {
    const [showNewTagInput, setShowNewTagInput] = useState(false);
    const [newTagName, setNewTagName] = useState("");

    const handleSubmitNewTag = () => {
        if (newTagName.trim()) {
            onAddNewTag(newTagName.trim());
            setNewTagName("");
            setShowNewTagInput(false);
        }
    };

    // Separate available tags into unselected and selected
    const unselectedTags = availableTags.filter(tag => !selectedTags.includes(tag));

    return (
        <div className="tag-selector">
            {/* Available tags as pills */}
            {unselectedTags.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#888', marginBottom: '8px' }}>
                        Tags disponibles :
                    </div>
                    <div className="tag-pills-available">
                        {unselectedTags.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                className="tag-pill-selectable"
                                onClick={() => onToggleTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Add new tag button/input */}
            {!showNewTagInput ? (
                <button
                    type="button"
                    className="add-tag-toggle-btn"
                    onClick={() => setShowNewTagInput(true)}
                >
                    + Créer un nouveau tag
                </button>
            ) : (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Nom du nouveau tag..."
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSubmitNewTag())}
                        autoFocus
                        style={{ flex: 1 }}
                    />
                    <button
                        type="button"
                        className="tag-confirm-btn"
                        onClick={handleSubmitNewTag}
                        disabled={!newTagName.trim()}
                    >
                        OK
                    </button>
                    <button
                        type="button"
                        className="tag-cancel-btn"
                        onClick={() => { setShowNewTagInput(false); setNewTagName(''); }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Selected tags display */}
            {selectedTags.length > 0 && (
                <div style={{ marginTop: '15px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#888', marginBottom: '8px' }}>
                        Tags sélectionnés :
                    </div>
                    <div className="tags-preview">
                        {selectedTags.map(tag => (
                            <div key={tag} className="preview-tag">
                                <span>{tag}</span>
                                <button
                                    type="button"
                                    onClick={() => onToggleTag(tag)}
                                    aria-label={`Retirer ${tag}`}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagSelector;
