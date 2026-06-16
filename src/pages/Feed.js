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
      {[1, 2, 3, 4, 5].map((n) => {
        const fraction = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className="feed-star-wrap">
            <span className="feed-star feed-star--base">★</span>
            <span className="feed-star feed-star--fill" style={{ width: `${fraction * 100}%` }}>★</span>
          </span>
        );
      })}
    </div>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="15" height="19" viewBox="0 0 15 19" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M1.5 1.5h12v15.5l-6-4.2-6 4.2V1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <circle cx="6.5" cy="5.3" r="3.8" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 9.1V12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Feed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [savedStoreIds, setSavedStoreIds] = useState(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('racks')
      .select(`
        id,
        user_id,
        rating,
        note,
        created_at,
        items ( id, name, photo_url, price, stores ( id, name, neighborhood, price_range ) ),
        profiles ( username, full_name )
      `)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.log('[Feed] fetch error:', error);
        setPosts(data || []);
        setLoadingPosts(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', user.id),
      supabase.from('saved_posts').select('rack_id').eq('user_id', user.id),
      supabase.from('saved_stores').select('store_id').eq('user_id', user.id),
    ]).then(([followsRes, savedPostsRes, savedStoresRes]) => {
      if (followsRes.error) console.log('[Feed] follows fetch error:', followsRes.error);
      if (savedPostsRes.error) console.log('[Feed] saved_posts fetch error:', savedPostsRes.error);
      if (savedStoresRes.error) console.log('[Feed] saved_stores fetch error:', savedStoresRes.error);
      setFollowingIds(new Set((followsRes.data || []).map((f) => f.following_id)));
      setSavedPostIds(new Set((savedPostsRes.data || []).map((p) => p.rack_id)));
      setSavedStoreIds(new Set((savedStoresRes.data || []).map((s) => s.store_id)));
    });
  }, [user]);

  async function toggleFollow(targetUserId) {
    if (followingIds.has(targetUserId)) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      if (error) { console.log('[Feed] unfollow error:', error); return; }
      setFollowingIds((prev) => { const next = new Set(prev); next.delete(targetUserId); return next; });
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (error) { console.log('[Feed] follow error:', error); return; }
      setFollowingIds((prev) => new Set(prev).add(targetUserId));
    }
  }

  async function toggleBookmark(rackId) {
    if (savedPostIds.has(rackId)) {
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('rack_id', rackId);
      if (error) { console.log('[Feed] unsave post error:', error); return; }
      setSavedPostIds((prev) => { const next = new Set(prev); next.delete(rackId); return next; });
    } else {
      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: user.id, rack_id: rackId });
      if (error) { console.log('[Feed] save post error:', error); return; }
      setSavedPostIds((prev) => new Set(prev).add(rackId));
    }
  }

  async function toggleSaveStore(storeId) {
    if (savedStoreIds.has(storeId)) {
      const { error } = await supabase
        .from('saved_stores')
        .delete()
        .eq('user_id', user.id)
        .eq('store_id', storeId);
      if (error) { console.log('[Feed] unsave store error:', error); return; }
      setSavedStoreIds((prev) => { const next = new Set(prev); next.delete(storeId); return next; });
    } else {
      const { error } = await supabase
        .from('saved_stores')
        .insert({ user_id: user.id, store_id: storeId });
      if (error) { console.log('[Feed] save store error:', error); return; }
      setSavedStoreIds((prev) => new Set(prev).add(storeId));
    }
  }

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
                const fullName = post.profiles?.full_name || post.profiles?.username || 'Someone';
                const storeLine = [store?.name, store?.neighborhood, store?.price_range]
                  .filter(Boolean)
                  .join(' · ');
                const isOwnPost = post.user_id === user.id;
                const isFollowing = followingIds.has(post.user_id);
                const isBookmarked = savedPostIds.has(post.id);
                const isStoreSaved = store?.id ? savedStoreIds.has(store.id) : false;

                return (
                  <article key={post.id} className="feed-card">
                    <div className="feed-card-header">
                      <span className="feed-avatar">{fullName.charAt(0).toUpperCase()}</span>
                      <div className="feed-card-meta">
                        <div className="feed-name-row">
                          <span className="feed-username">{fullName}</span>
                          {!isOwnPost && (
                            isFollowing ? (
                              <span className="feed-follow-badge">Following</span>
                            ) : (
                              <button
                                type="button"
                                className="feed-follow-btn"
                                onClick={() => toggleFollow(post.user_id)}
                              >
                                Follow
                              </button>
                            )
                          )}
                        </div>
                        {storeLine && (
                          <div className="feed-store-row">
                            <span className="feed-store">{storeLine}</span>
                            {store?.id && (
                              <button
                                type="button"
                                className="feed-save-store-btn"
                                onClick={() => toggleSaveStore(store.id)}
                                aria-label={isStoreSaved ? 'Unsave store' : 'Save store'}
                              >
                                <PinIcon filled={isStoreSaved} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="feed-header-right">
                        <span className="feed-time">{formatRelativeTime(post.created_at)}</span>
                        <button
                          type="button"
                          className="feed-bookmark-btn"
                          onClick={() => toggleBookmark(post.id)}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          <BookmarkIcon filled={isBookmarked} />
                        </button>
                      </div>
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
