import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Allow any email to login
        // Admin check is done later for redirection

        try {
            const { error } = await supabase.auth.signInWithOtp({ email });
            if (error) throw error;
            setMessage('Un lien de connexion magique a été envoyé à votre email !');
        } catch (error: any) {
            console.error('Error logging in:', error.message);
            setMessage('Erreur lors de la connexion : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Check if session exists and redirect
    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
                if (session.user.email?.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                    navigate('/admindesrecettes');
                } else {
                    navigate('/');
                }
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
                if (session.user.email?.trim().toLowerCase() === adminEmail.trim().toLowerCase()) {
                    navigate('/admindesrecettes');
                } else {
                    navigate('/');
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    return (
        <div className="login-container fade-in" style={{
            maxWidth: '400px',
            margin: '100px auto',
            padding: '20px',
            textAlign: 'center',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ fontFamily: 'Pacifico, cursive', color: 'var(--primary-color)' }}>Connexion</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>Connectez-vous pour gérer vos recettes.</p>

            {message && <div style={{
                padding: '10px',
                marginBottom: '20px',
                background: message.startsWith('Erreur') ? '#ffebee' : '#e8f5e9',
                color: message.startsWith('Erreur') ? '#c62828' : '#2e7d32',
                borderRadius: '8px',
                fontSize: '0.9rem'
            }}>{message}</div>}

            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <input
                        type="email"
                        placeholder="Votre email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                    style={{ marginTop: '10px' }}
                >
                    {loading ? 'Envoi en cours...' : 'Envoyer le lien magique'}
                </button>
            </form>
            <button onClick={() => navigate('/')} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>
                Retour au site
            </button>
        </div>
    );
};

export default Login;
