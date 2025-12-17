import { useState, type FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import './UsernamePrompt.css';

interface UsernamePromptProps {
    userId: string;
    onComplete: (username: string) => void;
}

const UsernamePrompt = ({ userId, onComplete }: UsernamePromptProps) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Le pseudo est requis');
            return;
        }

        if (username.length < 3) {
            setError('Le pseudo doit contenir au moins 3 caractères');
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            setError('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores');
            return;
        }

        setLoading(true);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ username: username.trim() })
                .eq('id', userId);

            if (updateError) {
                if (updateError.code === '23505') {
                    setError('Ce pseudo est déjà pris');
                } else {
                    setError('Erreur lors de la sauvegarde du pseudo');
                }
                setLoading(false);
                return;
            }

            onComplete(username.trim());
        } catch (err) {
            setError('Une erreur est survenue');
            setLoading(false);
        }
    };

    return (
        <div className="username-prompt-overlay">
            <div className="username-prompt-modal">
                <h2>Choisissez votre pseudo</h2>
                <p>Votre pseudo sera affiché sur vos recettes</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="MonPseudo"
                        maxLength={20}
                        disabled={loading}
                        autoFocus
                    />

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Valider'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UsernamePrompt;
