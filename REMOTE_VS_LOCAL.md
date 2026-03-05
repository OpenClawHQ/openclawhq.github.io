# Remote vs local — comparison

## Summary

- **Tracked files with content differences**: Only **index.html** (about 47 lines; mainly padding and spacing).
- **Tracked only locally**: None.
- **Tracked only on remote**: None.
- **Untracked locally**: `PAGES_CHECK.md` (Pages setup notes), `dist/` (build output).

## Two extra commits on local

1. `ee2792c` — docs: update index and hq index  
2. `5187383` — merge origin/main: resolve index.html conflicts, accept remote structure  

After the merge, local `index.html` still differed slightly from remote (e.g. `.shell` padding). The “remote UI” you prefer is **origin/main**’s `index.html`.

## What we did (you preferred remote UI)

1. **Use remote’s index.html**  
   Overwrote local with:  
   `git checkout origin/main -- index.html`  
   so local matches the current remote UI.

2. **Keep useful local-only content**  
   - **PAGES_CHECK.md**: Added to the repo for future Pages setup reference.  
   - **dist/**: Added to `.gitignore` so build output is not committed.

3. **No force-push of local index**  
   For future changes, edit `index.html` locally and push as usual. This step only aligned local with remote UI and kept PAGES_CHECK + ignored dist.

---

## Keeping local in sync with remote

Local is now aligned with remote (same commit). If you change the remote elsewhere, run this to match it locally:

```bash
cd openclawHQ.github.io
git fetch origin && git reset --hard origin/main
```
