# Deployment & Security Hardening Guide

This guide describes how to deploy the **NotesGPT** application to production (specifically on **Google Cloud Run** and **Firebase**) and configure security settings to ensure that your deployed application cannot be compromised, abused, or run up unexpected API bills.

---

## 1. Environment Variables Configuration

Before deploying, ensure you configure the following environment variables. The client variables must be prefixed with `NEXT_PUBLIC_` so they are accessible to the browser client, whereas the backend variables must remain private.

### Backend Environment Variables (Keep Private 🔒)
- **`GEMINI_API_KEY`**: Your Gemini API Key from Google AI Studio. This key is used for server-side generation, document summarization, and vector embeddings. It should **only** exist in your hosting platform's secure environment settings (never committed to git!).

### Client Environment Variables (Publicly Bundle-Safe 🌐)
These are public configurations used to initialize the client-side Firebase SDK:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## 2. Hardening Your Deployed App

Follow these steps to protect your live deployment from abuse and ensure high availability.

### Step 1: Restrict Firebase API Keys in Google Cloud (Critical ⚠️)
Because your Firebase client config is public, apply HTTP referrer restrictions to prevent unauthorized use:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Go to **APIs & Services > Credentials**.
3. Under **API Keys**, locate and click on your Firebase API key (`Browser key (auto-created by Firebase)`).
4. Under **Application restrictions**, select **Websites (HTTP referrers)**.
5. Under **Website restrictions**, add your deployed application domain(s) and localhost:
   - `http://localhost:3000/*`
   - `https://your-custom-domain.com/*`
   - `https://your-cloud-run-url.a.run.app/*`
6. Click **Save**.

### Step 2: Restrict Firebase Authentication Authorized Domains
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication > Settings**.
3. Under **Authorized Domains**, ensure only your trusted domains are present:
   - `localhost`
   - `your-custom-domain.com`
   - `your-cloud-run-url.a.run.app`
4. Delete any unneeded domains.

### Step 3: Deploy Firestore Security Rules
Your codebase includes a secure ruleset in `firebase/firestore.rules` that verifies session ownership before allowing data operations:
```javascript
allow read, delete: if isAuthenticated() && resource.data.sessionId == request.auth.uid;
```
Deploy these rules using the Firebase CLI:
```bash
npx firebase-tools deploy --only firestore:rules
```
*Alternatively, copy the contents of `firebase/firestore.rules` directly into the Rules editor in the Firebase Console.*

### Step 4: Configure Cloud Run Billing & DoS Prevention
To protect against Denial of Service (DoS) and unexpected auto-scaling charges:
1. Navigate to **Cloud Run** in the Google Cloud Console.
2. Select your **NotesGPT** service and click **Edit & Deploy New Revision**.
3. Under **Scaling**:
   - Set **Minimum instances** to `0`.
   - Set **Maximum instances** to a low threshold (e.g. `5` or `10`).
4. Under **Security**, attach a least-privilege service account with only `Datastore User` and `Logs Writer` roles.

### Step 5: Secure the Ollama Local AI Proxy
The server proxy route `/api/local-ai/ollama` is hardened to prevent Server-Side Request Forgery (SSRF):
- **Authentication**: Requires session authentication or local development validation.
- **Loopback Enforcement**: In production (`NODE_ENV === 'production'`), it restricts proxying to loopback endpoints (`localhost`, `127.0.0.1`, `[::1]`).

---

## 3. Production Deployment Commands (Cloud Run)

```bash
# 1. Build container image with Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/notes-gpt

# 2. Deploy to Cloud Run
gcloud run deploy notes-gpt \
  --image gcr.io/YOUR_PROJECT_ID/notes-gpt \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 5 \
  --set-env-vars GEMINI_API_KEY="your-gemini-key" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-key" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain.firebaseapp.com" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket.appspot.com" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```
