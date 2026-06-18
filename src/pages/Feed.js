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

const STAR_PATH = 'M12 2.5l3.09 6.26L22 9.77l-5 4.87L18.18 21.5 12 17.77 5.82 21.5 7 14.64l-5-4.87 6.91-1.01L12 2.5z';

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d={STAR_PATH} stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="feed-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fraction = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className="feed-star-wrap">
            <StarIcon filled={false} />
            <span className="feed-star-fill-clip" style={{ width: `${fraction * 100}%` }}>
              <StarIcon filled />
            </span>
          </span>
        );
      })}
    </div>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path d="M3 1.5h10v13l-5-3.5-5 3.5v-13z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <circle cx="8" cy="5" r="3.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 8.2V14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" fill={filled ? '#e0473e' : 'none'} aria-hidden="true">
      <path
        d="M9 14.2s-6.2-3.8-7.6-7.7C0.6 3.8 2.4 1.4 5.1 1.4c1.6 0 2.9 0.9 3.9 2.3 1-1.4 2.3-2.3 3.9-2.3 2.7 0 4.5 2.4 3.7 5.1-1.4 3.9-7.6 7.7-7.6 7.7z"
        stroke={filled ? '#e0473e' : 'currentColor'}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden="true">
      <path
        d="M1.5 8.2c0-3.7 3.4-6.5 7.5-6.5s7.5 2.8 7.5 6.5-3.4 6.5-7.5 6.5c-0.9 0-1.8-0.1-2.6-0.4L2.5 16l0.9-3.2c-1.2-1.2-1.9-2.8-1.9-4.6z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none" aria-hidden="true">
      <circle cx="13" cy="3" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3" cy="8.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="13" cy="14" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.7 7.5L11.3 4M4.7 9.5l6.6 3.5" stroke="currentColor" strokeWidth="1.3" />
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
  const [likedIds, setLikedIds] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [tab, setTab] = useState('explore');
  const [commentCounts, setCommentCounts] = useState({});
  const [topComments, setTopComments] = useState({});

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
      .neq('user_id', user.id)
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

  useEffect(() => {
    if (!user || posts.length === 0) return;
    const rackIds = posts.map((p) => p.id);
    Promise.all([
      supabase.from('likes').select('rack_id, user_id').in('rack_id', rackIds),
      supabase.from('comments').select('rack_id').in('rack_id', rackIds),
      supabase
        .from('comments')
        .select('id, rack_id, content, created_at, profiles ( username, full_name )')
        .in('rack_id', rackIds)
        .is('parent_id', null)
        .order('created_at', { ascending: true }),
    ]).then(([likesRes, commentsRes, topCommentsRes]) => {
      if (likesRes.error) console.log('[Feed] likes fetch error:', likesRes.error);
      if (commentsRes.error) console.log('[Feed] comments fetch error:', commentsRes.error);
      if (topCommentsRes.error) console.log('[Feed] top comments fetch error:', topCommentsRes.error);

      const counts = {};
      const liked = new Set();
      (likesRes.data || []).forEach((l) => {
        counts[l.rack_id] = (counts[l.rack_id] || 0) + 1;
        if (l.user_id === user.id) liked.add(l.rack_id);
      });
      setLikeCounts(counts);
      setLikedIds(liked);

      const cCounts = {};
      (commentsRes.data || []).forEach((c) => {
        cCounts[c.rack_id] = (cCounts[c.rack_id] || 0) + 1;
      });
      setCommentCounts(cCounts);

      const topMap = {};
      (topCommentsRes.data || []).forEach((c) => {
        if (!topMap[c.rack_id]) topMap[c.rack_id] = c;
      });
      setTopComments(topMap);
    });
  }, [user, posts]);

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

  async function toggleLike(rackId) {
    if (likedIds.has(rackId)) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('rack_id', rackId);
      if (error) { console.log('[Feed] unlike error:', error); return; }
      setLikedIds((prev) => { const next = new Set(prev); next.delete(rackId); return next; });
      setLikeCounts((prev) => ({ ...prev, [rackId]: Math.max(0, (prev[rackId] || 1) - 1) }));
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: user.id, rack_id: rackId });
      if (error) { console.log('[Feed] like error:', error); return; }
      setLikedIds((prev) => new Set(prev).add(rackId));
      setLikeCounts((prev) => ({ ...prev, [rackId]: (prev[rackId] || 0) + 1 }));
    }
  }

  async function handleShare(rackId) {
    const url = `${window.location.origin}/post/${rackId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(rackId);
      setTimeout(() => setCopiedId((prev) => (prev === rackId ? null : prev)), 1500);
    } catch (err) {
      console.log('[Feed] clipboard error:', err);
    }
  }

  if (authLoading || !user) return null;

  const explorePosts = posts
    .filter((p) => p.user_id !== user.id && !followingIds.has(p.user_id))
    .sort((a, b) => {
      const scoreA = (likeCounts[a.id] || 0) + (commentCounts[a.id] || 0);
      const scoreB = (likeCounts[b.id] || 0) + (commentCounts[b.id] || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  const activePosts = tab === 'explore' ? explorePosts : posts;

  return (
    <>
      <Nav />
      <main className="feed-page">
        <div className="feed-container">
          <div className="feed-tabs">
            <button
              className={`feed-tab${tab === 'explore' ? ' feed-tab--active' : ''}`}
              onClick={() => setTab('explore')}
            >
              Explore
            </button>
            <button
              className={`feed-tab${tab === 'following' ? ' feed-tab--active' : ''}`}
              onClick={() => setTab('following')}
            >
              Following
            </button>
          </div>
          {loadingPosts ? (
            <p className="feed-status">Loading…</p>
          ) : activePosts.length === 0 ? (
            <div className="feed-empty">
              <p>Nothing here yet. Be the first to rack something.</p>
              <Link to="/post" className="feed-empty-link">Rack something new</Link>
            </div>
          ) : (
            <div className="feed-list">
              {activePosts.map((post) => {
                const item = post.items;
                const store = item?.stores;
                const username = post.profiles?.username;
                const fullName = post.profiles?.full_name || username || 'Someone';
                const storeLine = [store?.name, store?.neighborhood, store?.price_range]
                  .filter(Boolean)
                  .join(' · ');
                const isOwnPost = post.user_id === user.id;
                const isFollowing = followingIds.has(post.user_id);
                const isBookmarked = savedPostIds.has(post.id);
                const isStoreSaved = store?.id ? savedStoreIds.has(store.id) : false;
                const isLiked = likedIds.has(post.id);
                const likeCount = likeCounts[post.id] || 0;
                const commentCount = commentCounts[post.id] || 0;
                const topComment = topComments[post.id];

                return (
                  <article key={post.id} className="feed-card">
                    <div className="feed-card-header">
                      {username ? (
                        <Link to={`/profile/${username}`} className="feed-avatar">
                          {fullName.charAt(0).toUpperCase()}
                        </Link>
                      ) : (
                        <span className="feed-avatar">{fullName.charAt(0).toUpperCase()}</span>
                      )}
                      <div className="feed-card-meta">
                        <div className="feed-name-row">
                          {username ? (
                            <Link to={`/profile/${username}`} className="feed-username">{fullName}</Link>
                          ) : (
                            <span className="feed-username">{fullName}</span>
                          )}
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
                          store?.id
                            ? <Link to={`/store/${store.id}`} className="feed-store">{storeLine}</Link>
                            : <span className="feed-store">{storeLine}</span>
                        )}
                      </div>
                      <div className="feed-header-right">
                        <span className="feed-time">{formatRelativeTime(post.created_at)}</span>
                        {store?.id && (
                          <button
                            type="button"
                            className="feed-icon-btn"
                            onClick={() => toggleSaveStore(store.id)}
                            aria-label={isStoreSaved ? 'Unsave store' : 'Save store'}
                          >
                            <PinIcon filled={isStoreSaved} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="feed-icon-btn"
                          onClick={() => toggleBookmark(post.id)}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                        >
                          <BookmarkIcon filled={isBookmarked} />
                        </button>
                      </div>
                    </div>

                    {item?.photo_url && (
                      <Link to={`/post/${post.id}`} className="feed-photo-link">
                        <img src={item.photo_url} alt={item.name} className="feed-photo" />
                      </Link>
                    )}

                    <div className="feed-card-body">
                      <div className="feed-item-row">
                        <span className="feed-item-name">{item?.name}</span>
                        {item?.price != null && <span className="feed-item-price">${item.price}</span>}
                      </div>
                      <StarDisplay rating={post.rating} />
                      {post.note && <p className="feed-note">{post.note}</p>}
                    </div>

                    <div className="feed-actions">
                      <button type="button" className="feed-action-btn" onClick={() => toggleLike(post.id)}>
                        <HeartIcon filled={isLiked} />
                        <span>{likeCount}</span>
                      </button>
                      <button type="button" className="feed-action-btn" onClick={() => navigate(`/post/${post.id}`)}>
                        <CommentIcon />
                        <span>{commentCount}</span>
                      </button>
                      <button type="button" className="feed-action-btn" onClick={() => handleShare(post.id)}>
                        <ShareIcon />
                        <span>{copiedId === post.id ? 'Copied!' : 'Share'}</span>
                      </button>
                    </div>

                    {topComment && (
                      <div className="feed-top-comment">
                        <p className="feed-top-comment-line">
                          <span className="feed-top-comment-user">
                            {topComment.profiles?.full_name || topComment.profiles?.username || 'Someone'}
                          </span>
                          {' '}
                          <span className="feed-top-comment-text">{topComment.content}</span>
                        </p>
                        {commentCount >= 2 && (
                          <Link to={`/post/${post.id}`} className="feed-view-comments">
                            View all {commentCount} comments
                          </Link>
                        )}
                      </div>
                    )}
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
