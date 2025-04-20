# Ordinary Tube - Class Access Edition

A restricted version of the Ordinary Tube YouTube search and summary application with access limited to 20-30 class members.

## Files Overview

- `index.html` - Password-protected entry page
- `app.html` - Main application (accessible only with valid password)
- `netlify/functions/check-password.js` - Serverless function to verify passwords and limit access
- `netlify/functions/verify-access.js` - Serverless function to validate access tokens

## Deployment Instructions

### 1. Set Up a Netlify Account

If you don't have one already, sign up for a [Netlify account](https://app.netlify.com/signup).

### 2. Prepare Your Files

Ensure your project structure looks like this:

```
your-project/
├── index.html
├── app.html
├── netlify.toml
├── netlify/
│   └── functions/
│       ├── check-password.js
│       └── verify-access.js
└── README.md
```

### 3. Deploy to Netlify

#### Option A: Deploy via GitHub (Recommended)

1. Push your code to a GitHub repository
2. Log in to your Netlify account
3. Click "New site from Git"
4. Choose GitHub and select your repository
5. Keep the default build settings
6. Click "Deploy site"

#### Option B: Deploy via Drag and Drop

1. Log in to your Netlify account
2. From the Sites page, drag and drop your project folder onto the Netlify UI
3. Wait for the upload and deployment to complete

### 4. Configure Environment Variables

After deployment:

1. Go to your site's dashboard in Netlify
2. Navigate to Site settings > Build & deploy > Environment
3. Add environment variables:
   - `CLASS_PASSWORD`: Set a secure password for your class
   - `MAX_USERS`: Set to the number of users you want to allow (e.g., "30")

### 5. Share with Your Class

Share the Netlify URL and the class password with your students. Only the first 20-30 students (as configured) who enter the correct password will be able to access the app.

## Updating Your Deployment

### If Deployed via GitHub:

Simply push changes to your connected GitHub repository, and Netlify will automatically rebuild and deploy your site.

### If Deployed via Drag and Drop:

1. Make your changes locally
2. Drag and drop your project folder onto the Netlify UI again
3. Netlify will create a new deploy with your changes

## Important Notes

- The access counter resets whenever the Netlify functions "go cold" (after periods of inactivity)
- For a more permanent solution, you could integrate with a database like Fauna or Supabase
- If you need to reset access, simply redeploy your functions or update any environment variable