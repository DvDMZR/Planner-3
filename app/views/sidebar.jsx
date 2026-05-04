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
        supportEmpsByCategory, supportEmpCategories, hasSupportEmployees,
        projectsByCategory, projCategoriesFromProjects, timelineWeeks,
        currentWeekColRef, resourceScrollRef, timelineScrollRef,
        currentUser, appUsers } = s;
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
        scrollToCurrentWeek, reconnectSharePoint,
        loginUser, logoutUser, setIsLoginModalOpen } = h;

    const isActive = !!currentUser;
    const isAdmin = currentUser?.role === 'admin';

    // Helper: locked tab button for passive users
    const lockedTabBtn = (label, icon) => (
        <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gea-600 opacity-50 cursor-not-allowed select-none">
            {icon} {label}
            <IconLock size={13} className="ml-auto shrink-0"/>
        </div>
    );

    // Helper: normal tab button
    const tabBtn = (tab, label, icon, onClick) => (
        <button
            onClick={onClick || (() => { setActiveTab(tab); setSelectedProjectDetails(null); })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${activeTab === tab ? 'bg-gea-600 text-white shadow-sm' : 'text-gea-300 hover:bg-gea-800 hover:text-white'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <aside className="w-60 bg-gea-900 text-gea-100 flex flex-col h-full shrink-0 shadow-xl">
            <div className="px-6 py-5 flex items-center gap-3 border-b border-gea-700">
                <div className="bg-gea-500 text-white p-2 rounded-lg shadow-sm"><IconBriefcase size={20} /></div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-white text-base tracking-tight font-bold uppercase">GEA</h1>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setIsChangelogOpen(true)} className="flex items-center gap-1.5 text-gea-300 hover:text-white transition-colors group">
                            <span className="text-xs font-medium">Einsatzplanung v0.8</span>
                            <span className="changelog-glow bg-gea-700 group-hover:bg-gea-600 text-gea-300 group-hover:text-white text-xs px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"><IconHistory size={12}/></span>
                        </button>
                    </div>
                </div>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
                <div className="text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-4 font-semibold">Planung</div>
                {tabBtn('resource', 'Ressourcen', <IconUsers size={18}/>)}
                {tabBtn('project', 'Projekte', <IconGanttChart size={18}/>, () => { setActiveTab('project'); setSelectedProject(projects[0]); setSelectedProjectDetails(null); })}
                {hasSupportEmployees && tabBtn('support', 'Support', <IconLifebuoy size={18}/>)}
                {isActive
                    ? tabBtn('utilization', 'Auslastung', <IconBarChart size={18}/>)
                    : lockedTabBtn('Auslastung', <IconBarChart size={18}/>)
                }
                {tabBtn('overview', 'Übersicht', <IconTable size={18}/>)}

                <div className="text-xs text-gea-500 uppercase tracking-wider mb-2 px-3 mt-8 font-semibold">Verwaltung</div>
                {isActive ? (
                    <>
                        {tabBtn('setup_emp',  'Mitarbeiter',    <IconUser size={18}/>)}
                        {tabBtn('setup_proj', 'Projekte',       <IconBriefcase size={18}/>)}
                        {tabBtn('setup_cats', 'Kategorien',     <IconTag size={18}/>)}
                        {tabBtn('data',       'System & Export',<IconSettings size={18}/>)}
                        {tabBtn('audit',      'Verlauf',        <IconHistory size={18}/>)}
                        {isAdmin && tabBtn('setup_users', 'Benutzer', <IconShield size={18}/>)}
                    </>
                ) : (
                    <>
                        {lockedTabBtn('Mitarbeiter',     <IconUser size={18}/>)}
                        {lockedTabBtn('Projekte',        <IconBriefcase size={18}/>)}
                        {lockedTabBtn('Kategorien',      <IconTag size={18}/>)}
                        {lockedTabBtn('System & Export', <IconSettings size={18}/>)}
                        {lockedTabBtn('Verlauf',         <IconHistory size={18}/>)}
                    </>
                )}
            </nav>

            {/* Login / Logout area */}
            <div className="px-4 py-3 border-t border-gea-700 shrink-0">
                {isActive ? (
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isAdmin ? 'bg-gea-500 text-white' : 'bg-gea-700 text-gea-200'}`}>
                            {currentUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-gea-200 text-xs font-medium truncate block">{currentUser.name}</span>
                            <span className="text-gea-500 text-xs">{isAdmin ? 'Administrator' : 'Aktiver Nutzer'}</span>
                        </div>
                        <button
                            onClick={logoutUser}
                            title="Abmelden"
                            className="text-gea-400 hover:text-white p-1 rounded hover:bg-gea-700 transition-colors shrink-0"
                        >
                            <IconLogOut size={15}/>
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="w-full flex items-center gap-2 text-gea-400 hover:text-white text-xs px-2 py-1.5 rounded hover:bg-gea-800 transition-colors"
                    >
                        <IconLogIn size={15}/> Anmelden
                    </button>
                )}
            </div>

            {(SP_CONTEXT || fsStatus === 'connected') && (
                <div className="px-4 py-3 border-t border-gea-700 flex items-center gap-2 shrink-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                        syncStatus === 'idle'            ? 'bg-emerald-400' :
                        syncStatus === 'syncing'         ? 'bg-amber-400 animate-pulse' :
                        syncStatus === 'updated'         ? 'bg-blue-400' :
                        syncStatus === 'conflict-reload' ? 'bg-orange-400' :
                        syncStatus === 'reconnecting'    ? 'bg-amber-400 animate-pulse' :
                        syncStatus === 'needs-auth'      ? 'bg-rose-500' :
                        syncStatus === 'offline'         ? 'bg-rose-500' :
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
                            {syncStatus === 'idle'            ? 'Synchronisiert' :
                             syncStatus === 'syncing'         ? 'Speichert ...' :
                             syncStatus === 'updated'         ? 'Aktualisiert ✓' :
                             syncStatus === 'conflict-reload' ? 'Änderung eines Kollegen übernommen' :
                             syncStatus === 'reconnecting'    ? 'Sitzung erneuern ...' :
                             syncStatus === 'offline'         ? 'Offline – lokal' :
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
    prev.s.activeTab            === next.s.activeTab          &&
    prev.s.syncStatus           === next.s.syncStatus         &&
    prev.s.fsStatus             === next.s.fsStatus           &&
    prev.s.projects             === next.s.projects           && // needed for onClick: setSelectedProject(projects[0])
    prev.s.hasSupportEmployees  === next.s.hasSupportEmployees &&
    prev.s.currentUser          === next.s.currentUser           // login/logout
);
