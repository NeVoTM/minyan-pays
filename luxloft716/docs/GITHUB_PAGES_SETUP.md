# Host LuxLoft716 on GitHub Pages

## One-time setup (about 1 minute)

1. Open **https://github.com/NeVoTM/minyan-pays/settings/pages**
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**
3. **Branch:** `gh-pages` · **Folder:** `/ (root)` → **Save**

After the next push to `main` (or a manual workflow run), your site will be live at:

### https://nevotm.github.io/minyan-pays/

(Use that exact URL on iPhone Safari; paths are case-insensitive for the username.)

## How deploys work

- Workflow: `.github/workflows/luxloft716-pages.yml`
- On every push to `main` that touches `luxloft716/`, GitHub Actions builds the app and pushes `dist/` to the `gh-pages` branch.
- React Router uses base path `/minyan-pays/` for this project site URL.

## Manual deploy

**Actions** → **Deploy LuxLoft716 to GitHub Pages** → **Run workflow**

## Custom domain (optional)

In the same Pages settings, add your domain (e.g. `luxloft716.com`) and follow GitHub’s DNS instructions.
