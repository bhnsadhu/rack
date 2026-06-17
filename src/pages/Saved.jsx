import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './saved.css';

function formatVisitDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PostGrid({ items }) {
  if (!items.length) return <p className="saved-status">Nothing here yet.</p>;
  return (
    <div className="saved-grid">
      {items.map(({ rack_id, racks }) => {
        const item = racks?.items;
        const store = item?.stores;
        return (
          <Link
            key={rack_id}
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
  );
}

const TABS = [
  { id: 'saved', label: 'Saved' },
  { id: 'liked', label: 'Liked' },
  { id: 'commented', label: 'Commented' },
  { id: 'visited', label: 'Visited' },
];

export default function Saved() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('saved');
  const [loading, setLoading] = useState(true);

  const [savedPosts, setSavedPosts] = useState([]);
  const [savedStores, setSavedStores] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [visitedStores, setVisitedStores] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase
        .from('saved_posts')
        .select(`rack_id, racks ( id, items ( id, name, photo_url, price, stores ( id, name, neighborhood ) ) )`)
        .eq('user_id', user.id),

      supabase
        .from('saved_stores')
        .select(`store_id, stores ( id, name, neighborhood, price_range )`)
        .eq('user_id', user.id),

      supabase
        .from('likes')
        .select(`rack_id, racks ( id, items ( id, name, photo_url, price, stores ( id, name ) ) )`)
        .eq('user_id', user.id),

      supabase
        .from('comments')
        .select(`rack_id, racks ( id, items ( id, name, photo_url, price, stores ( id, name ) ) )`)
        .eq('user_id', user.id),

      supabase
        .from('racks')
        .select(`created_at, items ( store_id, stores ( id, name, neighborhood, price_range ) )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([spRes, ssRes, likedRes, commentedRes, racksRes]) => {
      if (spRes.error) console.log('[Saved] saved_posts error:', spRes.error);
      if (ssRes.error) console.log('[Saved] saved_stores error:', ssRes.error);
      if (likedRes.error) console.log('[Saved] likes error:', likedRes.error);
      if (commentedRes.error) console.log('[Saved] comments error:', commentedRes.error);
      if (racksRes.error) console.log('[Saved] racks error:', racksRes.error);

      setSavedPosts(spRes.data || []);
      setSavedStores(ssRes.data || []);
      setLikedPosts(likedRes.data || []);

      const seen = new Set();
      setCommentedPosts(
        (commentedRes.data || []).filter(({ rack_id }) => {
          if (seen.has(rack_id)) return false;
          seen.add(rack_id);
          return true;
        })
      );

      const storeMap = {};
      (racksRes.data || []).forEach((rack) => {
        const store = rack.items?.stores;
        if (!store) return;
        const sid = store.id;
        if (!storeMap[sid]) {
          storeMap[sid] = { store, visits: 0, lastVisit: rack.created_at };
        }
        storeMap[sid].visits += 1;
        if (rack.created_at > storeMap[sid].lastVisit) storeMap[sid].lastVisit = rack.created_at;
      });
      setVisitedStores(Object.values(storeMap));

      setLoading(false);
    });
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <>
      <Nav />
      <main className="saved-page">
        <div className="saved-container">
          <h1 className="saved-heading">Stash</h1>

          <div className="saved-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`saved-tab${tab === t.id ? ' saved-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="saved-status">Loading…</p>
          ) : (
            <>
              {tab === 'saved' && (
                savedPosts.length === 0 && savedStores.length === 0 ? (
                  <p className="saved-status">Nothing saved yet.</p>
                ) : (
                  <>
                    <PostGrid items={savedPosts} />
                    {savedStores.length > 0 && (
                      <div className={savedPosts.length > 0 ? 'saved-stores-section' : ''}>
                        {savedPosts.length > 0 && (
                          <p className="saved-section-label">Saved Stores</p>
                        )}
                        <div className="saved-stores-list">
                          {savedStores.map(({ store_id, stores: store }) => {
                            const meta = [store?.neighborhood, store?.price_range].filter(Boolean).join(' · ');
                            return (
                              <Link key={store_id} to={`/store/${store?.id}`} className="saved-store-card">
                                <div>
                                  <span className="saved-store-name">{store?.name}</span>
                                  {meta && <span className="saved-store-meta">{meta}</span>}
                                </div>
                                <span style={{ color: '#bab0a8', fontSize: '16px' }}>→</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )
              )}

              {tab === 'liked' && <PostGrid items={likedPosts} />}

              {tab === 'commented' && <PostGrid items={commentedPosts} />}

              {tab === 'visited' && (
                visitedStores.length === 0 ? (
                  <p className="saved-status">No visited stores yet.</p>
                ) : (
                  <div className="saved-stores-list">
                    {visitedStores.map(({ store, visits, lastVisit }) => {
                      const meta = [store?.neighborhood, store?.price_range].filter(Boolean).join(' · ');
                      return (
                        <Link key={store?.id} to={`/store/${store?.id}`} className="saved-store-card">
                          <div>
                            <span className="saved-store-name">{store?.name}</span>
                            {meta && <span className="saved-store-meta">{meta}</span>}
                            <span className="saved-store-visits">
                              {visits} visit{visits !== 1 ? 's' : ''} · last {formatVisitDate(lastVisit)}
                            </span>
                          </div>
                          <span style={{ color: '#bab0a8', fontSize: '16px' }}>→</span>
                        </Link>
                      );
                    })}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
