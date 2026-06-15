import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './auth.css';

export default function Feed() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="auth-page">
        <p className="feed-placeholder">Welcome to your feed</p>
      </main>
    </>
  );
}
