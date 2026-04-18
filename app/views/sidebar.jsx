const _SidebarBase = ({ s, h }) => {
    const { activeTab, employees, projects, assignments, expenses, costItems,
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
        currentWeekColRef, resourceScrollRef, timelineScrollRef } = s;
    const { setActiveTab, setEmployees, setProjects, setAssignments,
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
        scrollToCurrentWeek, reconnectSharePoint } = h;
    return (
        <aside className="w-60 bg-gea-900 text-gea-100 flex flex-col h-full shrink-0 shadow-xl">
            <div className="px-6 py-5 flex items-center gap-3 border-b border-gea-700">
                <div className="bg-gea-500 text-white p-2 rounded-lg shadow-sm"><IconBriefcase size={20} /></div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-white text-base tracking-tight font-bold uppercase">GEA</h1>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setIsChangelogOpen(true)} className="flex items-center gap-1.5 text-gea-300 hover:text-white transition-colors group">
                            <span className="text-xs font-medium">Einsatzplanung v0.6.6</span>
                            <span className="bg-gea-700 group-hover:bg-gea-600 text-gea-300 group-hover:text-white text-xs px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"><IconHistory size={12}/></span>
                        </button>
                    </div>
                </div>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-3">
                <div className="text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-4 font-semibold">Planung</div>
                <button onClick={() => { setActiveTab('resource'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'resource' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconUsers size={18}/> Ressourcen</button>
                <button onClick={() => { setActiveTab('project'); setSelectedProject(projects[0]); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'project' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconBriefcase size={18}/> Projekte</button>
                <button onClick={() => { setActiveTab('utilization'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'utilization' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconBarChart size={18}/> Auslastung</button>
                <button onClick={() => { setActiveTab('overview'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'overview' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconTable size={18}/> Übersicht</button>

                <div className="text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-8 font-semibold">Verwaltung</div>
                <button onClick={() => { setActiveTab('setup_emp'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'setup_emp' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconUsers size={18}/> Mitarbeiter</button>
                <button onClick={() => { setActiveTab('setup_proj'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'setup_proj' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconBriefcase size={18}/> Projekte</button>
                <button onClick={() => { setActiveTab('setup_cats'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'setup_cats' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconList size={18}/> Kategorien</button>
                <button onClick={() => { setActiveTab('data'); setSelectedProjectDetails(null); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === 'data' ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}><IconSettings size={18}/> System & Export</button>
            </nav>
            {(SP_CONTEXT || fsStatus === 'connected') && (
                <div className="px-4 py-3 border-t border-gea-700 flex items-center gap-2 shrink-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                        syncStatus === 'idle'         ? 'bg-emerald-400' :
                        syncStatus === 'syncing'      ? 'bg-amber-400 animate-pulse' :
                        syncStatus === 'updated'      ? 'bg-blue-400' :
                        syncStatus === 'reconnecting' ? 'bg-amber-400 animate-pulse' :
                        syncStatus === 'needs-auth'   ? 'bg-rose-500' :
                        syncStatus === 'offline'      ? 'bg-rose-500' :
                                                       'bg-amber-400 animate-pulse'
                    }`}/>
                    {syncStatus === 'needs-auth' ? (
                        <button
                            type="button"
                            onClick={reconnectSharePoint}
                            className="text-rose-300 hover:text-rose-200 text-xs truncate underline decoration-dotted"
                            title="Sitzung bei SharePoint ist abgelaufen – hier klicken um sich neu anzumelden"
                        >
                            Sitzung abgelaufen – neu verbinden
                        </button>
                    ) : (
                        <span className="text-gea-400 text-xs truncate">
                            {syncStatus === 'idle'         ? 'Synchronisiert' :
                             syncStatus === 'syncing'      ? 'Speichert ...' :
                             syncStatus === 'updated'      ? 'Aktualisiert ✓' :
                             syncStatus === 'reconnecting' ? 'Sitzung erneuern ...' :
                             syncStatus === 'offline'      ? 'Offline – lokal' :
                                                            'Verbindet ...'}
                        </span>
                    )}
                </div>
            )}
        </aside>
    );
};

// Only re-render when sidebar-visible state actually changes (not on every
// background poll that touches employees/projects/assignments).
const SidebarView = React.memo(_SidebarBase, (prev, next) =>
    prev.s.activeTab    === next.s.activeTab    &&
    prev.s.syncStatus   === next.s.syncStatus   &&
    prev.s.fsStatus     === next.s.fsStatus     &&
    prev.s.projects     === next.s.projects       // needed for onClick: setSelectedProject(projects[0])
);
