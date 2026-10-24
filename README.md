# Blogapp

An Expo / React Native community blogging app backed by Supabase Auth and Postgres.

## Supabase setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the Supabase SQL Editor, run [`supabase/migrations/20261024000000_initial_schema.sql`](./supabase/migrations/20261024000000_initial_schema.sql).
   This creates the app's public profiles, posts, comments, and likes tables, sets up a profile when a Supabase Auth user registers, and enables row-level security.
3. Copy `.env.example` to `.env` (merge these settings into an existing `.env` rather than overwriting other local settings). In the Supabase project's **Connect** dialog, copy the project URL and publishable key (the legacy `anon` key also works) into:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
   ```

   Never put a `service_role` key in the app or any `EXPO_PUBLIC_` variable.
4. Install dependencies and launch the app:

   ```bash
   npm install
   npx expo start
   ```

   If the Expo dev server was already running, restart it after changing `.env`.

The app uses Supabase Auth for email/password accounts and stores the username in Auth user metadata and `public.profiles`. To let users sign in immediately after registration without confirming their email, open **Authentication → Sign In / Providers → Email** in the Supabase dashboard and turn off **Confirm email**. Registration signs out any session created by Supabase and sends the user to the login screen; they must sign in with their email and password before accessing the dashboard. If email confirmation remains enabled in Supabase, sign-in will require confirmation despite the app redirecting to login.

## Database model

Supabase owns credentials in `auth.users`; the app must not create or expose a `password_hash` column. `public.profiles.id` references `auth.users.id`, and its username is created by a database trigger. Post and comment authors are linked to profiles. Likes have a unique `(post_id, user_id)` constraint, while reshares use `posts.original_post_id`.

The SQL migration targets a new Supabase project. It intentionally grants public read access to profiles (usernames only), posts, comments, and like rows; write policies require an authenticated user and restrict writes to that user's own rows.
