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
            {profile?.username ? (
              <Link to={`/profile/${profile.username}`} className="app-nav-username">
                {profile.full_name ?? user.email}
              </Link>
            ) : (
              <span className="app-nav-username">{profile?.full_name ?? user.email}</span>
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
