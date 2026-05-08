const _SidebarBase = ({
  s,
  h
}) => {
  const {
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
    currentUser,
    appUsers
  } = s;
  const {
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
    setProjForm,
    setEditingProjectId,
    setNewEmpCat,
    setNewProjCat,
    setNewBasicTask,
    setNewOfftimeTask,
    setExpandedSetupCats,
    setSyncStatus,
    setFsStatus,
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
    reconnectSharePoint,
    loginUser,
    logoutUser,
    setIsLoginModalOpen
  } = h;
  const isActive = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  // Sondertätigkeiten group: collapsible, persisted, auto-expand on navigation
  const SONDER_TABS = ['support', 'offtime', 'training'];
  const [sonderOpen, setSonderOpen] = React.useState(() => {
    try {
      const stored = localStorage.getItem('sidebar.sonderOpen');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return false;
  });
  React.useEffect(() => {
    try {
      localStorage.setItem('sidebar.sonderOpen', String(sonderOpen));
    } catch (e) {}
  }, [sonderOpen]);
  React.useEffect(() => {
    if (SONDER_TABS.includes(activeTab) && !sonderOpen) setSonderOpen(true);
  }, [activeTab]);

  // Verwaltung group: collapsible, persisted, auto-expand when navigating to a Verwaltung tab
  const VERWALTUNG_TABS = ['setup_emp', 'setup_proj', 'setup_cats', 'data', 'audit', 'setup_users'];
  const [verwaltungOpen, setVerwaltungOpen] = React.useState(() => {
    try {
      const stored = localStorage.getItem('sidebar.verwaltungOpen');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return currentUser?.role === 'admin';
  });
  React.useEffect(() => {
    try {
      localStorage.setItem('sidebar.verwaltungOpen', String(verwaltungOpen));
    } catch (e) {}
  }, [verwaltungOpen]);
  React.useEffect(() => {
    if (VERWALTUNG_TABS.includes(activeTab) && !verwaltungOpen) setVerwaltungOpen(true);
  }, [activeTab]);

  // Helper: locked tab button for passive users
  const lockedTabBtn = (label, icon) => /*#__PURE__*/React.createElement("div", {
    className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gea-600 opacity-50 cursor-not-allowed select-none"
  }, icon, " ", label, /*#__PURE__*/React.createElement(IconLock, {
    size: 13,
    className: "ml-auto shrink-0"
  }));

  // Helper: normal tab button
  const tabBtn = (tab, label, icon, onClick) => /*#__PURE__*/React.createElement("button", {
    onClick: onClick || (() => {
      setActiveTab(tab);
      setSelectedProjectDetails(null);
    }),
    className: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === tab ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`
  }, icon, " ", label);
  return /*#__PURE__*/React.createElement("aside", {
    className: "w-60 bg-gea-900 text-gea-100 flex flex-col h-full shrink-0 shadow-xl"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-5 flex items-center gap-3 border-b border-gea-700"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gea-500 text-white p-2 rounded-lg shadow-sm"
  }, /*#__PURE__*/React.createElement(IconBriefcase, {
    size: 20
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "text-white text-base tracking-tight font-bold uppercase"
  }, "GEA"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsChangelogOpen(true),
    className: "flex items-center gap-1.5 text-gea-300 hover:text-white transition-colors group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium"
  }, "Einsatzplanung v0.81"), /*#__PURE__*/React.createElement("span", {
    className: "changelog-glow bg-gea-700 group-hover:bg-gea-600 text-gea-300 group-hover:text-white text-xs px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(IconHistory, {
    size: 12
  })))))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 py-4 space-y-0.5 px-3 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-4 font-semibold"
  }, "Planung"), tabBtn('resource', 'Ressourcen', /*#__PURE__*/React.createElement(IconUsers, {
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setSonderOpen(o => !o),
    className: "w-full flex items-center justify-between text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-4 font-semibold hover:text-gea-300 transition-colors"
  }, /*#__PURE__*/React.createElement("span", null, "Details"), sonderOpen ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 14
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 14
  })), sonderOpen && /*#__PURE__*/React.createElement(React.Fragment, null, hasSupportEmployees && tabBtn('support', 'Support', /*#__PURE__*/React.createElement(IconLifebuoy, {
    size: 18
  })), tabBtn('offtime', 'Abwesenheiten', /*#__PURE__*/React.createElement(IconCalendar, {
    size: 18
  })), tabBtn('training', 'Trainings', /*#__PURE__*/React.createElement(IconBookOpen, {
    size: 18
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mx-3 mt-2 mb-1",
    style: {
      height: '1px',
      background: 'rgba(255,255,255,0.10)'
    }
  }), tabBtn('project', 'Projekte', /*#__PURE__*/React.createElement(IconGanttChart, {
    size: 18
  }), () => {
    setActiveTab('project');
    setSelectedProject(projects[0]);
    setSelectedProjectDetails(null);
  }), isActive ? tabBtn('utilization', 'Auslastung', /*#__PURE__*/React.createElement(IconBarChart, {
    size: 18
  })) : lockedTabBtn('Auslastung', /*#__PURE__*/React.createElement(IconBarChart, {
    size: 18
  })), isActive ? tabBtn('overview', 'Übersicht', /*#__PURE__*/React.createElement(IconTable, {
    size: 18
  })) : lockedTabBtn('Übersicht', /*#__PURE__*/React.createElement(IconTable, {
    size: 18
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setVerwaltungOpen(o => !o),
    className: "w-full flex items-center justify-between text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-8 font-semibold hover:text-gea-300 transition-colors"
  }, /*#__PURE__*/React.createElement("span", null, "Verwaltung"), verwaltungOpen ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 14
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 14
  })), verwaltungOpen && (isActive ? /*#__PURE__*/React.createElement(React.Fragment, null, tabBtn('setup_emp', 'Mitarbeiter', /*#__PURE__*/React.createElement(IconUser, {
    size: 18
  })), tabBtn('setup_proj', 'Projekte', /*#__PURE__*/React.createElement(IconBriefcase, {
    size: 18
  })), tabBtn('setup_cats', 'Kategorien', /*#__PURE__*/React.createElement(IconTag, {
    size: 18
  })), tabBtn('data', 'System & Export', /*#__PURE__*/React.createElement(IconSettings, {
    size: 18
  })), tabBtn('audit', 'Verlauf', /*#__PURE__*/React.createElement(IconHistory, {
    size: 18
  })), tabBtn('setup_users', 'Benutzer', /*#__PURE__*/React.createElement(IconShield, {
    size: 18
  }))) : /*#__PURE__*/React.createElement(React.Fragment, null, lockedTabBtn('Mitarbeiter', /*#__PURE__*/React.createElement(IconUser, {
    size: 18
  })), lockedTabBtn('Projekte', /*#__PURE__*/React.createElement(IconBriefcase, {
    size: 18
  })), lockedTabBtn('Kategorien', /*#__PURE__*/React.createElement(IconTag, {
    size: 18
  })), lockedTabBtn('System & Export', /*#__PURE__*/React.createElement(IconSettings, {
    size: 18
  })), lockedTabBtn('Verlauf', /*#__PURE__*/React.createElement(IconHistory, {
    size: 18
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 border-t border-gea-700 shrink-0"
  }, isActive ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin ? 'bg-gea-500 text-white' : 'bg-gea-700 text-gea-200'}`
  }, currentUser.name.slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-gea-200 text-xs font-medium truncate block"
  }, currentUser.name), /*#__PURE__*/React.createElement("span", {
    className: "text-gea-500 text-xs"
  }, isAdmin ? 'Administrator' : 'Aktiver Nutzer')), /*#__PURE__*/React.createElement(Tooltip, {
    text: "Abmelden",
    side: "top"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: logoutUser,
    className: "text-gea-400 hover:text-white p-1 rounded hover:bg-gea-700 transition-colors shrink-0"
  }, /*#__PURE__*/React.createElement(IconLogOut, {
    size: 15
  })))) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsLoginModalOpen(true),
    className: "w-full flex items-center gap-2 text-gea-400 hover:text-white text-xs px-2 py-1.5 rounded hover:bg-gea-800 transition-colors"
  }, /*#__PURE__*/React.createElement(IconLogIn, {
    size: 15
  }), " Anmelden")), (SP_CONTEXT || fsStatus === 'connected') && /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 border-t border-gea-700 flex items-center gap-2 shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-2 h-2 rounded-full shrink-0 ${syncStatus === 'idle' ? 'bg-emerald-400' : syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : syncStatus === 'updated' ? 'bg-blue-400' : syncStatus === 'conflict-reload' ? 'bg-orange-400' : syncStatus === 'reconnecting' ? 'bg-amber-400 animate-pulse' : syncStatus === 'needs-auth' ? 'bg-rose-500' : syncStatus === 'offline' ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`
  }), syncStatus === 'needs-auth' ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: reconnectSharePoint,
    className: "text-rose-300 hover:text-rose-200 text-xs truncate underline decoration-dotted",
    title: "Sitzung bei SharePoint ist abgelaufen \u2013 hier klicken um sich neu anzumelden"
  }, "Sitzung abgelaufen \u2013 neu verbinden") : /*#__PURE__*/React.createElement("span", {
    className: "text-gea-400 text-xs truncate"
  }, syncStatus === 'idle' ? 'Synchronisiert' : syncStatus === 'syncing' ? 'Speichert ...' : syncStatus === 'updated' ? 'Aktualisiert ✓' : syncStatus === 'conflict-reload' ? 'Änderung eines Kollegen übernommen' : syncStatus === 'reconnecting' ? 'Sitzung erneuern ...' : syncStatus === 'offline' ? 'Offline – lokal' : 'Verbindet ...')));
};

// Only re-render when sidebar-visible state actually changes (not on every
// background poll that touches employees/projects/assignments).
const SidebarView = React.memo(_SidebarBase, (prev, next) => prev.s.activeTab === next.s.activeTab && prev.s.syncStatus === next.s.syncStatus && prev.s.fsStatus === next.s.fsStatus && prev.s.projects === next.s.projects &&
// needed for onClick: setSelectedProject(projects[0])
prev.s.hasSupportEmployees === next.s.hasSupportEmployees && prev.s.currentUser === next.s.currentUser // login/logout
);