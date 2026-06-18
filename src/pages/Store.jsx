import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './store.css';

const STAR_PATH = 'M12 2.5l3.09 6.26L22 9.77l-5 4.87L18.18 21.5 12 17.77 5.82 21.5 7 14.64l-5-4.87 6.91-1.01L12 2.5z';

function StarIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d={STAR_PATH} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="store-stars" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fraction = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className="store-star-wrap">
            <StarIcon filled={false} />
            <span className="store-star-fill-clip" style={{ width: `${fraction * 100}%` }}>
              <StarIcon filled />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function Store() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id, name, neighborhood, city, price_range')
        .eq('id', id)
        .maybeSingle();

      if (storeError) { setNotFound(true); setLoading(false); return; }
      if (!storeData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStore(storeData);

      const { data: postsData } = await supabase
        .from('racks')
        .select(`
          id, rating, created_at, user_id,
          items!inner ( id, name, photo_url, price, store_id ),
          profiles ( username, full_name )
        `)
        .eq('items.store_id', id)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
      setLoading(false);
    }

    load();
  }, [user, id]);

  const avgRating =
    posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.rating || 0), 0) / posts.length
      : null;

  if (authLoading || !user) return null;

  return (
    <>
      <Nav />
      <main className="store-page">
        {loading ? (
          <p className="store-status">Loading…</p>
        ) : notFound ? (
          <p className="store-status">Store not found.</p>
        ) : (
          <div className="store-container">
            <button type="button" className="page-back-btn" onClick={() => navigate(-1)}>← Back</button>
            <div className="store-header">
              <h1 className="store-name">{store.name}</h1>
              <p className="store-meta">
                {[store.neighborhood, store.city, store.price_range].filter(Boolean).join(' · ')}
              </p>
              {avgRating !== null && (
                <div className="store-rating">
                  <StarDisplay rating={avgRating} />
                  <span className="store-rating-text">
                    {avgRating.toFixed(1)} avg · {posts.length} post{posts.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {posts.length === 0 ? (
              <p className="store-status">No posts yet.</p>
            ) : (
              <div className="store-grid">
                {posts.map((post) => {
                  const item = post.items;
                  const username = post.profiles?.username;
                  const fullName = post.profiles?.full_name || username || 'Someone';
                  return (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      className="store-grid-item"
                    >
                      <div className="store-grid-photo-wrap">
                        {item?.photo_url && (
                          <img src={item.photo_url} alt={item.name} className="store-grid-photo" />
                        )}
                      </div>
                      <span className="store-grid-name">{item?.name}</span>
                      {item?.price != null && <span className="store-grid-price">${item.price}</span>}
                      <span className="store-grid-poster">{fullName}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
