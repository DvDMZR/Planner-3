const SetupProjView = ({ s, h }) => {
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
        scrollToCurrentWeek } = h;
        if (selectedProjectDetails) {
            return <ProjectDetailsView s={s} h={h}/>;
        }

        const handleEditProject = (p) => {
            setProjForm({ name: p.name, category: p.category || projCategories[0] || '', projectNumber: p.projectNumber || '', address: p.address || '', country: p.country || '', startWeek: p.startWeek, ibnWeek: p.ibnWeek, color: resolveProjectColor(p.color).id });
            setEditingProjectId(p.id);
            setIsProjFormOpen(true);
        };

        const now = getWeekString(new Date());
        const byStartWeek = (a, b) => (a.startWeek || '').localeCompare(b.startWeek || '');
        const activeProjects = projects.filter(p => p.ibnWeek >= now).slice().sort(byStartWeek);
        const pastProjects = projects.filter(p => p.ibnWeek < now).slice().sort(byStartWeek);
        const activeCats = [...new Set(activeProjects.map(p => p.category))];

        const ProjectRow = ({ p }) => {
            const effStatus = computeAutoStatus(p);
            const cc = resolveCountryCode(p.country);
            return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <button onClick={() => setSelectedProjectDetails(p.id)}
                            className="flex items-center gap-2 text-left group">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${resolveProjectColor(p.color).dot}`}></div>
                            <span className="text-slate-900 font-medium group-hover:text-gea-600 transition-colors">{p.name}</span>
                        </button>
                    </td>
                    <td className="p-4">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${cc === '??' ? 'bg-rose-50 border-rose-200 text-rose-600' : cc === '/' ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`} title="Land">{cc}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-xs">{p.projectNumber || '–'}</td>
                    <td className="p-4"><StatusBadge status={effStatus}/></td>
                    <td className="p-4 text-slate-600 text-xs">{p.startWeek} – {p.ibnWeek}</td>
                    <td className="p-4 text-right">
                        <div className="flex justify-end gap-3">
                            <button onClick={() => handleEditProject(p)} className="text-gea-600 text-xs font-medium hover:text-gea-700">Bearbeiten</button>
                            <button onClick={() => {
                                const assCount = (assignmentsByProject.get(p.id) || []).length;
                                const msg = assCount > 0
                                    ? `Projekt „${p.name}" wirklich löschen?\n\n${assCount} Einsatz-Planung(en) werden ebenfalls gelöscht.`
                                    : `Projekt „${p.name}" wirklich löschen?`;
                                if (window.confirm(msg)) {
                                    setProjects(projects.filter(x => x.id !== p.id));
                                    setAssignments(assignments.filter(a => a.reference !== p.id));
                                }
                            }} className="text-rose-600 text-xs font-medium hover:text-rose-700">Löschen</button>
                        </div>
                    </td>
                </tr>
            );
        };

        return (
            <div className="flex-1 overflow-auto p-8 bg-slate-50">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl text-gea-800 font-semibold">Projekte</h2>
                        <button
                            onClick={() => {
                                setEditingProjectId(null);
                                setProjForm({ name: '', category: projCategories[0] || '', projectNumber: '', address: '', country: '', startWeek: weeks[0]?.id || '', ibnWeek: weeks[10]?.id || '', color: PROJECT_COLORS[projects.length % PROJECT_COLORS.length].id });
                                setIsProjFormOpen(true);
                            }}
                            className="flex items-center gap-2 bg-gea-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors shadow-sm">
                            <IconPlus size={16}/> Neues Projekt
                        </button>
                    </div>

                    {/* Active projects by category */}
                    {activeCats.length === 0 && activeProjects.length === 0 && (
                        <div className="text-center text-slate-400 text-sm py-8">Noch keine aktiven Projekte.</div>
                    )}
                    {activeCats.map(cat => {
                        const catProjs = activeProjects.filter(p => p.category === cat);
                        const isCollapsed = collapsedProjCategories[cat];
                        return (
                            <div key={cat} className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                                <button onClick={() => toggleProjCategory(cat)}
                                    className="w-full p-4 bg-gea-50 border-b border-gea-200 flex items-center gap-3 hover:bg-gea-100 transition-colors">
                                    <span className="text-gea-500">{isCollapsed ? <IconChevronRight size={18}/> : <IconChevronDown size={18}/>}</span>
                                    <span className="text-gea-900 font-semibold text-lg">{cat}</span>
                                    <span className="ml-2 px-2 py-0.5 bg-white border border-gea-200 rounded-full text-xs text-gea-700 font-semibold">{catProjs.length}</span>
                                </button>
                                {!isCollapsed && (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="p-4 text-slate-700 font-semibold">Name</th>
                                                <th className="p-4 text-slate-700 font-semibold">Land</th>
                                                <th className="p-4 text-slate-700 font-semibold">Nr.</th>
                                                <th className="p-4 text-slate-700 font-semibold">Status</th>
                                                <th className="p-4 text-slate-700 font-semibold">Zeitraum</th>
                                                <th className="p-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {catProjs.map(p => <ProjectRow key={p.id} p={p}/>)}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        );
                    })}

                    {/* Past projects */}
                    {pastProjects.length > 0 && (
                        <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                            <button onClick={() => setPastProjectsExpanded(e => !e)}
                                className="w-full p-4 bg-slate-100 border-b border-slate-300 flex items-center gap-3 hover:bg-slate-200 transition-colors">
                                <span className="text-slate-500">{pastProjectsExpanded ? <IconChevronDown size={18}/> : <IconChevronRight size={18}/>}</span>
                                <span className="text-slate-700 font-semibold">Vergangene Projekte</span>
                                <span className="ml-2 px-2 py-0.5 bg-white border border-slate-300 rounded-full text-xs text-slate-600 font-semibold">{pastProjects.length}</span>
                            </button>
                            {pastProjectsExpanded && (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 text-slate-700 font-semibold">Name</th>
                                            <th className="p-4 text-slate-700 font-semibold">Land</th>
                                            <th className="p-4 text-slate-700 font-semibold">Nr.</th>
                                            <th className="p-4 text-slate-700 font-semibold">Status</th>
                                            <th className="p-4 text-slate-700 font-semibold">Zeitraum</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 opacity-75">
                                        {pastProjects.map(p => <ProjectRow key={p.id} p={p}/>)}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

