const STATUS_ORDER = { active: 0, missing_costs: 1, planned: 2, completed: 3, costs_submitted: 4 };

const OverviewView = ({ s, h }) => {
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
        const fmt = n => n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const currentWeekStr = getWeekString(new Date());
        const activeEmps = activeEmployees;
        const activeProjects = React.useMemo(
            () => projects.filter(p => computeAutoStatus(p) === 'active').length,
            [projects, computeAutoStatus]
        );
        const { avgUtil, overbookedCount } = React.useMemo(() => {
            const utils = activeEmps.map(e => getUtilization(e.id, currentWeekStr).total);
            const avg = activeEmps.length > 0 ? Math.round(utils.reduce((a, b) => a + b, 0) / activeEmps.length) : 0;
            return { avgUtil: avg, overbookedCount: utils.filter(u => u > 100).length };
        }, [activeEmps, getUtilization, currentWeekStr]);

        const rows = React.useMemo(() => projects.filter(p => ['active', 'planned'].includes(computeAutoStatus(p))).map(p => {
            const projAss = assignmentsByProject.get(p.id) || [];
            let totalHours = 0, totalLaborCost = 0;
            for (let i = 0; i < projAss.length; i++) {
                const a = projAss[i];
                if (a.type !== 'project') continue;
                const h = a.hours ?? ((a.percent ?? 100) / 100 * HOURS_PER_WEEK);
                totalHours += h;
                if (p.billable !== false) totalLaborCost += h * (p.hourlyRate ?? DEFAULT_HOURLY_RATE);
            }
            const projCosts = costItemsByProject.get(p.id) || [];
            let zusatzkosten = 0;
            for (let i = 0; i < projCosts.length; i++) zusatzkosten += projCosts[i].amount || 0;
            return { p, totalHours, totalLaborCost, zusatzkosten, gesamtkosten: totalLaborCost + zusatzkosten };
        }).sort((a, b) =>
            (STATUS_ORDER[computeAutoStatus(a.p)] ?? 5) - (STATUS_ORDER[computeAutoStatus(b.p)] ?? 5)
        ), [projects, computeAutoStatus, assignmentsByProject, costItemsByProject]);

        const totalGesamtkosten = rows.reduce((acc, r) => acc + r.gesamtkosten, 0);
        const totalHoursAll = rows.reduce((acc, r) => acc + r.totalHours, 0);

        return (
            <div className="flex-1 overflow-auto p-8 bg-slate-50">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-300 border-l-4 border-l-gea-500 rounded-xl p-5 shadow-md">
                            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Aktive Projekte</p>
                            <p className="text-3xl font-bold text-gea-700 mt-1">{activeProjects}</p>
                            <p className="text-xs text-slate-500 mt-1">von {projects.length} gesamt (ohne abgeschl.)</p>
                        </div>
                        <div className="bg-white border border-slate-300 border-l-4 border-l-gea-400 rounded-xl p-5 shadow-md">
                            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Mitarbeiter</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{activeEmps.length}</p>
                            <p className="text-xs text-slate-500 mt-1">aktiv</p>
                        </div>
                        <div className={`bg-white border border-l-4 rounded-xl p-5 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${avgUtil >= 100 ? 'border-rose-300 border-l-rose-500' : avgUtil >= 80 ? 'border-amber-300 border-l-amber-500' : 'border-slate-300 border-l-emerald-500'}`}
                            onClick={() => { setActiveTab('resource'); setTimeout(() => scrollToCurrentWeek(resourceScrollRef, 288), 120); }}
                            title="Zur Ressourcenansicht – aktuelle KW">
                            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Ø Auslastung diese KW</p>
                            <p className={`text-3xl font-bold mt-1 ${avgUtil >= 100 ? 'text-rose-600' : avgUtil >= 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{avgUtil}%</p>
                            <p className="text-xs text-slate-500 mt-1">{currentWeekStr}</p>
                        </div>
                        <div className={`bg-white border border-l-4 rounded-xl p-5 shadow-md cursor-pointer hover:shadow-lg transition-shadow ${overbookedCount > 0 ? 'border-rose-300 border-l-rose-500' : 'border-slate-300 border-l-slate-400'}`}
                            onClick={() => { setActiveTab('resource'); setTimeout(() => scrollToCurrentWeek(resourceScrollRef, 288), 120); }}
                            title="Zur Ressourcenansicht – aktuelle KW">
                            <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide">Überlastet diese KW</p>
                            <p className={`text-3xl font-bold mt-1 ${overbookedCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{overbookedCount}</p>
                            <p className="text-xs text-slate-500 mt-1">{overbookedCount > 0 ? 'Mitarbeiter >100%' : 'Alles im Rahmen'}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl text-gea-800 font-semibold">Projektübersicht</h2>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{rows.length} offene / geplante Projekte</span>
                            <span className="text-slate-300">|</span>
                            <span>{fmt(totalHoursAll)} h gesamt</span>
                            <span className="text-slate-300">|</span>
                            <span className="font-medium text-slate-700">{fmt(totalGesamtkosten)} € gesamt</span>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gea-50 border-b-2 border-gea-200">
                                <tr>
                                    <th className="p-4 text-gea-800 font-semibold">Projekt</th>
                                    <th className="p-4 text-gea-800 font-semibold">Status</th>
                                    <th className="p-4 text-gea-800 font-semibold">IBN</th>
                                    <th className="p-4 text-gea-800 font-semibold text-right">Stunden</th>
                                    <th className="p-4 text-gea-800 font-semibold text-right">Lohnkosten</th>
                                    <th className="p-4 text-gea-800 font-semibold text-right">Zusatzkosten</th>
                                    <th className="p-4 text-gea-800 font-semibold text-right">Gesamt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {rows.map(({ p, totalHours, totalLaborCost, zusatzkosten, gesamtkosten }) => (
                                    <tr key={p.id} className="hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => { setSelectedProjectDetails(p.id); setActiveTab('setup_proj'); }}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${resolveProjectColor(p.color).dot}`}></div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{p.name}</div>
                                                    <div className="text-xs text-slate-400 font-mono">{p.projectNumber || '–'} · {p.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4"><StatusBadge status={computeAutoStatus(p)}/></td>
                                        <td className="p-4 text-slate-500 text-xs font-mono">{p.ibnWeek || '–'}</td>
                                        <td className="p-4 text-right text-slate-700 tabular-nums">{fmt(totalHours)} h</td>
                                        <td className="p-4 text-right text-slate-700 tabular-nums">
                                            {p.billable !== false ? `${fmt(totalLaborCost)} €` : <span className="text-slate-400 text-xs">–</span>}
                                        </td>
                                        <td className="p-4 text-right text-slate-700 tabular-nums">
                                            {zusatzkosten > 0 ? `${fmt(zusatzkosten)} €` : <span className="text-slate-400">–</span>}
                                        </td>
                                        <td className="p-4 text-right font-semibold text-slate-900 tabular-nums">
                                            {gesamtkosten > 0 ? `${fmt(gesamtkosten)} €` : <span className="text-slate-400 font-normal">–</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot className="border-t-2 border-gea-200 bg-gea-50">
                                    <tr>
                                        <td className="p-4 text-gea-800 font-semibold text-sm" colSpan={4}>Gesamt</td>
                                        <td className="p-4 text-right font-semibold text-slate-900 tabular-nums">{fmt(totalHoursAll)} h</td>
                                        <td className="p-4 text-right font-semibold text-slate-900 tabular-nums">{fmt(rows.reduce((a,r)=>a+r.totalLaborCost,0))} €</td>
                                        <td className="p-4 text-right font-semibold text-slate-900 tabular-nums">{fmt(rows.reduce((a,r)=>a+r.zusatzkosten,0))} €</td>
                                        <td className="p-4 text-right font-bold text-gea-700 tabular-nums">{fmt(totalGesamtkosten)} €</td>
                                    </tr>
                                </tfoot>
                            )}
                            {rows.length === 0 && (
                                <tbody><tr><td colSpan={8} className="text-center text-slate-400 text-sm py-12">Keine Projekte vorhanden.</td></tr></tbody>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        );
    };

