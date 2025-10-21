# Environment Variables Needed for LifeCal Database

To enable real-time sync between users, you'll need to:

## 1. Create Vercel KV Database
1. Go to https://vercel.com/dashboard
2. Open your LifeCal project 
3. Go to Storage tab
4. Click "Create Database" → "KV (Redis)"
5. Name it "lifecal-db"
6. Select your region
7. Click "Create"

## 2. Connect Database to Project
After creating the KV database:
1. In your project dashboard, go to Settings → Environment Variables
2. The KV database will automatically add these variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN` 
   - `KV_REST_API_READ_ONLY_TOKEN`
3. Make sure they're enabled for Development, Preview, and Production

## 3. Test the Connection
After setting up, the app will automatically sync:
- Todos assigned to Em, Steph, or Maisie
- Meal plans and grocery lists
- Parking status (P2/P3)
- People/color assignments

## 4. Multi-User Access
- Share this URL with Steph: https://life-jwdmzfiqj-emilys-projects-9f8716f7.vercel.app
- Changes made by either user will sync within 5 seconds
- Works offline - syncs when back online

## Features Enabled by Database:
✅ Real-time todo sharing
✅ Shared meal planning
✅ Parking status sync
✅ Offline support with sync
✅ Conflict resolution