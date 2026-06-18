import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './postDetail.css';

function formatRelativeTime(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
    <div className="pd-stars">
      {[1, 2, 3, 4, 5].map((n) => {
        const fraction = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className="pd-star-wrap">
            <StarIcon filled={false} />
            <span className="pd-star-fill-clip" style={{ width: `${fraction * 100}%` }}>
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

export default function PostDetail() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isStoreSaved, setIsStoreSaved] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [postRes, commentsRes] = await Promise.all([
        supabase
          .from('racks')
          .select(`
            id, user_id, rating, note, created_at,
            items ( id, name, photo_url, price, stores ( id, name, neighborhood, price_range ) ),
            profiles ( username, full_name )
          `)
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('comments')
          .select('id, content, created_at, user_id, parent_id, profiles ( username, full_name )')
          .eq('rack_id', id)
          .order('created_at', { ascending: true }),
      ]);

      if (postRes.error) console.log('[PostDetail] post error:', postRes.error);
      if (!postRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(postRes.data);

      if (commentsRes.error) console.log('[PostDetail] comments error:', commentsRes.error);
      setComments(commentsRes.data || []);

      const storeId = postRes.data.items?.stores?.id;
      const [likesRes, likedRes, savedRes, savedStoreRes] = await Promise.all([
        supabase.from('likes').select('rack_id').eq('rack_id', id),
        supabase.from('likes').select('rack_id').eq('user_id', user.id).eq('rack_id', id).maybeSingle(),
        supabase.from('saved_posts').select('rack_id').eq('user_id', user.id).eq('rack_id', id).maybeSingle(),
        storeId
          ? supabase.from('saved_stores').select('store_id').eq('user_id', user.id).eq('store_id', storeId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setLikeCount(likesRes.data?.length ?? 0);
      setIsLiked(!!likedRes.data);
      setIsBookmarked(!!savedRes.data);
      setIsStoreSaved(!!savedStoreRes.data);
      setLoading(false);
    }
    load();
  }, [user, id]);

  async function toggleLike() {
    if (!post) return;
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('rack_id', post.id);
      setIsLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, rack_id: post.id });
      setIsLiked(true);
      setLikeCount((c) => c + 1);
    }
  }

  async function toggleBookmark() {
    if (!post) return;
    if (isBookmarked) {
      await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('rack_id', post.id);
      setIsBookmarked(false);
    } else {
      await supabase.from('saved_posts').insert({ user_id: user.id, rack_id: post.id });
      setIsBookmarked(true);
    }
  }

  async function toggleSaveStore() {
    const storeId = post?.items?.stores?.id;
    if (!storeId) return;
    if (isStoreSaved) {
      await supabase.from('saved_stores').delete().eq('user_id', user.id).eq('store_id', storeId);
      setIsStoreSaved(false);
    } else {
      await supabase.from('saved_stores').insert({ user_id: user.id, store_id: storeId });
      setIsStoreSaved(true);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/post/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.log('[PostDetail] clipboard error:', err);
    }
  }

  async function submitComment() {
    const content = commentDraft.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, rack_id: id, content })
      .select('id, content, created_at, user_id, parent_id, profiles ( username, full_name )')
      .single();
    if (error) {
      console.log('[PostDetail] comment error:', error);
      setSubmitting(false);
      return;
    }
    setComments((prev) => [...prev, data]);
    setCommentDraft('');
    setSubmitting(false);
  }

  async function submitReply(parentId) {
    const content = replyDraft.trim();
    if (!content || replySubmitting) return;
    setReplySubmitting(true);
    const { data, error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, rack_id: id, content, parent_id: parentId })
      .select('id, content, created_at, user_id, parent_id, profiles ( username, full_name )')
      .single();
    if (error) {
      console.log('[PostDetail] reply error:', error);
      setReplySubmitting(false);
      return;
    }
    setComments((prev) => [...prev, data]);
    setReplyDraft('');
    setReplyingTo(null);
    setReplySubmitting(false);
  }

  if (authLoading || !user) return null;

  if (loading) {
    return (
      <>
        <Nav />
        <main className="pd-page">
          <div className="pd-container">
            <p className="pd-status">Loading…</p>
          </div>
        </main>
      </>
    );
  }

  if (notFound || !post) {
    return (
      <>
        <Nav />
        <main className="pd-page">
          <div className="pd-container">
            <p className="pd-status">Post not found.</p>
          </div>
        </main>
      </>
    );
  }

  const item = post.items;
  const store = item?.stores;
  const username = post.profiles?.username;
  const fullName = post.profiles?.full_name || username || 'Someone';
  const storeLine = [store?.name, store?.neighborhood, store?.price_range].filter(Boolean).join(' · ');

  // Build comment tree
  const topLevelComments = comments
    .filter((c) => !c.parent_id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const repliesByParentId = {};
  comments
    .filter((c) => c.parent_id)
    .forEach((c) => {
      if (!repliesByParentId[c.parent_id]) repliesByParentId[c.parent_id] = [];
      repliesByParentId[c.parent_id].push(c);
    });

  function renderComment(comment, depth = 0) {
    const cUsername = comment.profiles?.username;
    const cName = comment.profiles?.full_name || cUsername || 'Someone';
    const replies = (repliesByParentId[comment.id] || []).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={depth > 0 ? 'pd-comment pd-comment--reply' : 'pd-comment'}>
        <span className="pd-comment-avatar">{cName.charAt(0).toUpperCase()}</span>
        <div className="pd-comment-body">
          <div className="pd-comment-top">
            {cUsername ? (
              <Link to={`/profile/${cUsername}`} className="pd-comment-username">{cName}</Link>
            ) : (
              <span className="pd-comment-username">{cName}</span>
            )}
            <span className="pd-comment-time">{formatRelativeTime(comment.created_at)}</span>
          </div>
          <p className="pd-comment-text">{comment.content}</p>
          <button
            type="button"
            className="pd-reply-btn"
            onClick={() => {
              setReplyingTo(isReplying ? null : comment.id);
              setReplyDraft('');
            }}
          >
            Reply
          </button>
          {isReplying && (
            <div className="pd-reply-box">
              <input
                className="pd-comment-input"
                type="text"
                placeholder="Write a reply…"
                value={replyDraft}
                autoFocus
                onChange={(e) => setReplyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); submitReply(comment.id); }
                }}
              />
              <button
                type="button"
                className="pd-comment-submit"
                onClick={() => submitReply(comment.id)}
                disabled={!replyDraft.trim() || replySubmitting}
              >
                Post
              </button>
            </div>
          )}
          {replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Nav />
      <main className="pd-page">
        <div className="pd-container">
          <button type="button" className="pd-back" onClick={() => navigate(-1)}>
            ← Back
          </button>

          <article className="pd-card">
            <div className="pd-card-header">
              {username ? (
                <Link to={`/profile/${username}`} className="pd-avatar">
                  {fullName.charAt(0).toUpperCase()}
                </Link>
              ) : (
                <span className="pd-avatar">{fullName.charAt(0).toUpperCase()}</span>
              )}
              <div className="pd-card-meta">
                <div className="pd-name-row">
                  {username ? (
                    <Link to={`/profile/${username}`} className="pd-username">{fullName}</Link>
                  ) : (
                    <span className="pd-username">{fullName}</span>
                  )}
                </div>
                {storeLine && (
                  store?.id
                    ? <Link to={`/store/${store.id}`} className="pd-store">{storeLine}</Link>
                    : <span className="pd-store">{storeLine}</span>
                )}
              </div>
              <div className="pd-header-right">
                <span className="pd-time">{formatRelativeTime(post.created_at)}</span>
                {store?.id && (
                  <button type="button" className="pd-icon-btn" onClick={toggleSaveStore} aria-label={isStoreSaved ? 'Unsave store' : 'Save store'}>
                    <PinIcon filled={isStoreSaved} />
                  </button>
                )}
                <button type="button" className="pd-icon-btn" onClick={toggleBookmark} aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}>
                  <BookmarkIcon filled={isBookmarked} />
                </button>
              </div>
            </div>

            {item?.photo_url && (
              <img src={item.photo_url} alt={item.name} className="pd-photo" />
            )}

            <div className="pd-card-body">
              <div className="pd-item-row">
                <span className="pd-item-name">{item?.name}</span>
                {item?.price != null && <span className="pd-item-price">${item.price}</span>}
              </div>
              <StarDisplay rating={post.rating} />
              {post.note && <p className="pd-note">{post.note}</p>}
            </div>

            <div className="pd-actions">
              <button type="button" className="pd-action-btn" onClick={toggleLike}>
                <HeartIcon filled={isLiked} />
                <span>{likeCount}</span>
              </button>
              <button type="button" className="pd-action-btn" onClick={handleShare}>
                <ShareIcon />
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </article>

          <div className="pd-comments">
            {topLevelComments.length > 0 && (
              <div className="pd-comments-list">
                {topLevelComments.map((c) => renderComment(c))}
              </div>
            )}

            <div className="pd-comment-box">
              <input
                className="pd-comment-input"
                type="text"
                placeholder="Add a comment…"
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); submitComment(); }
                }}
              />
              <button
                type="button"
                className="pd-comment-submit"
                onClick={submitComment}
                disabled={!commentDraft.trim() || submitting}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
