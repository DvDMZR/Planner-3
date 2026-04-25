const TIMELINE_WEEK_W = 120;   // matches min-w-[120px]
const TIMELINE_STICKY_W = 256; // matches w-64

const TimelineView = ({ s, h }) => {
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
        const [scrollInfo, setScrollInfo] = React.useState({ progress: 0, label: '' });
        // Same horizontal virtualization as resource.jsx: only body cells in
        // the visible range (+ 8-week buffer) get rendered; the header always
        // shows all weeks so column widths stay stable.
        const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 25 });
        const scrollRafRef = React.useRef(null);
        React.useEffect(() => () => {
            if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
        }, []);

        const handleScroll = React.useCallback((e) => {
            if (scrollRafRef.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
            scrollRafRef.current = requestAnimationFrame(() => {
                scrollRafRef.current = null;
                const maxScroll = scrollWidth - clientWidth;
                const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
                const firstIdx = Math.max(0, Math.floor(scrollLeft / TIMELINE_WEEK_W));
                const lastIdx  = Math.min(timelineWeeks.length - 1,
                                 firstIdx + Math.floor((clientWidth - TIMELINE_STICKY_W) / TIMELINE_WEEK_W) - 1);
                const label = timelineWeeks[firstIdx] && timelineWeeks[lastIdx]
                    ? `${timelineWeeks[firstIdx].label} – ${timelineWeeks[lastIdx].label}`
                    : '';
                setScrollInfo({ progress, label });
                const BUFFER = 8;
                const newStart = Math.max(0, firstIdx - BUFFER);
                const newEnd = Math.min(timelineWeeks.length - 1, lastIdx + BUFFER);
                setVisibleRange(prev =>
                    prev.start === newStart && prev.end === newEnd
                        ? prev
                        : { start: newStart, end: newEnd }
                );
            });
        }, [timelineWeeks]);

        const scrollWeeks = (n) =>
            timelineScrollRef.current?.scrollBy({ left: n * TIMELINE_WEEK_W, behavior: 'smooth' });
        const activeProjCategories = projCategoriesFromProjects;
        const currentYear = new Date().getFullYear();
        const currentWeekStr = getWeekString(new Date());

        // Clamp the visible range against the current week list (year switch
        // can shrink it) and derive the slice + colSpan widths used by every
        // body row.
        const safeStart = Math.max(0, Math.min(visibleRange.start, timelineWeeks.length - 1));
        const safeEnd = Math.max(safeStart, Math.min(visibleRange.end, timelineWeeks.length - 1));
        const visibleWeeks = React.useMemo(
            () => timelineWeeks.slice(safeStart, safeEnd + 1),
            [timelineWeeks, safeStart, safeEnd]
        );
        const leftSpacerSpan = safeStart;
        const rightSpacerSpan = Math.max(0, timelineWeeks.length - 1 - safeEnd);

        return (
            <div className="flex-1 flex h-full overflow-hidden bg-white">
                <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <h3 className="text-slate-900 text-lg font-medium">Mitarbeiter (Drag)</h3>
                        <p className="text-xs text-slate-500 mt-1">Zieh Mitarbeiter in den Kalender</p>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {activeEmpCategories.map(category => {
                            const isCollapsed = collapsedCategories[category];
                            const catEmps = activeEmpsByCategory.get(category) || [];
                            
                            return (
                                <div key={category} className="border-b border-slate-200 bg-slate-50/80">
                                    <div 
                                        onClick={() => toggleCategory(category)}
                                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors group"
                                    >
                                        <div className="flex items-center gap-2 text-sm uppercase tracking-wider font-medium text-slate-700">
                                            <span className="text-slate-400 group-hover:text-gea-500 transition-colors">
                                                {isCollapsed ? <IconChevronRight size={16}/> : <IconChevronDown size={16}/>}
                                            </span>
                                            {category}
                                        </div>
                                        <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 font-medium shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                            {catEmps.length}
                                        </span>
                                    </div>
                                    
                                    {!isCollapsed && (
                                        <div className="p-3 pt-0 space-y-2 bg-slate-50">
                                            {catEmps.map(emp => (
                                                <div 
                                                    key={emp.id} 
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('empId', emp.id)}
                                                    className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-gea-300 transition-colors flex items-center gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <div className="text-sm text-slate-900 font-medium truncate">{emp.name}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
                        <h3 className="text-slate-900 text-lg font-medium">Projekt-Planung</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center">
                                <button onClick={() => scrollWeeks(-4)} className="p-1.5 rounded-l bg-gea-100 text-gea-700 hover:bg-gea-200 transition-colors border-r border-gea-200" title="4 Wochen zurück"><IconChevronLeft size={16}/></button>
                                <span className="px-2 text-xs text-slate-500 bg-gea-50 h-[30px] flex items-center min-w-[130px] justify-center border-y border-gea-100 font-mono tabular-nums">{scrollInfo.label || '—'}</span>
                                <button onClick={() => scrollWeeks(4)} className="p-1.5 rounded-r bg-gea-100 text-gea-700 hover:bg-gea-200 transition-colors border-l border-gea-200" title="4 Wochen vor"><IconChevronRight size={16}/></button>
                            </div>
                            <select value={timelineYear} onChange={e => setTimelineYear(Number(e.target.value))}
                                className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-gea-400">
                                {Array.from({length: 7}, (_, i) => currentYear - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <button onClick={() => {
                                if (timelineYear !== currentYear) { setTimelineYear(currentYear); setTimeout(() => scrollToCurrentWeek(timelineScrollRef, 256), 120); }
                                else { scrollToCurrentWeek(timelineScrollRef, 256); }
                            }} className="px-3 py-1.5 bg-gea-100 text-gea-700 rounded-lg text-sm font-medium hover:bg-gea-200 transition-colors">
                                Heute
                            </button>
                            <span className="text-xs text-slate-500">Zieh Mitarbeiter von links in die Kalenderwochen.</span>
                        </div>
                    </div>
                    
                    <div className="h-0.5 bg-slate-100 shrink-0">
                        <div className="h-full bg-gea-400 transition-all duration-150" style={{width: `${scrollInfo.progress * 100}%`}}/>
                    </div>
                    <div ref={timelineScrollRef} className="flex-1 overflow-auto relative outline-none"
                        onScroll={handleScroll}
                        tabIndex={-1}
                        onKeyDown={e => {
                            if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollWeeks(-1); }
                            if (e.key === 'ArrowRight') { e.preventDefault(); scrollWeeks(1); }
                            if (e.key === 'PageUp')     { e.preventDefault(); scrollWeeks(-4); }
                            if (e.key === 'PageDown')   { e.preventDefault(); scrollWeeks(4); }
                        }}>
                        <table className="w-full border-collapse text-sm text-left">
                            <thead className="sticky top-0 bg-white z-20 shadow-sm">
                                <tr>
                                    <th className="p-3 border-b border-r border-slate-200 w-64 bg-slate-50 sticky left-0 z-30 text-slate-600 font-medium">Projekt</th>
                                    {timelineWeeks.map(w => (
                                        <th key={w.id} ref={w.id === currentWeekStr ? currentWeekColRef : null}
                                            className={`p-2 border-b border-r min-w-[120px] text-center font-medium ${w.id === currentWeekStr ? 'bg-gea-100 text-gea-800 border-b-2 border-b-gea-500 border-slate-200' : w.id < currentWeekStr ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            <div>{w.label}</div>
                                            <div className="text-[10px] font-normal opacity-70">{w.sub}</div>
                                            {w.holidays.length > 0 && <div className="text-[9px] font-semibold text-amber-600 leading-tight mt-0.5 truncate" title={w.holidays.join(' · ')}>{w.holidays.join(' · ')}</div>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan={timelineWeeks.length + 1} className="p-8 text-center text-slate-400">
                                            Noch keine Projekte angelegt.
                                        </td>
                                    </tr>
                                ) : activeProjCategories.map(category => {
                                    const isCollapsed = collapsedProjCategories[category];
                                    const catProjects = projectsByCategory.get(category) || [];
                                    if (catProjects.length === 0) return null;

                                    return (
                                        <React.Fragment key={category}>
                                            <tr className="bg-slate-100 border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => toggleProjCategory(category)}>
                                                <td className="p-3 text-slate-900 sticky left-0 z-10 bg-inherit border-r border-slate-200 font-medium">
                                                    <div className="flex items-center gap-2 text-lg">
                                                        {isCollapsed ? <IconChevronRight size={16}/> : <IconChevronDown size={16}/>}
                                                        {category}
                                                    </div>
                                                </td>
                                                {leftSpacerSpan > 0 && <td colSpan={leftSpacerSpan} className="border-r border-slate-200"/>}
                                                {visibleWeeks.map(w => <td key={`header-${category}-${w.id}`} className="border-r border-slate-200"></td>)}
                                                {rightSpacerSpan > 0 && <td colSpan={rightSpacerSpan} className="border-r border-slate-200"/>}
                                            </tr>
                                            
                                            {!isCollapsed && catProjects.map(proj => {
                                                const pColor = resolveProjectColor(proj.color);
                                                return (
                                                <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 border-b border-r border-slate-200 bg-white sticky left-0 z-10">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${pColor.dot}`}></div>
                                                            <div className="text-slate-900 font-medium">{proj.name}</div>
                                                        </div>
                                                    </td>
                                                    {leftSpacerSpan > 0 && <td colSpan={leftSpacerSpan} className="border-b border-r border-slate-300 bg-white"/>}
                                                    {visibleWeeks.map(w => {
                                                        const isProjectActive = w.id >= proj.startWeek && w.id <= proj.ibnWeek;
                                                        const projAss = assignmentsByProjectWeek.get(proj.id + '\u0000' + w.id) || [];
                                                        return (
                                                            <td key={w.id}
                                                                onDragOver={(e) => e.preventDefault()}
                                                                onDrop={(e) => handleDrop(e, w.id, proj.id)}
                                                                className={`p-1 border-b border-r border-slate-300 relative min-w-[120px] align-top transition-colors ${isProjectActive ? 'bg-white hover:bg-slate-50' : 'bg-slate-100 opacity-60'}`}
                                                            >
                                                                <div className="flex flex-col gap-1 min-h-[60px]">
                                                                    {projAss.map(a => {
                                                                        const emp = employeeById.get(a.empId);
                                                                        return (
                                                                            <div key={a.id}
                                                                                onClick={(e) => { e.stopPropagation(); setAssignContext({ empId: a.empId, week: w.id, existing: a }); setIsAssignModalOpen(true); }}
                                                                                className={`text-[10px] px-1.5 py-1 rounded flex justify-between items-center shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${pColor.chip}`}>
                                                                                <span className="truncate font-medium">{emp?.name || 'Unbekannt'}</span>
                                                                                <span className="opacity-90 ml-1 font-medium">{a.hours ?? Math.round((a.percent ?? 100) / 100 * HOURS_PER_WEEK)}h</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                    {rightSpacerSpan > 0 && <td colSpan={rightSpacerSpan} className="border-b border-r border-slate-300 bg-white"/>}
                                                </tr>
                                            );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

