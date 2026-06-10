import { useState } from 'react';
import './App.css';

const FEED_CARDS = [
  {
    id: 1,
    profilePic: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=60&q=80',
    name: 'Maya Chen',
    store: 'Kokorokoko · Wicker Park · $$',
    items: [
      { img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&q=80', label: 'Denim Jacket', price: '$38' },
      { img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=80', label: 'Corduroy Pants', price: '$24' },
      { img: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&q=80', label: 'Graphic Tee', price: '$14' },
    ],
  },
  {
    id: 2,
    profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80',
    name: 'Jaden Williams',
    store: 'p.45 · Bucktown · $$$',
    items: [
      { img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=300&q=80', label: 'Linen Blazer', price: '$120' },
      { img: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=300&q=80', label: 'White Shirt', price: '$55' },
      { img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&q=80', label: 'Trousers', price: '$80' },
    ],
  },
];

function BookmarkIcon() {
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true">
      <path d="M1.5 1.5h8v10.5l-4-2.8-4 2.8V1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneMockup() {
  return (
    <div className="phone-frame">
      <div className="phone-screen">
        <div className="phone-screen-header">
          <span className="phone-rack-logo">RACK</span>
        </div>
        <div className="phone-tabs">
          <span className="phone-tab active">Near you</span>
          <span className="phone-tab">Following</span>
          <span className="phone-tab">Trending</span>
        </div>
        <div className="phone-cards">
          {FEED_CARDS.map((card) => (
            <div key={card.id} className="phone-card">
              <div className="phone-card-header">
                <img
                  src={card.profilePic}
                  alt={card.name}
                  className="phone-profile-pic"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="phone-card-info">
                  <span className="phone-person-name">{card.name}</span>
                  <span className="phone-store-info">{card.store}</span>
                </div>
                <span className="phone-bookmark"><BookmarkIcon /></span>
              </div>
              <div className="phone-items-row">
                {card.items.map((item, i) => (
                  <div key={i} className="phone-item-tile">
                    <div className="phone-item-img-wrap">
                      <img
                        src={item.img}
                        alt={item.label}
                        className="phone-item-img"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <span className="phone-item-tag">{item.label}</span>
                    <span className="phone-item-price">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <div className="page">
      <nav className="nav">
        <div className="container nav-container">
          <span className="nav-brand">RACK</span>
          <span className="nav-status">Coming soon</span>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-inner">
          <span className="hero-badge">Fashion. Local. Social.</span>
          <h1 className="hero-headline">
            Your city's closet,<br />all in one rack.
          </h1>
          <p className="hero-sub">
            Discover what people near you are finding at local stores. Real people, real finds, real prices.
          </p>
          <div className="waitlist-wrap">
            {submitted ? (
              <p className="waitlist-success">You're on the list. We'll be in touch.</p>
            ) : (
              <form className="waitlist-pill" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="waitlist-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="waitlist-btn" type="submit">
                  Join the waitlist
                </button>
              </form>
            )}
            <p className="social-proof">Joining 500+ people on the waitlist</p>
            <p className="waitlist-hint">Be among the first to know.</p>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <span className="section-label">What rack does</span>
          <div className="features-grid">
            <div className="feature">
              <span className="feature-num">01</span>
              <h3 className="feature-title">Stores near you ranked by real people</h3>
              <p className="feature-desc">Real ratings on specific pieces, not just the store. Know exactly what's worth the trip before you go.</p>
            </div>
            <div className="feature">
              <span className="feature-num">02</span>
              <h3 className="feature-title">Follow people with taste</h3>
              <p className="feature-desc">Follow friends, local stylists, anyone whose eye you trust. See what they're finding across the city.</p>
            </div>
            <div className="feature">
              <span className="feature-num">03</span>
              <h3 className="feature-title">Snap it, find it nearby</h3>
              <p className="feature-desc">Spot something you love? Snap a photo and find it at a store near you, or something even better.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mockup-section">
        <PhoneMockup />
      </section>

      <section className="quote-section">
        <p className="quote-text">See it. Rack it. Wear it.</p>
      </section>

      <footer className="footer">
        <div className="container footer-container">
          <span className="footer-brand">RACK</span>
          <p className="footer-copy">© 2026 Rack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
