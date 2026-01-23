# Supabase Leaderboard Setup

## Why Supabase Keys Are Safe in Open Source

### ✅ Anon Key (Public)
- **Safe to expose** - designed for frontend use
- **Protected by Row Level Security (RLS)** policies
- Even if someone copies your key, they can only do what your RLS policies allow
- Think of it like a restricted API endpoint - it's public but controlled

### ❌ Service Role Key (Secret)
- **NEVER expose** - only use in backend
- Bypasses all security rules
- Not needed for this project (frontend-only)

---

## Setup Instructions (2 minutes)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create free account (GitHub login works)
4. Create new project (choose region close to your users)

### 2. Create Leaderboard Table
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Paste this SQL:

```sql
-- Create leaderboard table
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL,
  level INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  captured INTEGER NOT NULL,
  total INTEGER NOT NULL DEFAULT 50,
  accuracy INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast sorting
CREATE INDEX idx_leaderboard_rank
  ON leaderboard(level DESC, captured DESC);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard FOR SELECT
  USING (true);

-- Allow anyone to insert their score
CREATE POLICY "Anyone can submit scores"
  ON leaderboard FOR INSERT
  WITH CHECK (true);
```

4. Click **Run** (bottom right)

### 3. Get Your API Keys
1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://abc123.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

### 4. Configure Environment Variables
1. Create `.env` file in project root:
```bash
cp .env.example .env
```

2. Edit `.env` and paste your keys:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Important:** `.env` is already in `.gitignore` - it won't be committed

### 5. Install Supabase SDK
```bash
npm install @supabase/supabase-js
```

### 6. That's It!
The leaderboard will now work globally with real-time updates.

---

## Security Details

### Row Level Security (RLS) Policies

Our policies allow:
- ✅ **Anyone** can **read** the leaderboard (public competition)
- ✅ **Anyone** can **insert** scores (no authentication needed)
- ❌ **No one** can **update** or **delete** existing scores (prevents cheating)

### Rate Limiting
Supabase free tier limits:
- 500MB database storage
- 2GB bandwidth per month
- 50K API requests per day

For a small game, this is **more than enough**.

### Anti-Abuse Measures

If you want to prevent spam:

1. **Application-level rate limiting:**
```javascript
// In leaderboard service
const lastSubmit = localStorage.getItem('last-submit-time');
const now = Date.now();
if (now - lastSubmit < 60000) {
  throw new Error('Please wait 1 minute between submissions');
}
localStorage.setItem('last-submit-time', now);
```

2. **Supabase RLS with timestamp check:**
```sql
-- Only allow 1 submission per player per hour
CREATE POLICY "Rate limit submissions"
  ON leaderboard FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM leaderboard
      WHERE player_name = NEW.player_name
      AND created_at > NOW() - INTERVAL '1 hour'
    )
  );
```

---

## For Other Contributors

When you clone this repo:
1. Copy `.env.example` to `.env`
2. Get your own Supabase project (free)
3. Follow setup steps above
4. Your local dev will use your own database

**OR** just use the deployed version's API (if owner shares keys in documentation).

---

## Deployment

### Vercel/Netlify
Your `.env` variables will be automatically read from the file during build.

Add them to your hosting platform:
- Vercel: **Settings** → **Environment Variables**
- Netlify: **Site Settings** → **Build & Deploy** → **Environment**

### Security Note
Even though the anon key is safe to expose, using environment variables:
- ✅ Allows key rotation without code changes
- ✅ Different keys for dev/staging/production
- ✅ Easier for other contributors to set up their own instance

---

## Monitoring

Check your Supabase dashboard:
- **Table Editor** - View all leaderboard entries
- **Database** → **Extensions** - Monitor query performance
- **Auth** → **Rate Limits** - See API usage

---

## FAQ

**Q: Can someone spam fake scores?**
A: Yes, but you can add rate limiting (see Anti-Abuse section above)

**Q: Can someone delete scores?**
A: No, RLS policies prevent updates and deletes

**Q: What if I hit the free tier limits?**
A: 50K requests/day = ~1700 players viewing leaderboard. Upgrade to Pro ($25/mo) for 5M requests/day.

**Q: Can I self-host Supabase?**
A: Yes! It's open source. See [Supabase self-hosting docs](https://supabase.com/docs/guides/self-hosting)

**Q: Do players need accounts?**
A: No! This is anonymous - just their in-game name.
