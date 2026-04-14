# Changelog

## v0.6 (2026-04-14)

### Bug Fixes
- Fixed sticky employee name column being covered by task chips when scrolling right in resource planning (z-index fix)

### Teams
- Renamed team "ME" to "CSS"
- Added new team "I&C"
- Teams are now displayed in alphabetical order (with "Other" always last)
- Employees within each team are now displayed in alphabetical order

### Planning Types (new in assignment modal)
- Added type "Trainings" with 8 sub-options: R95 Training: I&C, R95 Training: S&T, F45 Training: I&C, F45 Training: S&T, HM Training, T89 Training, T86 Training, DNB Training
- Added type "Support": 24/7 Support, CRM Support, 24/7 Replacement, CRM Replacement
- Added type "Other" for user-created tasks (previously stored under "Basic")
- Tasks created via "+ Neu" now appear under "Other" instead of "Basic"
- Removed "24/7" and "Ticketing" from Basic — they are now Support tasks

### Categories (Kategorien)
- "Set Inactive" is now available for all category types: Basic, Other, Support, Training, Offtime
- Added "Permanent" tag per task: tasks with this tag are never auto-inactivated after 12 weeks
  - Hardcoded tasks (Basic, Support, Training) are permanently active by default
  - User-created Other tasks can be toggled between Permanent and Temporary
  - New user-created tasks default to Temporary (auto-expire after 12 weeks)
- Support and Training tasks now shown in their own sections in Kategorien

### Task Comments
- Click any planned task chip to open the edit modal and add a comment
- Tasks with a comment display a small message icon (indicator)
- Hovering over a task with a comment shows the comment text as a native tooltip
- Copying a task via the copy button also copies the comment
- Drag-dropping a task to a different employee clears the comment (reassignment = new context)

### Colors
- Projects now display their color as the full chip background in resource planning
- 9-color palette available for projects (blue, violet, emerald, teal, rose, lime, cyan, pink, gea)
- New projects are auto-assigned the next available color from the palette
- Project color picker now shows swatches in the project edit dialog
- 24/7 Support: unique amber color not shared with any project
- CRM Support: unique indigo color not shared with any project
- 24/7 Replacement: unique orange color
- CRM Replacement: unique purple color
- Training tasks use a unique sky-blue color
- User-created Other/Basic tasks can optionally have a custom color assigned in Kategorien settings
  (Default is no color — neutral gray chip)

### Projects
- Added address field to projects (shown in project details and included in CSV export)

### Copy Function
- Fixed: source week was not selectable when copying a task (highlighted in amber, now selectable for other employees)
- Employees in copy dialog are now grouped by team in collapsible sections; each team can be expanded/collapsed and all members selected at once

### Version & UI
- Version bumped to v0.6
- Changelog button in sidebar is now a visible badge (more prominent)
- System & Export tab now lists all external libraries with loaded versions and an "Check for updates" button that queries the npm registry

---

## v0.5.1 (2024-04-xx)
- Fix critical sync bugs and field loss in team-split data layer
- Fix workload slider showing wrong percentage for non-40h employees
- Add auto-expiry for custom Basic Tasks (12 weeks)
- Remove invoice status dropdown UI
- Split planner state into per-team files for conflict-free multi-user sync
- Extract modal components to module scope for state preservation
- Performance optimizations (memoization, debounce)
- Add File System Access API sync with IndexedDB persistence
- Add SharePoint Online collaborative sync
- Add invoice email functionality
- Add project number input
