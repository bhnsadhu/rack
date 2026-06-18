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
            <Link to="/search" className="app-nav-icon-btn" aria-label="Search">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </Link>
            <Link to="/post" className="app-nav-btn app-nav-btn--fill">Rack it</Link>
            <Link to="/saved" className="app-nav-icon-btn" aria-label="Stash">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </Link>
            {profile?.username ? (
              <Link to={`/profile/${profile.username}`} className="app-nav-username">
                {profile.full_name || profile.username}
              </Link>
            ) : (
              <span className="app-nav-username">{profile?.full_name || profile?.username || user.email}</span>
            )}
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
