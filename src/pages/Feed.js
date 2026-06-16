import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './feed.css';

function formatRelativeTime(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function StarDisplay({ rating }) {
  return (
    <div className="feed-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`feed-star${n <= rating ? ' feed-star--on' : ''}`}>★</span>
      ))}
    </div>
  );
}

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('racks')
      .select(`
        id,
        rating,
        note,
        created_at,
        items ( name, photo_url, price, stores ( name, neighborhood, price_range ) ),
        profiles ( username )
      `)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.log('[Feed] fetch error:', error);
        setPosts(data || []);
        setLoadingPosts(false);
      });
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <>
      <Nav />
      <main className="feed-page">
        <div className="feed-container">
          {loadingPosts ? (
            <p className="feed-status">Loading…</p>
          ) : posts.length === 0 ? (
            <div className="feed-empty">
              <p>Nothing here yet. Be the first to rack something.</p>
              <Link to="/post" className="feed-empty-link">Rack something new</Link>
            </div>
          ) : (
            <div className="feed-list">
              {posts.map((post) => {
                const item = post.items;
                const store = item?.stores;
                const username = post.profiles?.username ?? 'Someone';
                const storeLine = [store?.name, store?.neighborhood, store?.price_range]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <article key={post.id} className="feed-card">
                    <div className="feed-card-header">
                      <span className="feed-avatar">{username.charAt(0).toUpperCase()}</span>
                      <div className="feed-card-meta">
                        <span className="feed-username">{username}</span>
                        {storeLine && <span className="feed-store">{storeLine}</span>}
                      </div>
                      <span className="feed-time">{formatRelativeTime(post.created_at)}</span>
                    </div>

                    {item?.photo_url && (
                      <img src={item.photo_url} alt={item.name} className="feed-photo" />
                    )}

                    <div className="feed-card-body">
                      <div className="feed-item-row">
                        <span className="feed-item-name">{item?.name}</span>
                        {item?.price != null && <span className="feed-item-price">${item.price}</span>}
                      </div>
                      <StarDisplay rating={post.rating} />
                      {post.note && <p className="feed-note">{post.note}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
