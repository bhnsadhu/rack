import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import './Nav.css';

export default function Nav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="app-nav">
      <Link to="/" className="app-nav-brand">RACK</Link>
      <div className="app-nav-actions">
        {user ? (
          <>
            <Link to="/post" className="app-nav-btn app-nav-btn--fill">Rack it</Link>
            <Link to="/saved" className="app-nav-icon-btn" aria-label="Stash">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 4a3 3 0 0 1 6 0v1H9V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M9 5v3a3 3 0 0 0 6 0V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Link>
            {profile?.username ? (
              <Link to={`/profile/${profile.username}`} className="app-nav-username">
                {profile.full_name || profile.username}
              </Link>
            ) : (
              <span className="app-nav-username">{profile?.full_name || profile?.username || user.email}</span>
            )}
            <button className="app-nav-btn app-nav-btn--outline" onClick={handleSignOut}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="app-nav-btn app-nav-btn--ghost">Log in</Link>
            <Link to="/signup" className="app-nav-btn app-nav-btn--fill">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
