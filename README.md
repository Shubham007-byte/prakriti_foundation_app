# Prakriti Shakti Foundation website — app starter

Next.js + Supabase starter for a mobile-friendly foundation website with published work posts, upcoming events, editable site settings, and a restricted team admin area.

## What's included
- Public homepage that reads only published work/events from Supabase.
- Email/password sign-in page; public sign-up is intentionally absent.
- Admin allowlist check plus database `site_admins` membership checks via RLS.
- Admin forms to create work posts/events and update approved site/contact/donation settings.
- SQL schema for tables, row-level security, and media bucket policies.
- No payment processor is connected. QR/UPI fields are empty until an admin supplies verified details.

## Local setup
1. Install Node.js 20+.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local`, and fill in the project URL and publishable key.
5. Set `ADMIN_EMAILS` to the exact 2–5 email addresses that are allowed to use the admin UI.
6. In Supabase Authentication, create each team user's account (disable public sign-ups). After each account exists, run SQL like this with its exact auth UUID and email:

   ```sql
   insert into public.site_admins (user_id, email)
   values ('AUTH_USER_UUID_HERE', 'team-member@example.org');
   ```

   Use the UUID from Authentication > Users. Only a trusted project owner should run this statement.
7. Install and run:

   ```bash
   npm install
   npm run dev
   ```
8. Open `http://localhost:3000`; admin sign-in is at `/login`.

## Important setup/security notes
- The app's `ADMIN_EMAILS` check protects the UI, and `site_admins` RLS policies protect database writes. Keep both in sync. The `site_admins` table is not readable by normal client roles.
- Never put a Supabase service-role/secret key in a `NEXT_PUBLIC_*` variable or browser code. This starter does not need a service-role key.
- Public site settings are readable by visitors, so never save private keys, bank account credentials, or personal data there.
- Donation QR and UPI ID are empty until the foundation verifies the recipient account and approves publication. Payment gateway is not integrated.
- This starter's media policy allows public viewing of media in `foundation-media`; do not upload private documents or photos without consent. Use only approved public-facing photos.
- For production, add rate limiting, audit logs, image upload UI/validation, event/post edit/delete, backup plan, privacy notice, terms, accessibility testing and security review.

## Deployment outline
1. Push the project to a private or organization-owned Git repository.
2. Deploy to a Next.js-compatible host (for example, Vercel or a Node.js host); set the same environment variables in its project settings.
3. Add the domain in the hosting dashboard, then configure the DNS records the provider gives you at the domain registrar.
4. Check availability of `prakritishaktifoundation.org` with a registrar before buying; this project does not confirm domain availability or register it.
5. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin and add that URL to Supabase Auth's allowed redirect/site URL settings.
6. Test published/draft visibility, admin access with a non-admin account, photo URLs, event timezone, mobile layout, contact links, and the donation section before launch.
7. Keep donation methods disabled until the organization verifies payment ownership and any applicable eligibility/compliance requirements.

## Current scope / follow-up work
The admin can create work posts and events, and update text/URLs for site settings. This is a starter implementation, not a fully audited production system. The admin UI currently takes a public image URL; direct file-picker upload, editing/deleting records, member management, automated email, contact form delivery, and payment gateway integration are not implemented yet.

Photo upload is supported in the admin form for JPG, PNG and WebP files (8 MB max for work photos; 5 MB for QR images). Files are stored in the public `foundation-media` bucket, so upload only approved public photos and verified QR artwork. The QR upload feature only displays the image; it does not initiate or verify a payment.
