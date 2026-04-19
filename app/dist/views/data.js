const DataView = ({
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
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 p-8 bg-slate-50 overflow-y-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-3xl mx-auto w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 mb-6"
  }, /*#__PURE__*/React.createElement(IconSettings, {
    size: 40,
    className: "text-slate-300 shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl text-slate-900 font-medium"
  }, "Datenverwaltung"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, "Exportiere deine Planung als JSON-Backup oder stelle Daten aus einem Backup wieder her."))), /*#__PURE__*/React.createElement("div", {
    className: "mb-6 text-left border border-slate-200 rounded-lg p-4"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-sm font-medium text-slate-700 mb-1"
  }, "Rechnungsempf\xE4nger (E-Mail)"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: invoiceRecipient,
    onChange: e => setInvoiceRecipient(e.target.value),
    placeholder: "rechnung@kunde.de",
    className: "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gea-400"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-1"
  }, "Standard-Empf\xE4nger f\xFCr den \"Per E-Mail\"-Button im Rechnungsdialog.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: exportData,
    className: "bg-gea-600 hover:bg-gea-700 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors"
  }, /*#__PURE__*/React.createElement(IconDownload, {
    size: 18
  }), " Backup exportieren (JSON)"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".json",
    onChange: importData,
    className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "w-full bg-white border-2 border-dashed border-slate-300 hover:border-gea-400 text-slate-600 py-3 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors"
  }, /*#__PURE__*/React.createElement(IconUpload, {
    size: 18
  }), " Daten importieren (JSON)"))), /*#__PURE__*/React.createElement(DepsSection, null), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      if (confirm('Alle Daten unwiderruflich löschen?')) {
        localStorage.removeItem('teamMasterProData');
        if (SP_CONTEXT) {
          try {
            const digest = await spGetDigest(SP_CONTEXT.siteUrl);
            // Legacy monolithic file
            await fetch(`${SP_CONTEXT.siteUrl}/_api/web/GetFileByServerRelativeUrl('${SP_ENC(SP_CONTEXT.stateFilePath)}')/recycle()`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'X-RequestDigest': digest,
                'Accept': 'application/json;odata=verbose'
              }
            }).catch(() => {});
            // New team-split folder
            const dataFolder = SP_CONTEXT.folderPath + '/' + PLANNER_DATA_DIR;
            await fetch(`${SP_CONTEXT.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${SP_ENC(dataFolder)}')/recycle()`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'X-RequestDigest': digest,
                'Accept': 'application/json;odata=verbose'
              }
            }).catch(() => {});
          } catch (e) {}
        }
        window.location.reload();
      }
    },
    className: "w-full mt-8 text-rose-500 hover:bg-rose-50 py-3 rounded-lg text-sm font-medium transition-colors"
  }, "System zur\xFCcksetzen"))));
};