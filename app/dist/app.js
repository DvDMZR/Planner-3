// --- MAIN APP ---
function App() {
  // Local aliases for React hooks; avoids duplicate top-level `const` clash
  // when multiple pre-compiled scripts share the same browser global scope.
  const {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
  } = React;

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
  const [basicTasksMeta, setBasicTasksMeta] = useState({}); // { [taskName]: { createdAt: ISO, permanent: bool, color?: string } }
  const [inactiveBasicTasks, setInactiveBasicTasks] = useState([]); // [{ name, createdAt }]
  const [basicTasksSubTab, setBasicTasksSubTab] = useState('aktiv');
  const [offtimeTasks, setOfftimeTasks] = useState(['Vacation', 'Sickness', 'Gleitzeit', 'Other']);
  const [inactiveOfftimeTasks, setInactiveOfftimeTasks] = useState([]); // [{ name }]
  const [inactiveSupportTasks, setInactiveSupportTasks] = useState([]); // string[]
  const [inactiveTrainingTasks, setInactiveTrainingTasks] = useState([]); // string[]
  const [customTrainingTasks, setCustomTrainingTasks] = useState([]); // user-added training tasks
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

  // Compact chip rendering shared by Ressourcen + Support so the choice
  // survives tab switches.
  const [compactView, setCompactView] = useState(true);

  // Auslastung click → Ressourcen jump: target week to scroll to once
  // ResourceView mounts. Cleared after the scroll runs.
  const [scrollTarget, setScrollTarget] = useState(null);

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
  const [invoiceSelection, setInvoiceSelection] = useState({
    emps: {},
    costs: {}
  });
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

  // Scroll a specific week (by id) into view, just past the sticky column.
  // Used by the Auslastung-cell → Ressourcen jump.
  const scrollToWeekById = useCallback((containerRef, weeks, weekId, weekW) => {
    const container = containerRef?.current;
    if (!container || !weeks) return;
    const idx = weeks.findIndex(w => w.id === weekId);
    if (idx < 0) return;
    container.scrollLeft = idx * weekW;
  }, []);

  // Forms
  const [empForm, setEmpForm] = useState({
    name: '',
    category: '',
    weeklyHours: HOURS_PER_WEEK,
    email: '',
    role: '',
    notes: ''
  });
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [isEmpFormOpen, setIsEmpFormOpen] = useState(false);
  const [projForm, setProjForm] = useState({
    name: '',
    category: '',
    projectNumber: '',
    address: '',
    country: '',
    startWeek: '',
    ibnWeek: '',
    color: 'gea',
    hourlyRate: DEFAULT_HOURLY_RATE,
    billable: true
  });
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Category Forms
  const [newEmpCat, setNewEmpCat] = useState('');
  const [newProjCat, setNewProjCat] = useState('');
  const [newBasicTask, setNewBasicTask] = useState('');
  const [newOfftimeTask, setNewOfftimeTask] = useState('');
  const [expandedSetupCats, setExpandedSetupCats] = useState({
    basic: true,
    other: false,
    support: false,
    training: false,
    offtime: false,
    empCats: false,
    projCats: false
  });

  // ── USER ROLES & SESSION ───────────────────────────────────────────────────
  const [appUsers, setAppUsers] = useState([HARDCODED_ADMIN]);
  const [auditLog, setAuditLog] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('plannerSession'));
    } catch {
      return null;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const currentUserRef = useRef(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  const dismissToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  const showToast = useCallback((message, opts = {}) => {
    const id = makeId('toast');
    const duration = opts.duration ?? 4000;
    const toast = {
      id,
      message,
      type: opts.type || 'info',
      action: opts.action || null
    };
    setToasts(prev => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
    return id;
  }, []);

  // Stable ref so audit handlers see current assignments without deps
  const assignmentsRef = useRef([]);
  useEffect(() => {
    assignmentsRef.current = assignments;
  }, [assignments]);
  const projectsRef = useRef([]);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Audit-log helpers
  const formatKW = weekId => {
    if (!weekId || typeof weekId !== 'string') return weekId || '?';
    const [y, w] = weekId.split('-W');
    if (!y || !w) return weekId;
    return `KW ${parseInt(w)}/${y.slice(-2)}`;
  };
  const describeAssignment = ass => {
    if (!ass) return '?';
    if (ass.type === 'project') {
      const p = projectsRef.current.find(x => x.id === ass.reference);
      return p ? `Projekt „${p.name}"` : `Projekt ${ass.reference || '?'}`;
    }
    const typeLabels = {
      basic: 'Task',
      other: 'Task',
      support: 'Support',
      training: 'Training',
      offtime: 'Abwesenheit'
    };
    const label = typeLabels[ass.type] || 'Eintrag';
    return ass.reference ? `${label} „${ass.reference}"` : label;
  };
  const loginUser = useCallback(user => {
    const session = {
      id: user.id,
      name: user.name,
      role: user.role
    };
    try {
      sessionStorage.setItem('plannerSession', JSON.stringify(session));
    } catch (e) {}
    setCurrentUser(session);
    setIsLoginModalOpen(false);
  }, []);
  const logoutUser = useCallback(() => {
    try {
      sessionStorage.removeItem('plannerSession');
    } catch (e) {}
    setCurrentUser(null);
    // Redirect away from restricted tabs
    setActiveTab(prev => {
      const restricted = ['utilization', 'setup_emp', 'setup_proj', 'setup_cats', 'data', 'audit', 'setup_users'];
      return restricted.includes(prev) ? 'resource' : prev;
    });
  }, []);

  // Central audit-log writer – uses refs to avoid stale closures
  const logAudit = useCallback((action, description, undoData = null) => {
    const user = currentUserRef.current;
    if (!user) return;
    const entry = {
      id: makeId('aud'),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
      description,
      undoData
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 500));
  }, []);

  // SharePoint / FS sync
  const syncStatusRef = useRef(SP_CONTEXT ? 'connecting' : 'local');
  const isRemoteUpdateRef = useRef(false);
  const spSaveTimer = useRef(null);
  const [syncStatus, setSyncStatusState] = useState(SP_CONTEXT ? 'connecting' : 'local');
  const setSyncStatus = s => {
    syncStatusRef.current = s;
    setSyncStatusState(s);
  };

  // File System sync (OneDrive lokal)
  const dirHandleRef = useRef(null);
  const [fsStatus, setFsStatus] = useState(FS_MODE ? 'checking' : 'off');
  // fsStatus: 'checking' | 'needs-setup' | 'needs-permission' | 'connected' | 'off'

  // meta.json is a commit-marker, never a target for If-Match conditional
  // writes – strip it so we don't store an ETag we'd never use.
  const stripMetaEtag = etags => {
    if (!etags) return {};
    const {
      'meta.json': _meta,
      ...rest
    } = etags;
    return rest;
  };

  // Team-split sync state
  const spFileTimestampsRef = useRef({}); // { 'file.json': 'ISO', ... } for SP polling
  const spFileEtagsRef = useRef({}); // { 'file.json': etag } for conditional writes
  const fsFileTimestampsRef = useRef({}); // { 'file.json': <ms>, ... } for FS polling
  const lastSavedSpRef = useRef({}); // { filename: JSON string } for diff-based writes
  const lastSavedFsRef = useRef({}); // same for FS
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
          const perm = await handle.queryPermission({
            mode: 'readwrite'
          });
          if (perm === 'granted') {
            try {
              const {
                state,
                timestamps
              } = await loadSplitStateFs(handle);
              if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
                parsedData = state;
                fsFileTimestampsRef.current = timestamps;
                isRemoteUpdateRef.current = true;
              }
            } catch (e) {
              console.warn('[FS] load failed', e);
            }
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
          const {
            state,
            timestamps,
            etags
          } = await loadSplitStateSp(SP_CONTEXT);
          // Treat "all empty" as fresh install → fall through to
          // localStorage / generateInitialData so the app has
          // sensible defaults to seed the new files.
          if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
            parsedData = state;
            spFileTimestampsRef.current = timestamps;
            spFileEtagsRef.current = stripMetaEtag(etags);
            isRemoteUpdateRef.current = true; // Loaded from SP – don't write back
          } else {
            spFileTimestampsRef.current = timestamps || {};
            spFileEtagsRef.current = stripMetaEtag(etags);
          }
        };
        try {
          await runLoad();
          setSyncStatus('idle');
        } catch (e) {
          if (e instanceof SpAuthError) {
            // Session expired between page load and our first
            // REST call – try a silent refresh before giving up.
            setSyncStatus('reconnecting');
            const ok = await spEnsureSession(SP_CONTEXT, {
              interactive: false
            });
            if (ok) {
              try {
                await runLoad();
                setSyncStatus('idle');
              } catch (e2) {
                console.warn('[SP] load retry failed', e2);
                setSyncStatus('needs-auth');
              }
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
        if (savedData) {
          try {
            parsedData = JSON.parse(savedData);
          } catch (e) {}
        }
      }

      // 3. Apply data
      if (parsedData) {
        setEmployees(parsedData.employees || []);
        setProjects(parsedData.projects || []);
        setAssignments(parsedData.assignments || []);
        setExpenses(parsedData.expenses || []);
        // Load costItems or migrate old expenses; then bring forward
        // single-amount entries to the new line-items shape.
        if (parsedData.costItems) {
          setCostItems(migrateCostItems(parsedData.costItems));
        } else if (parsedData.expenses && parsedData.expenses.length > 0) {
          setCostItems(migrateCostItems(migrateExpensesToCostItems(parsedData.expenses)));
        }
        if (parsedData.empCategories) {
          // Migrate old team name 'ME' → 'CSS'
          const migratedCats = parsedData.empCategories.map(c => c === 'ME' ? 'CSS' : c);
          if (!migratedCats.includes('I&C')) migratedCats.splice(migratedCats.indexOf('Other'), 0, 'I&C');
          setEmpCategories(migratedCats);
          currentEmpCats = migratedCats;
          // Also migrate employees
          if (parsedData.employees) {
            parsedData.employees = parsedData.employees.map(e => e.category === 'ME' ? {
              ...e,
              category: 'CSS'
            } : e);
          }
        }
        if (parsedData.projCategories) setProjCategories(parsedData.projCategories);
        if (parsedData.basicTasks) {
          const loadedMeta = parsedData.basicTasksMeta || {};
          const loadedInactive = parsedData.inactiveBasicTasks || [];
          const expiryMs = BASIC_TASK_EXPIRY_WEEKS * 7 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          // Skip tasks that are marked permanent or have no createdAt
          const toExpire = parsedData.basicTasks.filter(t => loadedMeta[t] && !loadedMeta[t].permanent && loadedMeta[t].createdAt && now - new Date(loadedMeta[t].createdAt).getTime() > expiryMs);
          if (toExpire.length > 0) {
            setBasicTasks(parsedData.basicTasks.filter(t => !toExpire.includes(t)));
            setInactiveBasicTasks([...loadedInactive, ...toExpire.map(t => ({
              name: t,
              createdAt: loadedMeta[t].createdAt
            }))]);
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
        if (parsedData.customTrainingTasks) setCustomTrainingTasks(parsedData.customTrainingTasks);
        if (parsedData.invoiceRecipient) setInvoiceRecipient(parsedData.invoiceRecipient);
        setAppUsers(injectAdmin(parsedData.appUsers));
        if (parsedData.auditLog) setAuditLog(parsedData.auditLog);

        // Seed diff snapshots so the first save cycle is a no-op for
        // files that are already in sync.
        try {
          seedLastSaved(parsedData, lastSavedSpRef.current);
          seedLastSaved(parsedData, lastSavedFsRef.current);
        } catch (e) {
          console.warn('[SEED] snapshot seeding failed', e);
        }
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
      for (let i = 0; i < 54; i++) {
        const d = new Date(thisMonday.getFullYear(), thisMonday.getMonth(), thisMonday.getDate() + i * 7);
        const weekId = getWeekString(d);
        if (seenIds.has(weekId)) continue;
        seenIds.add(weekId);
        if (w.length >= 54) break;
        const kw = parseInt(weekId.split('-W')[1], 10);
        w.push({
          id: weekId,
          label: `KW ${kw}`,
          sub: `${d.getDate()}.${d.getMonth() + 1}.`,
          month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
        });
      }
      setWeeks(w);
      setEmpForm(prev => ({
        ...prev,
        category: currentEmpCats[0] || ''
      }));
      setProjForm(prev => ({
        ...prev,
        startWeek: w[0].id,
        ibnWeek: w[10]?.id || w[w.length - 1].id
      }));
    };
    loadData();
  }, []);

  // Keep refs aligned with state so polling closures see fresh data.
  useEffect(() => {
    employeesRef.current = employees;
  }, [employees]);
  useEffect(() => {
    empCategoriesRef.current = empCategories;
  }, [empCategories]);

  // ── AUDIT WATCH: employees ─────────────────────────────────────────────────
  // Must run BEFORE the save effect so isRemoteUpdateRef is still true for
  // remote-sync updates when this effect checks it.
  const prevEmployeesRef = useRef(null);
  useEffect(() => {
    if (prevEmployeesRef.current === null) {
      prevEmployeesRef.current = employees;
      return;
    }
    const prev = prevEmployeesRef.current;
    prevEmployeesRef.current = employees;
    if (prev === employees || isRemoteUpdateRef.current) return;
    const user = currentUserRef.current;
    if (!user) return;
    if (employees.length > prev.length) {
      const added = employees.find(e => !prev.some(p => p.id === e.id));
      if (added) logAudit('employee_create', `Mitarbeiter angelegt: ${added.name}`, {
        type: 'del_employee',
        id: added.id
      });
    } else if (employees.length < prev.length) {
      const removed = prev.find(e => !employees.some(p => p.id === e.id));
      if (removed) {
        logAudit('employee_delete', `Mitarbeiter gelöscht: ${removed.name}`, {
          type: 'restore_employee',
          prev: removed
        });
        showToast(`Mitarbeiter „${removed.name}" gelöscht`, {
          type: 'success',
          duration: 6000,
          action: {
            label: 'Rückgängig',
            onClick: () => setEmployees(p => p.some(e => e.id === removed.id) ? p : [...p, removed])
          }
        });
      }
    } else {
      const changed = employees.find(e => {
        const p = prev.find(p => p.id === e.id);
        return p && JSON.stringify(e) !== JSON.stringify(p);
      });
      if (changed) {
        const prevEmp = prev.find(p => p.id === changed.id);
        logAudit('employee_update', `Mitarbeiter bearbeitet: ${changed.name}`, {
          type: 'restore_employee',
          prev: prevEmp
        });
      }
    }
  }, [employees, logAudit, showToast]);

  // ── AUDIT WATCH: projects ──────────────────────────────────────────────────
  const prevProjectsRef = useRef(null);
  useEffect(() => {
    if (prevProjectsRef.current === null) {
      prevProjectsRef.current = projects;
      return;
    }
    const prev = prevProjectsRef.current;
    prevProjectsRef.current = projects;
    if (prev === projects || isRemoteUpdateRef.current) return;
    const user = currentUserRef.current;
    if (!user) return;
    if (projects.length > prev.length) {
      const added = projects.find(p => !prev.some(q => q.id === p.id));
      if (added) logAudit('project_create', `Projekt angelegt: ${added.name}`, {
        type: 'del_project',
        id: added.id
      });
    } else if (projects.length < prev.length) {
      const removed = prev.find(p => !projects.some(q => q.id === p.id));
      if (removed) {
        logAudit('project_delete', `Projekt gelöscht: ${removed.name}`, {
          type: 'restore_project',
          prev: removed
        });
        showToast(`Projekt „${removed.name}" gelöscht`, {
          type: 'success',
          duration: 6000,
          action: {
            label: 'Rückgängig',
            onClick: () => setProjects(p => p.some(q => q.id === removed.id) ? p : [...p, removed])
          }
        });
      }
    } else {
      const changed = projects.find(p => {
        const q = prev.find(q => q.id === p.id);
        return q && JSON.stringify(p) !== JSON.stringify(q);
      });
      if (changed) {
        const prevProj = prev.find(q => q.id === changed.id);
        logAudit('project_update', `Projekt bearbeitet: ${changed.name}`, {
          type: 'restore_project',
          prev: prevProj
        });
      }
    }
  }, [projects, logAudit, showToast]);

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
      employees,
      projects,
      assignments,
      expenses,
      costItems,
      empCategories,
      projCategories,
      basicTasks,
      basicTasksMeta,
      inactiveBasicTasks,
      offtimeTasks,
      inactiveOfftimeTasks,
      inactiveSupportTasks,
      inactiveTrainingTasks,
      customTrainingTasks,
      invoiceRecipient,
      appUsers,
      auditLog
    };
    if (localSaveTimer.current) clearTimeout(localSaveTimer.current);
    localSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem('teamMasterProData', JSON.stringify(stateData));
      } catch (e) {
        console.warn('[LS] save failed', e);
      }
      if (FS_MODE && dirHandleRef.current) {
        saveSplitState(stateData, lastSavedFsRef.current, (filename, payload) => fsSaveFile(dirHandleRef.current, filename, payload)).then(async () => {
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
          await saveSplitState(stateData, lastSavedSpRef.current, (filename, payload) => spSaveFile(SP_CONTEXT, filename, payload, filename === 'meta.json' ? null : spFileEtagsRef.current[filename]));
          // Refresh timestamps AND etags in one request after a successful save.
          const meta = await spGetFolderMeta(SP_CONTEXT);
          const refreshedEtags = {};
          Object.entries(meta).forEach(([f, v]) => {
            spFileTimestampsRef.current[f] = v.ts;
            refreshedEtags[f] = v.etag;
          });
          Object.assign(spFileEtagsRef.current, stripMetaEtag(refreshedEtags));
        };
        setSyncStatus('syncing');
        try {
          await runSave();
          setSyncStatus('idle');
        } catch (e) {
          if (e instanceof SpConflictError) {
            // Another client modified the file while we were editing.
            // Reload the remote snapshot and let the user see a toast.
            setSyncStatus('reconnecting');
            try {
              const {
                state,
                timestamps,
                etags
              } = await loadSplitStateSp(SP_CONTEXT);
              spFileTimestampsRef.current = timestamps;
              spFileEtagsRef.current = stripMetaEtag(etags);
              applyRemoteSnapshot(state, {
                notify: false
              });
              setSyncStatus('conflict-reload');
              showToast('Änderung eines Kollegen wurde übernommen.', {
                type: 'warning',
                duration: 5000
              });
              setTimeout(() => {
                if (syncStatusRef.current === 'conflict-reload') setSyncStatus('idle');
              }, 3000);
            } catch (e2) {
              console.warn('[SP] conflict reload failed', e2);
              // Drop ETags so the next save uses overwrite=true
              // and can't loop on a stale 412.
              spFileEtagsRef.current = {};
              setSyncStatus('offline');
            }
          } else if (e instanceof SpAuthError) {
            // Session expired while idle – try silent re-auth and
            // replay the save exactly once. lastSavedSpRef is only
            // updated per successful file write, so interrupted
            // writes are naturally retried on the next save.
            setSyncStatus('reconnecting');
            const ok = await spEnsureSession(SP_CONTEXT, {
              interactive: false
            });
            if (ok) {
              try {
                await runSave();
                setSyncStatus('idle');
              } catch (e2) {
                console.warn('[SP] save retry failed', e2);
                setSyncStatus('needs-auth');
              }
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
  }, [employees, projects, assignments, expenses, costItems, empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks, customTrainingTasks, invoiceRecipient, appUsers, auditLog]);

  // Keep latestStateRef current so the beforeunload flush always sees the
  // latest data without re-registering the event listener on every change.
  useEffect(() => {
    latestStateRef.current = {
      employees,
      projects,
      assignments,
      expenses,
      costItems,
      empCategories,
      projCategories,
      basicTasks,
      basicTasksMeta,
      inactiveBasicTasks,
      offtimeTasks,
      inactiveOfftimeTasks,
      inactiveSupportTasks,
      inactiveTrainingTasks,
      customTrainingTasks,
      invoiceRecipient,
      appUsers,
      auditLog
    };
  }, [employees, projects, assignments, expenses, costItems, empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, inactiveOfftimeTasks, inactiveSupportTasks, inactiveTrainingTasks, customTrainingTasks, invoiceRecipient, appUsers, auditLog]);

  // Flush pending local save before the page unloads so a fast tab close
  // doesn't drop the most recent edits.
  useEffect(() => {
    const flush = () => {
      if (!localSaveTimer.current) return;
      clearTimeout(localSaveTimer.current);
      localSaveTimer.current = null;
      try {
        localStorage.setItem('teamMasterProData', JSON.stringify(latestStateRef.current));
      } catch (e) {}
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);
  const applyRemoteSnapshot = useCallback((data, {
    notify = true
  } = {}) => {
    isRemoteUpdateRef.current = true;
    setEmployees(data.employees || []);
    setProjects(data.projects || []);
    setAssignments(data.assignments || []);
    setExpenses(data.expenses || []);
    if (data.costItems) setCostItems(migrateCostItems(data.costItems));else if (data.expenses && data.expenses.length > 0) setCostItems(migrateCostItems(migrateExpensesToCostItems(data.expenses)));
    if (data.empCategories?.length) setEmpCategories(data.empCategories);
    // Guard: never overwrite non-empty category arrays with empty remote data
    // (protects against settings.json load failures wiping user-defined categories)
    setProjCategories(prev => data.projCategories?.length > 0 ? data.projCategories : prev);
    setBasicTasks(prev => data.basicTasks?.length > 0 ? data.basicTasks : prev);
    if (data.basicTasksMeta !== undefined) setBasicTasksMeta(data.basicTasksMeta);
    if (data.inactiveBasicTasks) setInactiveBasicTasks(data.inactiveBasicTasks);
    setOfftimeTasks(prev => data.offtimeTasks?.length > 0 ? data.offtimeTasks : prev);
    if (data.customTrainingTasks) setCustomTrainingTasks(data.customTrainingTasks);
    if (data.invoiceRecipient !== undefined) setInvoiceRecipient(data.invoiceRecipient);
    setAppUsers(injectAdmin(data.appUsers));
    if (data.auditLog) setAuditLog(data.auditLog);
    // Also re-seed the snapshots so the save cascade triggered by these
    // setStates doesn't rewrite identical data back to the server.
    try {
      seedLastSaved(data, lastSavedSpRef.current);
      seedLastSaved(data, lastSavedFsRef.current);
    } catch (e) {
      console.warn('[SEED] snapshot seeding failed in applyRemoteSnapshot', e);
    }
    if (notify) {
      setSyncStatus('updated');
      setTimeout(() => {
        if (syncStatusRef.current === 'updated') setSyncStatus('idle');
      }, 2000);
    }
  }, []);

  // SharePoint polling – pick up changes from other users every 5 seconds.
  // One folder-list call returns timestamps+etags for all files; if only team
  // assignment/cost-item files changed, only those are reloaded (selective
  // reload). A full reload is triggered when employees/projects/settings change.
  const pollFailuresRef = useRef(0);
  const pollInFlightRef = useRef(false);
  // True when we saw changes without meta.json (possible mid-write); forces
  // a full reload on the next cycle as a safety net.
  const pendingReloadRef = useRef(false);
  useEffect(() => {
    if (!SP_CONTEXT) return;
    const poll = async () => {
      if (document.visibilityState === 'hidden') return;
      if (pollInFlightRef.current) return;
      const st = syncStatusRef.current;
      if (st === 'syncing' || st === 'connecting' || st === 'reconnecting' || st === 'needs-auth') return;
      pollInFlightRef.current = true;
      try {
        const newMeta = await spGetFolderMeta(SP_CONTEXT);
        const changedFiles = Object.keys(newMeta).filter(f => newMeta[f].ts !== spFileTimestampsRef.current[f]);
        if (changedFiles.length > 0) {
          // A local save is debounced and about to fire – skip this cycle so
          // we don't overwrite our pending state with a stale remote snapshot.
          if (spSaveTimer.current !== null) return;

          // Files changed but meta.json (the commit marker) is not among
          // them: probably a mid-write.  Defer; on the next cycle
          // pendingReloadRef forces a full reload regardless.
          if (!changedFiles.includes('meta.json') && !pendingReloadRef.current) {
            pendingReloadRef.current = true;
            return;
          }
          pendingReloadRef.current = false;
          const needsFullReload = changedFiles.some(f => f === 'employees.json' || f === 'projects.json' || f === 'settings.json');

          // A changed team file referring to an unknown team can happen when
          // an employee's team was renamed mid-air – fall back to full reload.
          const knownTeams = new Set(empCategoriesRef.current || DEFAULT_TEAMS);
          const hasUnknownTeam = !needsFullReload && changedFiles.some(f => {
            if (f.startsWith('assignments-')) {
              return !knownTeams.has(f.slice('assignments-'.length, -'.json'.length));
            }
            return false;
          });
          if (needsFullReload || hasUnknownTeam) {
            const {
              state,
              timestamps,
              etags
            } = await loadSplitStateSp(SP_CONTEXT);
            spFileTimestampsRef.current = timestamps;
            spFileEtagsRef.current = stripMetaEtag(etags);
            applyRemoteSnapshot(state);
          } else {
            const {
              assignmentsByTeam,
              costItemsByTeam
            } = await loadChangedTeamFilesSp(SP_CONTEXT, changedFiles);
            const empTeamMap = new Map(employeesRef.current.map(e => [e.id, e.category || 'Other']));
            const teamsUpdated = new Set([...Object.keys(assignmentsByTeam), ...Object.keys(costItemsByTeam)]);
            setAssignments(prev => {
              const kept = prev.filter(a => !teamsUpdated.has(empTeamMap.get(a.empId) || 'Other'));
              return [...kept, ...Object.values(assignmentsByTeam).flat()];
            });
            setCostItems(prev => {
              const kept = prev.filter(c => !teamsUpdated.has(empTeamMap.get(c.empId) || 'Other'));
              return [...kept, ...migrateCostItems(Object.values(costItemsByTeam).flat())];
            });
            // Update timestamps; invalidate ETags for remotely-changed files so
            // our next write for those files uses overwrite=true (safe: we just
            // applied the remote state, so there's no local-only version to protect).
            changedFiles.forEach(f => {
              spFileTimestampsRef.current[f] = newMeta[f].ts;
              delete spFileEtagsRef.current[f];
            });
            changedFiles.forEach(f => {
              if (f.startsWith('assignments-')) {
                const team = f.slice('assignments-'.length, -'.json'.length);
                lastSavedSpRef.current[f] = JSON.stringify({
                  assignments: assignmentsByTeam[team] || []
                });
              } else if (f.startsWith('cost-items-')) {
                const team = f.slice('cost-items-'.length, -'.json'.length);
                lastSavedSpRef.current[f] = JSON.stringify({
                  costItems: costItemsByTeam[team] || []
                });
              }
            });
          }
        } else {
          // No remote changes – if a mid-write deferral was pending it
          // can be cleared safely (the write either completed and our
          // save covered it, or never actually happened).
          pendingReloadRef.current = false;
        }
        pollFailuresRef.current = 0;
        // Recover from a prior 'offline' as soon as the next poll
        // succeeds – no need to wait for a user edit.
        if (syncStatusRef.current === 'offline') setSyncStatus('idle');
      } catch (e) {
        if (e instanceof SpAuthError) {
          // Session expired – drive the recovery pipeline. Silent
          // refresh succeeds while the user's Entra session is
          // alive, otherwise we surface the manual reconnect CTA.
          setSyncStatus('reconnecting');
          const ok = await spEnsureSession(SP_CONTEXT, {
            interactive: false
          });
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
          const {
            state,
            timestamps
          } = await loadSplitStateFs(dirHandleRef.current);
          fsFileTimestampsRef.current = timestamps;
          applyRemoteSnapshot(state);
        }
      } catch (e) {/* Transient errors ignored */}
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Shared helper: after any kind of successful re-auth we want to pull the
  // latest remote snapshot so the UI can't show stale data.
  const refreshSpSnapshot = useCallback(async () => {
    try {
      const {
        state,
        timestamps,
        etags
      } = await loadSplitStateSp(SP_CONTEXT);
      spFileTimestampsRef.current = timestamps;
      spFileEtagsRef.current = stripMetaEtag(etags);
      if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
        applyRemoteSnapshot(state, {
          notify: false
        });
      }
      return true;
    } catch (e) {
      console.warn('[SP] snapshot refresh failed', e);
      return false;
    }
  }, [applyRemoteSnapshot]);

  // Manual reconnect button on the status pill. Must run inside a click
  // handler so the browser allows the popup used for interactive re-auth.
  const reconnectSharePoint = useCallback(async () => {
    if (!SP_CONTEXT) return;
    setSyncStatus('reconnecting');
    const ok = await spEnsureSession(SP_CONTEXT, {
      interactive: true
    });
    if (!ok) {
      setSyncStatus('needs-auth');
      return;
    }
    const loaded = await refreshSpSnapshot();
    setSyncStatus(loaded ? 'idle' : 'needs-auth');
  }, [refreshSpSnapshot]);

  // Ensure form defaults align with categories
  useEffect(() => {
    if (!empForm.category && empCategories.length > 0) {
      setEmpForm(prev => ({
        ...prev,
        category: empCategories[0]
      }));
    }
    if (!projForm.category && projCategories.length > 0) {
      setProjForm(prev => ({
        ...prev,
        category: projCategories[0]
      }));
    }
  }, [empCategories, projCategories]);

  // Auto-scroll to current week when switching to resource or project tab.
  // If a scrollTarget was set (e.g. via the Auslastung cell-jump), the
  // ResourceView itself honours it from its own effect so we just skip
  // the default jump-to-today here.
  useEffect(() => {
    if (activeTab === 'resource') {
      if (scrollTarget?.weekId) return; // ResourceView handles it
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
      if (!arr) {
        arr = [];
        m.set(key, arr);
      }
      arr.push(a);
    });
    return m;
  }, [assignments]);
  const assignmentsByProject = useMemo(() => {
    const m = new Map();
    assignments.forEach(a => {
      let arr = m.get(a.reference);
      if (!arr) {
        arr = [];
        m.set(a.reference, arr);
      }
      arr.push(a);
    });
    return m;
  }, [assignments]);
  const assignmentsByProjectWeek = useMemo(() => {
    const m = new Map();
    assignments.forEach(a => {
      const key = a.reference + '\u0000' + a.week;
      let arr = m.get(key);
      if (!arr) {
        arr = [];
        m.set(key, arr);
      }
      arr.push(a);
    });
    return m;
  }, [assignments]);
  const costItemsByProject = useMemo(() => {
    const m = new Map();
    costItems.forEach(c => {
      let arr = m.get(c.projectId);
      if (!arr) {
        arr = [];
        m.set(c.projectId, arr);
      }
      arr.push(c);
    });
    return m;
  }, [costItems]);
  const getEmpWeeklyHours = useCallback(empId => {
    return employeeById.get(empId)?.weeklyHours ?? HOURS_PER_WEEK;
  }, [employeeById]);
  const projectStatusById = useMemo(() => {
    const now = getWeekString(new Date());
    const m = new Map();
    projects.forEach(p => {
      let status;
      if (p.costsSubmitted) status = 'costs_submitted';else if (p.projectCompleted) status = 'completed';else {
        const projCosts = costItemsByProject.get(p.id) || [];
        const projAss = assignmentsByProject.get(p.id) || [];
        if (p.ibnWeek < now && projAss.length > 0 && projCosts.length === 0) status = 'missing_costs';else if (p.startWeek <= now) status = 'active';else status = 'planned';
      }
      m.set(p.id, status);
    });
    return m;
  }, [projects, assignmentsByProject, costItemsByProject]);
  const computeAutoStatus = useCallback(p => {
    return projectStatusById.get(p.id) ?? 'planned';
  }, [projectStatusById]);

  // Derived collections – memoized so render functions don't rebuild them
  // on every keystroke / polling tick.
  const activeEmployees = useMemo(() => employees.filter(e => e.active !== false), [employees]);
  const activeEmpsByCategory = useMemo(() => {
    const m = new Map();
    activeEmployees.forEach(e => {
      let arr = m.get(e.category);
      if (!arr) {
        arr = [];
        m.set(e.category, arr);
      }
      arr.push(e);
    });
    // Sort employees alphabetically within each category
    m.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'de')));
    return m;
  }, [activeEmployees]);
  const activeEmpCategories = useMemo(() => Array.from(activeEmpsByCategory.keys()).sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b, 'de')), [activeEmpsByCategory]);

  // Employees who have ever been planned for any 'support' assignment
  // (past or future). Drives the optional Support tab.
  const supportEmpIds = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i].type === 'support') s.add(assignments[i].empId);
    }
    return s;
  }, [assignments]);
  const supportEmpsByCategory = useMemo(() => {
    const m = new Map();
    const seen = new Set();
    const add = e => {
      if (seen.has(e.id)) return;
      seen.add(e.id);
      let arr = m.get(e.category);
      if (!arr) {
        arr = [];
        m.set(e.category, arr);
      }
      arr.push(e);
    };
    // Active employees first (so a deactivated employee with an old
    // support stint still shows up under their team).
    activeEmployees.forEach(e => {
      if (supportEmpIds.has(e.id)) add(e);
    });
    employees.forEach(e => {
      if (supportEmpIds.has(e.id)) add(e);
    });
    m.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name, 'de')));
    return m;
  }, [activeEmployees, employees, supportEmpIds]);
  const supportEmpCategories = useMemo(() => Array.from(supportEmpsByCategory.keys()).sort((a, b) => a === 'Other' ? 1 : b === 'Other' ? -1 : a.localeCompare(b, 'de')), [supportEmpsByCategory]);
  const hasSupportEmployees = supportEmpIds.size > 0;

  // Fall back to Ressourcen if on Support tab and last support assignment disappears
  useEffect(() => {
    if (activeTab === 'support' && !hasSupportEmployees) {
      setActiveTab('resource');
    }
  }, [activeTab, hasSupportEmployees]);
  const projectsByCategory = useMemo(() => {
    const m = new Map();
    projects.forEach(p => {
      let arr = m.get(p.category);
      if (!arr) {
        arr = [];
        m.set(p.category, arr);
      }
      arr.push(p);
    });
    for (const arr of m.values()) {
      arr.sort((a, b) => (a.startWeek || '').localeCompare(b.startWeek || ''));
    }
    return m;
  }, [projects]);
  const projCategoriesFromProjects = useMemo(() => Array.from(projectsByCategory.keys()), [projectsByCategory]);

  // Cache weeks per year – generateWeeksForYear does Easter math + 54
  // iterations, expensive to redo on every render.
  const weeksByYearCacheRef = useRef(new Map());
  const getWeeksForYear = useCallback(year => {
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
        total += (a.hours ?? (a.percent ?? 100) / 100 * weeklyHours) / weeklyHours * 100;
        if (a.type === 'offtime') isOfftime = true;
      }
      m.set(key, {
        total,
        isOfftime,
        assignments: weekAss
      });
    }
    return m;
  }, [assignmentsByEmpWeek, getEmpWeeklyHours]);
  const getUtilization = useCallback((empId, week) => utilizationMap.get(empId + '\u0000' + week) ?? {
    total: 0,
    isOfftime: false,
    assignments: []
  }, [utilizationMap]);
  const toggleCategory = useCallback(cat => {
    setCollapsedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  }, []);
  const toggleProjCategory = useCallback(cat => {
    setCollapsedProjCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  }, []);
  const toggleEmpSetup = useCallback(cat => {
    setCollapsedEmpSetup(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  }, []);
  const handleSaveAssignment = useCallback(data => {
    if (Array.isArray(data)) {
      setAssignments(prev => [...prev, ...data]);
      const first = data[0];
      const weeks = data.map(a => a.week).filter(Boolean).sort();
      const weekRange = weeks.length > 1 && weeks[0] !== weeks[weeks.length - 1] ? `${formatKW(weeks[0])} – ${formatKW(weeks[weeks.length - 1])}` : formatKW(weeks[0]);
      const emp = employeesRef.current.find(e => e.id === first?.empId);
      logAudit('assignment_copy', `${data.length}× ${describeAssignment(first)} für ${emp?.name || '?'} (${weekRange})`, {
        type: 'del_assignments',
        ids: data.map(a => a.id)
      });
    } else if (data.id) {
      const oldAss = assignmentsRef.current.find(a => a.id === data.id);
      setAssignments(prev => prev.map(a => a.id === data.id ? data : a));
      const emp = employeesRef.current.find(e => e.id === data.empId);
      const weekChanged = oldAss && oldAss.week !== data.week;
      const weekPart = weekChanged ? `${formatKW(oldAss.week)} → ${formatKW(data.week)}` : formatKW(data.week);
      logAudit('assignment_update', `${describeAssignment(data)} – ${emp?.name || '?'} (${weekPart})`, {
        type: 'restore_assignment',
        prev: oldAss
      });
    } else {
      const newId = makeId('ass');
      setAssignments(prev => [...prev, {
        ...data,
        id: newId
      }]);
      const emp = employeesRef.current.find(e => e.id === data.empId);
      logAudit('assignment_create', `${describeAssignment(data)} – ${emp?.name || '?'} (${formatKW(data.week)})`, {
        type: 'del_assignment',
        ids: [newId]
      });
    }
    setIsAssignModalOpen(false);
  }, [logAudit]);
  const handleDeleteAssignment = useCallback(id => {
    const deleted = assignmentsRef.current.find(a => a.id === id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    if (deleted) {
      const emp = employeesRef.current.find(e => e.id === deleted.empId);
      logAudit('assignment_delete', `${describeAssignment(deleted)} – ${emp?.name || '?'} (${formatKW(deleted.week)})`, {
        type: 'restore_assignment',
        prev: deleted
      });
    }
    setIsAssignModalOpen(false);
  }, [logAudit]);
  const handleDeleteAssignmentSeries = useCallback(id => {
    const ass = assignmentsRef.current.find(a => a.id === id);
    if (!ass) {
      setIsAssignModalOpen(false);
      return;
    }
    const toDelete = assignmentsRef.current.filter(a => a.ruleId === ass.ruleId && a.week >= ass.week);
    setAssignments(prev => prev.filter(a => !(a.ruleId === ass.ruleId && a.week >= ass.week)));
    const emp = employeesRef.current.find(e => e.id === ass.empId);
    const weeks = toDelete.map(a => a.week).sort();
    const weekRange = weeks.length > 1 && weeks[0] !== weeks[weeks.length - 1] ? `${formatKW(weeks[0])} – ${formatKW(weeks[weeks.length - 1])}` : formatKW(weeks[0]);
    logAudit('assignment_delete_series', `Terminserie ${describeAssignment(ass)} – ${emp?.name || '?'} (${toDelete.length}× ${weekRange})`, {
      type: 'restore_assignments',
      prevItems: toDelete
    });
    setIsAssignModalOpen(false);
  }, [logAudit]);
  const handleDrop = useCallback((e, targetWeek, targetEmpIdOrProjId, isResourceView = false) => {
    e.preventDefault();
    if (!currentUserRef.current) return; // passive users cannot drag-drop
    const assignmentId = e.dataTransfer.getData('assignmentId');
    if (assignmentId) {
      // Move existing assignment chip. In resource view: reassign to target employee.
      // In project view: reassign to target project (only for project-type chips).
      const origAss = assignmentsRef.current.find(a => a.id === assignmentId);
      setAssignments(prev => prev.map(a => {
        if (a.id !== assignmentId) return a;
        const updated = {
          ...a,
          week: targetWeek
        };
        if (isResourceView) {
          const newEmpId = targetEmpIdOrProjId;
          if (newEmpId !== a.empId) {
            updated.empId = newEmpId;
            delete updated.comment;
            // Preserve the *percentage*, not the absolute hours, when
            // the target employee has different weeklyHours than the
            // source – e.g. 100 % on 35h → 100 % on 40h (= 40h).
            const sourceEmp = employeesRef.current.find(e => e.id === a.empId);
            const targetEmp = employeesRef.current.find(e => e.id === newEmpId);
            const sourceWH = sourceEmp?.weeklyHours ?? HOURS_PER_WEEK;
            const targetWH = targetEmp?.weeklyHours ?? HOURS_PER_WEEK;
            if (sourceWH > 0 && targetWH !== sourceWH) {
              updated.hours = getAssignmentHours(a, sourceWH) / sourceWH * targetWH;
              delete updated.percent;
            }
          }
        } else if (a.type === 'project' && targetEmpIdOrProjId !== a.reference) {
          updated.reference = targetEmpIdOrProjId;
        }
        return updated;
      }));
      if (origAss) {
        const newEmpId = isResourceView ? targetEmpIdOrProjId : origAss.empId;
        const fromEmp = employeesRef.current.find(e => e.id === origAss.empId);
        const toEmp = employeesRef.current.find(e => e.id === newEmpId);
        const empPart = fromEmp?.id !== toEmp?.id ? `${fromEmp?.name || '?'} → ${toEmp?.name || '?'}` : toEmp?.name || '?';
        const weekPart = origAss.week !== targetWeek ? `${formatKW(origAss.week)} → ${formatKW(targetWeek)}` : formatKW(targetWeek);
        // For project drops, also describe the new project if it changed
        const draggedTask = !isResourceView && origAss.type === 'project' && targetEmpIdOrProjId !== origAss.reference ? `${describeAssignment(origAss)} → ${describeAssignment({
          ...origAss,
          reference: targetEmpIdOrProjId
        })}` : describeAssignment(origAss);
        logAudit('assignment_drop', `${draggedTask} – ${empPart} (${weekPart})`, {
          type: 'restore_assignment',
          prev: origAss
        });
      }
      return;
    }
    const empId = e.dataTransfer.getData('empId');
    if (!empId) return;
    if (!isResourceView) {
      // Default a fresh drag-create to 100 % of the dragged employee's
      // weekly hours so a 35h employee gets a 35h chip (not 40h).
      const droppedEmp = employeesRef.current.find(x => x.id === empId);
      const droppedHours = droppedEmp?.weeklyHours ?? HOURS_PER_WEEK;
      setAssignments(prev => [...prev, {
        id: makeId('ass'),
        empId,
        week: targetWeek,
        type: 'project',
        reference: targetEmpIdOrProjId,
        hours: droppedHours
      }]);
    } else {
      // In resource view: open modal to pick type/reference
      setAssignContext({
        empId: targetEmpIdOrProjId,
        week: targetWeek
      });
      setIsAssignModalOpen(true);
    }
  }, [logAudit]);
  const exportData = useCallback(() => {
    const data = JSON.stringify({
      employees,
      projects,
      assignments,
      expenses,
      costItems,
      empCategories,
      projCategories,
      basicTasks,
      basicTasksMeta,
      inactiveBasicTasks,
      offtimeTasks,
      customTrainingTasks,
      invoiceRecipient,
      schemaVersion: SCHEMA_VERSION
    }, null, 2);
    const blob = new Blob([data], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Einsatzplanung3.0_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }, [employees, projects, assignments, expenses, costItems, empCategories, projCategories, basicTasks, basicTasksMeta, inactiveBasicTasks, offtimeTasks, customTrainingTasks, invoiceRecipient]);
  const importData = useCallback(e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.assignments) setAssignments(parsed.assignments);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.costItems) {
          setCostItems(migrateCostItems(parsed.costItems));
        } else if (parsed.expenses && parsed.expenses.length > 0) {
          setCostItems(migrateCostItems(migrateExpensesToCostItems(parsed.expenses)));
        }
        if (parsed.empCategories) setEmpCategories(parsed.empCategories);
        if (parsed.projCategories) setProjCategories(parsed.projCategories);
        if (parsed.basicTasks) setBasicTasks(parsed.basicTasks);
        if (parsed.basicTasksMeta) setBasicTasksMeta(parsed.basicTasksMeta);
        if (parsed.inactiveBasicTasks) setInactiveBasicTasks(parsed.inactiveBasicTasks);
        if (parsed.offtimeTasks) setOfftimeTasks(parsed.offtimeTasks);
        if (parsed.customTrainingTasks) setCustomTrainingTasks(parsed.customTrainingTasks);
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
      const h = a.hours ?? (a.percent ?? 100) / 100 * HOURS_PER_WEEK;
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
        hours,
        rate,
        cost,
        included
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
        included
      });
    });
    return {
      laborLines,
      costLines,
      total
    };
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
    setInvoiceSelection({
      emps: initialEmps,
      costs: initialCosts
    });
    setIsInvoiceModalOpen(true);
  }, [projectById, selectedProjectDetails, assignmentsByProject, costItemsByProject]);
  const handleInvoiceExport = () => {
    const proj = projectById.get(selectedProjectDetails);
    if (!proj) return;
    const {
      laborLines,
      costLines,
      total
    } = buildInvoiceData(proj, invoiceSelection);
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
    costLines.forEach(({
      ci,
      emp,
      included
    }) => {
      if (!included) return;
      (ci.lines || []).forEach(l => {
        const cfg = COST_LINE_TYPES[l.type] || COST_LINE_TYPES.other;
        const desc = [ci.description, l.comment].filter(Boolean).join(' – ');
        if (l.type === 'hours') {
          const hrs = l.hours || 0,
            rate = l.hourlyRate || 0;
          rows.push([cfg.invoiceLabel, emp?.name || 'Unbekannt', desc || 'Arbeitszeit', `${hrs} Std.`, `${rate} EUR`, `${(hrs * rate).toFixed(2)} EUR`]);
        } else {
          const amt = l.amount || 0;
          rows.push([cfg.invoiceLabel, emp?.name || 'Unbekannt', desc, "1", `${amt.toFixed(2)} EUR`, `${amt.toFixed(2)} EUR`]);
        }
      });
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
    setProjects(prev => prev.map(p => p.id === selectedProjectDetails ? {
      ...p,
      invoiceStatus: 'exportiert'
    } : p));
  };
  const handleInvoiceSendEmail = () => {
    const proj = projectById.get(selectedProjectDetails);
    if (!proj) return;
    const {
      laborLines,
      costLines,
      total
    } = buildInvoiceData(proj, invoiceSelection);
    const rows = [];
    laborLines.forEach(l => {
      if (!l.included) return;
      rows.push(`  - ${l.emp?.name || 'Unbekannt'}: ${l.hours} Std. x ${l.rate} EUR/h = ${l.cost.toFixed(2)} EUR`);
    });
    costLines.forEach(({
      ci,
      included
    }) => {
      if (!included) return;
      (ci.lines || []).forEach(l => {
        const cfg = COST_LINE_TYPES[l.type] || COST_LINE_TYPES.other;
        const desc = [ci.description, l.comment].filter(Boolean).join(' – ');
        const detail = desc ? ` (${desc})` : '';
        if (l.type === 'hours') {
          const hrs = l.hours || 0,
            rate = l.hourlyRate || 0;
          rows.push(`  - ${cfg.invoiceLabel}${detail}: ${hrs} Std. x ${rate} EUR/h = ${(hrs * rate).toFixed(2)} EUR`);
        } else {
          rows.push(`  - ${cfg.invoiceLabel}${detail}: ${(l.amount || 0).toFixed(2)} EUR`);
        }
      });
    });
    const subject = encodeURIComponent(`Rechnung: ${proj.name} - ${new Date().toLocaleDateString('de-DE')}`);
    const body = encodeURIComponent(`Guten Tag,\n\nanbei sende ich die Rechnung fuer folgendes Projekt:\n\n` + `Projekt: ${proj.name}\n` + `Projektnummer: ${proj.projectNumber || '-'}\n` + `Datum: ${new Date().toLocaleDateString('de-DE')}\n\n` + `Positionen:\n${rows.join('\n')}\n\n` + `Gesamtsumme (Netto): ${total.toFixed(2)} EUR\n\n` + `Mit freundlichen Gruessen`);
    window.location.href = `mailto:${invoiceRecipient}?subject=${subject}&body=${body}`;
  };

  // --- SUB-COMPONENTS ---

  const ProjFormModal = () => {
    if (!isProjFormOpen) return null;
    const isEditing = !!editingProjectId;
    const emptyForm = () => {
      const nextColorId = PROJECT_COLORS[projects.length % PROJECT_COLORS.length].id;
      return {
        name: '',
        category: projCategories[0] || '',
        projectNumber: '',
        address: '',
        country: '',
        startWeek: weeks[0]?.id || '',
        ibnWeek: weeks[10]?.id || '',
        color: nextColorId
      };
    };
    const save = () => {
      if (!projForm.name.trim()) return;
      if (projForm.startWeek && projForm.ibnWeek && projForm.ibnWeek < projForm.startWeek) {
        alert('IBN-Woche darf nicht vor der Start-Woche liegen.');
        return;
      }
      if (isEditing) {
        setProjects(projects.map(p => p.id === editingProjectId ? {
          ...p,
          ...projForm
        } : p));
        setEditingProjectId(null);
      } else {
        setProjects([...projects, {
          id: makeId('p'),
          ...projForm,
          billable: true,
          hourlyRate: DEFAULT_HOURLY_RATE
        }]);
      }
      setProjForm(emptyForm());
      setIsProjFormOpen(false);
    };
    const cancel = () => {
      setEditingProjectId(null);
      setProjForm(emptyForm());
      setIsProjFormOpen(false);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
    }, /*#__PURE__*/React.createElement(ModalHeader, {
      title: isEditing ? 'Projekt bearbeiten' : 'Neues Projekt',
      onClose: cancel
    }), /*#__PURE__*/React.createElement("div", {
      className: "p-6 space-y-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-2 gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col-span-2"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "Name"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: projForm.name,
      onChange: e => setProjForm({
        ...projForm,
        name: e.target.value
      }),
      className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500",
      autoFocus: true
    })), /*#__PURE__*/React.createElement("div", {
      className: "col-span-2"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "Adresse"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: projForm.address || '',
      onChange: e => setProjForm({
        ...projForm,
        address: e.target.value
      }),
      placeholder: "Stra\xDFe, PLZ Ort, Land",
      className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500"
    })), /*#__PURE__*/React.createElement("div", {
      className: "col-span-2"
    }, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "Land"), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 items-stretch"
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      value: projForm.country || '',
      onChange: e => setProjForm({
        ...projForm,
        country: e.target.value
      }),
      placeholder: "z.B. DE oder Deutschland",
      className: "flex-1 p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500"
    }), (() => {
      const code = resolveCountryCode(projForm.country);
      const styled = code === '??' ? 'bg-rose-50 border-rose-300 text-rose-700' : code === '/' ? 'bg-slate-50 border-slate-300 text-slate-400' : 'bg-emerald-50 border-emerald-300 text-emerald-700';
      return /*#__PURE__*/React.createElement("span", {
        className: `px-3 py-2 rounded text-sm font-mono font-bold border min-w-[3.5rem] text-center flex items-center justify-center ${styled}`,
        title: "Aufl\xF6sung des Eingabefelds"
      }, code);
    })()), /*#__PURE__*/React.createElement("p", {
      className: "text-[11px] text-slate-500 mt-1"
    }, "Land oder ISO-K\xFCrzel eingeben \u2014 wird auf einen 2-Buchstaben-Code aufgel\xF6st. Erscheint in \xDCbersicht und Projekte.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "Projektnr."), /*#__PURE__*/React.createElement("input", {
      type: "text",
      maxLength: 15,
      value: projForm.projectNumber,
      onChange: e => setProjForm({
        ...projForm,
        projectNumber: e.target.value
      }),
      placeholder: "GEA-2024-00001",
      className: "w-full p-2 border border-slate-400 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gea-400 focus:border-gea-500"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "Kategorie"), /*#__PURE__*/React.createElement("select", {
      value: projForm.category,
      onChange: e => setProjForm({
        ...projForm,
        category: e.target.value
      }),
      className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
    }, projCategories.map(c => /*#__PURE__*/React.createElement("option", {
      key: c,
      value: c
    }, c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "Start (KW)"), /*#__PURE__*/React.createElement("input", {
      type: "week",
      value: projForm.startWeek,
      onChange: e => setProjForm({
        ...projForm,
        startWeek: e.target.value
      }),
      className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-1 font-semibold"
    }, "IBN (KW)"), /*#__PURE__*/React.createElement("input", {
      type: "week",
      value: projForm.ibnWeek,
      onChange: e => setProjForm({
        ...projForm,
        ibnWeek: e.target.value
      }),
      className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
      className: "block text-xs text-slate-700 mb-2 font-semibold"
    }, "Farbe"), /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2"
    }, PROJECT_COLORS.map(c => /*#__PURE__*/React.createElement("button", {
      key: c.id,
      onClick: () => setProjForm({
        ...projForm,
        color: c.id
      }),
      title: c.id,
      className: `w-7 h-7 rounded-full border-2 transition-all ${c.dot} ${projForm.color === c.id ? 'border-slate-800 scale-110 shadow' : 'border-transparent hover:border-slate-400'}`
    })))), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2 pt-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: cancel,
      className: "flex-1 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
    }, "Abbruch"), /*#__PURE__*/React.createElement("button", {
      onClick: save,
      className: "flex-1 bg-gea-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors"
    }, isEditing ? 'Speichern' : 'Erstellen')))));
  };
  const HelpModal = () => /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden",
    style: {
      maxHeight: '85vh',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement(ModalHeader, {
    title: "Hilfe & Legende",
    onClose: () => setIsHelpModalOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "p-6 space-y-6 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-gea-800 mb-3 uppercase tracking-wide text-xs border-b border-gea-100 pb-2"
  }, "Zell-Farben im Ressourcenplaner"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 bg-emerald-200 border border-emerald-300"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "Frei / Verf\xFCgbar \u2014 keine Eins\xE4tze geplant")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 bg-amber-200 border border-amber-300"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "Auslastung \u2265 80% \u2014 Achtung, fast voll")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 bg-rose-200 border border-rose-300"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "\xDCberlastet \u2014 Einsatz > 100%")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 diagonal-stripes border border-slate-300"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "Abwesenheit (Urlaub, Krank, Gleitzeit \u2026)")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 bg-blue-200 border border-blue-300 bg-hatched"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "Einsatz zu 0% \u2014 ", /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Unter Vorbehalt"), " (geplant, aber nicht best\xE4tigt)")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 bg-gea-200 border border-gea-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "Aktuelle Woche \u2014 farbig hervorgehoben")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-6 rounded flex-shrink-0 bg-slate-300 border border-slate-400"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700"
  }, "Vergangene Woche \u2014 gedimmt angezeigt")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-gea-800 mb-3 uppercase tracking-wide text-xs border-b border-gea-100 pb-2"
  }, "Bedienung"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 text-slate-700"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Klick auf Zelle"), " \u2192 Einsatz anlegen oder bearbeiten (Prozent oder Stunden, Projekt oder Abwesenheit)"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Drag & Drop"), " (Projekt-Zeitstrahl) \u2192 Mitarbeiter aus der linken Liste in eine Projektwoche ziehen"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "L\xF6schmodus"), " \u2192 roten Button oben rechts aktivieren, dann Eins\xE4tze anklicken um sie zu l\xF6schen"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Kompaktansicht"), " \u2192 Button oben rechts reduziert die Zellh\xF6he; Kopiersymbol bleibt per Hover erreichbar"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Heute-Button"), " (Zeitstrahl) \u2192 springt zur aktuellen Kalenderwoche"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "Klick in der Heatmap"), " \u2192 Klick auf einen Mitarbeiter oder Monat \xF6ffnet die Ressourcenplanung mit dem Mitarbeiter vorausgew\xE4hlt"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-semibold text-gea-800 mb-3 uppercase tracking-wide text-xs border-b border-gea-100 pb-2"
  }, "Projekt-Status"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, PROJECT_STATUSES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.value,
    className: "flex items-start gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${s.color}`
  }, s.label), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-600 text-xs"
  }, s.value === 'planned' ? 'Start-Woche liegt noch in der Zukunft' : s.value === 'active' ? 'Projekt hat begonnen und läuft aktuell' : s.value === 'missing_costs' ? 'IBN-Woche ist vorbei, aber noch keine Kostenpunkte erfasst' : s.value === 'completed' ? 'Projekt wurde als abgeschlossen markiert' : 'Kosten wurden bereits übermittelt'))))))));
  const InvoiceModal = () => {
    if (!isInvoiceModalOpen || !selectedProjectDetails) return null;
    const proj = projectById.get(selectedProjectDetails);
    if (!proj) return null;
    const {
      laborLines,
      costLines,
      total: currentTotal
    } = buildInvoiceData(proj, invoiceSelection);
    return /*#__PURE__*/React.createElement("div", {
      className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
    }, /*#__PURE__*/React.createElement(ModalHeader, {
      title: "Rechnung konfigurieren",
      subtitle: `Projekt: ${proj.name}`,
      onClose: () => setIsInvoiceModalOpen(false)
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 overflow-y-auto p-6 space-y-6"
    }, proj.billable !== false && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      className: "text-slate-700 text-base mb-3 border-b border-slate-300 pb-2 font-medium"
    }, "Dienstleistungen (Arbeitszeit)"), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2"
    }, laborLines.filter(l => l.hours > 0).map(({
      empId,
      emp,
      hours,
      rate,
      cost
    }) => /*#__PURE__*/React.createElement("label", {
      key: empId,
      className: "flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: !!invoiceSelection.emps[empId],
      onChange: e => setInvoiceSelection({
        ...invoiceSelection,
        emps: {
          ...invoiceSelection.emps,
          [empId]: e.target.checked
        }
      }),
      className: "w-5 h-5 text-gea-600 rounded"
    }), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 text-sm text-slate-800 font-medium"
    }, emp?.name || 'Unbekannt'), /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-slate-500"
    }, hours, " Std. \xD7 ", rate, " \u20AC/h"), /*#__PURE__*/React.createElement("div", {
      className: "text-sm text-slate-900 w-24 text-right font-medium"
    }, cost.toFixed(2), " \u20AC"))), laborLines.length === 0 && /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-400"
    }, "Keine Arbeitszeiten verplant."))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
      className: "text-slate-700 text-base mb-3 border-b border-slate-300 pb-2 font-medium"
    }, "Kostenpunkte"), /*#__PURE__*/React.createElement("div", {
      className: "space-y-2"
    }, costLines.map(({
      ci,
      emp
    }) => {
      return /*#__PURE__*/React.createElement("label", {
        key: ci.id,
        className: "flex flex-col gap-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-3"
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: !!invoiceSelection.costs[ci.id],
        onChange: e => setInvoiceSelection({
          ...invoiceSelection,
          costs: {
            ...invoiceSelection.costs,
            [ci.id]: e.target.checked
          }
        }),
        className: "w-5 h-5 text-gea-600 rounded"
      }), /*#__PURE__*/React.createElement("div", {
        className: "flex-1 text-sm"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-slate-800 font-medium"
      }, ci.description || 'Kostenpunkt'), /*#__PURE__*/React.createElement("span", {
        className: "text-slate-400 ml-2"
      }, "(", emp?.name || 'Unbekannt', ")")), ci.week && /*#__PURE__*/React.createElement("div", {
        className: "text-xs text-slate-400"
      }, ci.week), /*#__PURE__*/React.createElement("div", {
        className: "text-sm text-slate-900 w-24 text-right font-medium"
      }, (ci.amount || 0).toFixed(2), " \u20AC")), (ci.lines || []).length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "pl-8 flex flex-col gap-1"
      }, (ci.lines || []).map(l => {
        const cfg = COST_LINE_TYPES[l.type] || COST_LINE_TYPES.other;
        return /*#__PURE__*/React.createElement("div", {
          key: l.id,
          className: "flex items-center gap-2 text-xs"
        }, /*#__PURE__*/React.createElement("span", {
          className: `px-2 py-0.5 rounded-full border font-medium shrink-0 ${cfg.chip}`
        }, cfg.label), l.type === 'hours' && /*#__PURE__*/React.createElement("span", {
          className: "text-slate-500 tabular-nums"
        }, l.hours || 0, "h \xD7 ", l.hourlyRate || 0, "\u20AC"), l.comment && /*#__PURE__*/React.createElement("span", {
          className: "text-slate-500 truncate"
        }, l.comment), /*#__PURE__*/React.createElement("span", {
          className: "text-slate-600 tabular-nums ml-auto"
        }, (l.amount || 0).toFixed(2), " \u20AC"));
      })));
    }), costLines.length === 0 && /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-400"
    }, "Keine Kostenpunkte erfasst.")))), /*#__PURE__*/React.createElement("div", {
      className: "p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
      className: "text-sm text-slate-500"
    }, "Gesamtsumme (Netto)"), /*#__PURE__*/React.createElement("p", {
      className: "text-xl text-gea-600 font-medium"
    }, currentTotal.toFixed(2), " \u20AC")), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setIsInvoiceModalOpen(false),
      className: "px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium"
    }, "Abbrechen"), invoiceRecipient && /*#__PURE__*/React.createElement("button", {
      onClick: handleInvoiceSendEmail,
      className: "px-4 py-2 text-sm text-white bg-gea-500 rounded-md hover:bg-gea-600 flex items-center gap-2 font-medium"
    }, "\u2709 Per E-Mail"), /*#__PURE__*/React.createElement("button", {
      onClick: handleInvoiceExport,
      className: "px-4 py-2 text-sm text-white bg-gea-600 rounded-md hover:bg-gea-700 flex items-center gap-2 font-medium"
    }, /*#__PURE__*/React.createElement(IconFileText, {
      size: 16
    }), " CSV Export")))));
  };

  // --- FILE SYSTEM SYNC HANDLERS ---

  const applyFsData = async handle => {
    try {
      const {
        state,
        timestamps
      } = await loadSplitStateFs(handle);
      if (state && (state.employees.length || state.assignments.length || state.projects.length)) {
        fsFileTimestampsRef.current = timestamps;
        applyRemoteSnapshot(state, {
          notify: false
        });
      }
    } catch (e) {
      console.warn('[FS] applyFsData failed', e);
    }
  };
  const handleSetupFolder = async () => {
    try {
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      await idbSaveHandle(handle);
      dirHandleRef.current = handle;
      await applyFsData(handle);
      setFsStatus('connected');
      setSyncStatus('idle');
    } catch (e) {/* Nutzer hat abgebrochen */}
  };
  const handleActivateSync = async () => {
    const handle = dirHandleRef.current;
    if (!handle) return;
    try {
      const result = await handle.requestPermission({
        mode: 'readwrite'
      });
      if (result === 'granted') {
        await applyFsData(handle);
        setFsStatus('connected');
        setSyncStatus('idle');
      }
    } catch (e) {}
  };

  // ─── PROP BUNDLES for view components ────────────────────────────────────
  const s = {
    activeTab,
    employees,
    projects,
    assignments,
    expenses,
    costItems,
    empCategories,
    projCategories,
    basicTasks,
    basicTasksMeta,
    inactiveBasicTasks,
    basicTasksSubTab,
    offtimeTasks,
    inactiveOfftimeTasks,
    inactiveSupportTasks,
    inactiveTrainingTasks,
    customTrainingTasks,
    isChangelogOpen,
    weeks,
    selectedProject,
    collapsedCategories,
    collapsedProjCategories,
    collapsedEmpSetup,
    selectedProjectDetails,
    weeksAhead,
    isAssignModalOpen,
    assignContext,
    isCostItemModalOpen,
    editingCostItem,
    isCopyModalOpen,
    copyContext,
    isDeleteMode,
    pastProjectsExpanded,
    isInvoiceModalOpen,
    invoiceSelection,
    invoiceRecipient,
    isProjFormOpen,
    isHelpModalOpen,
    timelineYear,
    empForm,
    editingEmpId,
    isEmpFormOpen,
    projForm,
    editingProjectId,
    newEmpCat,
    newProjCat,
    newBasicTask,
    newOfftimeTask,
    expandedSetupCats,
    syncStatus,
    fsStatus,
    employeeById,
    projectById,
    assignmentsByEmpWeek,
    assignmentsByProject,
    assignmentsByProjectWeek,
    costItemsByProject,
    projectStatusById,
    activeEmployees,
    activeEmpsByCategory,
    activeEmpCategories,
    supportEmpsByCategory,
    supportEmpCategories,
    hasSupportEmployees,
    projectsByCategory,
    projCategoriesFromProjects,
    timelineWeeks,
    currentWeekColRef,
    resourceScrollRef,
    timelineScrollRef,
    compactView,
    scrollTarget,
    currentUser,
    appUsers,
    auditLog,
    isLoginModalOpen
  };
  const h = useMemo(() => ({
    setActiveTab,
    setEmployees,
    setProjects,
    setAssignments,
    setCostItems,
    setEmpCategories,
    setProjCategories,
    setBasicTasks,
    setBasicTasksMeta,
    setInactiveBasicTasks,
    setBasicTasksSubTab,
    setOfftimeTasks,
    setInactiveOfftimeTasks,
    setInactiveSupportTasks,
    setInactiveTrainingTasks,
    setCustomTrainingTasks,
    setIsChangelogOpen,
    setSelectedProject,
    setCollapsedCategories,
    setCollapsedProjCategories,
    setCollapsedEmpSetup,
    setSelectedProjectDetails,
    setWeeksAhead,
    setIsAssignModalOpen,
    setAssignContext,
    setIsCostItemModalOpen,
    setEditingCostItem,
    setIsCopyModalOpen,
    setCopyContext,
    setIsDeleteMode,
    setPastProjectsExpanded,
    setIsInvoiceModalOpen,
    setInvoiceSelection,
    setInvoiceRecipient,
    setIsProjFormOpen,
    setIsHelpModalOpen,
    setTimelineYear,
    setEmpForm,
    setEditingEmpId,
    setIsEmpFormOpen,
    setProjForm,
    setEditingProjectId,
    setNewEmpCat,
    setNewProjCat,
    setNewBasicTask,
    setNewOfftimeTask,
    setExpandedSetupCats,
    setSyncStatus,
    setFsStatus,
    setCompactView,
    setScrollTarget,
    setAppUsers,
    setAuditLog,
    setIsLoginModalOpen,
    showToast,
    dismissToast,
    loginUser,
    logoutUser,
    getEmpWeeklyHours,
    computeAutoStatus,
    getWeeksForYear,
    getUtilization,
    toggleCategory,
    toggleProjCategory,
    toggleEmpSetup,
    handleSaveAssignment,
    handleDeleteAssignment,
    handleDeleteAssignmentSeries,
    handleDrop,
    exportData,
    importData,
    buildInvoiceData,
    openInvoiceModal,
    scrollToCurrentWeek,
    scrollToWeekById,
    reconnectSharePoint
  }), [
  // useState setters are stable – no deps needed for those.
  // Only useCallback refs with real deps need listing:
  loginUser, logoutUser, getEmpWeeklyHours, computeAutoStatus, getWeeksForYear, getUtilization, buildInvoiceData, openInvoiceModal, exportData, reconnectSharePoint, scrollToWeekById, handleSaveAssignment, handleDeleteAssignment, handleDeleteAssignmentSeries, handleDrop]);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex h-screen w-full font-sans text-slate-800 bg-white overflow-hidden"
  }, /*#__PURE__*/React.createElement(SidebarView, {
    s: s,
    h: h
  }), activeTab === 'resource' && /*#__PURE__*/React.createElement(ResourceView, {
    s: s,
    h: h
  }), activeTab === 'project' && /*#__PURE__*/React.createElement(TimelineView, {
    s: s,
    h: h
  }), activeTab === 'support' && hasSupportEmployees && /*#__PURE__*/React.createElement(SupportView, {
    s: s,
    h: h
  }), activeTab === 'offtime' && /*#__PURE__*/React.createElement(OfftimeView, {
    s: s,
    h: h
  }), activeTab === 'training' && /*#__PURE__*/React.createElement(TrainingView, {
    s: s,
    h: h
  }), activeTab === 'utilization' && currentUser && /*#__PURE__*/React.createElement(UtilizationView, {
    s: s,
    h: h
  }), activeTab === 'overview' && /*#__PURE__*/React.createElement(OverviewView, {
    s: s,
    h: h
  }), activeTab === 'setup_emp' && currentUser && /*#__PURE__*/React.createElement(SetupEmpView, {
    s: s,
    h: h
  }), activeTab === 'setup_proj' && currentUser && /*#__PURE__*/React.createElement(SetupProjView, {
    s: s,
    h: h
  }), activeTab === 'setup_cats' && currentUser && /*#__PURE__*/React.createElement(SetupCatsView, {
    s: s,
    h: h
  }), activeTab === 'data' && currentUser && /*#__PURE__*/React.createElement(DataView, {
    s: s,
    h: h
  }), activeTab === 'audit' && currentUser && /*#__PURE__*/React.createElement(AuditView, {
    s: s,
    h: h
  }), activeTab === 'setup_users' && currentUser && /*#__PURE__*/React.createElement(SetupUsersView, {
    s: s,
    h: h
  }), isAssignModalOpen && assignContext && currentUser && /*#__PURE__*/React.createElement(AssignmentModal, {
    assignContext: assignContext,
    employeeById: employeeById,
    basicTasks: basicTasks,
    basicTasksMeta: basicTasksMeta,
    offtimeTasks: offtimeTasks,
    inactiveOfftimeTasks: inactiveOfftimeTasks,
    inactiveSupportTasks: inactiveSupportTasks,
    inactiveTrainingTasks: inactiveTrainingTasks,
    customTrainingTasks: customTrainingTasks,
    projects: projects,
    computeAutoStatus: computeAutoStatus,
    getUtilization: getUtilization,
    getEmpWeeklyHours: getEmpWeeklyHours,
    setBasicTasks: setBasicTasks,
    setBasicTasksMeta: setBasicTasksMeta,
    onClose: () => setIsAssignModalOpen(false),
    onSave: handleSaveAssignment,
    onDelete: handleDeleteAssignment,
    onDeleteSeries: handleDeleteAssignmentSeries
  }), isCopyModalOpen && copyContext && currentUser && /*#__PURE__*/React.createElement(CopyModal, {
    copyContext: copyContext,
    employees: employees,
    activeEmps: activeEmployees,
    empsByCategory: activeEmpsByCategory,
    empCategories: activeEmpCategories,
    weeks: weeks,
    projectById: projectById,
    assignments: assignments,
    setAssignments: setAssignments,
    onClose: () => {
      setIsCopyModalOpen(false);
      setCopyContext(null);
    }
  }), isInvoiceModalOpen && /*#__PURE__*/React.createElement(InvoiceModal, null), isProjFormOpen && ProjFormModal(), isChangelogOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden",
    style: {
      maxHeight: '85vh'
    }
  }, /*#__PURE__*/React.createElement(ModalHeader, {
    title: "Changelog \u2013 Einsatzplanung",
    onClose: () => setIsChangelogOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    className: "overflow-auto p-6",
    style: {
      maxHeight: 'calc(85vh - 64px)'
    }
  }, /*#__PURE__*/React.createElement("pre", {
    className: "text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed"
  }, CHANGELOG_CONTENT)))), FS_MODE && (fsStatus === 'needs-setup' || fsStatus === 'needs-permission') && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 bg-gea-100 rounded-full flex items-center justify-center mx-auto mb-4"
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "text-gea-600"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "17 8 12 3 7 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15"
  }))), fsStatus === 'needs-setup' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold text-slate-900 mb-2"
  }, "Synchronisation einrichten"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mb-6"
  }, "W\xE4hle einmalig den Ordner, in dem ", /*#__PURE__*/React.createElement("strong", null, "index.html"), " liegt. OneDrive verteilt \xC4nderungen danach automatisch an alle Nutzer."), /*#__PURE__*/React.createElement("button", {
    onClick: handleSetupFolder,
    className: "w-full bg-gea-600 hover:bg-gea-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-2"
  }, "Ordner w\xE4hlen")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg font-semibold text-slate-900 mb-2"
  }, "Synchronisation aktivieren"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500 mb-6"
  }, "Klicke auf ", /*#__PURE__*/React.createElement("strong", null, "Aktivieren"), " \u2013 der Browser fragt kurz nach Dateizugriff. Danach l\xE4uft die Synchronisation automatisch."), /*#__PURE__*/React.createElement("button", {
    onClick: handleActivateSync,
    className: "w-full bg-gea-600 hover:bg-gea-700 text-white font-medium py-3 px-4 rounded-xl transition-colors mb-2"
  }, "Aktivieren")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFsStatus('off'),
    className: "w-full text-slate-400 hover:text-slate-600 text-sm py-2 transition-colors"
  }, "Ohne Sync starten"))), isHelpModalOpen && HelpModal(), isLoginModalOpen && /*#__PURE__*/React.createElement(LoginModal, {
    appUsers: appUsers,
    onLogin: loginUser,
    onClose: () => setIsLoginModalOpen(false)
  }), /*#__PURE__*/React.createElement(ToastContainer, {
    toasts: toasts,
    onDismiss: dismissToast
  }));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));