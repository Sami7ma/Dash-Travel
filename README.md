# Dash Travel mobile

Dash Travel is a mobile-first React Native / Expo continuation of the original Dash Travel experience: route search, seat booking, ticket confirmation, and account flows for Ethiopian bus travel.

## What's included

- Home search screen styled to match the original dark glassmorphism brand
- Route selection and seat map flow
- Passenger details and ticket confirmation
- QR-based ticket mockup for the booking experience
- Profile and settings screens
- Admin login screen mirroring the staff portal concept
- Supabase-ready service layer for native environment variables

## Tech stack

- React Native
- Expo
- Expo Router
- TypeScript
- Supabase JS client
- Lucide React Native icons
- react-native-qrcode-svg

## Run locally

```bash
npm install
npm start
```

Then run the app in Expo Go or a simulator.

## Environment variables

Create a `.env` file if you want to connect to Supabase in a real mobile environment:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The app includes a fallback mock dataset so it can run without backend configuration.

## Project structure

```text
app/
  _layout.tsx
  index.tsx
  search.tsx
  booking.tsx
  ticket.tsx
  profile.tsx
  settings.tsx
  auth/login.tsx

data/
  mockData.ts

services/
  supabase.ts

types.ts
```

## Notes

This project preserves the Dash Travel identity and booking flow while replacing the original web implementation with a native Expo architecture. The legacy web project remains outside the repo root for historical reference only.
