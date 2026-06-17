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
            <Link to="/saved" className="app-nav-icon-btn" aria-label="Saved">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 1.5h10v13l-5-3.5-5 3.5v-13z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
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
