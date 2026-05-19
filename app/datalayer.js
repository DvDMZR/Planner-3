// ─── TEAM-SPLIT MIGRATION / LOAD / SAVE ───────────────────────────────────────

// Migrate legacy `expenses` entries to the new `costItems` shape.
const migrateExpensesToCostItems = (expenses) =>
    (expenses || []).map(e => ({
        id: e.id,
        projectId: e.projectId,
        empId: e.empId,
        type: (e.type === 'Travelcosts' || e.type === 'Hotel') ? 'Reisekosten'
              : (e.type === 'Other' ? 'Sonstiges' : 'Reisekosten'),
        description: e.type === 'Hotel' ? 'Hotel' : (e.type === 'Travelcosts' ? 'Reise' : e.type),
        week: null, hours: null, hourlyRate: null,
        amount: e.amount,
        travelAmount: e.type === 'Travelcosts' ? e.amount : null,
        hotelAmount: e.type === 'Hotel' ? e.amount : null,
    }));

// Migrate a costItem from the legacy single-amount/extras shape to the
// line-items shape used by the redesigned modal.
const migrateCostItem = (ci) => {
    if (!ci || Array.isArray(ci.lines)) return ci;

    const oldTypeMap = {
        'Reisekosten':    'travel',
        'Dienstleistung': 'hours',
        'Sonstiges':      'other',
    };
    const lines = [];

    if (ci.hours != null && ci.hourlyRate != null) {
        const hrs = ci.hours || 0;
        const rate = ci.hourlyRate || 0;
        lines.push({
            id: makeId('cl'), type: 'hours',
            hours: hrs, hourlyRate: rate, amount: hrs * rate,
            comment: ''
        });
    }
    const mainAmount = ci.mainAmount != null ? ci.mainAmount
                     : (ci.hours == null && ci.amount != null ? ci.amount : 0);
    if (mainAmount && (ci.hours == null || ci.hourlyRate == null)) {
        lines.push({
            id: makeId('cl'),
            type: oldTypeMap[ci.type] || 'other',
            amount: mainAmount,
            comment: ''
        });
    }
    (ci.extraCosts || []).forEach(ec => {
        lines.push({
            id: ec.id || makeId('cl'),
            type: 'other',
            amount: parseFloat(ec.amount) || 0,
            comment: ec.type || ''
        });
    });

    const total = lines.reduce((s, l) => s + (l.amount || 0), 0);
    const { type, hours, hourlyRate, mainAmount: _ma, extraCosts,
            travelAmount, hotelAmount, ...rest } = ci;
    return { ...rest, lines, amount: total };
};

const migrateCostItems = (items) => (items || []).map(migrateCostItem);

// Split a monolithic state into the new file layout.
// Returns an object { filename: content } ready to be persisted.
function buildSplitFiles(state) {
    const employees       = state.employees       || [];
    const projects        = state.projects        || [];
    const assignments     = state.assignments     || [];
    const costItems       = state.costItems && state.costItems.length
        ? state.costItems
        : migrateExpensesToCostItems(state.expenses);
    const empCategories         = state.empCategories         || DEFAULT_TEAMS;
    const projCategories        = state.projCategories        || [];
    const basicTasks            = state.basicTasks            || [];
    const basicTasksMeta        = state.basicTasksMeta        || {};
    const inactiveBasicTasks    = state.inactiveBasicTasks    || [];
    const offtimeTasks          = state.offtimeTasks          || [];
    const inactiveOfftimeTasks  = state.inactiveOfftimeTasks  || [];
    const inactiveSupportTasks  = state.inactiveSupportTasks  || [];
    const inactiveTrainingTasks = state.inactiveTrainingTasks || [];
    const customTrainingTasks   = state.customTrainingTasks   || [];
    const invoiceRecipient      = state.invoiceRecipient      || '';
    // Persist all users (admin included, with hashed PIN). Skip placeholders
    // that signal "admin needs re-seeding" – the next save cycle will replace
    // them with a hashed entry.
    const appUsers              = (state.appUsers || []).filter(u => !u._needsSeed);
    const auditLog              = state.auditLog              || [];

    const teams = [...new Set([...DEFAULT_TEAMS, ...empCategories])];
    const assGroups = groupByTeam(assignments, employees, teams);
    const ciGroups  = groupByTeam(costItems,   employees, teams);

    // Split into four global files so that high-frequency writes (audit log,
    // user changes) don't force the rest of settings to be re-written every
    // time – which used to cause ETag conflicts on settings.json.
    const autoBackup = state.autoBackup || {};
    const files = {
        'employees.json':  { employees },
        'projects.json':   { projects },
        'settings.json':   { invoiceRecipient, autoBackup },
        'categories.json': { empCategories, projCategories,
                             basicTasks, basicTasksMeta, inactiveBasicTasks,
                             offtimeTasks, inactiveOfftimeTasks,
                             inactiveSupportTasks, inactiveTrainingTasks,
                             customTrainingTasks },
        'users.json':      { appUsers },
        'audit.json':      { auditLog },
    };
    for (const team of teams) {
        files[teamAssignmentsFile(team)] = { assignments: assGroups[team] || [] };
        files[teamCostItemsFile(team)]   = { costItems:   ciGroups[team]  || [] };
    }
    return files;
}

// Merge split files back into a flat state object (like the old monolithic parsedData).
// `settings` is now the slim settings.json (invoiceRecipient + autoBackup).
// `categories`, `users`, `audit` are the new sibling files. If they are not
// yet present (i.e. data from an older schema), `settings` is also probed
// for the legacy fields so the merge still produces a complete state.
function mergeSplitFiles({ employees, projects, settings, categories, users, audit,
                          assignmentsByTeam, costItemsByTeam }) {
    const allAssignments = [];
    const allCostItems = [];
    Object.values(assignmentsByTeam || {}).forEach(arr => { if (arr) allAssignments.push(...arr); });
    Object.values(costItemsByTeam   || {}).forEach(arr => { if (arr) allCostItems.push(...arr); });
    const cat = categories || settings || {};
    const usr = users      || settings || {};
    const aud = audit      || settings || {};
    return {
        employees:        employees || [],
        projects:         projects  || [],
        assignments:      allAssignments,
        costItems:        allCostItems,
        expenses:         [],
        empCategories:      cat.empCategories      || DEFAULT_TEAMS,
        projCategories:     cat.projCategories     || [],
        basicTasks:         cat.basicTasks         || [],
        basicTasksMeta:     cat.basicTasksMeta     || {},
        inactiveBasicTasks:   cat.inactiveBasicTasks   || [],
        offtimeTasks:         cat.offtimeTasks         || [],
        inactiveOfftimeTasks: cat.inactiveOfftimeTasks || [],
        inactiveSupportTasks: cat.inactiveSupportTasks || [],
        inactiveTrainingTasks:cat.inactiveTrainingTasks|| [],
        customTrainingTasks:  cat.customTrainingTasks  || [],
        invoiceRecipient:     settings?.invoiceRecipient     || '',
        autoBackup:           settings?.autoBackup           || null,
        appUsers:             usr.appUsers             || [],
        auditLog:             aud.auditLog             || []
    };
}

// Migrate the old monolithic planner-state.json on SharePoint to split files.
// Idempotent: skips if meta.json already shows schemaVersion >= 3.
async function migrateSpToTeamSplit(ctx) {
    const meta = await spLoadFile(ctx, 'meta.json').catch(() => null);
    if (meta?.schemaVersion >= SCHEMA_VERSION) return;
    await spEnsureFolder(ctx, PLANNER_DATA_DIR);
    // If split files already exist, this install is already on >=v3; the
    // categories/users/audit split (v4) is handled lazily by buildSplitFiles
    // on the next save. Do NOT re-import the legacy monolith – it would
    // overwrite live split data with stale backup contents.
    const existingSettings = await spLoadFile(ctx, 'settings.json').catch(() => null);
    if (existingSettings) {
        await spSaveFile(ctx, 'meta.json', { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
        return;
    }
    const old = await spLoad(ctx).catch(() => null);
    if (!old) {
        await spSaveFile(ctx, 'meta.json', { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
        return;
    }
    const files = buildSplitFiles(old);
    for (const [filename, payload] of Object.entries(files)) {
        await spSaveFile(ctx, filename, payload);
    }
    await spSaveFile(ctx, 'meta.json', { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
    // planner-state.json is left in place as a backup.
}

// FS equivalent of the SharePoint migration.
async function migrateFsToTeamSplit(dirHandle) {
    const metaResult = await fsLoadFile(dirHandle, 'meta.json').catch(() => null);
    if (metaResult?.data?.schemaVersion >= SCHEMA_VERSION) return;
    // Same logic as the SP migration: if split files already exist, just
    // bump the schema marker. The categories/users/audit split is created
    // lazily on the next save.
    const existingSettings = await fsLoadFile(dirHandle, 'settings.json').catch(() => null);
    if (existingSettings) {
        await fsSaveFile(dirHandle, 'meta.json', { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
        return;
    }
    const oldResult = await fsLoad(dirHandle).catch(() => null);
    const old = oldResult?.data;
    if (!old) {
        await fsSaveFile(dirHandle, 'meta.json', { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
        return;
    }
    const files = buildSplitFiles(old);
    for (const [filename, payload] of Object.entries(files)) {
        await fsSaveFile(dirHandle, filename, payload);
    }
    await fsSaveFile(dirHandle, 'meta.json', { schemaVersion: SCHEMA_VERSION, migratedAt: new Date().toISOString() });
}

// Load all split files from SharePoint in parallel and merge into a flat
// parsedData-shaped object. Also returns the folder timestamps for polling.
async function loadSplitStateSp(ctx) {
    await migrateSpToTeamSplit(ctx);
    // Load global files first (categories.json governs the team list).
    const [settingsData, categoriesData, usersData, auditData] = await Promise.all([
        spLoadFile(ctx, 'settings.json').catch(() => null),
        spLoadFile(ctx, 'categories.json').catch(() => null),
        spLoadFile(ctx, 'users.json').catch(() => null),
        spLoadFile(ctx, 'audit.json').catch(() => null),
    ]);
    // Categories live in categories.json now; legacy settings.json still
    // carries empCategories for un-migrated installs (fallback).
    const teams = (categoriesData?.empCategories)
               || (settingsData?.empCategories)
               || DEFAULT_TEAMS;

    const [empFile, projFile, ...teamFiles] = await Promise.all([
        spLoadFile(ctx, 'employees.json').catch(() => null),
        spLoadFile(ctx, 'projects.json').catch(() => null),
        ...teams.flatMap(t => [
            spLoadFile(ctx, teamAssignmentsFile(t)).catch(() => null),
            spLoadFile(ctx, teamCostItemsFile(t)).catch(() => null)
        ])
    ]);

    const assignmentsByTeam = {};
    const costItemsByTeam = {};
    teams.forEach((t, i) => {
        assignmentsByTeam[t] = teamFiles[i * 2]?.assignments || [];
        costItemsByTeam[t]   = teamFiles[i * 2 + 1]?.costItems || [];
    });
    const state = mergeSplitFiles({
        employees:  empFile?.employees,
        projects:   projFile?.projects,
        settings:   settingsData   || {},
        categories: categoriesData || null,
        users:      usersData      || null,
        audit:      auditData      || null,
        assignmentsByTeam,
        costItemsByTeam
    });
    const fileMeta = await spGetFolderMeta(ctx).catch(() => ({}));
    const timestamps = {};
    const etags = {};
    Object.entries(fileMeta).forEach(([f, v]) => { timestamps[f] = v.ts; etags[f] = v.etag; });
    return { state, timestamps, etags };
}

async function loadSplitStateFs(dirHandle) {
    await migrateFsToTeamSplit(dirHandle);
    const [settingsResult, categoriesResult, usersResult, auditResult] = await Promise.all([
        fsLoadFile(dirHandle, 'settings.json').catch(() => null),
        fsLoadFile(dirHandle, 'categories.json').catch(() => null),
        fsLoadFile(dirHandle, 'users.json').catch(() => null),
        fsLoadFile(dirHandle, 'audit.json').catch(() => null),
    ]);
    const settings   = settingsResult?.data   || {};
    const categories = categoriesResult?.data || null;
    const users      = usersResult?.data      || null;
    const audit      = auditResult?.data      || null;
    const teams = (categories?.empCategories) || settings.empCategories || DEFAULT_TEAMS;

    const [empResult, projResult, ...teamResults] = await Promise.all([
        fsLoadFile(dirHandle, 'employees.json').catch(() => null),
        fsLoadFile(dirHandle, 'projects.json').catch(() => null),
        ...teams.flatMap(t => [
            fsLoadFile(dirHandle, teamAssignmentsFile(t)).catch(() => null),
            fsLoadFile(dirHandle, teamCostItemsFile(t)).catch(() => null)
        ])
    ]);

    const assignmentsByTeam = {};
    const costItemsByTeam = {};
    teams.forEach((t, i) => {
        assignmentsByTeam[t] = teamResults[i * 2]?.data?.assignments || [];
        costItemsByTeam[t]   = teamResults[i * 2 + 1]?.data?.costItems || [];
    });
    const state = mergeSplitFiles({
        employees: empResult?.data?.employees,
        projects:  projResult?.data?.projects,
        settings, categories, users, audit,
        assignmentsByTeam,
        costItemsByTeam
    });
    const timestamps = await fsGetFolderTimestamps(dirHandle).catch(() => ({}));
    return { state, timestamps };
}

// Save split files, writing ONLY those whose serialised payload differs from
// the entry in `lastSaved`. `lastSaved` is mutated to reflect the new state.
// `writeFile(filename, payload)` is the actual write callback (SP or FS).
// meta.json is always written LAST as an atomic commit marker so that polling
// clients can wait for meta.json before reacting to mid-write states.
async function saveSplitState(state, lastSaved, writeFile) {
    const files = buildSplitFiles(state);

    // Include any "historical" team files we may have written previously so
    // that removing a team from empCategories still produces an (empty)
    // write – otherwise stale data would linger in its file.
    Object.keys(lastSaved).forEach(fn => {
        if (!(fn in files) && (fn.startsWith('assignments-') || fn.startsWith('cost-items-'))) {
            files[fn] = fn.startsWith('assignments-') ? { assignments: [] } : { costItems: [] };
        }
    });

    // Sanity guards: skip writes that would wipe critical data. A previous
    // non-empty payload becoming empty is almost always a transient state-load
    // race, not a deliberate "delete everything". Protects against the
    // "settings.json plötzlich leer" failure mode.
    const wouldWipe = (filename, payload) => {
        const prev = lastSaved[filename];
        if (!prev) return false; // never saved before – fine
        try {
            const prevObj = JSON.parse(prev);
            if (filename === 'users.json') {
                return (prevObj.appUsers?.length > 0) && !(payload.appUsers?.length > 0);
            }
            if (filename === 'categories.json') {
                return (prevObj.empCategories?.length > 0) && !(payload.empCategories?.length > 0);
            }
            if (filename === 'employees.json') {
                return (prevObj.employees?.length > 0) && !(payload.employees?.length > 0);
            }
        } catch(e) { /* corrupt prev – allow write */ }
        return false;
    };

    let wroteAny = false;
    for (const [filename, payload] of Object.entries(files)) {
        const serialised = JSON.stringify(payload);
        if (lastSaved[filename] === serialised) continue;
        if (wouldWipe(filename, payload)) {
            console.warn(`[saveSplitState] aborted potentially destructive write to ${filename} (would wipe data)`);
            continue;
        }
        await writeFile(filename, serialised);
        lastSaved[filename] = serialised;
        wroteAny = true;
    }

    // Commit marker: written last so polling clients only react once all
    // data files are consistent.
    if (wroteAny) {
        await writeFile('meta.json', JSON.stringify({ schemaVersion: SCHEMA_VERSION, lastSaveAt: new Date().toISOString() }));
    }
}

// Load only specific team assignment/cost-item files from SharePoint.
// Used by the polling loop when global files (employees, projects, settings)
// are unchanged – avoids reloading all teams when only one changed.
async function loadChangedTeamFilesSp(ctx, changedFiles) {
    const results = await Promise.all(
        changedFiles.map(f => spLoadFile(ctx, f).then(d => [f, d]).catch(() => [f, null]))
    );
    const assignmentsByTeam = {};
    const costItemsByTeam = {};
    results.forEach(([f, data]) => {
        if (f.startsWith('assignments-')) {
            const team = f.slice('assignments-'.length, -'.json'.length);
            assignmentsByTeam[team] = data?.assignments || [];
        } else if (f.startsWith('cost-items-')) {
            const team = f.slice('cost-items-'.length, -'.json'.length);
            costItemsByTeam[team] = data?.costItems || [];
        }
    });
    return { assignmentsByTeam, costItemsByTeam };
}

// Pre-populate `lastSaved` from a state object so the next save round
// doesn't re-write files that are already in sync.
function seedLastSaved(state, lastSaved) {
    const files = buildSplitFiles(state);
    for (const [filename, payload] of Object.entries(files)) {
        lastSaved[filename] = JSON.stringify(payload);
    }
}
// ─────────────────────────────────────────────────────────────────────────────
