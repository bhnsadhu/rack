import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Nav from '../components/Nav';
import './auth.css';
import './post.css';

export default function Post() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [showStoreRequest, setShowStoreRequest] = useState(false);
  const [storeRequest, setStoreRequest] = useState('');
  const [storeRequestStatus, setStoreRequestStatus] = useState('');

  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('stores')
      .select('id, name, neighborhood')
      .order('name')
      .then(({ data }) => { if (data) setStores(data); });
  }, [user]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleStoreRequest(e) {
    e.preventDefault();
    setStoreRequestStatus('sending');
    try {
      const res = await fetch('https://formspree.io/f/mnjyzzgv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: 'store_request', store_info: storeRequest }),
      });
      setStoreRequestStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStoreRequestStatus('error');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!storeId) { setError('Please select a store.'); return; }
    if (rating === 0) { setError('Please select a rating.'); return; }
    setSubmitting(true);
    setError('');

    try {
      // Upload photo if provided
      let photoUrl = '';
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(path, photoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from('item-photos')
          .getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      // Find or create the item for this store
      const { data: existingItem } = await supabase
        .from('items')
        .select('id')
        .eq('store_id', storeId)
        .eq('name', itemName.trim())
        .maybeSingle();

      let itemId;
      if (existingItem) {
        itemId = existingItem.id;
      } else {
        const { data: newItem, error: itemError } = await supabase
          .from('items')
          .insert({ store_id: storeId, name: itemName.trim(), photo_url: photoUrl, price: parseFloat(price) })
          .select('id')
          .single();
        if (itemError) throw itemError;
        itemId = newItem.id;
      }

      // Insert rack entry
      const { error: rackError } = await supabase
        .from('racks')
        .insert({ user_id: user.id, item_id: itemId, note: note.trim() || null, rating });
      if (rackError) throw rackError;

      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <>
      <Nav />
      <main className="auth-page">
        <div className="auth-card post-card">
          <h1 className="auth-title">Rack something new</h1>
          <p className="auth-sub">Share what you found.</p>

          <form className="auth-form" onSubmit={handleSubmit}>

            {/* Store dropdown */}
            <label className="auth-label">
              Store
              <select
                className="auth-input post-select"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="">Select a store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.neighborhood ? ` — ${s.neighborhood}` : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Store request */}
            {storeRequestStatus === 'sent' ? (
              <p className="post-store-sent">Thanks, we'll add it!</p>
            ) : !showStoreRequest ? (
              <button
                type="button"
                className="post-store-link"
                onClick={() => setShowStoreRequest(true)}
              >
                Don't see your store?
              </button>
            ) : (
              <div className="post-store-request">
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Store name and location"
                  value={storeRequest}
                  onChange={(e) => setStoreRequest(e.target.value)}
                  disabled={storeRequestStatus === 'sending'}
                />
                <button
                  type="button"
                  className="post-store-submit"
                  onClick={handleStoreRequest}
                  disabled={storeRequestStatus === 'sending' || !storeRequest.trim()}
                >
                  {storeRequestStatus === 'sending' ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            )}

            {/* Item name */}
            <label className="auth-label">
              Item name
              <input
                className="auth-input"
                type="text"
                placeholder="e.g. Denim Jacket"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
                disabled={submitting}
              />
            </label>

            {/* Price */}
            <label className="auth-label">
              Price
              <div className="post-price-wrap">
                <span className="post-price-prefix">$</span>
                <input
                  className="auth-input post-price-input"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </label>

            {/* Photo */}
            <div className="auth-label">
              <span>Photo</span>
              <label className="post-upload-label">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="post-photo-preview" />
                ) : (
                  <span className="post-upload-placeholder">Tap to add a photo</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="post-file-input"
                  onChange={handlePhotoChange}
                  disabled={submitting}
                />
              </label>
            </div>

            {/* Star rating */}
            <div className="auth-label">
              <span>Rating</span>
              <div className="post-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`post-star${rating >= n ? ' post-star--on' : ''}`}
                    onClick={() => setRating(n)}
                    disabled={submitting}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <label className="auth-label">
              Note <span className="post-optional">(optional)</span>
              <textarea
                className="auth-input post-textarea"
                placeholder="Why do you like it?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={submitting}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-btn" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post to your rack'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
