# Rack
**Your city's closet, all in one rack.**

Rack is a social fashion discovery app built for Chicago. Users post items they find at local stores, follow people with good taste, and discover what's worth buying nearby — think Beli, but for clothes.

## Status
🚧 **Currently in private beta** — actively building and iterating. Core social features are live and being tested with early users in Chicago.

## Features
- Post items found at local Chicago stores with photos, prices, and half-star ratings
- Explore trending posts from people you don't follow yet
- Following feed — posts only from people you follow
- Store pages with average community ratings and post history
- Stash — saved posts, liked posts, commented posts, and visited stores
- Threaded comments with replies
- Post detail pages
- Search for people and stores ranked by traction
- Profile pages with follower/following/post counts

## Tech Stack
- **Frontend:** React (Create React App), React Router
- **Backend:** Supabase (auth, PostgreSQL, storage)
- **Hosting:** Vercel (auto-deploy on push)
- **Version Control:** GitHub

## Architecture
- Supabase handles auth, real-time database, and photo storage (item-photos bucket)
- RLS policies to be enforced before public launch
- Profile stats exposed via a Supabase view for efficient querying

## Local Development
1. Clone the repo
2. Run `npm install`
3. Create a `.env` file with:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
4. Run `npm start`

## Live
- App: rack-beta.vercel.app
- Landing: rack-landing-ashy.vercel.app

## Roadmap
- [ ] RLS policies before public launch
- [ ] Geolocation-based store discovery
- [ ] Multiple photos per post
- [ ] Push notifications
- [ ] Expand beyond Chicago
