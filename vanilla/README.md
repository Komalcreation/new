# KCTC - Komal Creations Tailoring Center (Vanilla JS Version)

This folder contains a fully self-contained, lightweight version of the KCTC website built using **plain HTML, CSS, and JavaScript**. There are **no React dependencies, no TypeScript, and no build or compilation steps**.

You can deploy this folder directly to **GitHub Pages** with absolute ease!

---

## Features Preserved

1. **Stitching Cost Estimator**: A fully interactive 5-step calculator mapping apparel choices, materials, sleeve styles, decorative upgrades, and quantity selectors.
2. **Vocational Certification Ledger**: Real-time roll number certificate queries that render gorgeous digital verified certificates with an elegant printable styling sheet.
3. **Academy Course Registry**: A scannable vocational course grid with a reactive search filter and quick enrollment contact binds.
4. **Student Portal Hub**: A toggleable authentication portal allowing student enrollment logins, progress summaries, and fee payment invoices status.
5. **Full Administrator Panel**: Secured behind a passkey gate containing a live metrics overview, students registry manager, lead inquiries table, graduation certificate generator, and connection credential handlers.
6. **Graphical Visual Insights**: Uses **Chart.js via CDN** to represent dynamic dashboards containing course popularity bars and invoice payment status metrics.
7. **Graceful Cloud Database Integrations**: Interfaces directly with your remote **Supabase Relational Database tables** if credentials are provided, or seamlessly falls back to local storage caching for absolute offline functionality.

---

## How to Deploy directly on GitHub Pages

### Option A: Hosting this Subfolder
1. Push this entire repository to GitHub.
2. Navigate to your repository settings on GitHub.
3. Click on the **Pages** tab in the sidebar.
4. Under **Build and deployment**, set the Source to **Deploy from a branch**.
5. Select your main/master branch, and set the folder to `/docs` or the root.
   * *Tip*: If you only want to deploy this subfolder, you can move the contents of the `vanilla` folder (`index.html`, `style.css`, `script.js`) directly to the root of your new repository and enable GitHub Pages on that branch!

### Option B: Creating a Dedicated Repository
1. Create a brand new repository on GitHub (e.g., `kctc-boutique`).
2. Copy the files inside this `vanilla` directory (`index.html`, `style.css`, and `script.js`) into that new folder on your computer.
3. Commit and push those files to your new GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of vanilla tailoring app"
   git branch -M main
   git remote add origin https://github.com/your-username/kctc-boutique.git
   git push -u origin main
   ```
4. In GitHub, go to **Settings** > **Pages**.
5. Select **main branch** and root directory `/`, then click **Save**.
6. Within a few seconds, your site will be live at `https://your-username.github.io/kctc-boutique/`!

---

## Connecting Your Supabase Database

1. Log in to your deployed GitHub Pages site or open `index.html` locally in a browser.
2. Navigate to the **Admin Panel** (Top right button).
3. Log in with the standard credentials:
   * **Admin Email**: `Universal8427@gmail.com` (or `admin@komalcreations.com`)
   * **Security Passcode**: `universal`
4. Select the **Supabase Config** tab from the sidebar.
5. Provide your **Supabase URL** and **Anon Key** credentials, then click **Test Connection**.
6. Click **Save & Active** to securely bind your cloud tables.
7. Click **Sync Live DB** at any time on the Analytics tab to keep local caches and cloud records perfectly synchronized!

*Note: Database credentials are saved securely in your browser's private local storage, keeping them completely hidden from general public visitors.*
