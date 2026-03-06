# GitHub Pages setup checklist (org site)

If **https://effectorhq.github.io** returns 404, Pages is not enabled or not published yet. Use this checklist.

---

## 1. Repository visibility

- Open **https://github.com/effectorHQ/effectorhq.github.io**
- Go to **Settings** → scroll to **Danger Zone**
- If the repo is **Private**, set it to **Public** (Pages on free accounts only works for public repos)

---

## 2. Enable Pages

- In the same repo **Settings** → **Pages** in the left sidebar
- Under **Build and deployment**:
  - **Source**: **Deploy from a branch**
  - **Branch**: `main`
  - **Folder**: **/ (root)** (this site has `index.html` at repo root)
- Click **Save**

---

## 3. Wait for deployment

- After saving, wait 1–3 minutes and open **https://effectorhq.github.io**
- If it still 404s, check **Settings → Pages** for errors or wait a bit longer

---

## 4. Repo structure (reference)

- **index.html** is at repo root, so use **/ (root)** as the Pages folder.
- If you later serve from `docs/` or `dist/`, change **Folder** in Pages to that directory.
