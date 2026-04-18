const UtilizationView = ({ s, h }) => {
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
        const visibleWeeks = weeks.slice(0, weeksAhead);
        const months = [];
        const weeksByMonth = {};

        visibleWeeks.forEach(w => {
            if (!weeksByMonth[w.month]) {
                weeksByMonth[w.month] = [];
                months.push(w.month);
            }
            weeksByMonth[w.month].push(w.id);
        });

        const activeCategories = activeEmpCategories;

        return (
            <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl text-slate-900 font-medium">Auslastung (Heatmap)</h2>
                        <p className="text-sm text-slate-500">Monatsweise Übersicht der durchschnittlichen Kapazitätsauslastung.</p>
                    </div>
                    <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-700 font-medium">Vorschau:</span>
                        <select value={weeksAhead} onChange={e=>setWeeksAhead(Number(e.target.value))} className="p-2 border border-slate-300 rounded text-sm bg-white">
                            <option value={4}>4 Wochen</option>
                            <option value={8}>8 Wochen</option>
                            <option value={12}>12 Wochen</option>
                            <option value={24}>24 Wochen</option>
                            <option value={52}>52 Wochen</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className="p-2 border-b border-slate-200 text-left w-48 text-slate-500 font-medium">Mitarbeiter</th>
                                <th className="p-2 border-b border-slate-200 text-center w-32 text-gea-600 bg-gea-50 rounded-t-lg font-medium">Ø Zeitraum</th>
                                {months.map(m => <th key={m} className="p-2 border-b border-slate-200 text-center text-slate-500 font-medium">{m}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {activeCategories.map(category => {
                                const isCollapsed = collapsedCategories[category];
                                const catEmps = activeEmpsByCategory.get(category) || [];

                                return (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-200/70 border-t-2 border-b border-slate-300 cursor-pointer hover:bg-slate-300/50 transition-colors group" onClick={() => toggleCategory(category)}>
                                            <td className="p-3 text-slate-700 sticky left-0 z-10 bg-inherit border-r border-l-4 border-l-gea-500 border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                                                <div className="flex items-center gap-2 text-sm uppercase tracking-wider font-medium">
                                                    <span className="text-slate-400 group-hover:text-gea-500 transition-colors">
                                                        {isCollapsed ? <IconChevronRight size={16}/> : <IconChevronDown size={16}/>}
                                                    </span>
                                                    {category}
                                                    <span className="ml-auto text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 font-medium">
                                                        {catEmps.length}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="border-b border-slate-300 bg-slate-200/70"></td>
                                            {months.map(m => <td key={`header-${category}-${m}`} className="border-b border-slate-300 bg-slate-200/70"></td>)}
                                        </tr>

                                        {!isCollapsed && catEmps.map(emp => {
                                            let totalPercentAll = 0;
                                            visibleWeeks.forEach(w => {
                                                totalPercentAll += getUtilization(emp.id, w.id).total;
                                            });
                                            const avgAll = visibleWeeks.length === 0 ? 0 : Math.round(totalPercentAll / visibleWeeks.length);

                                            return (
                                                <tr key={emp.id} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                                                    <td className="p-2 text-slate-900 font-medium pl-6">{emp.name}</td>
                                                    
                                                    <td className="p-2 border-r border-slate-300">
                                                        <div className="w-full h-8 rounded flex items-center justify-center text-xs bg-gea-50 text-gea-700 border border-gea-100 font-medium">
                                                            {avgAll}%
                                                        </div>
                                                    </td>

                                                    {months.map(m => {
                                                        const monthWeeks = weeksByMonth[m];
                                                        let monthTotal = 0;
                                                        let hasOfftime = false;

                                                        monthWeeks.forEach(wId => {
                                                            const { total, isOfftime } = getUtilization(emp.id, wId);
                                                            monthTotal += total;
                                                            if (isOfftime) hasOfftime = true;
                                                        });
                                                        
                                                        const avgMonth = monthWeeks.length === 0 ? 0 : Math.round(monthTotal / monthWeeks.length);

                                                        let bgColor = 'bg-slate-50';
                                                        let textColor = 'text-slate-400';

                                                        if (avgMonth === 0 && hasOfftime) { bgColor = 'bg-slate-200'; textColor = 'text-slate-600'; }
                                                        else if (avgMonth >= 100) { bgColor = 'bg-rose-500'; textColor = 'text-white'; }
                                                        else if (avgMonth >= 80) { bgColor = 'bg-amber-400'; textColor = 'text-white'; }
                                                        else if (avgMonth > 0) { bgColor = 'bg-emerald-500'; textColor = 'text-white'; }

                                                        const label = avgMonth > 0 ? `${avgMonth}%` : (hasOfftime ? 'OFF' : '-');

                                                        return (
                                                            <td key={m} className="p-1 border-r border-slate-300 last:border-0">
                                                                <div className={`w-full h-8 rounded flex items-center justify-center text-xs transition-colors ${bgColor} ${textColor} ${hasOfftime && avgMonth === 0 ? 'diagonal-stripes' : ''} font-medium`}>
                                                                    {label}
                                                                </div>
                                                            </td>
                                                        )
                                                    })}
                                                </tr>
                                            )
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };
