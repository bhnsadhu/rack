import { useState } from 'react';
import './App.css';

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
          <div className="phone-card">
            <div className="phone-card-user">
              <span className="phone-avatar" style={{ background: '#c8b89a' }} />
              <span className="phone-username">@maya.finds</span>
            </div>
            <div className="phone-card-store">Archive Studio</div>
            <div className="phone-card-image" style={{ background: '#d4c4b0' }} />
            <div className="phone-card-meta">
              <span className="phone-card-tag">Vintage</span>
              <span className="phone-card-price">$48</span>
            </div>
          </div>
          <div className="phone-card">
            <div className="phone-card-user">
              <span className="phone-avatar" style={{ background: '#b8a898' }} />
              <span className="phone-username">@jaden.style</span>
            </div>
            <div className="phone-card-store">Mada Mada</div>
            <div className="phone-card-image" style={{ background: '#b8a898' }} />
            <div className="phone-card-meta">
              <span className="phone-card-tag">Streetwear</span>
              <span className="phone-card-price">$120</span>
            </div>
          </div>
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
              <p className="feature-desc">Skip the algorithm. See which local shops your city actually loves, sorted by community scores and fresh drops.</p>
            </div>
            <div className="feature">
              <span className="feature-num">02</span>
              <h3 className="feature-title">Follow people with taste</h3>
              <p className="feature-desc">Build a feed of people whose style you trust. See what they're buying, saving, and rating across the city.</p>
            </div>
            <div className="feature">
              <span className="feature-num">03</span>
              <h3 className="feature-title">Snap it, find it nearby</h3>
              <p className="feature-desc">See something you like out in the wild? Snap a photo and Rack finds the same piece at a store near you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mockup-section">
        <PhoneMockup />
      </section>

      <section className="quote-section">
        <p className="quote-text">"If you don't know where to go, just rack it."</p>
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
