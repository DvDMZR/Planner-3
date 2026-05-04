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
    const appUsers              = (state.appUsers || []).filter(u => u.role !== 'admin');
    const auditLog              = state.auditLog              || [];

    const teams = [...new Set([...DEFAULT_TEAMS, ...empCategories])];
    const assGroups = groupByTeam(assignments, employees, teams);
    const ciGroups  = groupByTeam(costItems,   employees, teams);

    const files = {
        'employees.json': { employees },
        'projects.json':  { projects },
        'settings.json':  { empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks, customTrainingTasks, invoiceRecipient, appUsers, auditLog }
    };
    for (const team of teams) {
        files[teamAssignmentsFile(team)] = { assignments: assGroups[team] || [] };
        files[teamCostItemsFile(team)]   = { costItems:   ciGroups[team]  || [] };
    }
    return files;
}

// Merge split files back into a flat state object (like the old monolithic parsedData).
function mergeSplitFiles({ employees, projects, settings, assignmentsByTeam, costItemsByTeam }) {
    const allAssignments = [];
    const allCostItems = [];
    Object.values(assignmentsByTeam || {}).forEach(arr => { if (arr) allAssignments.push(...arr); });
    Object.values(costItemsByTeam   || {}).forEach(arr => { if (arr) allCostItems.push(...arr); });
    return {
        employees:        employees || [],
        projects:         projects  || [],
        assignments:      allAssignments,
        costItems:        allCostItems,
        expenses:         [],
        empCategories:      settings?.empCategories      || DEFAULT_TEAMS,
        projCategories:     settings?.projCategories     || [],
        basicTasks:         settings?.basicTasks         || [],
        basicTasksMeta:     settings?.basicTasksMeta     || {},
        inactiveBasicTasks:   settings?.inactiveBasicTasks   || [],
        offtimeTasks:         settings?.offtimeTasks         || [],
        inactiveOfftimeTasks: settings?.inactiveOfftimeTasks || [],
        inactiveSupportTasks: settings?.inactiveSupportTasks || [],
        inactiveTrainingTasks:settings?.inactiveTrainingTasks|| [],
        customTrainingTasks:  settings?.customTrainingTasks  || [],
        invoiceRecipient:     settings?.invoiceRecipient     || '',
        appUsers:             settings?.appUsers             || [],
        auditLog:             settings?.auditLog             || []
    };
}

// Migrate the old monolithic planner-state.json on SharePoint to split files.
// Idempotent: skips if meta.json already shows schemaVersion >= 3.
async function migrateSpToTeamSplit(ctx) {
    const meta = await spLoadFile(ctx, 'meta.json').catch(() => null);
    if (meta?.schemaVersion >= SCHEMA_VERSION) return;
    await spEnsureFolder(ctx, PLANNER_DATA_DIR);
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
    const settingsData = (await spLoadFile(ctx, 'settings.json').catch(() => null)) || {};
    const teams = settingsData.empCategories || DEFAULT_TEAMS;

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
        employees: empFile?.employees,
        projects:  projFile?.projects,
        settings:  settingsData,
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
    const settingsResult = await fsLoadFile(dirHandle, 'settings.json').catch(() => null);
    const settings = settingsResult?.data || {};
    const teams = settings.empCategories || DEFAULT_TEAMS;

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
        settings,
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

    let wroteAny = false;
    for (const [filename, payload] of Object.entries(files)) {
        const serialised = JSON.stringify(payload);
        if (lastSaved[filename] === serialised) continue;
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
