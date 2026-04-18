const SetupEmpView = ({ s, h }) => {
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
        const handleSaveEmp = () => {
            if(!empForm.name.trim()) return;
            const wh = Math.max(1, parseInt(empForm.weeklyHours) || HOURS_PER_WEEK);
            if (editingEmpId) {
                setEmployees(employees.map(e => e.id === editingEmpId ? { ...e, name: empForm.name, category: empForm.category, weeklyHours: wh } : e));
                setEditingEmpId(null);
            } else {
                setEmployees([...employees, { id: makeId('emp'), name: empForm.name, category: empForm.category, weeklyHours: wh, active: true }]);
            }
            setEmpForm({name: '', category: empCategories[0] || '', weeklyHours: HOURS_PER_WEEK});
        };

        const handleEditEmp = (e) => {
            setEmpForm({ name: e.name, category: e.category, weeklyHours: e.weeklyHours ?? HOURS_PER_WEEK });
            setEditingEmpId(e.id);
        };

        const cancelEditEmp = () => {
            setEditingEmpId(null);
            setEmpForm({name: '', category: empCategories[0] || '', weeklyHours: HOURS_PER_WEEK});
        };

        return (
            <div className="flex-1 overflow-auto p-8 bg-slate-50">
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-xl text-slate-900 font-medium">Mitarbeiterverwaltung</h2>
                        </div>
                        <div className="p-6 flex gap-4 items-end bg-white">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-500 mb-1 font-medium">Name</label>
                                <input type="text" value={empForm.name} onChange={e=>setEmpForm({...empForm, name: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm"/>
                            </div>
                            <div className="w-44">
                                <label className="block text-xs text-slate-500 mb-1 font-medium">Kategorie</label>
                                <select value={empForm.category} onChange={e=>setEmpForm({...empForm, category: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm">
                                    {empCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="w-36">
                                <label className="block text-xs text-slate-500 mb-1 font-medium">Std./Woche</label>
                                <input type="number" min="1" max="80" value={empForm.weeklyHours} onChange={e=>setEmpForm({...empForm, weeklyHours: e.target.value})} className="w-full p-2 border border-slate-300 rounded text-sm"/>
                            </div>
                            <div className="flex gap-2">
                                {editingEmpId && (
                                    <button 
                                        onClick={cancelEditEmp}
                                        className="bg-slate-200 text-slate-600 px-4 py-2 rounded text-sm hover:bg-slate-300 h-[38px] font-medium transition-colors">
                                        Abbruch
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveEmp}
                                    className="bg-gea-600 text-white px-4 py-2 rounded text-sm hover:bg-gea-700 h-[38px] font-medium transition-colors">
                                    {editingEmpId ? 'Speichern' : 'Hinzufügen'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {empCategories.map(category => {
                            const isCollapsed = collapsedEmpSetup[category];
                            const catEmps = employees.filter(e => e.category === category);

                            return (
                                <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <button
                                        onClick={() => toggleEmpSetup(category)}
                                        className="w-full p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2 hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-slate-500">
                                            {isCollapsed ? <IconChevronRight size={20}/> : <IconChevronDown size={20}/>}
                                        </span>
                                        <h3 className="text-lg text-slate-900 font-medium">{category}</h3>
                                        <span className="ml-2 px-2 py-0.5 bg-white border border-slate-200 rounded-full text-xs text-slate-500 font-medium">
                                            {catEmps.length}
                                        </span>
                                    </button>

                                    {!isCollapsed && (
                                        catEmps.length > 0 ? (
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50/50">
                                                    <tr>
                                                        <th className="p-4 text-slate-500 font-medium">Name</th>
                                                        <th className="p-4 text-slate-500 font-medium text-center">Std./Woche</th>
                                                        <th className="p-4 text-slate-500 font-medium">Status</th>
                                                        <th className="p-4"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-300">
                                                    {catEmps.map(e => (
                                                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 text-slate-900 font-medium">{e.name}</td>
                                                            <td className="p-4 text-center">
                                                                <span className="text-sm font-medium text-slate-700">{e.weeklyHours ?? HOURS_PER_WEEK}h</span>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-2 py-1 rounded text-xs font-medium ${e.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                                                    {e.active ? 'Aktiv' : 'Inaktiv'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right flex justify-end gap-3">
                                                                <button onClick={() => handleEditEmp(e)} className="text-gea-600 text-xs font-medium hover:text-gea-700">Bearbeiten</button>
                                                                <button onClick={() => setEmployees(employees.map(x => x.id === e.id ? {...x, active: !x.active} : x))} className="text-gea-600 text-xs font-medium hover:text-gea-700">Toggle Status</button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-4 text-sm text-slate-400 text-center bg-white">
                                                Keine Mitarbeiter in dieser Kategorie.
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };
