<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/9e9c44f2-2d17-4c0a-81d7-dca6fdffcc17

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create `.env` with Firebase values (or use `.env.example`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIRESTORE_DATABASE_ID` (use `(default)` no Firestore multi-tenant)
3. Set `GEMINI_API_KEY` in `.env` if estiver usando Gemini.
4. Run the app:
   `npm run dev`

## Firebase setup

1. No console Firebase, crie/abra o projeto.
2. Em Authentication, habilite Google Sign-In.
3. Em Firestore, crie o banco de dados (modo teste no dev).
4. Cole as regras de `firestore.rules` do projeto.
5. Atualize `firebase-applet-config.json` / ou use `.env`.

## Deploy with Firebase Hosting

1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init hosting` -> selecione o projeto -> build output `dist` -> SPA yes
4. `npm run build`
5. `firebase deploy --only hosting`
