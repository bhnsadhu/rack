import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './search.css';

export default function Search() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [storeCounts, setStoreCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [profilesRes, followsRes, storesRes, itemsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name')
          .neq('id', user.id),
        supabase
          .from('follows')
          .select('following_id'),
        supabase
          .from('stores')
          .select('id, name, neighborhood, price_range'),
        supabase
          .from('items')
          .select('store_id'),
      ]);

      if (profilesRes.error) console.log('[Search] profiles error:', profilesRes.error);
      if (storesRes.error) console.log('[Search] stores error:', storesRes.error);

      const followerCounts = {};
      (followsRes.data || []).forEach(({ following_id }) => {
        if (following_id) followerCounts[following_id] = (followerCounts[following_id] || 0) + 1;
      });

      const profiles = (profilesRes.data || [])
        .map((p) => ({ ...p, followers_count: followerCounts[p.id] || 0 }))
        .sort((a, b) => b.followers_count - a.followers_count);

      const counts = {};
      (itemsRes.data || []).forEach(({ store_id }) => {
        if (store_id) counts[store_id] = (counts[store_id] || 0) + 1;
      });

      setAllProfiles(profiles);
      setAllStores(storesRes.data || []);
      setStoreCounts(counts);
      setLoading(false);
    }
    load();
  }, [user]);

  if (authLoading || !user) return null;

  const q = query.trim().toLowerCase();

  const filteredProfiles = q
    ? allProfiles.filter(
        (p) =>
          p.username?.toLowerCase().includes(q) ||
          p.full_name?.toLowerCase().includes(q)
      )
    : allProfiles.slice(0, 5);

  const storesSorted = [...allStores].sort(
    (a, b) => (storeCounts[b.id] || 0) - (storeCounts[a.id] || 0)
  );

  const filteredStores = q
    ? storesSorted.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.neighborhood?.toLowerCase().includes(q)
      )
    : storesSorted.slice(0, 5);

  return (
    <>
      <Nav />
      <main className="search-page">
        <div className="search-container">
          <div className="search-input-wrap">
            <svg className="search-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Search people and stores…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {loading ? (
            <p className="search-status">Loading…</p>
          ) : (
            <>
              <section className="search-section">
                <p className="search-section-label">People</p>
                {filteredProfiles.length === 0 ? (
                  <p className="search-empty">No people found.</p>
                ) : (
                  <div className="search-list">
                    {filteredProfiles.map((profile) => (
                      <Link
                        key={profile.id}
                        to={`/profile/${profile.username}`}
                        className="search-row"
                      >
                        <span className="search-avatar">
                          {(profile.full_name || profile.username || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="search-row-info">
                          <span className="search-row-name">
                            {profile.full_name || profile.username}
                          </span>
                          <span className="search-row-sub">@{profile.username}</span>
                        </div>
                        <span className="search-row-meta">
                          {profile.followers_count} follower{profile.followers_count !== 1 ? 's' : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section className="search-section">
                <p className="search-section-label">Stores</p>
                {filteredStores.length === 0 ? (
                  <p className="search-empty">No stores found.</p>
                ) : (
                  <div className="search-list">
                    {filteredStores.map((store) => {
                      const meta = [store.neighborhood, store.price_range]
                        .filter(Boolean)
                        .join(' · ');
                      const count = storeCounts[store.id] || 0;
                      return (
                        <Link
                          key={store.id}
                          to={`/store/${store.id}`}
                          className="search-row"
                        >
                          <div className="search-row-info">
                            <span className="search-row-name">{store.name}</span>
                            {meta && <span className="search-row-sub">{meta}</span>}
                          </div>
                          <span className="search-row-meta">
                            {count} post{count !== 1 ? 's' : ''}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
