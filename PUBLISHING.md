# Publishing Checklist

This package is prepared for a new personal GitHub repository but has not been uploaded.

## Suggested repository settings

- Repository name: `codex-micro-spotify-router`
- Description: `Reversible Spotify-aware RGB routing for the Work Louder Codex Micro`
- Visibility: Private initially; make it public only after reviewing trademarks, dependencies, and permissions documentation.
- Default branch: `main`
- Topics: `codex-micro`, `work-louder`, `spotify`, `rgb`, `macos`, `nodejs`

## Before the first push

1. Review `README.md` and `docs/ADDITIVE_CHANGES.md`.
2. Choose and add a license. None is included because a license choice was not provided.
3. Confirm that `config/rollback-snapshot.json` contains placeholders only.
4. Run `npm ci` and `npm test` from a clean checkout.
5. Confirm that `node_modules/`, `runtime/`, `dist/`, logs, and `.DS_Store` are absent.
6. Review the dependency and trademark disclaimer.

## Suggested local Git commands

The packaged directory is already initialized on the `main` branch with its files staged. Review and commit it with your own configured Git identity:

```sh
git status
git commit -m "Add reversible Spotify lighting router for Codex Micro"
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/codex-micro-spotify-router.git
git push -u origin main
```

Create the empty GitHub repository before adding the remote. Do not initialize the remote with a README or license if you want the first push to remain conflict-free.
