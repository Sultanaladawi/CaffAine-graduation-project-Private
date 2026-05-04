# GitHub Upload Guide - Faculty Coffee

If you are seeing an error that you cannot upload more than 100 files via the GitHub website, follow these steps to upload your entire project (including all images) using the Command Line or Desktop App.

### Option 1: Using the Terminal (Recommended)

1. **Open PowerShell or CMD** in your project folder.
2. **Initialize Git** (if not already done):
   ```bash
   git init
   ```
3. **Add your GitHub Repository as Remote**:
   (Replace `YOUR_URL` with your actual repository link)
   ```bash
   git remote add origin YOUR_URL
   ```
4. **Add all files**:
   ```bash
   git add .
   ```
5. **Commit your changes**:
   ```bash
   git commit -m "Final project submission with all assets"
   ```
6. **Push to GitHub**:
   ```bash
   git push -u origin main
   ```

### Option 2: Using GitHub Desktop (Easiest for UI)

1. Download and install **GitHub Desktop** from [desktop.github.com](https://desktop.github.com/).
2. Open the app and select **"Add Existing Repository"**.
3. Point it to your project folder: `c:\Users\ECC\Downloads\Graduation-project--main`.
4. The app will show all 100+ new images in the "Changes" tab.
5. Write a summary (e.g., "Add all assets") and click **Commit to main**.
6. Click **Publish/Push** at the top.

### Why does the website limit me?
GitHub's web interface is designed for small edits. For large folders like `public/images`, you must use the desktop tools mentioned above. This will bypass the 100-file limit and handle all your images at once.

---
*Project cleaned and optimized by Faculty Coffee Dev Team.*
