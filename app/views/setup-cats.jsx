const SetupCatsView = ({ s, h }) => {
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
        const COLOR_SWATCHES = [null, ...PROJECT_COLORS.map(c => c.id)];
        const renderSwatch = (colorId) => {
            if (!colorId) return <span className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white inline-block"></span>;
            const c = resolveProjectColor(colorId);
            return <span className={`w-4 h-4 rounded-full ${c.dot} inline-block`}></span>;
        };
        const renderColorPicker = (taskName, metaKey = 'basicTasksMeta') => (
            <div className="flex gap-1 items-center">
                {COLOR_SWATCHES.map((cid, i) => (
                    <button key={i} title={cid || 'Keine Farbe'}
                        onClick={() => setBasicTasksMeta(prev => ({...prev, [taskName]: {...(prev[taskName]||{}), color: cid || undefined}}))}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${(basicTasksMeta[taskName]?.color || null) === cid ? 'border-gea-600 scale-110' : 'border-transparent hover:border-slate-400'} ${cid ? resolveProjectColor(cid).dot : 'bg-white border-slate-300'}`}>
                    </button>
                ))}
            </div>
        );

        return (
            <div className="flex-1 overflow-auto p-8 bg-slate-50">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Basic Tasks */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, basic: !prev.basic}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Basic Tasks</h2>
                            <span className="text-slate-500">{expandedSetupCats.basic ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.basic && (
                            <div>
                                <div className="flex border-b border-slate-200 bg-slate-50">
                                    <button onClick={() => setBasicTasksSubTab('aktiv')} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${basicTasksSubTab === 'aktiv' ? 'border-gea-600 text-gea-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Aktiv</button>
                                    <button onClick={() => setBasicTasksSubTab('inaktiv')} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${basicTasksSubTab === 'inaktiv' ? 'border-gea-600 text-gea-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                        Inaktiv {inactiveBasicTasks.length > 0 && <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">{inactiveBasicTasks.length}</span>}
                                    </button>
                                </div>
                                {basicTasksSubTab === 'aktiv' && (
                                    <ul className="divide-y divide-slate-200">
                                        {basicTasks.filter(t => !basicTasksMeta?.[t]).map(task => (
                                            <li key={task} className="p-4 flex justify-between items-center gap-3 text-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-slate-800 font-medium">{task}</span>
                                                    <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {renderColorPicker(task)}
                                                    <button onClick={() => { setBasicTasks(prev => prev.filter(t => t !== task)); setInactiveBasicTasks(prev => [...prev, { name: task, createdAt: new Date().toISOString() }]); }} className="px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">Set Inactive</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {basicTasksSubTab === 'inaktiv' && (
                                    <div>{inactiveBasicTasks.length === 0 ? <p className="p-6 text-sm text-slate-400 text-center">Keine inaktiven Kategorien</p> :
                                        <ul className="divide-y divide-slate-200">{inactiveBasicTasks.map(task => (
                                            <li key={task.name} className="p-4 flex justify-between items-center text-sm">
                                                <div><span className="text-slate-800">{task.name}</span><span className="ml-2 text-xs text-slate-400">(inaktiv seit {new Date(task.createdAt).toLocaleDateString('de-DE')})</span></div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setBasicTasks(prev => [...prev, task.name]); setBasicTasksMeta(prev => ({...prev, [task.name]: {...(prev[task.name]||{}), createdAt: new Date().toISOString(), permanent: false}})); setInactiveBasicTasks(prev => prev.filter(t => t.name !== task.name)); }} className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100">Reaktivieren</button>
                                                    <button onClick={() => setInactiveBasicTasks(prev => prev.filter(t => t.name !== task.name))} className="px-2.5 py-1 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded hover:bg-rose-100">Löschen</button>
                                                </div>
                                            </li>
                                        ))}</ul>
                                    }</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Other Tasks (user-created) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, other: !prev.other}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Other Tasks <span className="text-sm text-slate-500 font-normal ml-2">(benutzerdefiniert)</span></h2>
                            <span className="text-slate-500">{expandedSetupCats.other ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.other && (
                            <div>
                                <div className="p-4 flex gap-2 border-b border-slate-200">
                                    <input type="text" value={newBasicTask} onChange={e=>setNewBasicTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const t = newBasicTask.trim(); if (t && !basicTasks.includes(t)) { setBasicTasks(prev=>[...prev,t]); setBasicTasksMeta(prev=>({...prev,[t]:{createdAt:new Date().toISOString(),permanent:false}})); setNewBasicTask(''); }}}} placeholder="Neuer Other Task" className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                                    <button onClick={() => { const t=newBasicTask.trim(); if(t&&!basicTasks.includes(t)){setBasicTasks(prev=>[...prev,t]);setBasicTasksMeta(prev=>({...prev,[t]:{createdAt:new Date().toISOString(),permanent:false}}));setNewBasicTask('');} }} className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">Hinzufügen</button>
                                </div>
                                <ul className="divide-y divide-slate-200">
                                    {basicTasks.filter(t => basicTasksMeta?.[t]).map(task => {
                                        const meta = basicTasksMeta[task] || {};
                                        const isPerm = !!meta.permanent;
                                        const weeksLeft = meta.createdAt && !isPerm ? Math.max(0, BASIC_TASK_EXPIRY_WEEKS - Math.floor((Date.now() - new Date(meta.createdAt).getTime()) / (7*24*60*60*1000))) : null;
                                        return (
                                            <li key={task} className="p-4 flex justify-between items-center gap-3 text-sm">
                                                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                                    <span className="text-slate-800 font-medium">{task}</span>
                                                    {isPerm ? (
                                                        <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                                    ) : weeksLeft !== null && (
                                                        <span className="text-xs text-slate-400">(läuft ab in {weeksLeft} Wo.)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {renderColorPicker(task)}
                                                    <button onClick={() => setBasicTasksMeta(prev => ({...prev, [task]: {...(prev[task]||{}), permanent: !isPerm}}))} className={`px-2 py-1 text-xs border rounded flex items-center gap-1 ${isPerm ? 'bg-gea-50 text-gea-700 border-gea-200 hover:bg-gea-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}><IconPin size={10}/>{isPerm ? 'Permanent' : 'Temporär'}</button>
                                                    <button onClick={() => { setBasicTasks(prev => prev.filter(t => t !== task)); setInactiveBasicTasks(prev => [...prev, { name: task, createdAt: meta.createdAt || new Date().toISOString() }]); }} className="px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">Set Inactive</button>
                                                    <button onClick={() => setBasicTasks(basicTasks.filter(t => t !== task))} className="text-rose-500 hover:text-rose-700"><IconX size={14}/></button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {basicTasks.filter(t => basicTasksMeta?.[t]).length === 0 && <li className="p-6 text-sm text-slate-400 text-center">Noch keine benutzerdefinierten Tasks.</li>}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Support Tasks */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, support: !prev.support}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Support</h2>
                            <span className="text-slate-500">{expandedSetupCats.support ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.support && (
                            <ul className="divide-y divide-slate-200">
                                {SUPPORT_TASKS.map(task => {
                                    const isInactive = inactiveSupportTasks.includes(task);
                                    const sc = SUPPORT_CHIP_COLORS[task] || {};
                                    return (
                                        <li key={task} className="p-4 flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full ${sc.dot || 'bg-slate-400'}`}></span>
                                                <span className={`font-medium ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task}</span>
                                                <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {isInactive ? (
                                                    <button onClick={() => setInactiveSupportTasks(prev => prev.filter(t => t !== task))} className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100">Reaktivieren</button>
                                                ) : (
                                                    <button onClick={() => setInactiveSupportTasks(prev => [...prev, task])} className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">Set Inactive</button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Training Tasks */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, training: !prev.training}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Trainings</h2>
                            <span className="text-slate-500">{expandedSetupCats.training ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.training && (
                            <ul className="divide-y divide-slate-200">
                                {TRAINING_TASKS.map(task => {
                                    const isInactive = inactiveTrainingTasks.includes(task);
                                    return (
                                        <li key={task} className="p-4 flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                                                <span className={`font-medium ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task}</span>
                                                <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                            </div>
                                            <div className="flex gap-2">
                                                {isInactive ? (
                                                    <button onClick={() => setInactiveTrainingTasks(prev => prev.filter(t => t !== task))} className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100">Reaktivieren</button>
                                                ) : (
                                                    <button onClick={() => setInactiveTrainingTasks(prev => [...prev, task])} className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">Set Inactive</button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Offtime */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, offtime: !prev.offtime}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Abwesenheiten (Offtime)</h2>
                            <span className="text-slate-500">{expandedSetupCats.offtime ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.offtime && (
                            <div>
                                <div className="p-4 flex gap-2 border-b border-slate-200">
                                    <input type="text" value={newOfftimeTask} onChange={e=>setNewOfftimeTask(e.target.value)} placeholder="Neue Abwesenheitsart" className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                                    <button onClick={() => { if(newOfftimeTask.trim()&&!offtimeTasks.includes(newOfftimeTask.trim())){setOfftimeTasks([...offtimeTasks,newOfftimeTask.trim()]);setNewOfftimeTask('');} }} className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">Hinzufügen</button>
                                </div>
                                <ul className="divide-y divide-slate-200">
                                    {offtimeTasks.map(task => {
                                        const isInactive = (inactiveOfftimeTasks||[]).some(t => t.name === task);
                                        return (
                                            <li key={task} className="p-4 flex justify-between items-center text-sm">
                                                <span className={`${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task}</span>
                                                <div className="flex gap-2">
                                                    {isInactive ? (
                                                        <button onClick={() => setInactiveOfftimeTasks(prev => prev.filter(t => t.name !== task))} className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100">Reaktivieren</button>
                                                    ) : (
                                                        <button onClick={() => setInactiveOfftimeTasks(prev => [...prev, { name: task }])} className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">Set Inactive</button>
                                                    )}
                                                    <button onClick={() => setOfftimeTasks(offtimeTasks.filter(t => t !== task))} className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Mitarbeiter-Kategorien */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, empCats: !prev.empCats}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Mitarbeiter-Kategorien</h2>
                            <span className="text-slate-500">{expandedSetupCats.empCats ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.empCats && (
                            <div>
                                <div className="p-4 flex gap-2 border-b border-slate-200">
                                    <input type="text" value={newEmpCat} onChange={e => setNewEmpCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newEmpCat.trim() && !empCategories.includes(newEmpCat.trim())) { setEmpCategories([...empCategories, newEmpCat.trim()]); setNewEmpCat(''); }}} placeholder="Neue Mitarbeiter-Kategorie" className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                                    <button onClick={() => { if(newEmpCat.trim()&&!empCategories.includes(newEmpCat.trim())){setEmpCategories([...empCategories,newEmpCat.trim()]);setNewEmpCat('');} }} className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">Hinzufügen</button>
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {empCategories.map(cat => (<li key={cat} className="px-4 py-3 flex justify-between items-center text-sm"><span className="text-slate-800">{cat}</span><button onClick={() => setEmpCategories(empCategories.filter(c => c !== cat))} className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button></li>))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Projekt-Kategorien */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <button onClick={() => setExpandedSetupCats(prev => ({...prev, projCats: !prev.projCats}))}
                            className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                            <h2 className="text-lg text-slate-900 font-medium">Projekt-Kategorien</h2>
                            <span className="text-slate-500">{expandedSetupCats.projCats ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                        </button>
                        {expandedSetupCats.projCats && (
                            <div>
                                <div className="p-4 flex gap-2 border-b border-slate-200">
                                    <input type="text" value={newProjCat} onChange={e => setNewProjCat(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newProjCat.trim() && !projCategories.includes(newProjCat.trim())) { setProjCategories([...projCategories, newProjCat.trim()]); setNewProjCat(''); }}} placeholder="Neue Projekt-Kategorie" className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                                    <button onClick={() => { if(newProjCat.trim()&&!projCategories.includes(newProjCat.trim())){setProjCategories([...projCategories,newProjCat.trim()]);setNewProjCat('');} }} className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">Hinzufügen</button>
                                </div>
                                <ul className="divide-y divide-slate-100">
                                    {projCategories.map(cat => (<li key={cat} className="px-4 py-3 flex justify-between items-center text-sm"><span className="text-slate-800">{cat}</span><button onClick={() => setProjCategories(projCategories.filter(c => c !== cat))} className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button></li>))}
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        );
    };

