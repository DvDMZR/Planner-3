const SetupProjView = ({
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
  if (selectedProjectDetails) {
    return /*#__PURE__*/React.createElement(ProjectDetailsView, {
      s: s,
      h: h
    });
  }
  const handleEditProject = p => {
    setProjForm({
      name: p.name,
      category: p.category || projCategories[0] || '',
      projectNumber: p.projectNumber || '',
      address: p.address || '',
      country: p.country || '',
      startWeek: p.startWeek,
      ibnWeek: p.ibnWeek,
      color: resolveProjectColor(p.color).id
    });
    setEditingProjectId(p.id);
    setIsProjFormOpen(true);
  };
  const now = getWeekString(new Date());
  const byStartWeek = (a, b) => (a.startWeek || '').localeCompare(b.startWeek || '');
  const activeProjects = projects.filter(p => p.ibnWeek >= now).slice().sort(byStartWeek);
  const pastProjects = projects.filter(p => p.ibnWeek < now).slice().sort(byStartWeek);
  const activeCats = [...new Set(activeProjects.map(p => p.category))];
  const ProjectRow = ({
    p
  }) => {
    const effStatus = computeAutoStatus(p);
    return /*#__PURE__*/React.createElement("tr", {
      key: p.id,
      className: "hover:bg-slate-50 transition-colors"
    }, /*#__PURE__*/React.createElement("td", {
      className: "p-4"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setSelectedProjectDetails(p.id),
      className: "flex items-center gap-2 text-left group"
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-3 h-3 rounded-full flex-shrink-0 ${resolveProjectColor(p.color).dot}`
    }), /*#__PURE__*/React.createElement("span", {
      className: "text-slate-900 font-medium group-hover:text-gea-600 transition-colors"
    }, p.name))), /*#__PURE__*/React.createElement("td", {
      className: "p-4 text-slate-500 font-mono text-xs"
    }, p.projectNumber || '–'), /*#__PURE__*/React.createElement("td", {
      className: "p-4"
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: effStatus
    })), /*#__PURE__*/React.createElement("td", {
      className: "p-4 text-slate-600 text-xs"
    }, p.startWeek, " \u2013 ", p.ibnWeek), /*#__PURE__*/React.createElement("td", {
      className: "p-4 text-right"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex justify-end gap-3"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => handleEditProject(p),
      className: "text-gea-600 text-xs font-medium hover:text-gea-700"
    }, "Bearbeiten"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        const assCount = (assignmentsByProject.get(p.id) || []).length;
        const msg = assCount > 0 ? `Projekt „${p.name}" wirklich löschen?\n\n${assCount} Einsatz-Planung(en) werden ebenfalls gelöscht.` : `Projekt „${p.name}" wirklich löschen?`;
        if (window.confirm(msg)) {
          setProjects(projects.filter(x => x.id !== p.id));
          setAssignments(assignments.filter(a => a.reference !== p.id));
        }
      },
      className: "text-rose-600 text-xs font-medium hover:text-rose-700"
    }, "L\xF6schen"))));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-auto p-8 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-5xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl text-gea-800 font-semibold"
  }, "Projekte"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setEditingProjectId(null);
      setProjForm({
        name: '',
        category: projCategories[0] || '',
        projectNumber: '',
        address: '',
        country: '',
        startWeek: weeks[0]?.id || '',
        ibnWeek: weeks[10]?.id || '',
        color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length].id
      });
      setIsProjFormOpen(true);
    },
    className: "flex items-center gap-2 bg-gea-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors shadow-sm"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 16
  }), " Neues Projekt")), activeCats.length === 0 && activeProjects.length === 0 && /*#__PURE__*/React.createElement("div", {
    className: "text-center text-slate-400 text-sm py-8"
  }, "Noch keine aktiven Projekte."), activeCats.map(cat => {
    const catProjs = activeProjects.filter(p => p.category === cat);
    const isCollapsed = collapsedProjCategories[cat];
    return /*#__PURE__*/React.createElement("div", {
      key: cat,
      className: "bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleProjCategory(cat),
      className: "w-full p-4 bg-gea-50 border-b border-gea-200 flex items-center gap-3 hover:bg-gea-100 transition-colors"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-gea-500"
    }, isCollapsed ? /*#__PURE__*/React.createElement(IconChevronRight, {
      size: 18
    }) : /*#__PURE__*/React.createElement(IconChevronDown, {
      size: 18
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-gea-900 font-semibold text-lg"
    }, cat), /*#__PURE__*/React.createElement("span", {
      className: "ml-2 px-2 py-0.5 bg-white border border-gea-200 rounded-full text-xs text-gea-700 font-semibold"
    }, catProjs.length)), !isCollapsed && /*#__PURE__*/React.createElement("table", {
      className: "w-full text-left text-sm"
    }, /*#__PURE__*/React.createElement("thead", {
      className: "bg-slate-50 border-b border-slate-200"
    }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
      className: "p-4 text-slate-700 font-semibold"
    }, "Name"), /*#__PURE__*/React.createElement("th", {
      className: "p-4 text-slate-700 font-semibold"
    }, "Nr."), /*#__PURE__*/React.createElement("th", {
      className: "p-4 text-slate-700 font-semibold"
    }, "Status"), /*#__PURE__*/React.createElement("th", {
      className: "p-4 text-slate-700 font-semibold"
    }, "Zeitraum"), /*#__PURE__*/React.createElement("th", {
      className: "p-4"
    }))), /*#__PURE__*/React.createElement("tbody", {
      className: "divide-y divide-slate-200"
    }, catProjs.map(p => /*#__PURE__*/React.createElement(ProjectRow, {
      key: p.id,
      p: p
    })))));
  }), pastProjects.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setPastProjectsExpanded(e => !e),
    className: "w-full p-4 bg-slate-100 border-b border-slate-300 flex items-center gap-3 hover:bg-slate-200 transition-colors"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, pastProjectsExpanded ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 18
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-700 font-semibold"
  }, "Vergangene Projekte"), /*#__PURE__*/React.createElement("span", {
    className: "ml-2 px-2 py-0.5 bg-white border border-slate-300 rounded-full text-xs text-slate-600 font-semibold"
  }, pastProjects.length)), pastProjectsExpanded && /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-sm"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-slate-50 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-slate-700 font-semibold"
  }, "Name"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-slate-700 font-semibold"
  }, "Nr."), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-slate-700 font-semibold"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-slate-700 font-semibold"
  }, "Zeitraum"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-200 opacity-75"
  }, pastProjects.map(p => /*#__PURE__*/React.createElement(ProjectRow, {
    key: p.id,
    p: p
  })))))));
};