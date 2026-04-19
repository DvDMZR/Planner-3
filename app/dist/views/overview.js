const OverviewView = ({
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
    projectsByCategory,
    projCategoriesFromProjects,
    timelineWeeks,
    currentWeekColRef,
    resourceScrollRef,
    timelineScrollRef
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
    scrollToCurrentWeek
  } = h;
  const fmt = n => n.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const currentWeekStr = getWeekString(new Date());
  const activeEmps = activeEmployees;
  const activeProjects = React.useMemo(() => projects.filter(p => computeAutoStatus(p) === 'active').length, [projects, computeAutoStatus]);
  const {
    avgUtil,
    overbookedCount
  } = React.useMemo(() => {
    const utils = activeEmps.map(e => getUtilization(e.id, currentWeekStr).total);
    const avg = activeEmps.length > 0 ? Math.round(utils.reduce((a, b) => a + b, 0) / activeEmps.length) : 0;
    return {
      avgUtil: avg,
      overbookedCount: utils.filter(u => u > 100).length
    };
  }, [activeEmps, getUtilization, currentWeekStr]);
  const rows = projects.filter(p => ['active', 'planned'].includes(computeAutoStatus(p))).map(p => {
    const projAss = assignmentsByProject.get(p.id) || [];
    let totalHours = 0,
      totalLaborCost = 0;
    for (let i = 0; i < projAss.length; i++) {
      const a = projAss[i];
      if (a.type !== 'project') continue;
      const h = a.hours ?? (a.percent ?? 100) / 100 * HOURS_PER_WEEK;
      totalHours += h;
      if (p.billable !== false) totalLaborCost += h * (p.hourlyRate ?? DEFAULT_HOURLY_RATE);
    }
    const projCosts = costItemsByProject.get(p.id) || [];
    let zusatzkosten = 0;
    for (let i = 0; i < projCosts.length; i++) zusatzkosten += projCosts[i].amount || 0;
    return {
      p,
      totalHours,
      totalLaborCost,
      zusatzkosten,
      gesamtkosten: totalLaborCost + zusatzkosten
    };
  }).sort((a, b) => {
    const statusOrder = {
      active: 0,
      missing_costs: 1,
      planned: 2,
      completed: 3,
      costs_submitted: 4
    };
    return (statusOrder[computeAutoStatus(a.p)] ?? 5) - (statusOrder[computeAutoStatus(b.p)] ?? 5);
  });
  const totalGesamtkosten = rows.reduce((acc, r) => acc + r.gesamtkosten, 0);
  const totalHoursAll = rows.reduce((acc, r) => acc + r.totalHours, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-auto p-8 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-6xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-300 border-l-4 border-l-gea-500 rounded-xl p-5 shadow-md"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 font-semibold uppercase tracking-wide"
  }, "Aktive Projekte"), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold text-gea-700 mt-1"
  }, activeProjects), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "von ", projects.length, " gesamt (ohne abgeschl.)")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-300 border-l-4 border-l-gea-400 rounded-xl p-5 shadow-md"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 font-semibold uppercase tracking-wide"
  }, "Mitarbeiter"), /*#__PURE__*/React.createElement("p", {
    className: "text-3xl font-bold text-slate-800 mt-1"
  }, activeEmps.length), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, "aktiv")), /*#__PURE__*/React.createElement("div", {
    className: `bg-white border border-l-4 rounded-xl p-5 shadow-md ${avgUtil >= 100 ? 'border-rose-300 border-l-rose-500' : avgUtil >= 80 ? 'border-amber-300 border-l-amber-500' : 'border-slate-300 border-l-emerald-500'}`
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 font-semibold uppercase tracking-wide"
  }, "\xD8 Auslastung diese KW"), /*#__PURE__*/React.createElement("p", {
    className: `text-3xl font-bold mt-1 ${avgUtil >= 100 ? 'text-rose-600' : avgUtil >= 80 ? 'text-amber-600' : 'text-emerald-600'}`
  }, avgUtil, "%"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, currentWeekStr)), /*#__PURE__*/React.createElement("div", {
    className: `bg-white border border-l-4 rounded-xl p-5 shadow-md ${overbookedCount > 0 ? 'border-rose-300 border-l-rose-500' : 'border-slate-300 border-l-slate-400'}`
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-600 font-semibold uppercase tracking-wide"
  }, "\xDCberlastet diese KW"), /*#__PURE__*/React.createElement("p", {
    className: `text-3xl font-bold mt-1 ${overbookedCount > 0 ? 'text-rose-600' : 'text-slate-800'}`
  }, overbookedCount), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-500 mt-1"
  }, overbookedCount > 0 ? 'Mitarbeiter >100%' : 'Alles im Rahmen'))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl text-gea-800 font-semibold"
  }, "Projekt\xFCbersicht"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 text-sm text-slate-500"
  }, /*#__PURE__*/React.createElement("span", null, rows.length, " offene / geplante Projekte"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300"
  }, "|"), /*#__PURE__*/React.createElement("span", null, fmt(totalHoursAll), " h gesamt"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-300"
  }, "|"), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-700"
  }, fmt(totalGesamtkosten), " \u20AC gesamt"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-gea-50 border-b-2 border-gea-200"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold"
  }, "Projekt"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold"
  }, "IBN"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold text-right"
  }, "Stunden"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold text-right"
  }, "Lohnkosten"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold text-right"
  }, "Zusatzkosten"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-gea-800 font-semibold text-right"
  }, "Gesamt"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-200"
  }, rows.map(({
    p,
    totalHours,
    totalLaborCost,
    zusatzkosten,
    gesamtkosten
  }) => /*#__PURE__*/React.createElement("tr", {
    key: p.id,
    className: "hover:bg-slate-50 cursor-pointer transition-colors",
    onClick: () => {
      setSelectedProjectDetails(p.id);
      setActiveTab('setup_proj');
    }
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-2.5 h-2.5 rounded-full flex-shrink-0 ${resolveProjectColor(p.color).dot}`
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-medium text-slate-900"
  }, p.name), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-slate-400 font-mono"
  }, p.projectNumber || '–', " \xB7 ", p.category)))), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    status: computeAutoStatus(p)
  })), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-slate-500 text-xs font-mono"
  }, p.ibnWeek || '–'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right text-slate-700 tabular-nums"
  }, fmt(totalHours), " h"), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right text-slate-700 tabular-nums"
  }, p.billable !== false ? `${fmt(totalLaborCost)} €` : /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 text-xs"
  }, "\u2013")), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right text-slate-700 tabular-nums"
  }, zusatzkosten > 0 ? `${fmt(zusatzkosten)} €` : /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400"
  }, "\u2013")), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right font-semibold text-slate-900 tabular-nums"
  }, gesamtkosten > 0 ? `${fmt(gesamtkosten)} €` : /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 font-normal"
  }, "\u2013"))))), rows.length > 0 && /*#__PURE__*/React.createElement("tfoot", {
    className: "border-t-2 border-gea-200 bg-gea-50"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-gea-800 font-semibold text-sm",
    colSpan: 4
  }, "Gesamt"), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right font-semibold text-slate-900 tabular-nums"
  }, fmt(totalHoursAll), " h"), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right font-semibold text-slate-900 tabular-nums"
  }, fmt(rows.reduce((a, r) => a + r.totalLaborCost, 0)), " \u20AC"), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right font-semibold text-slate-900 tabular-nums"
  }, fmt(rows.reduce((a, r) => a + r.zusatzkosten, 0)), " \u20AC"), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right font-bold text-gea-700 tabular-nums"
  }, fmt(totalGesamtkosten), " \u20AC"))), rows.length === 0 && /*#__PURE__*/React.createElement("tbody", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    className: "text-center text-slate-400 text-sm py-12"
  }, "Keine Projekte vorhanden.")))))));
};