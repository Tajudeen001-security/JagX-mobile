# JagX Mobile

Native Android chat app (Expo/React Native) for JagX. Calls your deployed
JagX Web API — never talks to NVIDIA directly, so no API key is ever
bundled into the APK.

## Setup

1. Deploy `jagx-web` first (separate repo) and get its Vercel URL.
2. Set it as a GitHub secret here: repo → Settings → Secrets and variables →
   Actions → New repository secret:
   - Name: `JAGX_API_URL`
   - Value: `https://YOUR-VERCEL-URL.vercel.app/api/chat`
3. Push to `main` (or run the workflow manually from the Actions tab).
4. Open the workflow run → Artifacts → download `jagx-debug-apk`.

This builds a **debug** APK — installable on any Android device, not signed
for the Play Store. See the comment in `.github/workflows/build-apk.yml`
for adding real release signing later.

## Local dev (optional, needs Android Studio / Expo Go)

```
npm install
npx expo start
```

Edit `app.json` → `expo.extra.JAGX_API_URL` if you want to hardcode the API
URL for local testing instead of relying on the GitHub secret injection.
