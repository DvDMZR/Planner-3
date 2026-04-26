// --- MAIN APP ---
function App() {
    // Local aliases for React hooks; avoids duplicate top-level `const` clash
    // when multiple pre-compiled scripts share the same browser global scope.
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    // --- STATE ---
    const [activeTab, setActiveTab] = useState('resource'); 
    
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [expenses, setExpenses] = useState([]); // legacy, migrated to costItems
    const [costItems, setCostItems] = useState([]);
    
    // Dynamic Categories
    const [empCategories, setEmpCategories] = useState(['AS', 'CMS', 'CSS', 'HM', 'I&C', 'Other']);
    const [projCategories, setProjCategories] = useState(['AMS', 'AFS', 'CMS', 'Other']);
    const [basicTasks, setBasicTasks] = useState(['Office']);
    const [basicTasksMeta, setBasicTasksMeta] = useState({});       // { [taskName]: { createdAt: ISO, permanent: bool, color?: string } }
    const [inactiveBasicTasks, setInactiveBasicTasks] = useState([]); // [{ name, createdAt }]
    const [basicTasksSubTab, setBasicTasksSubTab] = useState('aktiv');
    const [offtimeTasks, setOfftimeTasks] = useState(['Vacation', 'Sickness', 'Gleitzeit', 'Other']);
    const [inactiveOfftimeTasks, setInactiveOfftimeTasks] = useState([]); // [{ name }]
    const [inactiveSupportTasks, setInactiveSupportTasks] = useState([]); // string[]
    const [inactiveTrainingTasks, setInactiveTrainingTasks] = useState([]); // string[]
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);

    const [weeks, setWeeks] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [collapsedCategories, setCollapsedCategories] = useState({});
    const [collapsedProjCategories, setCollapsedProjCategories] = useState({});
    const [collapsedEmpSetup, setCollapsedEmpSetup] = useState({});

    // Ansichten-Steuerung für Projekt-Details
    const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);

    // Zeitspanne für Auslastungs-Berechnung
    const [weeksAhead, setWeeksAhead] = useState(DEFAULT_WEEKS_AHEAD);

    // Modals
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignContext, setAssignContext] = useState(null); 
    
    const [isCostItemModalOpen, setIsCostItemModalOpen] = useState(false);
    const [editingCostItem, setEditingCostItem] = useState(null);

    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copyContext, setCopyContext] = useState(null);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [pastProjectsExpanded, setPastProjectsExpanded] = useState(false);

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [invoiceSelection, setInvoiceSelection] = useState({ emps: {}, costs: {} });
    const [invoiceRecipient, setInvoiceRecipient] = useState('');
    const [isProjFormOpen, setIsProjFormOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [timelineYear, setTimelineYear] = useState(new Date().getFullYear());
    const currentWeekColRef = useRef(null);
    const resourceScrollRef = useRef(null);
    const timelineScrollRef = useRef(null);

    // Scroll current week to the left edge (right after sticky column)
    const scrollToCurrentWeek = useCallback((containerRef, stickyWidth) => {
        const container = containerRef?.current;
        const th = currentWeekColRef?.current;
        if (!container || !th) return;
        const thRect = th.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        container.scrollLeft = container.scrollLeft + (thRect.left - cRect.left) - stickyWidth;
    }, []);

    // Forms
    const [empForm, setEmpForm] = useState({ name: '', category: '', weeklyHours: HOURS_PER_WEEK });
    const [editingEmpId, setEditingEmpId] = useState(null);
    const [projForm, setProjForm] = useState({ name: '', category: '', projectNumber: '', address: '', startWeek: '', ibnWeek: '', color: 'gea', hourlyRate: DEFAULT_HOURLY_RATE, billable: true });
    const [editingProjectId, setEditingProjectId] = useState(null);

    // Category Forms
    const [newEmpCat, setNewEmpCat] = useState('');
    const [newProjCat, setNewProjCat] = useState('');
    const [newBasicTask, setNewBasicTask] = useState('');
    const [newOfftimeTask, setNewOfftimeTask] = useState('');
    const [expandedSetupCats, setExpandedSetupCats] = useState({ basic: true, other: false, support: false, training: false, offtime: false, empCats: false, projCats: false });

    // SharePoint / FS sync
    const syncStatusRef = useRef(SP_CONTEXT ? 'connecting' : 'local');
    const isRemoteUpdateRef = useRef(false);
    const spSaveTimer = useRef(null);
    const [syncStatus, setSyncStatusState] = useState(SP_CONTEXT ? 'connecting' : 'local');
    const setSyncStatus = (s) => { syncStatusRef.current = s; setSyncStatusState(s); };

    // File System sync (OneDrive lokal)
    const dirHandleRef = useRef(null);
    const [fsStatus, setFsStatus] = useState(FS_MODE ? 'checking' : 'off');
    // fsStatus: 'checking' | 'needs-setup' | 'needs-permission' | 'connected' | 'off'

    // Team-split sync state
    const spFileTimestampsRef = useRef({}); // { 'file.json': 'ISO', ... } for SP polling
    const fsFileTimestampsRef = useRef({}); // { 'file.json': <ms>, ... } for FS polling
    const lastSavedSpRef = useRef({});      // { filename: JSON string } for diff-based writes
    const lastSavedFsRef = useRef({});      // same for FS
    const employeesRef = useRef([]);
    const empCategoriesRef = useRef(DEFAULT_TEAMS);
    const latestStateRef = useRef({});

    // --- INIT ---
    useEffect(() => {
        const loadData = async () => {
            let parsedData = null;
            let currentEmpCats = DEFAULT_TEAMS;

            // 0. Try File System (local OneDrive folder)
            if (FS_MODE) {
                const handle = await idbGetHandle();
                if (handle) {
                    dirHandleRef.current = handle;
                    const perm = await handle.queryPermission({ mode: 'readwrite' });
                    if (perm === 'granted') {
                        try {
                            const { state, timestamps } = await loadSplitStateFs(handle);
                            if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
                                parsedData = state;
                                fsFileTimestampsRef.current = timestamps;
                                isRemoteUpdateRef.current = true;
                            }
                        } catch(e) { console.warn('[FS] load failed', e); }
                        setFsStatus('connected');
                    } else {
                        setFsStatus('needs-permission'); // Popup erscheint
                    }
                } else {
                    setFsStatus('needs-setup'); // Popup erscheint
                }
            }

            // 1. Try SharePoint first (wins over local data if available)
            if (SP_CONTEXT) {
                const runLoad = async () => {
                    const { state, timestamps } = await loadSplitStateSp(SP_CONTEXT);
                    // Treat "all empty" as fresh install → fall through to
                    // localStorage / generateInitialData so the app has
                    // sensible defaults to seed the new files.
                    if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
                        parsedData = state;
                        spFileTimestampsRef.current = timestamps;
                        isRemoteUpdateRef.current = true; // Loaded from SP – don't write back
                    } else {
                        spFileTimestampsRef.current = timestamps || {};
                    }
                };
                try {
                    await runLoad();
                    setSyncStatus('idle');
                } catch(e) {
                    if (e instanceof SpAuthError) {
                        // Session expired between page load and our first
                        // REST call – try a silent refresh before giving up.
                        setSyncStatus('reconnecting');
                        const ok = await spEnsureSession(SP_CONTEXT, { interactive: false });
                        if (ok) {
                            try { await runLoad(); setSyncStatus('idle'); }
                            catch(e2) { console.warn('[SP] load retry failed', e2); setSyncStatus('needs-auth'); }
                        } else {
                            setSyncStatus('needs-auth');
                        }
                    } else {
                        console.warn('[SP] load failed', e);
                        setSyncStatus('offline');
                    }
                }
            }

            // 2. Fallback to localStorage
            if (!parsedData) {
                const savedData = localStorage.getItem('teamMasterProData');
                if (savedData) { try { parsedData = JSON.parse(savedData); } catch(e) {} }
            }

            // 3. Apply data
            if (parsedData) {
                setEmployees(parsedData.employees || []);
                setProjects(parsedData.projects || []);
                setAssignments(parsedData.assignments || []);
                setExpenses(parsedData.expenses || []);
                // Load costItems or migrate old expenses
                if (parsedData.costItems) {
                    setCostItems(parsedData.costItems);
                } else if (parsedData.expenses && parsedData.expenses.length > 0) {
                    setCostItems(migrateExpensesToCostItems(parsedData.expenses));
                }
                if (parsedData.empCategories) {
                    // Migrate old team name 'ME' → 'CSS'
                    const migratedCats = parsedData.empCategories.map(c => c === 'ME' ? 'CSS' : c);
                    if (!migratedCats.includes('I&C')) migratedCats.splice(migratedCats.indexOf('Other'), 0, 'I&C');
                    setEmpCategories(migratedCats);
                    currentEmpCats = migratedCats;
                    // Also migrate employees
                    if (parsedData.employees) {
                        parsedData.employees = parsedData.employees.map(e => e.category === 'ME' ? {...e, category: 'CSS'} : e);
                    }
                }
                if (parsedData.projCategories) setProjCategories(parsedData.projCategories);
                if (parsedData.basicTasks) {
                    const loadedMeta     = parsedData.basicTasksMeta     || {};
                    const loadedInactive = parsedData.inactiveBasicTasks || [];
                    const expiryMs = BASIC_TASK_EXPIRY_WEEKS * 7 * 24 * 60 * 60 * 1000;
                    const now = Date.now();
                    // Skip tasks that are marked permanent or have no createdAt
                    const toExpire = parsedData.basicTasks.filter(t =>
                        loadedMeta[t] && !loadedMeta[t].permanent && loadedMeta[t].createdAt &&
                        (now - new Date(loadedMeta[t].createdAt).getTime()) > expiryMs
                    );
                    if (toExpire.length > 0) {
                        setBasicTasks(parsedData.basicTasks.filter(t => !toExpire.includes(t)));
                        setInactiveBasicTasks([...loadedInactive, ...toExpire.map(t => ({ name: t, createdAt: loadedMeta[t].createdAt }))]);
                    } else {
                        setBasicTasks(parsedData.basicTasks);
                        setInactiveBasicTasks(loadedInactive);
                    }
                    setBasicTasksMeta(parsedData.basicTasksMeta || {});
                }
                if (parsedData.offtimeTasks) setOfftimeTasks(parsedData.offtimeTasks);
                if (parsedData.inactiveOfftimeTasks) setInactiveOfftimeTasks(parsedData.inactiveOfftimeTasks);
                if (parsedData.inactiveSupportTasks) setInactiveSupportTasks(parsedData.inactiveSupportTasks);
                if (parsedData.inactiveTrainingTasks) setInactiveTrainingTasks(parsedData.inactiveTrainingTasks);
                if (parsedData.invoiceRecipient) setInvoiceRecipient(parsedData.invoiceRecipient);

                // Seed diff snapshots so the first save cycle is a no-op for
                // files that are already in sync.
                try {
                    seedLastSaved(parsedData, lastSavedSpRef.current);
                    seedLastSaved(parsedData, lastSavedFsRef.current);
                } catch(e) { console.warn('[SEED] snapshot seeding failed', e); }
            } else {
                const init = generateInitialData(currentEmpCats);
                setEmployees(init.employees);
                setProjects(init.projects);
                setAssignments(init.assignments);
                setExpenses(init.expenses);
            }

            const w = [];
            const today = new Date();
            // Anchor to Monday of the current ISO week so the resource view
            // is consistent with the timeline tab (which also starts on Monday).
            const todayDow = today.getDay() || 7; // 1=Mon … 7=Sun
            const thisMonday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayDow + 1);
            // Use 54 iterations to cover 53-week ISO years; deduplicate by ID.
            const seenIds = new Set();
            for(let i=0; i<54; i++) {
                const d = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + (i*7));
                const weekId = getWeekString(d);
                if (seenIds.has(weekId)) continue;
                seenIds.add(weekId);
                if (w.length >= 54) break;
                const kw = parseInt(weekId.split('-W')[1], 10);
                w.push({
                    id: weekId,
                    label: `KW ${kw}`,
                    sub: `${d.getDate()}.${d.getMonth()+1}.`,
                    month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
                });
            }
            setWeeks(w);
            setEmpForm(prev => ({...prev, category: currentEmpCats[0] || ''}));
            setProjForm(prev => ({...prev, startWeek: w[0].id, ibnWeek: w[10]?.id || w[w.length-1].id}));
        };
        loadData();
    }, []);

    // Keep refs aligned with state so polling closures see fresh data.
    useEffect(() => { employeesRef.current = employees; }, [employees]);
    useEffect(() => { empCategoriesRef.current = empCategories; }, [empCategories]);

    // Save on change. localStorage runs at ~400 ms, SharePoint at 1.5 s. The
    // SharePoint write is split per entity / team; saveSplitState() only
    // writes files whose content actually changed (diff against the last
    // saved snapshot), so Chef A editing CMS only touches assignments-CMS.json
    // while Chef B editing AS only touches assignments-AS.json – no conflicts.
    const localSaveTimer = useRef(null);
    useEffect(() => {
        if (employees.length === 0) return;

        // Skip writes triggered by remote updates (SharePoint polling or initial load)
        if (isRemoteUpdateRef.current) {
            isRemoteUpdateRef.current = false;
            return;
        }

        const stateData = {
            employees, projects, assignments, expenses, costItems,
            empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks,
            offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks,
            invoiceRecipient
        };

        if (localSaveTimer.current) clearTimeout(localSaveTimer.current);
        localSaveTimer.current = setTimeout(() => {
            try {
                localStorage.setItem('teamMasterProData', JSON.stringify(stateData));
            } catch(e) {
                console.warn('[LS] save failed', e);
            }
            if (FS_MODE && dirHandleRef.current) {
                saveSplitState(stateData, lastSavedFsRef.current,
                    (filename, payload) => fsSaveFile(dirHandleRef.current, filename, payload)
                ).then(async () => {
                    fsFileTimestampsRef.current = await fsGetFolderTimestamps(dirHandleRef.current);
                }).catch(err => {
                    console.warn('[FS] save failed', err);
                });
            }
        }, 400);

        if (SP_CONTEXT) {
            if (spSaveTimer.current) clearTimeout(spSaveTimer.current);
            spSaveTimer.current = setTimeout(async () => {
                // Don't clobber a known-broken auth state – the user will
                // retry the save by clicking "neu verbinden".
                if (syncStatusRef.current === 'needs-auth') return;
                const runSave = async () => {
                    await spEnsureFolder(SP_CONTEXT, PLANNER_DATA_DIR);
                    await saveSplitState(stateData, lastSavedSpRef.current,
                        (filename, payload) => spSaveFile(SP_CONTEXT, filename, payload)
                    );
                    spFileTimestampsRef.current = await spGetFolderTimestamps(SP_CONTEXT);
                };
                setSyncStatus('syncing');
                try {
                    await runSave();
                    setSyncStatus('idle');
                } catch(e) {
                    if (e instanceof SpAuthError) {
                        // Session expired while idle – try silent re-auth and
                        // replay the save exactly once. lastSavedSpRef is only
                        // updated per successful file write, so interrupted
                        // writes are naturally retried on the next save.
                        setSyncStatus('reconnecting');
                        const ok = await spEnsureSession(SP_CONTEXT, { interactive: false });
                        if (ok) {
                            try { await runSave(); setSyncStatus('idle'); }
                            catch(e2) { console.warn('[SP] save retry failed', e2); setSyncStatus('needs-auth'); }
                        } else {
                            setSyncStatus('needs-auth');
                        }
                    } else {
                        console.warn('[SP] save failed', e);
                        setSyncStatus('offline');
                    }
                }
            }, 1500);
        }
    }, [employees, projects, assignments, expenses, costItems, empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks, invoiceRecipient]);

    // Keep latestStateRef current so the beforeunload flush always sees the
    // latest data without re-registering the event listener on every change.
    useEffect(() => {
        latestStateRef.current = {
            employees, projects, assignments, expenses, costItems,
            empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks,
            offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks,
            invoiceRecipient
        };
    }, [employees, projects, assignments, expenses, costItems, empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks, invoiceRecipient]);

    // Flush pending local save before the page unloads so a fast tab close
    // doesn't drop the most recent edits.
    useEffect(() => {
        const flush = () => {
            if (!localSaveTimer.current) return;
            clearTimeout(localSaveTimer.current);
            localSaveTimer.current = null;
            try {
                localStorage.setItem('teamMasterProData', JSON.stringify(latestStateRef.current));
            } catch(e) {}
        };
        window.addEventListener('beforeunload', flush);
        return () => window.removeEventListener('beforeunload', flush);
    }, []);

    const applyRemoteSnapshot = useCallback((data, { notify = true } = {}) => {
        isRemoteUpdateRef.current = true;
        setEmployees(data.employees || []);
        setProjects(data.projects || []);
        setAssignments(data.assignments || []);
        setExpenses(data.expenses || []);
        if (data.costItems) setCostItems(data.costItems);
        else if (data.expenses && data.expenses.length > 0) setCostItems(migrateExpensesToCostItems(data.expenses));
        if (data.empCategories) setEmpCategories(data.empCategories);
        if (data.projCategories) setProjCategories(data.projCategories);
        if (data.basicTasks) setBasicTasks(data.basicTasks);
        if (data.basicTasksMeta !== undefined) setBasicTasksMeta(data.basicTasksMeta);
        if (data.inactiveBasicTasks) setInactiveBasicTasks(data.inactiveBasicTasks);
        if (data.offtimeTasks) setOfftimeTasks(data.offtimeTasks);
        if (data.invoiceRecipient !== undefined) setInvoiceRecipient(data.invoiceRecipient);
        // Also re-seed the snapshots so the save cascade triggered by these
        // setStates doesn't rewrite identical data back to the server.
        try {
            seedLastSaved(data, lastSavedSpRef.current);
            seedLastSaved(data, lastSavedFsRef.current);
        } catch(e) { console.warn('[SEED] snapshot seeding failed in applyRemoteSnapshot', e); }
        if (notify) {
            setSyncStatus('updated');
            setTimeout(() => { if (syncStatusRef.current === 'updated') setSyncStatus('idle'); }, 2000);
        }
    }, []);

    // SharePoint polling – pick up changes from other users every 5 seconds.
    // One folder-list call returns timestamps for all files; if only team
    // assignment/cost-item files changed, only those are reloaded (selective
    // reload). A full reload is triggered when employees/projects/settings change.
    const pollFailuresRef = useRef(0);
    const pollInFlightRef = useRef(false);
    useEffect(() => {
        if (!SP_CONTEXT) return;
        const poll = async () => {
            if (document.visibilityState === 'hidden') return;
            if (pollInFlightRef.current) return;
            const st = syncStatusRef.current;
            if (st === 'syncing' || st === 'connecting' || st === 'reconnecting' || st === 'needs-auth') return;
            pollInFlightRef.current = true;
            try {
                const newTs = await spGetFolderTimestamps(SP_CONTEXT);
                const prev = spFileTimestampsRef.current;
                const changedFiles = Object.keys(newTs).filter(f => newTs[f] !== prev[f]);
                if (changedFiles.length > 0) {
                    const needsFullReload = changedFiles.some(f =>
                        f === 'employees.json' || f === 'projects.json' || f === 'settings.json'
                    );
                    if (needsFullReload) {
                        const { state, timestamps } = await loadSplitStateSp(SP_CONTEXT);
                        spFileTimestampsRef.current = timestamps;
                        applyRemoteSnapshot(state);
                    } else {
                        const { assignmentsByTeam, costItemsByTeam } =
                            await loadChangedTeamFilesSp(SP_CONTEXT, changedFiles);
                        const empTeamMap = new Map(
                            employeesRef.current.map(e => [e.id, e.category || 'Other'])
                        );
                        const teamsUpdated = new Set([
                            ...Object.keys(assignmentsByTeam),
                            ...Object.keys(costItemsByTeam),
                        ]);
                        setAssignments(prev => {
                            const kept = prev.filter(a => !teamsUpdated.has(empTeamMap.get(a.empId) || 'Other'));
                            return [...kept, ...Object.values(assignmentsByTeam).flat()];
                        });
                        setCostItems(prev => {
                            const kept = prev.filter(c => !teamsUpdated.has(empTeamMap.get(c.empId) || 'Other'));
                            return [...kept, ...Object.values(costItemsByTeam).flat()];
                        });
                        spFileTimestampsRef.current = newTs;
                        changedFiles.forEach(f => {
                            if (f.startsWith('assignments-')) {
                                const team = f.slice('assignments-'.length, -'.json'.length);
                                lastSavedSpRef.current[f] = JSON.stringify({ assignments: assignmentsByTeam[team] || [] });
                            } else if (f.startsWith('cost-items-')) {
                                const team = f.slice('cost-items-'.length, -'.json'.length);
                                lastSavedSpRef.current[f] = JSON.stringify({ costItems: costItemsByTeam[team] || [] });
                            }
                        });
                    }
                }
                pollFailuresRef.current = 0;
                // Recover from a prior 'offline' as soon as the next poll
                // succeeds – no need to wait for a user edit.
                if (syncStatusRef.current === 'offline') setSyncStatus('idle');
            } catch(e) {
                if (e instanceof SpAuthError) {
                    // Session expired – drive the recovery pipeline. Silent
                    // refresh succeeds while the user's Entra session is
                    // alive, otherwise we surface the manual reconnect CTA.
                    setSyncStatus('reconnecting');
                    const ok = await spEnsureSession(SP_CONTEXT, { interactive: false });
                    setSyncStatus(ok ? 'idle' : 'needs-auth');
                    pollFailuresRef.current = 0;
                } else {
                    pollFailuresRef.current += 1;
                    if (pollFailuresRef.current >= 3 && syncStatusRef.current === 'idle') {
                        setSyncStatus('offline');
                    }
                }
            } finally {
                pollInFlightRef.current = false;
            }
        };
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, []);

    // Safety net: falls der initiale SharePoint-Handshake den Status
    // nicht auf 'idle' flippt (z.B. wegen eines geschluckten Fetches
    // oder Browser-Quirks), aber Saves trotzdem durchgehen, nach 10 s
    // auf 'idle' umstellen, damit die UI nicht dauerhaft „Verbindet ..."
    // zeigt.
    useEffect(() => {
        if (!SP_CONTEXT) return;
        const t = setTimeout(() => {
            if (syncStatusRef.current === 'connecting') setSyncStatus('idle');
        }, 10000);
        return () => clearTimeout(t);
    }, []);

    // File System polling – Änderungen von Kollegen alle 5 Sek. erkennen.
    useEffect(() => {
        if (!FS_MODE) return;
        const poll = async () => {
            if (document.visibilityState === 'hidden') return;
            if (!dirHandleRef.current) return;
            try {
                const newTs = await fsGetFolderTimestamps(dirHandleRef.current);
                const prev = fsFileTimestampsRef.current;
                const changed = Object.keys(newTs).some(f => newTs[f] !== prev[f]);
                if (changed) {
                    const { state, timestamps } = await loadSplitStateFs(dirHandleRef.current);
                    fsFileTimestampsRef.current = timestamps;
                    applyRemoteSnapshot(state);
                }
            } catch(e) { /* Transient errors ignored */ }
        };
        const interval = setInterval(poll, 5000);
        return () => clearInterval(interval);
    }, []);

    // Shared helper: after any kind of successful re-auth we want to pull the
    // latest remote snapshot so the UI can't show stale data.
    const refreshSpSnapshot = useCallback(async () => {
        try {
            const { state, timestamps } = await loadSplitStateSp(SP_CONTEXT);
            spFileTimestampsRef.current = timestamps;
            if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
                applyRemoteSnapshot(state, { notify: false });
            }
            return true;
        } catch(e) {
            console.warn('[SP] snapshot refresh failed', e);
            return false;
        }
    }, [applyRemoteSnapshot]);

    // Manual reconnect button on the status pill. Must run inside a click
    // handler so the browser allows the popup used for interactive re-auth.
    const reconnectSharePoint = useCallback(async () => {
        if (!SP_CONTEXT) return;
        setSyncStatus('reconnecting');
        const ok = await spEnsureSession(SP_CONTEXT, { interactive: true });
        if (!ok) { setSyncStatus('needs-auth'); return; }
        const loaded = await refreshSpSnapshot();
        setSyncStatus(loaded ? 'idle' : 'needs-auth');
    }, [refreshSpSnapshot]);

    // Ensure form defaults align with categories
    useEffect(() => {
        if (!empForm.category && empCategories.length > 0) {
            setEmpForm(prev => ({...prev, category: empCategories[0]}));
        }
        if (!projForm.category && projCategories.length > 0) {
            setProjForm(prev => ({...prev, category: projCategories[0]}));
        }
    }, [empCategories, projCategories]);

    // Auto-scroll to current week when switching to resource or project tab
    useEffect(() => {
        if (activeTab === 'resource') {
            const timer = setTimeout(() => scrollToCurrentWeek(resourceScrollRef, 288), 80);
            return () => clearTimeout(timer);
        }
        if (activeTab === 'project') {
            const timer = setTimeout(() => scrollToCurrentWeek(timelineScrollRef, 256), 80);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    // --- LOGIC ---
    const employeeById = useMemo(() => {
        const m = new Map();
        employees.forEach(e => m.set(e.id, e));
        return m;
    }, [employees]);

    const projectById = useMemo(() => {
        const m = new Map();
        projects.forEach(p => m.set(p.id, p));
        return m;
    }, [projects]);

    const assignmentsByEmpWeek = useMemo(() => {
        const m = new Map();
        assignments.forEach(a => {
            const key = a.empId + '\u0000' + a.week;
            let arr = m.get(key);
            if (!arr) { arr = []; m.set(key, arr); }
            arr.push(a);
        });
        return m;
    }, [assignments]);

    const assignmentsByProject = useMemo(() => {
        const m = new Map();
        assignments.forEach(a => {
            let arr = m.get(a.reference);
            if (!arr) { arr = []; m.set(a.reference, arr); }
            arr.push(a);
        });
        return m;
    }, [assignments]);

    const assignmentsByProjectWeek = useMemo(() => {
        const m = new Map();
        assignments.forEach(a => {
            const key = a.reference + '\u0000' + a.week;
            let arr = m.get(key);
            if (!arr) { arr = []; m.set(key, arr); }
            arr.push(a);
        });
        return m;
    }, [assignments]);

    const costItemsByProject = useMemo(() => {
        const m = new Map();
        costItems.forEach(c => {
            let arr = m.get(c.projectId);
            if (!arr) { arr = []; m.set(c.projectId, arr); }
            arr.push(c);
        });
        return m;
    }, [costItems]);

    const getEmpWeeklyHours = useCallback((empId) => {
        return employeeById.get(empId)?.weeklyHours ?? HOURS_PER_WEEK;
    }, [employeeById]);

    const projectStatusById = useMemo(() => {
        const now = getWeekString(new Date());
        const m = new Map();
        projects.forEach(p => {
            let status;
            if (p.costsSubmitted) status = 'costs_submitted';
            else if (p.projectCompleted) status = 'completed';
            else {
                const projCosts = costItemsByProject.get(p.id) || [];
                const projAss = assignmentsByProject.get(p.id) || [];
                if (p.ibnWeek < now && projAss.length > 0 && projCosts.length === 0) status = 'missing_costs';
                else if (p.startWeek <= now) status = 'active';
                else status = 'planned';
            }
            m.set(p.id, status);
        });
        return m;
    }, [projects, assignmentsByProject, costItemsByProject]);

    const computeAutoStatus = useCallback((p) => {
        return projectStatusById.get(p.id) ?? 'planned';
    }, [projectStatusById]);

    // Derived collections – memoized so render functions don't rebuild them
    // on every keystroke / polling tick.
    const activeEmployees = useMemo(
        () => employees.filter(e => e.active !== false),
        [employees]
    );

    const activeEmpsByCategory = useMemo(() => {
        const m = new Map();
        activeEmployees.forEach(e => {
            let arr = m.get(e.category);
            if (!arr) { arr = []; m.set(e.category, arr); }
            arr.push(e);
        });
        // Sort employees alphabetically within each category
        m.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'de')));
        return m;
    }, [activeEmployees]);

    const activeEmpCategories = useMemo(
        () => Array.from(activeEmpsByCategory.keys()).sort((a, b) =>
            a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b, 'de')
        ),
        [activeEmpsByCategory]
    );

    const projectsByCategory = useMemo(() => {
        const m = new Map();
        projects.forEach(p => {
            let arr = m.get(p.category);
            if (!arr) { arr = []; m.set(p.category, arr); }
            arr.push(p);
        });
        for (const arr of m.values()) {
            arr.sort((a, b) => (a.startWeek || '').localeCompare(b.startWeek || ''));
        }
        return m;
    }, [projects]);

    const projCategoriesFromProjects = useMemo(
        () => Array.from(projectsByCategory.keys()),
        [projectsByCategory]
    );

    // Cache weeks per year – generateWeeksForYear does Easter math + 54
    // iterations, expensive to redo on every render.
    const weeksByYearCacheRef = useRef(new Map());
    const getWeeksForYear = useCallback((year) => {
        const cache = weeksByYearCacheRef.current;
        if (!cache.has(year)) cache.set(year, generateWeeksForYear(year));
        return cache.get(year);
    }, []);
    const timelineWeeks = useMemo(() => getWeeksForYear(timelineYear), [timelineYear, getWeeksForYear]);

    const utilizationMap = useMemo(() => {
        const m = new Map();
        for (const [key, weekAss] of assignmentsByEmpWeek) {
            const empId = key.slice(0, key.indexOf('\u0000'));
            const weeklyHours = getEmpWeeklyHours(empId);
            let total = 0;
            let isOfftime = false;
            for (let i = 0; i < weekAss.length; i++) {
                const a = weekAss[i];
                total += ((a.hours ?? (a.percent / 100 * weeklyHours)) / weeklyHours) * 100;
                if (a.type === 'offtime') isOfftime = true;
            }
            m.set(key, { total, isOfftime, assignments: weekAss });
        }
        return m;
    }, [assignmentsByEmpWeek, getEmpWeeklyHours]);

    const getUtilization = useCallback((empId, week) =>
        utilizationMap.get(empId + '\u0000' + week) ?? { total: 0, isOfftime: false, assignments: [] }
    , [utilizationMap]);

    const toggleCategory = useCallback((cat) => {
        setCollapsedCategories(prev => ({...prev, [cat]: !prev[cat]}));
    }, []);

    const toggleProjCategory = useCallback((cat) => {
        setCollapsedProjCategories(prev => ({...prev, [cat]: !prev[cat]}));
    }, []);

    const toggleEmpSetup = useCallback((cat) => {
        setCollapsedEmpSetup(prev => ({...prev, [cat]: !prev[cat]}));
    }, []);

    const handleSaveAssignment = useCallback((data) => {
        if (Array.isArray(data)) {
            setAssignments(prev => [...prev, ...data]);
        } else if (data.id) {
            setAssignments(prev => prev.map(a => a.id === data.id ? data : a));
        } else {
            setAssignments(prev => [...prev, { ...data, id: makeId('ass') }]);
        }
        setIsAssignModalOpen(false);
    }, []);

    const handleDeleteAssignment = useCallback((id) => {
        setAssignments(prev => prev.filter(a => a.id !== id));
        setIsAssignModalOpen(false);
    }, []);

    const handleDeleteAssignmentSeries = useCallback((id) => {
        setAssignments(prev => {
            const ass = prev.find(a => a.id === id);
            if (!ass) return prev;
            return prev.filter(a => !(a.ruleId === ass.ruleId && a.week >= ass.week));
        });
        setIsAssignModalOpen(false);
    }, []);

    const handleDrop = useCallback((e, targetWeek, targetEmpIdOrProjId, isResourceView = false) => {
        e.preventDefault();
        const assignmentId = e.dataTransfer.getData('assignmentId');
        if (assignmentId) {
            // Move existing assignment chip. In resource view: reassign to target employee.
            // In project view: reassign to target project (only for project-type chips).
            setAssignments(prev => prev.map(a => {
                if (a.id !== assignmentId) return a;
                const updated = { ...a, week: targetWeek };
                if (isResourceView) {
                    const newEmpId = targetEmpIdOrProjId;
                    if (newEmpId !== a.empId) {
                        updated.empId = newEmpId;
                        delete updated.comment;
                    }
                } else if (a.type === 'project' && targetEmpIdOrProjId !== a.reference) {
                    updated.reference = targetEmpIdOrProjId;
                }
                return updated;
            }));
            return;
        }
        const empId = e.dataTransfer.getData('empId');
        if (!empId) return;
        if (!isResourceView) {
            setAssignments(prev => [...prev, {
                id: makeId('ass'),
                empId,
                week: targetWeek,
                type: 'project',
                reference: targetEmpIdOrProjId,
                hours: HOURS_PER_WEEK
            }]);
        } else {
            // In resource view: open modal to pick type/reference
            setAssignContext({ empId: targetEmpIdOrProjId, week: targetWeek });
            setIsAssignModalOpen(true);
        }
    }, []);

    const exportData = useCallback(() => {
        const data = JSON.stringify({
            employees, projects, assignments, expenses, costItems,
            empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks,
            offtimeTasks, invoiceRecipient,
            schemaVersion: SCHEMA_VERSION
        }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Einsatzplanung3.0_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    }, [employees, projects, assignments, expenses, costItems, empCategories, projCategories,
        basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, invoiceRecipient]);

    const importData = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.employees) setEmployees(parsed.employees);
                if (parsed.projects) setProjects(parsed.projects);
                if (parsed.assignments) setAssignments(parsed.assignments);
                if (parsed.expenses) setExpenses(parsed.expenses);
                if (parsed.costItems) {
                    setCostItems(parsed.costItems);
                } else if (parsed.expenses && parsed.expenses.length > 0) {
                    setCostItems(migrateExpensesToCostItems(parsed.expenses));
                }
                if (parsed.empCategories) setEmpCategories(parsed.empCategories);
                if (parsed.projCategories) setProjCategories(parsed.projCategories);
                if (parsed.basicTasks) setBasicTasks(parsed.basicTasks);
                if (parsed.basicTasksMeta) setBasicTasksMeta(parsed.basicTasksMeta);
                if (parsed.inactiveBasicTasks) setInactiveBasicTasks(parsed.inactiveBasicTasks);
                if (parsed.offtimeTasks) setOfftimeTasks(parsed.offtimeTasks);
            } catch (err) {
                alert('Fehler beim Importieren der Daten: Die Datei konnte nicht gelesen werden.');
            }
        };
        reader.readAsText(file);
    }, []);

    const buildInvoiceData = useCallback((proj, selection) => {
        const projAss = assignmentsByProject.get(proj.id) || [];
        const hoursByEmp = new Map();
        for (let i = 0; i < projAss.length; i++) {
            const a = projAss[i];
            const h = a.hours ?? ((a.percent ?? 100) / 100 * HOURS_PER_WEEK);
            hoursByEmp.set(a.empId, (hoursByEmp.get(a.empId) || 0) + h);
        }

        const laborLines = [];
        let total = 0;
        const rate = proj.hourlyRate ?? DEFAULT_HOURLY_RATE;
        hoursByEmp.forEach((hours, empId) => {
            if (hours <= 0 || proj.billable === false) return;
            const cost = hours * rate;
            const included = !selection || selection.emps[empId];
            if (included) total += cost;
            laborLines.push({
                empId,
                emp: employeeById.get(empId),
                hours, rate, cost,
                included,
            });
        });

        const costLines = [];
        const projCosts = costItemsByProject.get(proj.id) || [];
        projCosts.forEach(ci => {
            const included = !selection || selection.costs[ci.id];
            if (included) total += ci.amount || 0;
            costLines.push({
                ci,
                emp: employeeById.get(ci.empId),
                included,
            });
        });

        return { laborLines, costLines, total };
    }, [assignmentsByProject, employeeById, costItemsByProject]);

    const openInvoiceModal = useCallback(() => {
        const proj = projectById.get(selectedProjectDetails);
        if (!proj) return;
        const projAss = assignmentsByProject.get(proj.id) || [];
        const empIds = [...new Set(projAss.map(a => a.empId))];
        const projCosts = costItemsByProject.get(proj.id) || [];

        const initialEmps = {};
        empIds.forEach(id => initialEmps[id] = true);

        const initialCosts = {};
        projCosts.forEach(c => initialCosts[c.id] = true);

        setInvoiceSelection({ emps: initialEmps, costs: initialCosts });
        setIsInvoiceModalOpen(true);
    }, [projectById, selectedProjectDetails, assignmentsByProject, costItemsByProject]);

    const handleInvoiceExport = () => {
        const proj = projectById.get(selectedProjectDetails);
        if (!proj) return;
        const { laborLines, costLines, total } = buildInvoiceData(proj, invoiceSelection);

        const rows = [];
        rows.push(["Rechnung für Projekt:", proj.name]);
        rows.push(["Projektnummer:", proj.projectNumber || '']);
        if (proj.address) rows.push(["Adresse:", proj.address]);
        rows.push(["Datum:", new Date().toLocaleDateString('de-DE')]);
        rows.push([]);
        rows.push(["Position", "Mitarbeiter", "Details", "Menge", "Einzelpreis", "Gesamt"]);

        laborLines.forEach(l => {
            if (!l.included) return;
            rows.push(["Dienstleistung", l.emp?.name || 'Unbekannt', "Arbeitszeit", `${l.hours} Std.`, `${l.rate} EUR`, `${l.cost.toFixed(2)} EUR`]);
        });
        costLines.forEach(({ ci, emp, included }) => {
            if (!included) return;
            rows.push([ci.type, emp?.name || 'Unbekannt', ci.description || '', "1", `${(ci.amount || 0).toFixed(2)} EUR`, `${(ci.amount || 0).toFixed(2)} EUR`]);
        });

        rows.push([]);
        rows.push(["", "", "", "", "Gesamt Netto:", `${total.toFixed(2)} EUR`]);

        const csvContent = "\uFEFF" + rows.map(e => e.join(";")).join("\n");
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Rechnung_${proj.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setIsInvoiceModalOpen(false);
        setProjects(prev => prev.map(p => p.id === selectedProjectDetails ? {...p, invoiceStatus: 'exportiert'} : p));
    };

    const handleInvoiceSendEmail = () => {
        const proj = projectById.get(selectedProjectDetails);
        if (!proj) return;
        const { laborLines, costLines, total } = buildInvoiceData(proj, invoiceSelection);
        const rows = [];
        laborLines.forEach(l => {
            if (!l.included) return;
            rows.push(`  - ${l.emp?.name || 'Unbekannt'}: ${l.hours} Std. x ${l.rate} EUR/h = ${l.cost.toFixed(2)} EUR`);
        });
        costLines.forEach(({ ci, included }) => {
            if (!included) return;
            rows.push(`  - ${ci.type}${ci.description ? ' (' + ci.description + ')' : ''}: ${(ci.amount || 0).toFixed(2)} EUR`);
        });

        const subject = encodeURIComponent(`Rechnung: ${proj.name} - ${new Date().toLocaleDateString('de-DE')}`);
        const body = encodeURIComponent(
            `Guten Tag,\n\nanbei sende ich die Rechnung fuer folgendes Projekt:\n\n` +
            `Projekt: ${proj.name}\n` +
            `Projektnummer: ${proj.projectNumber || '-'}\n` +
            `Datum: ${new Date().toLocaleDateString('de-DE')}\n\n` +
            `Positionen:\n${rows.join('\n')}\n\n` +
            `Gesamtsumme (Netto): ${total.toFixed(2)} EUR\n\n` +
            `Mit freundlichen Gruessen`
        );
        window.location.href = `mailto:${invoiceRecipient}?subject=${subject}&body=${body}`;
    };

    // --- SUB-COMPONENTS ---

    const ProjFormModal = () => {
        if (!isProjFormOpen) return null;
        const isEditing = !!editingProjectId;
        const emptyForm = () => {
            const nextColorId = PROJECT_COLORS[projects.length % PROJECT_COLORS.length].id;
            return { name: '', category: projCategories[0] || '', projectNumber: '', address: '', startWeek: weeks[0]?.id || '', ibnWeek: weeks[10]?.id || '', color: nextColorId };
        };
        const save = () => {
            if (!projForm.name.trim()) return;
            if (projForm.startWeek && projForm.ibnWeek && projForm.ibnWeek < projForm.startWeek) {
                alert('IBN-Woche darf nicht vor der Start-Woche liegen.');
                return;
            }
            if (isEditing) {
                setProjects(projects.map(p => p.id === editingProjectId ? { ...p, ...projForm } : p));
                setEditingProjectId(null);
            } else {
                setProjects([...projects, { id: makeId('p'), ...projForm, billable: true, hourlyRate: DEFAULT_HOURLY_RATE }]);
            }
            setProjForm(emptyForm());
            setIsProjFormOpen(false);
        };
        const cancel = () => {
            setEditingProjectId(null);
            setProjForm(emptyForm());
            setIsProjFormOpen(false);
        };
        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                    <ModalHeader title={isEditing ? 'Projekt bearbeiten' : 'Neues Projekt'} onClose={cancel}/>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-700 mb-1 font-semibold">Name</label>
                                <input type="text" value={projForm.name} onChange={e => setProjForm({...projForm, name: e.target.value})} className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500" autoFocus/>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-700 mb-1 font-semibold">Adresse</label>
                                <input type="text" value={projForm.address || ''} onChange={e => setProjForm({...projForm, address: e.target.value})} placeholder="Straße, PLZ Ort, Land" className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500"/>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-700 mb-1 font-semibold">Projektnr.</label>
                                <input type="text" maxLength={15} value={projForm.projectNumber} onChange={e => setProjForm({...projForm, projectNumber: e.target.value})} placeholder="GEA-2024-00001" className="w-full p-2 border border-slate-400 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500"/>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-700 mb-1 font-semibold">Kategorie</label>
                                <select value={projForm.category} onChange={e => setProjForm({...projForm, category: e.target.value})} className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400">
                                    {projCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-700 mb-1 font-semibold">Start (KW)</label>
                                <input type="week" value={projForm.startWeek} onChange={e => setProjForm({...projForm, startWeek: e.target.value})} className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"/>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-700 mb-1 font-semibold">IBN (KW)</label>
                                <input type="week" value={projForm.ibnWeek} onChange={e => setProjForm({...projForm, ibnWeek: e.target.value})} className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-700 mb-2 font-semibold">Farbe</label>
                            <div className="flex flex-wrap gap-2">
                                {PROJECT_COLORS.map(c => (
                                    <button key={c.id} onClick={() => setProjForm({...projForm, color: c.id})}
                                        title={c.id}
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${c.dot} ${projForm.color === c.id ? 'border-slate-800 scale-110 shadow' : 'border-transparent hover:border-slate-400'}`}>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={cancel} className="flex-1 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">Abbruch</button>
                            <button onClick={save} className="flex-1 bg-gea-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors">{isEditing ? 'Speichern' : 'Erstellen'}</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const HelpModal = () => (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden" style={{maxHeight:'85vh',overflowY:'auto'}}>
                <ModalHeader title="Hilfe & Legende" onClose={() => setIsHelpModalOpen(false)}/>
                <div className="p-6 space-y-6 text-sm">
                    <div>
                        <h3 className="font-semibold text-gea-800 mb-3 uppercase tracking-wide text-xs border-b border-gea-100 pb-2">Zell-Farben im Ressourcenplaner</h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3"><div className="w-10 h-6 rounded flex-shrink-0 bg-emerald-200 border border-emerald-300"></div><span className="text-slate-700">Frei / Verfügbar — keine Einsätze geplant</span></div>
                            <div className="flex items-center gap-3"><div className="w-10 h-6 rounded flex-shrink-0 bg-amber-200 border border-amber-300"></div><span className="text-slate-700">Auslastung ≥ 80% — Achtung, fast voll</span></div>
                            <div className="flex items-center gap-3"><div className="w-10 h-6 rounded flex-shrink-0 bg-rose-200 border border-rose-300"></div><span className="text-slate-700">Überlastet — Einsatz &gt; 100%</span></div>
                            <div className="flex items-center gap-3"><div className="w-10 h-6 rounded flex-shrink-0 diagonal-stripes border border-slate-300"></div><span className="text-slate-700">Abwesenheit (Urlaub, Krank, Gleitzeit …)</span></div>
                            <div className="flex items-center gap-3"><div className="w-10 h-6 rounded flex-shrink-0 bg-gea-200 border border-gea-400"></div><span className="text-slate-700">Aktuelle Woche — farbig hervorgehoben</span></div>
                            <div className="flex items-center gap-3"><div className="w-10 h-6 rounded flex-shrink-0 bg-slate-300 border border-slate-400"></div><span className="text-slate-700">Vergangene Woche — gedimmt angezeigt</span></div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gea-800 mb-3 uppercase tracking-wide text-xs border-b border-gea-100 pb-2">Bedienung</h3>
                        <div className="space-y-2 text-slate-700">
                            <p><span className="font-semibold">Klick auf Zelle</span> → Einsatz anlegen oder bearbeiten (Prozent oder Stunden, Projekt oder Abwesenheit)</p>
                            <p><span className="font-semibold">Drag &amp; Drop</span> (Projekt-Zeitstrahl) → Mitarbeiter aus der linken Liste in eine Projektwoche ziehen</p>
                            <p><span className="font-semibold">Löschmodus</span> → roten Button oben rechts aktivieren, dann Einsätze anklicken um sie zu löschen</p>
                            <p><span className="font-semibold">Heute-Button</span> (Zeitstrahl) → springt zur aktuellen Kalenderwoche</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gea-800 mb-3 uppercase tracking-wide text-xs border-b border-gea-100 pb-2">Projekt-Status</h3>
                        <div className="space-y-2">
                            {PROJECT_STATUSES.map(s => (
                                <div key={s.value} className="flex items-start gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${s.color}`}>{s.label}</span>
                                    <span className="text-slate-600 text-xs">{
                                        s.value === 'planned' ? 'Start-Woche liegt noch in der Zukunft' :
                                        s.value === 'active' ? 'Projekt hat begonnen und läuft aktuell' :
                                        s.value === 'missing_costs' ? 'IBN-Woche ist vorbei, aber noch keine Kostenpunkte erfasst' :
                                        s.value === 'completed' ? 'Projekt wurde als abgeschlossen markiert' :
                                        'Kosten wurden bereits übermittelt'
                                    }</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const InvoiceModal = () => {
        if (!isInvoiceModalOpen || !selectedProjectDetails) return null;

        const proj = projectById.get(selectedProjectDetails);
        if (!proj) return null;
        const { laborLines, costLines, total: currentTotal } = buildInvoiceData(proj, invoiceSelection);

        return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                    <ModalHeader title="Rechnung konfigurieren" subtitle={`Projekt: ${proj.name}`} onClose={() => setIsInvoiceModalOpen(false)} />

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {proj.billable !== false && (
                            <div>
                                <h4 className="text-slate-700 text-base mb-3 border-b border-slate-300 pb-2 font-medium">Dienstleistungen (Arbeitszeit)</h4>
                                <div className="space-y-2">
                                    {laborLines.filter(l => l.hours > 0).map(({ empId, emp, hours, rate, cost }) => (
                                        <label key={empId} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={!!invoiceSelection.emps[empId]}
                                                onChange={e => setInvoiceSelection({...invoiceSelection, emps: {...invoiceSelection.emps, [empId]: e.target.checked}})}
                                                className="w-5 h-5 text-gea-600 rounded"/>
                                            <div className="flex-1 text-sm text-slate-800 font-medium">{emp?.name || 'Unbekannt'}</div>
                                            <div className="text-sm text-slate-500">{hours} Std. × {rate} €/h</div>
                                            <div className="text-sm text-slate-900 w-24 text-right font-medium">{cost.toFixed(2)} €</div>
                                        </label>
                                    ))}
                                    {laborLines.length === 0 && <p className="text-sm text-slate-400">Keine Arbeitszeiten verplant.</p>}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-slate-700 text-base mb-3 border-b border-slate-300 pb-2 font-medium">Kostenpunkte</h4>
                            <div className="space-y-2">
                                {costLines.map(({ ci, emp }) => {
                                    return (
                                        <label key={ci.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={!!invoiceSelection.costs[ci.id]}
                                                onChange={e => setInvoiceSelection({...invoiceSelection, costs: {...invoiceSelection.costs, [ci.id]: e.target.checked}})}
                                                className="w-5 h-5 text-gea-600 rounded"/>
                                            <div className="flex-1 text-sm">
                                                <span className="text-slate-800 font-medium">{ci.type}</span>
                                                {ci.description && <span className="text-slate-500 ml-2">{ci.description}</span>}
                                                <span className="text-slate-400 ml-2">({emp?.name || 'Unbekannt'})</span>
                                            </div>
                                            {ci.week && <div className="text-xs text-slate-400">{ci.week}</div>}
                                            <div className="text-sm text-slate-900 w-24 text-right font-medium">{(ci.amount || 0).toFixed(2)} €</div>
                                        </label>
                                    );
                                })}
                                {costLines.length === 0 && <p className="text-sm text-slate-400">Keine Kostenpunkte erfasst.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-500">Gesamtsumme (Netto)</p>
                            <p className="text-xl text-gea-600 font-medium">{currentTotal.toFixed(2)} €</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium">Abbrechen</button>
                            {invoiceRecipient && (
                                <button onClick={handleInvoiceSendEmail} className="px-4 py-2 text-sm text-white bg-gea-500 rounded-md hover:bg-gea-600 flex items-center gap-2 font-medium">
                                    ✉ Per E-Mail
                                </button>
                            )}
                            <button onClick={handleInvoiceExport} className="px-4 py-2 text-sm text-white bg-gea-600 rounded-md hover:bg-gea-700 flex items-center gap-2 font-medium">
                                <IconFileText size={16}/> CSV Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- FILE SYSTEM SYNC HANDLERS ---

    const applyFsData = async (handle) => {
        try {
            const { state, timestamps } = await loadSplitStateFs(handle);
            if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
                fsFileTimestampsRef.current = timestamps;
                applyRemoteSnapshot(state, { notify: false });
            }
        } catch(e) { console.warn('[FS] applyFsData failed', e); }
    };

    const handleSetupFolder = async () => {
        try {
            const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
            await idbSaveHandle(handle);
            dirHandleRef.current = handle;
            await applyFsData(handle);
            setFsStatus('connected');
            setSyncStatus('idle');
        } catch(e) { /* Nutzer hat abgebrochen */ }
    };

    const handleActivateSync = async () => {
        const handle = dirHandleRef.current;
        if (!handle) return;
        try {
            const result = await handle.requestPermission({ mode: 'readwrite' });
            if (result === 'granted') {
                await applyFsData(handle);
                setFsStatus('connected');
                setSyncStatus('idle');
            }
        } catch(e) {}
    };


    // ─── PROP BUNDLES for view components ────────────────────────────────────
    const s = {
        activeTab, employees, projects, assignments, expenses, costItems,
        empCategories, projCategories, basicTasks, basicTasksMeta,
        inactiveBasicTasks, basicTasksSubTab, offtimeTasks, inactiveOfftimeTasks,
        inactiveSupportTasks, inactiveTrainingTasks, isChangelogOpen,
        weeks, selectedProject, collapsedCategories, collapsedProjCategories,
        collapsedEmpSetup, selectedProjectDetails, weeksAhead,
        isAssignModalOpen, assignContext, isCostItemModalOpen, editingCostItem,
        isCopyModalOpen, copyContext, isDeleteMode, pastProjectsExpanded,
        isInvoiceModalOpen, invoiceSelection, invoiceRecipient, isProjFormOpen,
        isHelpModalOpen, timelineYear, empForm, editingEmpId, projForm,
        editingProjectId, newEmpCat, newProjCat, newBasicTask, newOfftimeTask,
        expandedSetupCats, syncStatus, fsStatus,
        employeeById, projectById, assignmentsByEmpWeek, assignmentsByProject,
        assignmentsByProjectWeek, costItemsByProject, projectStatusById,
        activeEmployees, activeEmpsByCategory, activeEmpCategories,
        projectsByCategory, projCategoriesFromProjects, timelineWeeks,
        currentWeekColRef, resourceScrollRef, timelineScrollRef,
    };
    const h = useMemo(() => ({
        setActiveTab, setEmployees, setProjects, setAssignments,
        setCostItems, setEmpCategories, setProjCategories, setBasicTasks,
        setBasicTasksMeta, setInactiveBasicTasks, setBasicTasksSubTab,
        setOfftimeTasks, setInactiveOfftimeTasks, setInactiveSupportTasks,
        setInactiveTrainingTasks, setIsChangelogOpen, setSelectedProject,
        setCollapsedCategories, setCollapsedProjCategories, setCollapsedEmpSetup,
        setSelectedProjectDetails, setWeeksAhead, setIsAssignModalOpen,
        setAssignContext, setIsCostItemModalOpen, setEditingCostItem,
        setIsCopyModalOpen, setCopyContext, setIsDeleteMode, setPastProjectsExpanded,
        setIsInvoiceModalOpen, setInvoiceSelection, setInvoiceRecipient,
        setIsProjFormOpen, setIsHelpModalOpen, setTimelineYear, setEmpForm,
        setEditingEmpId, setProjForm, setEditingProjectId, setNewEmpCat,
        setNewProjCat, setNewBasicTask, setNewOfftimeTask, setExpandedSetupCats,
        setSyncStatus, setFsStatus,
        getEmpWeeklyHours, computeAutoStatus, getWeeksForYear, getUtilization,
        toggleCategory, toggleProjCategory, toggleEmpSetup,
        handleSaveAssignment, handleDeleteAssignment, handleDeleteAssignmentSeries,
        handleDrop, exportData, importData, buildInvoiceData, openInvoiceModal,
        scrollToCurrentWeek, reconnectSharePoint,
    }), [
        // useState setters are stable – no deps needed for those.
        // Only useCallback refs with real deps need listing:
        getEmpWeeklyHours, computeAutoStatus, getWeeksForYear, getUtilization,
        buildInvoiceData, openInvoiceModal, exportData, reconnectSharePoint,
    ]);

    return (
        <div className="flex h-screen w-full font-sans text-slate-800 bg-white overflow-hidden">

            <SidebarView s={s} h={h}/>
            
            {activeTab === 'resource' && <ResourceView s={s} h={h}/>}
            {activeTab === 'project' && <TimelineView s={s} h={h}/>}
            {activeTab === 'utilization' && <UtilizationView s={s} h={h}/>}
            {activeTab === 'overview' && <OverviewView s={s} h={h}/>}
            {activeTab === 'setup_emp' && <SetupEmpView s={s} h={h}/>}
            {activeTab === 'setup_proj' && <SetupProjView s={s} h={h}/>}
            {activeTab === 'setup_cats' && <SetupCatsView s={s} h={h}/>}
            {activeTab === 'data' && <DataView s={s} h={h}/>}

            {isAssignModalOpen && assignContext && (
                <AssignmentModal
                    assignContext={assignContext}
                    employeeById={employeeById}
                    basicTasks={basicTasks}
                    basicTasksMeta={basicTasksMeta}
                    offtimeTasks={offtimeTasks}
                    inactiveOfftimeTasks={inactiveOfftimeTasks}
                    inactiveSupportTasks={inactiveSupportTasks}
                    inactiveTrainingTasks={inactiveTrainingTasks}
                    projects={projects}
                    computeAutoStatus={computeAutoStatus}
                    getUtilization={getUtilization}
                    getEmpWeeklyHours={getEmpWeeklyHours}
                    setBasicTasks={setBasicTasks}
                    setBasicTasksMeta={setBasicTasksMeta}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSave={handleSaveAssignment}
                    onDelete={handleDeleteAssignment}
                    onDeleteSeries={handleDeleteAssignmentSeries}
                />
            )}
            {isCopyModalOpen && copyContext && (
                <CopyModal
                    copyContext={copyContext}
                    activeEmps={activeEmployees}
                    empsByCategory={activeEmpsByCategory}
                    empCategories={activeEmpCategories}
                    weeks={weeks}
                    projectById={projectById}
                    assignments={assignments}
                    setAssignments={setAssignments}
                    onClose={() => { setIsCopyModalOpen(false); setCopyContext(null); }}
                />
            )}
            {isInvoiceModalOpen && <InvoiceModal />}
            {isProjFormOpen && ProjFormModal()}

            {/* Changelog Modal */}
            {isChangelogOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden" style={{maxHeight:'85vh'}}>
                        <ModalHeader title="Changelog – Einsatzplanung" onClose={() => setIsChangelogOpen(false)}/>
                        <div className="overflow-auto p-6" style={{maxHeight:'calc(85vh - 64px)'}}>
                            <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">{CHANGELOG_CONTENT}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* OneDrive-Sync Popup */}
            {FS_MODE && (fsStatus === 'needs-setup' || fsStatus === 'needs-permission') && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
                        <div className="w-12 h-12 bg-gea-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gea-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        </div>
                        {fsStatus === 'needs-setup' ? (<>
                            <h2 className="text-lg font-semibold text-slate-900 mb-2">Synchronisation einrichten</h2>
                            <p className="text-sm text-slate-500 mb-6">Wähle einmalig den Ordner, in dem <strong>index.html</strong> liegt. OneDrive verteilt Änderungen danach automatisch an alle Nutzer.</p>
                            <button onClick={handleSetupFolder} className="w-full bg-gea-600 hover:bg-gea-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-2">Ordner wählen</button>
                        </>) : (<>
                            <h2 className="text-lg font-semibold text-slate-900 mb-2">Synchronisation aktivieren</h2>
                            <p className="text-sm text-slate-500 mb-6">Klicke auf <strong>Aktivieren</strong> – der Browser fragt kurz nach Dateizugriff. Danach läuft die Synchronisation automatisch.</p>
                            <button onClick={handleActivateSync} className="w-full bg-gea-600 hover:bg-gea-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-2">Aktivieren</button>
                        </>)}
                        <button onClick={() => setFsStatus('off')} className="w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors">Ohne Sync starten</button>
                    </div>
                </div>
            )}
            {isHelpModalOpen && HelpModal()}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
