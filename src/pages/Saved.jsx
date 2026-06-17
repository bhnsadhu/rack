import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './saved.css';

export default function Saved() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('posts');
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedStores, setSavedStores] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('saved_posts')
      .select(`
        rack_id,
        racks (
          id, rating, created_at,
          items ( id, name, photo_url, price, stores ( id, name, neighborhood ) )
        )
      `)
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) console.log('[Saved] posts fetch error:', error);
        setSavedPosts(data || []);
        setLoadingPosts(false);
      });

    supabase
      .from('saved_stores')
      .select(`
        store_id,
        stores ( id, name, neighborhood, price_range )
      `)
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) console.log('[Saved] stores fetch error:', error);
        setSavedStores(data || []);
        setLoadingStores(false);
      });
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <>
      <Nav />
      <main className="saved-page">
        <div className="saved-container">
          <div className="saved-tabs">
            <button
              className={`saved-tab${tab === 'posts' ? ' saved-tab--active' : ''}`}
              onClick={() => setTab('posts')}
            >
              Posts
            </button>
            <button
              className={`saved-tab${tab === 'stores' ? ' saved-tab--active' : ''}`}
              onClick={() => setTab('stores')}
            >
              Stores
            </button>
          </div>

          {tab === 'posts' && (
            loadingPosts ? (
              <p className="saved-status">Loading…</p>
            ) : savedPosts.length === 0 ? (
              <p className="saved-status">No saved posts yet.</p>
            ) : (
              <div className="saved-grid">
                {savedPosts.map((sp) => {
                  const item = sp.racks?.items;
                  const store = item?.stores;
                  return (
                    <Link
                      key={sp.rack_id}
                      to={store?.id ? `/store/${store.id}` : '/feed'}
                      className="saved-grid-item"
                    >
                      <div className="saved-grid-photo-wrap">
                        {item?.photo_url && (
                          <img src={item.photo_url} alt={item.name} className="saved-grid-photo" />
                        )}
                      </div>
                      <span className="saved-grid-name">{item?.name}</span>
                      {item?.price != null && <span className="saved-grid-price">${item.price}</span>}
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {tab === 'stores' && (
            loadingStores ? (
              <p className="saved-status">Loading…</p>
            ) : savedStores.length === 0 ? (
              <p className="saved-status">No saved stores yet.</p>
            ) : (
              <div className="saved-stores-list">
                {savedStores.map((ss) => {
                  const store = ss.stores;
                  const meta = [store?.neighborhood, store?.price_range].filter(Boolean).join(' · ');
                  return (
                    <Link
                      key={ss.store_id}
                      to={`/store/${store.id}`}
                      className="saved-store-card"
                    >
                      <span className="saved-store-name">{store?.name}</span>
                      {meta && <span className="saved-store-meta">{meta}</span>}
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}
