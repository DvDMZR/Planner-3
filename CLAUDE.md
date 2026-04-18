# Planner-3 – Claude Code Instructions

## Git workflow (IMPORTANT — prevents recurring conflicts)

This repo merges PRs via squash or merge commits. Each time a PR is merged,
`main` gets a new commit hash for the same content. If our branch still carries
the original commit as a parent, the next push always conflicts.

**At the start of every session, before making any commits:**

```bash
git fetch origin main
git log --oneline origin/main..HEAD   # shows commits unique to our branch
```

If our branch has commits that are already in `main` (same content, different hash):

```bash
# Identify which commits are truly new (not yet in main)
NEW_COMMITS=$(git log --oneline origin/main..HEAD)

# Reset to main, then cherry-pick only the new commits
git reset --hard origin/main
git cherry-pick <new-commit-hashes>   # cherry-pick only new work

git push --force-with-lease
```

If our branch has NO commits ahead of main yet, just continue normally.

**Before every push:**

```bash
git fetch origin main
git log --oneline origin/main..HEAD   # must show ONLY our new commits
# If it shows merged-PR commits as well → rebase first (see above)
git push -u origin <branch>
```

## Project structure

- `index.html` — App entry point (React, Babel Standalone)
- `app/config.js` — Constants, teams, colors, changelog
- `app/utils.js` — Date/week helpers
- `app/sharepoint.js` — SharePoint REST API, auth
- `app/filesync.js` — File System Access API, IndexedDB
- `app/datalayer.js` — Split-file build/merge, migration
- `app/style.css` — Custom CSS (diagonal-stripes)
- `app/tailwind.css` — Pre-built Tailwind (regenerate with `npm run build:css`)
- `app/components.jsx` — Icons, ModalHeader, StatusBadge, WeekCalendarPicker
- `app/modals.jsx` — AssignmentModal, CopyModal, CostItemModal, DepsSection
- `app/views/*.jsx` — One file per tab view (SidebarView, ResourceView, …)

## Tailwind rebuild

When adding new Tailwind classes, regenerate the pre-built CSS:

```bash
npx tailwindcss -i app/tailwind.css.in -o app/tailwind.css --minify
```

Or add a script shortcut: already wired as `npm run build:css` (see package.json).
