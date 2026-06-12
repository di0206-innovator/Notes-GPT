# Deployment & Security Hardening Guide

This guide describes how to deploy the **NotesGPT** application to production (specifically on **Google Cloud Run** and **Firebase**) and configure security settings to ensure that your deployed application cannot be compromised, abused, or run up unexpected API bills.

---

## 1. Environment Variables Configuration

Before deploying, ensure you configure the following environment variables. The client variables must be prefixed with `NEXT_PUBLIC_` so they are accessible to the browser client, whereas the backend variables must remain private.

### Backend Environment Variables (Keep Private 🔒)
- **`GEMINI_API_KEY`**: Your Gemini API Key from Google AI Studio. This key is used for server-side generation, document summarization, and vector embeddings. It should **only** exist in your hosting platform's secure environment settings (never in git!).

### Client Environment Variables (Publicly Bundle-Safe 🌐)
These are public configurations used to initialize the client-side Firebase SDK. They should be set in your deployment configuration:
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
Because your Firebase client config is public, someone could theoretically copy your Firebase API key and use it to execute requests against your Firebase services. To prevent this, apply referrer restrictions:
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Go to **APIs & Services > Credentials**.
3. Under **API Keys**, locate and click on your Firebase API key (it will look like `Browser key (auto-created by Firebase)`).
4. Under **Application restrictions**, select **Websites (HTTP referrers)**.
5. Under **Website restrictions**, add your deployed application domain(s) and localhost for development, e.g.:
   - `http://localhost:3000/*`
   - `https://your-custom-domain.com/*`
   - `https://your-cloud-run-url.a.run.app/*`
6. Click **Save**. 

*This ensures the key is rejected if someone attempts to run requests against your Firebase project from an external, unauthorized website or terminal script.*

### Step 2: Restrict Firebase Authentication Authorized Domains
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Go to **Authentication > Settings**.
3. Under **Authorized Domains**, ensure that only your trusted domains are in the whitelist:
   - `localhost`
   - `your-custom-domain.com`
   - `your-cloud-run-url.a.run.app`
4. Delete any other unfamiliar domains.

### Step 3: Deploy Firestore Security Rules
Your codebase includes a secure ruleset in [firebase/firestore.rules](file:///Users/divyanshusinha/Rag-Campus-GPT/firebase/firestore.rules) that verifies session ownership before allowing any data read/write:
```javascript
allow read, delete: if isAuthenticated() && resource.data.sessionId == request.auth.uid;
```
Ensure these rules are deployed to your Firestore console:
```bash
# If you have Firebase CLI installed:
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```
*Alternatively, copy the contents of [firestore.rules](file:///Users/divyanshusinha/Rag-Campus-GPT/firebase/firestore.rules) and paste them directly into the "Rules" tab of the Firestore section in the Firebase Console.*

### Step 4: Configure Cloud Run Billing & DoS Prevention
To protect against Denial of Service (DoS) attacks that could cause resource scaling and run up high server charges, restrict your Cloud Run instance counts:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and navigate to **Cloud Run**.
2. Click on your **NotesGPT** service, and click **Edit & Deploy New Revision**.
3. Under **Scaling**:
   - Set **Minimum instances** to `0` (so you only pay when requests are active).
   - Set **Maximum instances** to a low threshold (e.g., `5` or `10`). This bounds your maximum scaling capacity, preventing sudden billing spikes if your site gets hit by massive traffic or bots.
4. Under **Security**, run the container with a custom, low-privilege service account (do not use the default Compute Engine service account, which has excessive workspace edit permissions). Give this custom service account only `Datastore User` (for Firestore access) and `Logs Writer` permissions.

### Step 5: Secure the Ollama Local AI Proxy
The server proxy route `/api/local-ai/ollama` has been hardened to prevent Server-Side Request Forgery (SSRF) where bad actors could use your deployment to scan ports on your internal network:
- **Authentication**: It requires a valid Firebase user ID token.
- **Loopback Enforcement**: In production builds (`NODE_ENV === 'production'`), it only allows requests targeting loopback hosts (`localhost`, `127.0.0.1`, `[::1]`). Requests targeting external URLs or other internal IPs are blocked.

---

## 3. Deployment Command Cheat Sheet (Cloud Run)

If you are building and deploying manually, use the following commands:

```bash
# 1. Build the docker image locally or via Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/notes-gpt

# 2. Deploy to Cloud Run (limiting scaling to max 5 instances)
gcloud run deploy notes-gpt \
  --image gcr.io/YOUR_PROJECT_ID/notes-gpt \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --max-instances 5 \
  --set-env-vars GEMINI_API_KEY="your-real-gemini-key" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-key" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain.firebaseapp.com" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket.appspot.com" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id" \
  --set-env-vars NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```
