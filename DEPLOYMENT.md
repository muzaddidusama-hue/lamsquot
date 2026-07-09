# LAMS POWER Proposal Generator - Live Deployment & Cloud Database Guide

This document walks you through setting up the **Firebase Firestore Cloud Database** for persistent storage, enabling **Google OAuth Authentication**, pushing your code to **GitHub**, and launching it live on **Vercel**.

---

## Step 1: Set Up Your Firebase Cloud Database (Persistent Storage)

To store user logins and quotations in the cloud (so they are saved permanently and accessible from any computer):

1. **Create a Firebase Project:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Click **Add Project**, enter a name (e.g., `lams-quotation`), and click **Continue**.
   - (Optional) Disable Google Analytics for this project, then click **Create Project**.

2. **Add a Web App to the Project:**
   - On the Project Overview page, click the **Web icon (`</>`)** to register a new web application.
   - Enter an app nickname (e.g., `lams-power-app`) and click **Register App**.
   - Firebase will show you a configuration script. Look for the `firebaseConfig` block:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "...",
       projectId: "...",
       storageBucket: "...",
       messagingSenderId: "...",
       appId: "..."
     };
     ```
   - Copy these credentials, open the `config.js` file in your project folder, and paste them inside the `firebaseConfig` object. Save the file.

3. **Enable Firestore Database:**
   - In the left sidebar of the Firebase Console, click **Build** -> **Firestore Database**.
   - Click **Create Database**.
   - Select **Start in Test Mode** (this allows you to read/write data immediately without writing complex rules). Click **Next**.
   - Choose a database location close to you (e.g., `asia-northeast1` or `us-central1`) and click **Enable**.

---

## Step 2: Enable Google OAuth Authentication

To authorize secure Google logins:

1. **Go to Authentication in Firebase:**
   - In the left sidebar of the Firebase Console, click **Build** -> **Authentication**.
   - Click **Get Started** (if opening for the first time).

2. **Configure Google Provider:**
   - Under the **Sign-in method** tab, click **Add new provider**.
   - Select **Google** from the list of providers.
   - Toggle the switch to **Enable**.
   - Choose a project support email from the dropdown menu.
   - Click **Save**.

3. **Add Authorized Domains (Important):**
   - Scroll down to the **Authorized domains** list on the Authentication settings page.
   - Verify that `localhost` is present (so you can test it on your machine).
   - Once you deploy the app to Vercel (see Step 4), click **Add domain** and input your Vercel address (e.g., `lams-quotation.vercel.app`) to authorize it.

---

## Step 3: Push Your Code to GitHub

To store your code and connect it to Vercel:

1. Open your terminal or Command Prompt in the `LAMS QUOTATION` folder and run:
   ```bash
   # Initialize git repository
   git init

   # Add all files
   git add .

   # Create initial commit
   git commit -m "Initial commit of routed SPA with Firebase cloud storage and Google OAuth"
   ```

2. Create a new repository on GitHub:
   - Go to [GitHub](https://github.com/) and log in.
   - Click **New** repository.
   - Name it `lams-quotation` (keep it private if you wish) and click **Create repository**.
   - Copy the commands under *"...or push an existing repository from the command line"*:
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/lams-quotation.git
     git branch -M main
     git push -u origin main
     ```
   - Paste and run these commands in your terminal. Your code is now safely on GitHub!

---

## Step 4: Deploy Live on Vercel

To launch the site live on a public URL (`lams-quotation.vercel.app`):

1. **Sign in to Vercel:**
   - Go to [Vercel](https://vercel.com/) and sign up or sign in using your **GitHub account**.

2. **Import Your Project:**
   - On the Vercel Dashboard, click **Add New** -> **Project**.
   - Under "Import Git Repository", find your `lams-quotation` repository and click **Import**.

3. **Configure and Deploy:**
   - Leave the default settings (Framework Preset: *Other*, Build Command: *None*, Output Directory: *None*).
   - Click **Deploy**.
   - Vercel will build your static files in under 30 seconds.
   - Click on the preview screenshot, and your site is live! You can share this URL with your sales team.
