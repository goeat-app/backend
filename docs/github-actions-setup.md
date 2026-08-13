# GitHub Actions Setup for Firebase Functions Deployment

This guide explains how to configure GitHub Actions to automatically deploy your Firebase Functions.

## Quick Start Checklist

Before your first deployment, complete these steps:

- [ ] Generate Firebase service account JSON key
- [ ] Add `FIREBASE_SERVICE_ACCOUNT` secret to GitHub
- [ ] Add `FIREBASE_PROJECT_ID` secret to GitHub
- [ ] Add `DATABASE_URL` secret to GitHub
- [ ] Add `SUPABASE_URL` secret to GitHub
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` secret to GitHub
- [ ] Add `RECOMMENDER_SYSTEM_URL` secret to GitHub
- [ ] Add `GOOGLE_PLACES_API_KEY` secret to GitHub
- [ ] Verify service account has correct IAM roles
- [ ] Push to `main` branch or manually trigger workflow

**Need help?** See detailed instructions below.

---

## Workflow Overview

The workflow file (`.github/workflows/firebase-deploy.yml`) is triggered:

- On push to `main` or `master` branch
- Manually via workflow dispatch

The workflow:

1. Checks out the code
2. Sets up Node.js 22
3. Installs dependencies with Yarn
4. Runs TypeScript checks
5. Builds the project
6. Deploys to Firebase Functions

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. FIREBASE_SERVICE_ACCOUNT

This is a JSON key file for a Firebase service account.

**Steps to create:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) > Project settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Save the downloaded JSON file
7. Copy the **entire contents** of the JSON file
8. In your GitHub repository:
   - Go to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire JSON content
   - Click "Add secret"

### 2. FIREBASE_PROJECT_ID

This is your Firebase project ID (e.g., `my-project-12345`).

**Steps to add:**

1. Find your project ID in Firebase Console (Project Settings)
2. In your GitHub repository:
   - Go to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `FIREBASE_PROJECT_ID`
   - Value: Your project ID (e.g., `go-eat-prod` or `goeat-c0750`)
   - Click "Add secret"

### 3. DATABASE_URL

Your PostgreSQL database connection string.

**Format:** `postgresql://username:password@host:port/database`

**Example:** `postgresql://user:pass@db.supabase.co:5432/postgres`

Add this secret with the name `DATABASE_URL` and your production database URL.

### 4. SUPABASE_URL

Your Supabase project URL.

**Format:** `https://your-project.supabase.co`

Find this in your Supabase project settings.

### 5. SUPABASE_SERVICE_ROLE_KEY

Your Supabase service role key (secret key with admin privileges).

**⚠️ Important:** This is a sensitive secret. Never commit it to your repository.

Find this in Supabase Project Settings > API > service_role key.

### 6. RECOMMENDER_SYSTEM_URL

The URL for your ML recommendation service.

**Example:** `https://your-ml-service.com` or `http://internal-service:5000`

### 7. GOOGLE_PLACES_API_KEY

Your Google Places API key used by the application for place lookup and discovery features.

**⚠️ Important:** Keep this key private and only store it in GitHub Secrets.

Create or find this key in the Google Cloud Console under APIs & Services > Credentials.

## Quick Setup: Add All Secrets at Once

Here's a checklist to add all required secrets in GitHub:

Go to: **Settings > Secrets and variables > Actions > New repository secret**

| Secret Name                 | Description                  | Example                               |
| --------------------------- | ---------------------------- | ------------------------------------- |
| `FIREBASE_SERVICE_ACCOUNT`  | Service account JSON         | `{"type": "service_account"...}`      |
| `FIREBASE_PROJECT_ID`       | Firebase project ID          | `goeat-c0750`                         |
| `DATABASE_URL`              | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SUPABASE_URL`              | Supabase project URL         | `https://xyz.supabase.co`             |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key         | `eyJhbGc...`                          |
| `RECOMMENDER_SYSTEM_URL`    | ML service URL               | `https://ml-api.example.com`          |
| `GOOGLE_PLACES_API_KEY`     | Google Places API key        | `AIza...`                             |

## Firebase Service Account Permissions

The service account needs the following roles:

- **Firebase Admin** or **Cloud Functions Developer**
- **Service Account User**

To assign roles:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to IAM & Admin > IAM
4. Find the service account (looks like `firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com`)
5. Click edit (pencil icon)
6. Add the required roles
7. Save

## How Environment Variables are Deployed

The GitHub Actions workflow automatically creates a `.env` file during deployment using the secrets you configured above. This file is generated at build time and included in your Firebase Functions deployment.

**The workflow does this automatically - you don't need to do anything else!**

The `.env` file is created with these values:

```bash
NODE_ENV=production
DATABASE_URL=${{ secrets.DATABASE_URL }}
SUPABASE_URL=${{ secrets.SUPABASE_URL }}
SUPABASE_SERVICE_ROLE_KEY=${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
PROJECT_ID=${{ secrets.FIREBASE_PROJECT_ID }}
RECOMMENDER_SYSTEM_URL=${{ secrets.RECOMMENDER_SYSTEM_URL }}
GOOGLE_PLACES_API_KEY=${{ secrets.GOOGLE_PLACES_API_KEY }}
```

Your NestJS application can then access these via `process.env.VARIABLE_NAME` or using ConfigService.

### Alternative: Firebase Functions Config (Legacy Method)

If you prefer the older Firebase Functions config method, you can set environment variables using Firebase CLI:

```bash
# Login to Firebase
firebase login

# Set the project
firebase use <your-project-id>

# Set environment variables
firebase functions:config:set \
  app.database_url="postgresql://user:pass@host:5432/db" \
  app.supabase_url="https://your-project.supabase.co" \
  app.supabase_key="your-service-role-key"

# View current config
firebase functions:config:get

# Deploy
firebase deploy --only functions
```

**Note:** The `.env` file approach (used by the GitHub Actions workflow) is recommended for modern Firebase Functions 2nd generation.

## Testing the Workflow

### Method 1: Push to main/master

```bash
git add .
git commit -m "Add GitHub Actions workflow"
git push origin main
```

### Method 2: Manual trigger

1. Go to your GitHub repository
2. Click "Actions" tab
3. Select "Deploy to Firebase Functions" workflow
4. Click "Run workflow"
5. Select branch and click "Run workflow"

## Monitoring Deployment

1. Go to the "Actions" tab in your GitHub repository
2. Click on the running workflow
3. View logs for each step
4. Check Firebase Console > Functions to verify deployment

## Verifying Environment Variables

After deployment, you can verify your environment variables are working:

### Method 1: Check Firebase Functions logs

```bash
# View recent logs
firebase functions:log --project your-project-id

# View logs for specific function
firebase functions:log --only api --project your-project-id
```

### Method 2: Add a debug endpoint (temporary)

Add a test endpoint to verify environment variables are loaded:

```typescript
// In your controller (REMOVE AFTER TESTING)
@Get('health/env-check')
checkEnv() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasSupabase: !!process.env.SUPABASE_URL,
    hasRecommender: !!process.env.RECOMMENDER_SYSTEM_URL,
    projectId: process.env.PROJECT_ID,
  };
}
```

**⚠️ Important:** Remove this endpoint or add authentication before going live!

### Method 3: Monitor application behavior

- Test database operations to verify `DATABASE_URL` is working
- Test file uploads to verify the Firebase Storage bucket (`<PROJECT_ID>.appspot.com`, derived from `PROJECT_ID`) is correct
- Check recommendation features to verify `RECOMMENDER_SYSTEM_URL` is accessible

## Troubleshooting Deployment

### Error: "Permission denied"

- Verify service account has correct IAM roles
- Ensure `FIREBASE_SERVICE_ACCOUNT` secret contains valid JSON

### Error: "Project not found"

- Check `FIREBASE_PROJECT_ID` is correct
- Verify service account belongs to the correct project

### Error: "Build failed"

- Check TypeScript compilation locally: `yarn typecheck`
- Verify all dependencies are in `package.json`

### Error: "Functions deployment failed"

- Check Firebase CLI version is compatible
- Review function logs in Firebase Console
- Verify `firebase.json` configuration

### Error: "Environment variable undefined" or "Connection failed"

- Verify all required secrets are set in GitHub repository settings
- Check secret names match exactly (case-sensitive)
- Ensure `DATABASE_URL` has the correct format: `postgresql://user:pass@host:port/db`
- Verify your Firebase Functions can access external services (database, Supabase, etc.)
- Check Firebase Functions logs for specific error messages

### Functions deploy successfully but app crashes at runtime

- Check Firebase Functions logs: `firebase functions:log`
- Verify environment variables are correctly loaded in production
- Test database connectivity from Firebase Functions
- Ensure your service account has network access to external services

## Multiple Environments

To deploy to different environments (dev, staging, prod), you can:

### Option 1: Multiple workflows

Create separate workflow files:

- `.github/workflows/deploy-dev.yml` (triggers on `develop` branch)
- `.github/workflows/deploy-prod.yml` (triggers on `main` branch)

Use different secrets:

- `FIREBASE_SERVICE_ACCOUNT_DEV`
- `FIREBASE_SERVICE_ACCOUNT_PROD`

### Option 2: Environment-based deployment

Use GitHub Environments:

```yaml
jobs:
  deploy:
    environment: production # or development, staging
    # ... rest of the job
```

Then configure environment-specific secrets in:
Settings > Environments > [Environment name] > Secrets

## Best Practices

1. **Never commit service account keys** to your repository
2. **Use different service accounts** for dev/staging/prod
3. **Enable required status checks** in branch protection rules
4. **Review deployment logs** regularly
5. **Set up notifications** for failed deployments
6. **Test locally** before pushing to main

## Additional Resources

- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase Functions Deployment](https://firebase.google.com/docs/functions/manage-functions)
