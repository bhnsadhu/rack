import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    setNotFound(false);
    setProfile(null);

    async function load() {
      const { data: pd, error: pe } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio')
        .eq('username', username)
        .maybeSingle();

      if (pe) console.log('[Profile] fetch error:', pe);
      if (!pd) {
        setNotFound(true);
        setLoadingProfile(false);
        return;
      }

      const { data: sd } = await supabase
        .from('profile_stats')
        .select('followers_count, following_count, racks_count')
        .eq('id', pd.id)
        .maybeSingle();

      setProfile({
        ...pd,
        followers_count: sd?.followers_count ?? 0,
        following_count: sd?.following_count ?? 0,
        racks_count: sd?.racks_count ?? 0,
      });
      setLoadingProfile(false);
    }

    load();
  }, [user, username]);

  useEffect(() => {
    if (!profile) return;
    setLoadingPosts(true);
    supabase
      .from('racks')
      .select(`
        id,
        created_at,
        items ( name, photo_url, price )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.log('[Profile] posts fetch error:', error);
        setPosts(data || []);
        setLoadingPosts(false);
      });
  }, [profile]);

  useEffect(() => {
    if (!user || !profile || profile.id === user.id) {
      setIsFollowing(false);
      return;
    }
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.log('[Profile] follow check error:', error);
        setIsFollowing(!!data);
      });
  }, [user, profile]);

  async function toggleFollow() {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      if (error) console.log('[Profile] unfollow error:', error);
      else setIsFollowing(false);
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profile.id });
      if (error) console.log('[Profile] follow error:', error);
      else setIsFollowing(true);
    }
    setFollowLoading(false);
  }

  if (authLoading || !user) return null;

  return (
    <>
      <Nav />
      <main className="profile-page">
        {loadingProfile ? (
          <p className="profile-status">Loading…</p>
        ) : notFound ? (
          <p className="profile-status">User not found.</p>
        ) : (
          <div className="profile-container">
            <div className="profile-header">
              <span className="profile-avatar">
                {(profile.full_name || profile.username || '?').charAt(0).toUpperCase()}
              </span>
              <div className="profile-identity">
                {profile.full_name && <h1 className="profile-name">{profile.full_name}</h1>}
                <p className="profile-username">@{profile.username}</p>
              </div>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '40px', width: '100%', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                  <span className="profile-stat-num">{profile.racks_count ?? 0}</span>
                  <span className="profile-stat-label">Posts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                  <span className="profile-stat-num">{profile.followers_count ?? 0}</span>
                  <span className="profile-stat-label">Followers</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                  <span className="profile-stat-num">{profile.following_count ?? 0}</span>
                  <span className="profile-stat-label">Following</span>
                </div>
              </div>

              {profile.id !== user.id && (
                <button
                  type="button"
                  className={`profile-follow-btn${isFollowing ? ' profile-follow-btn--following' : ''}`}
                  onClick={toggleFollow}
                  disabled={followLoading}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            {loadingPosts ? (
              <p className="profile-status">Loading…</p>
            ) : posts.length === 0 ? (
              <p className="profile-status">No posts yet.</p>
            ) : (
              <div className="profile-grid">
                {posts.map((post) => {
                  const item = post.items;
                  return (
                    <Link key={post.id} to="/feed" className="profile-grid-item">
                      <div className="profile-grid-photo-wrap">
                        {item?.photo_url && (
                          <img src={item.photo_url} alt={item.name} className="profile-grid-photo" />
                        )}
                      </div>
                      <span className="profile-grid-name">{item?.name}</span>
                      {item?.price != null && <span className="profile-grid-price">${item.price}</span>}
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
