const SetupCatsView = ({ s, h }) => {
    const { useState } = React;
    const {
        empCategories, projCategories, basicTasks, basicTasksMeta,
        inactiveBasicTasks, offtimeTasks, inactiveOfftimeTasks,
        inactiveSupportTasks, inactiveTrainingTasks, customTrainingTasks,
        expandedSetupCats, newEmpCat, newProjCat, newBasicTask, newOfftimeTask,
    } = s;
    const {
        setEmpCategories, setProjCategories, setBasicTasks, setBasicTasksMeta,
        setInactiveBasicTasks, setOfftimeTasks, setInactiveOfftimeTasks,
        setInactiveSupportTasks, setInactiveTrainingTasks, setCustomTrainingTasks,
        setExpandedSetupCats, setNewEmpCat, setNewProjCat, setNewBasicTask, setNewOfftimeTask,
    } = h;

    const [newTrainingTask, setNewTrainingTask] = useState('');
    const [inactiveOpen, setInactiveOpen] = useState(false);

    const COLOR_SWATCHES = [null, ...PROJECT_COLORS.map(c => c.id)];
    const renderSwatch = (colorId) => {
        if (!colorId) return <span className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white inline-block"></span>;
        const c = resolveProjectColor(colorId);
        return <span className={`w-4 h-4 rounded-full ${c.dot} inline-block`}></span>;
    };
    const renderColorPicker = (taskName) => (
        <div className="flex gap-1 items-center">
            {COLOR_SWATCHES.map((cid, i) => (
                <button key={i} title={cid || 'Keine Farbe'}
                    onClick={() => setBasicTasksMeta(prev => ({...prev, [taskName]: {...(prev[taskName]||{}), color: cid || undefined}}))}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${(basicTasksMeta[taskName]?.color || null) === cid ? 'border-gea-600 scale-110' : 'border-transparent hover:border-slate-400'} ${cid ? resolveProjectColor(cid).dot : 'bg-white border-slate-300'}`}>
                </button>
            ))}
        </div>
    );

    const addBasicTask = () => {
        const t = newBasicTask.trim();
        if (!t) return;
        if (basicTasks.includes(t)) return;
        setBasicTasks(prev => [...prev, t]);
        setBasicTasksMeta(prev => ({...prev, [t]: { createdAt: new Date().toISOString(), permanent: true }}));
        setNewBasicTask('');
    };

    const setBasicInactive = (task) => {
        const meta = basicTasksMeta?.[task];
        setBasicTasks(prev => prev.filter(t => t !== task));
        setInactiveBasicTasks(prev => [...prev, { name: task, createdAt: meta?.createdAt || new Date().toISOString() }]);
    };

    const reactivateBasic = (item) => {
        setBasicTasks(prev => [...prev, item.name]);
        setBasicTasksMeta(prev => ({...prev, [item.name]: {...(prev[item.name]||{}), createdAt: item.createdAt || new Date().toISOString()}}));
        setInactiveBasicTasks(prev => prev.filter(t => t.name !== item.name));
    };

    // Aggregate count for all inactive items
    const totalInactive = inactiveBasicTasks.length
        + (inactiveOfftimeTasks||[]).length
        + (inactiveSupportTasks||[]).length
        + (inactiveTrainingTasks||[]).length;

    const section = (key, title, children) => (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <button onClick={() => setExpandedSetupCats(prev => ({...prev, [key]: !prev[key]}))}
                className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                <h2 className="text-lg text-slate-900 font-medium">{title}</h2>
                <span className="text-slate-500">{expandedSetupCats[key] ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
            </button>
            {expandedSetupCats[key] && children}
        </div>
    );

    return (
        <div className="flex-1 overflow-auto p-8 bg-slate-50">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Basic Tasks ─────────────────────────────────────── */}
                {section('basic', 'Basic Tasks', (
                    <div>
                        <div className="p-4 flex gap-2 border-b border-slate-200">
                            <input type="text" value={newBasicTask}
                                onChange={e => setNewBasicTask(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addBasicTask()}
                                placeholder="Neuer Basic Task"
                                className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                            <button onClick={addBasicTask}
                                className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">
                                Hinzufügen
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-200">
                            {basicTasks.map(task => {
                                const meta = basicTasksMeta?.[task];
                                const isUserCreated = !!meta;
                                const isPerm = !meta || meta.permanent !== false;
                                const weeksLeft = meta && !isPerm
                                    ? Math.max(0, BASIC_TASK_EXPIRY_WEEKS - Math.floor((Date.now() - new Date(meta.createdAt).getTime()) / (7*24*60*60*1000)))
                                    : null;
                                return (
                                    <li key={task} className="p-4 flex justify-between items-center gap-3 text-sm">
                                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                            <span className="text-slate-800 font-medium">{task}</span>
                                            {isPerm
                                                ? <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                                : weeksLeft !== null && <span className="text-xs text-slate-400">(läuft ab in {weeksLeft} Wo.)</span>
                                            }
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {renderColorPicker(task)}
                                            {isUserCreated && (
                                                <button
                                                    onClick={() => setBasicTasksMeta(prev => ({...prev, [task]: {...(prev[task]||{}), permanent: !isPerm}}))}
                                                    className={`px-2 py-1 text-xs border rounded flex items-center gap-1 ${isPerm ? 'bg-gea-50 text-gea-700 border-gea-200 hover:bg-gea-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                                                    <IconPin size={10}/>{isPerm ? 'Permanent' : 'Temporär'}
                                                </button>
                                            )}
                                            <button onClick={() => setBasicInactive(task)}
                                                className="px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">
                                                Inaktiv setzen
                                            </button>
                                            {isUserCreated && !isPerm && (
                                                <button onClick={() => { setBasicTasks(prev => prev.filter(t => t !== task)); setBasicTasksMeta(prev => { const n = {...prev}; delete n[task]; return n; }); }}
                                                    className="text-rose-500 hover:text-rose-700">
                                                    <IconX size={14}/>
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                            {basicTasks.length === 0 && <li className="p-6 text-sm text-slate-400 text-center">Keine aktiven Basic Tasks.</li>}
                        </ul>
                    </div>
                ))}

                {/* ── Support Tasks ───────────────────────────────────── */}
                {section('support', 'Support', (
                    <ul className="divide-y divide-slate-200">
                        {SUPPORT_TASKS.filter(t => !(inactiveSupportTasks||[]).includes(t)).map(task => {
                            const sc = SUPPORT_CHIP_COLORS[task] || {};
                            return (
                                <li key={task} className="p-4 flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full ${sc.dot || 'bg-slate-400'}`}></span>
                                        <span className="font-medium text-slate-800">{task}</span>
                                        <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                    </div>
                                    <button onClick={() => setInactiveSupportTasks(prev => [...(prev||[]), task])}
                                        className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">
                                        Inaktiv setzen
                                    </button>
                                </li>
                            );
                        })}
                        {SUPPORT_TASKS.filter(t => !(inactiveSupportTasks||[]).includes(t)).length === 0 &&
                            <li className="p-6 text-sm text-slate-400 text-center">Alle Support-Tasks sind inaktiv.</li>}
                    </ul>
                ))}

                {/* ── Training Tasks ──────────────────────────────────── */}
                {section('training', 'Trainings', (
                    <div>
                        <div className="p-4 flex gap-2 border-b border-slate-200">
                            <input type="text" value={newTrainingTask}
                                onChange={e => setNewTrainingTask(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { const t = newTrainingTask.trim(); if (t && !TRAINING_TASKS.includes(t) && !(customTrainingTasks||[]).includes(t)) { setCustomTrainingTasks(prev => [...(prev||[]), t]); setNewTrainingTask(''); } } }}
                                placeholder="Neues Training"
                                className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                            <button onClick={() => { const t = newTrainingTask.trim(); if (t && !TRAINING_TASKS.includes(t) && !(customTrainingTasks||[]).includes(t)) { setCustomTrainingTasks(prev => [...(prev||[]), t]); setNewTrainingTask(''); } }}
                                className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">
                                Hinzufügen
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-200">
                            {TRAINING_TASKS.filter(t => !(inactiveTrainingTasks||[]).includes(t)).map(task => (
                                <li key={task} className="p-4 flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                                        <span className="font-medium text-slate-800">{task}</span>
                                        <span className="text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"><IconPin size={10}/>Permanent</span>
                                    </div>
                                    <button onClick={() => setInactiveTrainingTasks(prev => [...(prev||[]), task])}
                                        className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">
                                        Inaktiv setzen
                                    </button>
                                </li>
                            ))}
                            {(customTrainingTasks||[]).filter(t => !(inactiveTrainingTasks||[]).includes(t)).map(task => (
                                <li key={task} className="p-4 flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                                        <span className="font-medium text-slate-800">{task}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setInactiveTrainingTasks(prev => [...(prev||[]), task])}
                                            className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">
                                            Inaktiv setzen
                                        </button>
                                        <button onClick={() => setCustomTrainingTasks(prev => (prev||[]).filter(t => t !== task))}
                                            className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {/* ── Abwesenheiten ───────────────────────────────────── */}
                {section('offtime', 'Abwesenheiten (Offtime)', (
                    <div>
                        <div className="p-4 flex gap-2 border-b border-slate-200">
                            <input type="text" value={newOfftimeTask}
                                onChange={e => setNewOfftimeTask(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newOfftimeTask.trim() && !offtimeTasks.includes(newOfftimeTask.trim())) { setOfftimeTasks([...offtimeTasks, newOfftimeTask.trim()]); setNewOfftimeTask(''); } }}
                                placeholder="Neue Abwesenheitsart"
                                className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                            <button onClick={() => { if (newOfftimeTask.trim() && !offtimeTasks.includes(newOfftimeTask.trim())) { setOfftimeTasks([...offtimeTasks, newOfftimeTask.trim()]); setNewOfftimeTask(''); } }}
                                className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">
                                Hinzufügen
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-200">
                            {offtimeTasks.filter(t => !(inactiveOfftimeTasks||[]).some(x => x.name === t)).map(task => (
                                <li key={task} className="p-4 flex justify-between items-center text-sm">
                                    <span className="text-slate-800">{task}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setInactiveOfftimeTasks(prev => [...(prev||[]), { name: task }])}
                                            className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100">
                                            Inaktiv setzen
                                        </button>
                                        <button onClick={() => setOfftimeTasks(offtimeTasks.filter(t2 => t2 !== task))}
                                            className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button>
                                    </div>
                                </li>
                            ))}
                            {offtimeTasks.filter(t => !(inactiveOfftimeTasks||[]).some(x => x.name === t)).length === 0 &&
                                <li className="p-6 text-sm text-slate-400 text-center">Keine aktiven Abwesenheitsarten.</li>}
                        </ul>
                    </div>
                ))}

                {/* ── Mitarbeiter-Kategorien ──────────────────────────── */}
                {section('empCats', 'Mitarbeiter-Kategorien', (
                    <div>
                        <div className="p-4 flex gap-2 border-b border-slate-200">
                            <input type="text" value={newEmpCat}
                                onChange={e => setNewEmpCat(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newEmpCat.trim() && !empCategories.includes(newEmpCat.trim())) { setEmpCategories([...empCategories, newEmpCat.trim()]); setNewEmpCat(''); } }}
                                placeholder="Neue Mitarbeiter-Kategorie"
                                className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                            <button onClick={() => { if (newEmpCat.trim() && !empCategories.includes(newEmpCat.trim())) { setEmpCategories([...empCategories, newEmpCat.trim()]); setNewEmpCat(''); } }}
                                className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">
                                Hinzufügen
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-100">
                            {empCategories.map(cat => (
                                <li key={cat} className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-800">{cat}</span>
                                    <button onClick={() => setEmpCategories(empCategories.filter(c => c !== cat))}
                                        className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}

                {/* ── Projekt-Kategorien ──────────────────────────────── */}
                {section('projCats', 'Projekt-Kategorien', (
                    <div>
                        <div className="p-4 flex gap-2 border-b border-slate-200">
                            <input type="text" value={newProjCat}
                                onChange={e => setNewProjCat(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newProjCat.trim() && !projCategories.includes(newProjCat.trim())) { setProjCategories([...projCategories, newProjCat.trim()]); setNewProjCat(''); } }}
                                placeholder="Neue Projekt-Kategorie"
                                className="flex-1 p-2 border border-slate-300 rounded text-sm"/>
                            <button onClick={() => { if (newProjCat.trim() && !projCategories.includes(newProjCat.trim())) { setProjCategories([...projCategories, newProjCat.trim()]); setNewProjCat(''); } }}
                                className="bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700">
                                Hinzufügen
                            </button>
                        </div>
                        <ul className="divide-y divide-slate-100">
                            {projCategories.map(cat => (
                                <li key={cat} className="px-4 py-3 flex justify-between items-center text-sm">
                                    <span className="text-slate-800">{cat}</span>
                                    <button onClick={() => setProjCategories(projCategories.filter(c => c !== cat))}
                                        className="text-rose-500 hover:text-rose-700"><IconX size={16}/></button>
                                </li>
                            ))}
                            {projCategories.length === 0 && <li className="p-6 text-sm text-slate-400 text-center">Keine Projekt-Kategorien angelegt.</li>}
                        </ul>
                    </div>
                ))}

                {/* ── Inaktiv (Sammelpunkt) ───────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <button onClick={() => setInactiveOpen(o => !o)}
                        className="w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg text-slate-900 font-medium">Inaktiv</h2>
                            {totalInactive > 0 && (
                                <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{totalInactive}</span>
                            )}
                        </div>
                        <span className="text-slate-500">{inactiveOpen ? <IconChevronDown size={20}/> : <IconChevronRight size={20}/>}</span>
                    </button>
                    {inactiveOpen && (
                        <div>
                            {totalInactive === 0 ? (
                                <p className="p-6 text-sm text-slate-400 text-center">Keine inaktiven Kategorien.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {inactiveBasicTasks.map(item => (
                                        <li key={item.name} className="px-4 py-3 flex items-center gap-3 text-sm">
                                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">Basic</span>
                                            <span className="flex-1 text-slate-700">{item.name}</span>
                                            <span className="text-xs text-slate-400 shrink-0">seit {new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
                                            <button onClick={() => reactivateBasic(item)}
                                                className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0">
                                                Reaktivieren
                                            </button>
                                            <button onClick={() => setInactiveBasicTasks(prev => prev.filter(t => t.name !== item.name))}
                                                className="text-rose-400 hover:text-rose-600 shrink-0"><IconX size={14}/></button>
                                        </li>
                                    ))}
                                    {(inactiveOfftimeTasks||[]).map(item => (
                                        <li key={item.name} className="px-4 py-3 flex items-center gap-3 text-sm">
                                            <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded shrink-0">Offtime</span>
                                            <span className="flex-1 text-slate-700">{item.name}</span>
                                            <button onClick={() => setInactiveOfftimeTasks(prev => prev.filter(t => t.name !== item.name))}
                                                className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0">
                                                Reaktivieren
                                            </button>
                                        </li>
                                    ))}
                                    {(inactiveSupportTasks||[]).map(task => (
                                        <li key={task} className="px-4 py-3 flex items-center gap-3 text-sm">
                                            <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded shrink-0">Support</span>
                                            <span className="flex-1 text-slate-700">{task}</span>
                                            <button onClick={() => setInactiveSupportTasks(prev => prev.filter(t => t !== task))}
                                                className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0">
                                                Reaktivieren
                                            </button>
                                        </li>
                                    ))}
                                    {(inactiveTrainingTasks||[]).map(task => (
                                        <li key={task} className="px-4 py-3 flex items-center gap-3 text-sm">
                                            <span className="text-xs bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded shrink-0">Training</span>
                                            <span className="flex-1 text-slate-700">{task}</span>
                                            <button onClick={() => setInactiveTrainingTasks(prev => prev.filter(t => t !== task))}
                                                className="px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0">
                                                Reaktivieren
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
