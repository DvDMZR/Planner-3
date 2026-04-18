// ─── TEAM-SPLIT FILE LAYOUT ───────────────────────────────────────────────────
const DEFAULT_TEAMS = ['AS', 'CMS', 'CSS', 'HM', 'I&C', 'Other'];
const PLANNER_DATA_DIR = 'planner-data';
const SCHEMA_VERSION = 3;
const teamAssignmentsFile = (team) => `assignments-${team}.json`;
const teamCostItemsFile   = (team) => `cost-items-${team}.json`;

const getEmpTeam = (empId, employees) => {
    const emp = (employees || []).find(e => e.id === empId);
    return (emp && emp.category) ? emp.category : 'Other';
};

const groupByTeam = (items, employees, teams) => {
    const groups = {};
    (teams || []).forEach(t => { groups[t] = []; });
    (items || []).forEach(item => {
        const t = getEmpTeam(item.empId, employees);
        if (!groups[t]) groups[t] = [];
        groups[t].push(item);
    });
    return groups;
};
// ─────────────────────────────────────────────────────────────────────────────

// Monotonic ID helper – avoids collisions from Date.now() when multiple
// items are created within the same millisecond.
let _idCounter = 0;
const makeId = (prefix = 'id') =>
    `${prefix}-${Date.now().toString(36)}-${(_idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// --- CHANGELOG ---
const CHANGELOG_CONTENT = `# Changelog

## v0.6.2 (2026-04-17)

### Wiederkehrende Planungen (Regeln)
- Planungen können jetzt als wiederkehrend markiert werden ("Wiederkehrend (Regel)")
- Beim Anlegen: Intervall in Wochen ("Alle X Wochen") und Endwoche ("Bis Woche") wählbar
- Speichern erzeugt automatisch alle Instanzen der Serie auf einen Schlag
- Alle Instanzen einer Serie sind intern über eine gemeinsame Regel-ID verknüpft
- Löschen einer Serienplanung bietet die Wahl: nur diese Instanz oder die gesamte Serie entfernen
- Wiederkehrende Planungen zeigen ein kleines ↻-Symbol im Chip (Ressourcenansicht)

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
`;

// --- KONFIGURATION ---
const COST_TYPES = ['Dienstleistung', 'Reisekosten', 'Sonstiges'];
const DEFAULT_HOURLY_RATE = 80;
const HOURS_PER_WEEK = 40;
const WEEKS_IN_YEAR = 52;
const BASIC_TASK_EXPIRY_WEEKS = 12;
const DEFAULT_WEEKS_AHEAD = 12;

const TRAINING_TASKS = [
    'R95 Training: I&C', 'R95 Training: S&T',
    'F45 Training: I&C', 'F45 Training: S&T',
    'HM Training', 'T89 Training', 'T86 Training', 'DNB Training'
];
const SUPPORT_TASKS = ['24/7 Support', 'CRM Support', '24/7 Replacement', 'CRM Replacement'];

const SUPPORT_CHIP_COLORS = {
    '24/7 Support':     { chip: 'bg-amber-100 border-amber-400 text-amber-900',    dot: 'bg-amber-500' },
    'CRM Support':      { chip: 'bg-indigo-100 border-indigo-300 text-indigo-900', dot: 'bg-indigo-500' },
    '24/7 Replacement': { chip: 'bg-orange-100 border-orange-300 text-orange-900', dot: 'bg-orange-500' },
    'CRM Replacement':  { chip: 'bg-purple-100 border-purple-300 text-purple-900', dot: 'bg-purple-500' },
};
const TRAINING_CHIP_COLOR = { chip: 'bg-sky-50 border-sky-200 text-sky-800', dot: 'bg-sky-500' };

const PROJECT_COLORS = [
    { id: 'blue',    dot: 'bg-blue-500',    chip: 'bg-blue-50 border-blue-200 text-blue-800' },
    { id: 'violet',  dot: 'bg-violet-500',  chip: 'bg-violet-50 border-violet-200 text-violet-800' },
    { id: 'emerald', dot: 'bg-emerald-500', chip: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { id: 'teal',    dot: 'bg-teal-500',    chip: 'bg-teal-50 border-teal-200 text-teal-800' },
    { id: 'rose',    dot: 'bg-rose-500',    chip: 'bg-rose-50 border-rose-200 text-rose-800' },
    { id: 'lime',    dot: 'bg-lime-500',    chip: 'bg-lime-50 border-lime-200 text-lime-800' },
    { id: 'cyan',    dot: 'bg-cyan-500',    chip: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
    { id: 'pink',    dot: 'bg-pink-500',    chip: 'bg-pink-50 border-pink-200 text-pink-800' },
    { id: 'gea',     dot: 'bg-gea-500',     chip: 'bg-gea-50 border-gea-200 text-gea-800' },
];
const OLD_COLOR_MAP = {
    'bg-gea-500': 'gea', 'bg-blue-500': 'blue', 'bg-violet-500': 'violet',
    'bg-emerald-500': 'emerald', 'bg-teal-500': 'teal', 'bg-rose-500': 'rose',
    'bg-lime-500': 'lime', 'bg-cyan-500': 'cyan', 'bg-pink-500': 'pink',
};
const resolveProjectColor = (colorVal) => {
    const raw = colorVal || 'gea';
    const id = OLD_COLOR_MAP[raw] || raw;
    return PROJECT_COLORS.find(c => c.id === id) || PROJECT_COLORS[0];
};

const PROJECT_STATUSES = [
    { value: 'planned',         label: 'Fängt noch an',       color: 'bg-blue-100 text-blue-700' },
    { value: 'active',          label: 'Hat angefangen',      color: 'bg-emerald-100 text-emerald-700' },
    { value: 'completed',       label: 'Abgeschlossen',       color: 'bg-slate-200 text-slate-600' },
    { value: 'missing_costs',   label: 'Fehlende Kosten',     color: 'bg-amber-100 text-amber-700' },
    { value: 'costs_submitted', label: 'Kosten übermittelt',  color: 'bg-gea-100 text-gea-700' },
];

// Month names – used by utils.js and React components
const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
