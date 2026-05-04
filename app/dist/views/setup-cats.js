const SetupCatsView = ({
  s,
  h
}) => {
  const {
    useState
  } = React;
  const {
    empCategories,
    projCategories,
    basicTasks,
    basicTasksMeta,
    inactiveBasicTasks,
    offtimeTasks,
    inactiveOfftimeTasks,
    inactiveSupportTasks,
    inactiveTrainingTasks,
    customTrainingTasks,
    expandedSetupCats,
    newEmpCat,
    newProjCat,
    newBasicTask,
    newOfftimeTask
  } = s;
  const {
    setEmpCategories,
    setProjCategories,
    setBasicTasks,
    setBasicTasksMeta,
    setInactiveBasicTasks,
    setOfftimeTasks,
    setInactiveOfftimeTasks,
    setInactiveSupportTasks,
    setInactiveTrainingTasks,
    setCustomTrainingTasks,
    setExpandedSetupCats,
    setNewEmpCat,
    setNewProjCat,
    setNewBasicTask,
    setNewOfftimeTask
  } = h;
  const [newTrainingTask, setNewTrainingTask] = useState('');
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const COLOR_SWATCHES = [null, ...PROJECT_COLORS.map(c => c.id)];
  const renderSwatch = colorId => {
    if (!colorId) return /*#__PURE__*/React.createElement("span", {
      className: "w-4 h-4 rounded-full border-2 border-slate-300 bg-white inline-block"
    });
    const c = resolveProjectColor(colorId);
    return /*#__PURE__*/React.createElement("span", {
      className: `w-4 h-4 rounded-full ${c.dot} inline-block`
    });
  };
  const renderColorPicker = taskName => /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 items-center"
  }, COLOR_SWATCHES.map((cid, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    title: cid || 'Keine Farbe',
    onClick: () => setBasicTasksMeta(prev => ({
      ...prev,
      [taskName]: {
        ...(prev[taskName] || {}),
        color: cid || undefined
      }
    })),
    className: `w-5 h-5 rounded-full border-2 transition-all ${(basicTasksMeta[taskName]?.color || null) === cid ? 'border-gea-600 scale-110' : 'border-transparent hover:border-slate-400'} ${cid ? resolveProjectColor(cid).dot : 'bg-white border-slate-300'}`
  })));
  const addBasicTask = () => {
    const t = newBasicTask.trim();
    if (!t) return;
    if (basicTasks.includes(t)) return;
    setBasicTasks(prev => [...prev, t]);
    setBasicTasksMeta(prev => ({
      ...prev,
      [t]: {
        createdAt: new Date().toISOString(),
        permanent: true
      }
    }));
    setNewBasicTask('');
  };
  const setBasicInactive = task => {
    const meta = basicTasksMeta?.[task];
    setBasicTasks(prev => prev.filter(t => t !== task));
    setInactiveBasicTasks(prev => [...prev, {
      name: task,
      createdAt: meta?.createdAt || new Date().toISOString()
    }]);
  };
  const reactivateBasic = item => {
    setBasicTasks(prev => [...prev, item.name]);
    setBasicTasksMeta(prev => ({
      ...prev,
      [item.name]: {
        ...(prev[item.name] || {}),
        createdAt: item.createdAt || new Date().toISOString()
      }
    }));
    setInactiveBasicTasks(prev => prev.filter(t => t.name !== item.name));
  };

  // Aggregate count for all inactive items
  const totalInactive = inactiveBasicTasks.length + (inactiveOfftimeTasks || []).length + (inactiveSupportTasks || []).length + (inactiveTrainingTasks || []).length;
  const section = (key, title, children) => /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      [key]: !prev[key]
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, title), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats[key] ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats[key] && children);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-auto p-8 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto space-y-6"
  }, section('basic', 'Basic Tasks', /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newBasicTask,
    onChange: e => setNewBasicTask(e.target.value),
    onKeyDown: e => e.key === 'Enter' && addBasicTask(),
    placeholder: "Neuer Basic Task",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addBasicTask,
    className: "bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700"
  }, "Hinzuf\xFCgen")), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, basicTasks.map(task => {
    const meta = basicTasksMeta?.[task];
    const isUserCreated = !!meta;
    const isPerm = !isUserCreated || !!meta?.permanent;
    const weeksLeft = meta && !isPerm ? Math.max(0, BASIC_TASK_EXPIRY_WEEKS - Math.floor((Date.now() - new Date(meta.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000))) : null;
    return /*#__PURE__*/React.createElement("li", {
      key: task,
      className: "p-4 flex justify-between items-center gap-3 text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 min-w-0 flex-wrap"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-800 font-medium"
    }, task), isPerm ? /*#__PURE__*/React.createElement("span", {
      className: "text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(IconPin, {
      size: 10
    }), "Permanent") : weeksLeft !== null && /*#__PURE__*/React.createElement("span", {
      className: "text-xs text-slate-400"
    }, "(l\xE4uft ab in ", weeksLeft, " Wo.)")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 flex-shrink-0"
    }, renderColorPicker(task), isUserCreated && /*#__PURE__*/React.createElement("button", {
      onClick: () => setBasicTasksMeta(prev => ({
        ...prev,
        [task]: {
          ...(prev[task] || {}),
          permanent: !isPerm
        }
      })),
      className: `px-2 py-1 text-xs border rounded flex items-center gap-1 ${isPerm ? 'bg-gea-50 text-gea-700 border-gea-200 hover:bg-gea-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`
    }, /*#__PURE__*/React.createElement(IconPin, {
      size: 10
    }), isPerm ? 'Permanent' : 'Temporär'), /*#__PURE__*/React.createElement("button", {
      onClick: () => setBasicInactive(task),
      className: "px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Inaktiv setzen"), isUserCreated && !isPerm && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setBasicTasks(prev => prev.filter(t => t !== task));
        setBasicTasksMeta(prev => {
          const n = {
            ...prev
          };
          delete n[task];
          return n;
        });
      },
      className: "text-rose-500 hover:text-rose-700"
    }, /*#__PURE__*/React.createElement(IconX, {
      size: 14
    }))));
  }), basicTasks.length === 0 && /*#__PURE__*/React.createElement("li", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Keine aktiven Basic Tasks.")))), section('support', 'Support', /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, SUPPORT_TASKS.filter(t => !(inactiveSupportTasks || []).includes(t)).map(task => {
    const sc = SUPPORT_CHIP_COLORS[task] || {};
    return /*#__PURE__*/React.createElement("li", {
      key: task,
      className: "p-4 flex justify-between items-center text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-3 h-3 rounded-full ${sc.dot || 'bg-slate-400'}`
    }), /*#__PURE__*/React.createElement("span", {
      className: "font-medium text-slate-800"
    }, task), /*#__PURE__*/React.createElement("span", {
      className: "text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(IconPin, {
      size: 10
    }), "Permanent")), /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveSupportTasks(prev => [...(prev || []), task]),
      className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Inaktiv setzen"));
  }), SUPPORT_TASKS.filter(t => !(inactiveSupportTasks || []).includes(t)).length === 0 && /*#__PURE__*/React.createElement("li", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Alle Support-Tasks sind inaktiv."))), section('training', 'Trainings', /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newTrainingTask,
    onChange: e => setNewTrainingTask(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        const t = newTrainingTask.trim();
        if (t && !TRAINING_TASKS.includes(t) && !(customTrainingTasks || []).includes(t)) {
          setCustomTrainingTasks(prev => [...(prev || []), t]);
          setNewTrainingTask('');
        }
      }
    },
    placeholder: "Neues Training",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const t = newTrainingTask.trim();
      if (t && !TRAINING_TASKS.includes(t) && !(customTrainingTasks || []).includes(t)) {
        setCustomTrainingTasks(prev => [...(prev || []), t]);
        setNewTrainingTask('');
      }
    },
    className: "bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700"
  }, "Hinzuf\xFCgen")), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, TRAINING_TASKS.filter(t => !(inactiveTrainingTasks || []).includes(t)).map(task => /*#__PURE__*/React.createElement("li", {
    key: task,
    className: "p-4 flex justify-between items-center text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full bg-sky-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-800"
  }, task), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(IconPin, {
    size: 10
  }), "Permanent")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveTrainingTasks(prev => [...(prev || []), task]),
    className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
  }, "Inaktiv setzen"))), (customTrainingTasks || []).filter(t => !(inactiveTrainingTasks || []).includes(t)).map(task => /*#__PURE__*/React.createElement("li", {
    key: task,
    className: "p-4 flex justify-between items-center text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full bg-sky-500"
  }), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-800"
  }, task)), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveTrainingTasks(prev => [...(prev || []), task]),
    className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
  }, "Inaktiv setzen"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCustomTrainingTasks(prev => (prev || []).filter(t => t !== task)),
    className: "text-rose-500 hover:text-rose-700"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 16
  })))))))), section('offtime', 'Abwesenheiten (Offtime)', /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newOfftimeTask,
    onChange: e => setNewOfftimeTask(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && newOfftimeTask.trim() && !offtimeTasks.includes(newOfftimeTask.trim())) {
        setOfftimeTasks([...offtimeTasks, newOfftimeTask.trim()]);
        setNewOfftimeTask('');
      }
    },
    placeholder: "Neue Abwesenheitsart",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (newOfftimeTask.trim() && !offtimeTasks.includes(newOfftimeTask.trim())) {
        setOfftimeTasks([...offtimeTasks, newOfftimeTask.trim()]);
        setNewOfftimeTask('');
      }
    },
    className: "bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700"
  }, "Hinzuf\xFCgen")), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, offtimeTasks.filter(t => !(inactiveOfftimeTasks || []).some(x => x.name === t)).map(task => /*#__PURE__*/React.createElement("li", {
    key: task,
    className: "p-4 flex justify-between items-center text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-800"
  }, task), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveOfftimeTasks(prev => [...(prev || []), {
      name: task
    }]),
    className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
  }, "Inaktiv setzen"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOfftimeTasks(offtimeTasks.filter(t2 => t2 !== task)),
    className: "text-rose-500 hover:text-rose-700"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 16
  }))))), offtimeTasks.filter(t => !(inactiveOfftimeTasks || []).some(x => x.name === t)).length === 0 && /*#__PURE__*/React.createElement("li", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Keine aktiven Abwesenheitsarten.")))), section('empCats', 'Mitarbeiter-Kategorien', /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newEmpCat,
    onChange: e => setNewEmpCat(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && newEmpCat.trim() && !empCategories.includes(newEmpCat.trim())) {
        setEmpCategories([...empCategories, newEmpCat.trim()]);
        setNewEmpCat('');
      }
    },
    placeholder: "Neue Mitarbeiter-Kategorie",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (newEmpCat.trim() && !empCategories.includes(newEmpCat.trim())) {
        setEmpCategories([...empCategories, newEmpCat.trim()]);
        setNewEmpCat('');
      }
    },
    className: "bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700"
  }, "Hinzuf\xFCgen")), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-100"
  }, empCategories.map(cat => /*#__PURE__*/React.createElement("li", {
    key: cat,
    className: "px-4 py-3 flex justify-between items-center text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-800"
  }, cat), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEmpCategories(empCategories.filter(c => c !== cat)),
    className: "text-rose-500 hover:text-rose-700"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 16
  }))))))), section('projCats', 'Projekt-Kategorien', /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newProjCat,
    onChange: e => setNewProjCat(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && newProjCat.trim() && !projCategories.includes(newProjCat.trim())) {
        setProjCategories([...projCategories, newProjCat.trim()]);
        setNewProjCat('');
      }
    },
    placeholder: "Neue Projekt-Kategorie",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (newProjCat.trim() && !projCategories.includes(newProjCat.trim())) {
        setProjCategories([...projCategories, newProjCat.trim()]);
        setNewProjCat('');
      }
    },
    className: "bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700"
  }, "Hinzuf\xFCgen")), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-100"
  }, projCategories.map(cat => /*#__PURE__*/React.createElement("li", {
    key: cat,
    className: "px-4 py-3 flex justify-between items-center text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-800"
  }, cat), /*#__PURE__*/React.createElement("button", {
    onClick: () => setProjCategories(projCategories.filter(c => c !== cat)),
    className: "text-rose-500 hover:text-rose-700"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 16
  })))), projCategories.length === 0 && /*#__PURE__*/React.createElement("li", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Keine Projekt-Kategorien angelegt.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveOpen(o => !o),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Inaktiv"), totalInactive > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full"
  }, totalInactive)), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, inactiveOpen ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), inactiveOpen && /*#__PURE__*/React.createElement("div", null, totalInactive === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Keine inaktiven Kategorien.") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-100"
  }, inactiveBasicTasks.map(item => /*#__PURE__*/React.createElement("li", {
    key: item.name,
    className: "px-4 py-3 flex items-center gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0"
  }, "Basic"), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-slate-700"
  }, item.name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400 shrink-0"
  }, "seit ", new Date(item.createdAt).toLocaleDateString('de-DE')), /*#__PURE__*/React.createElement("button", {
    onClick: () => reactivateBasic(item),
    className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0"
  }, "Reaktivieren"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveBasicTasks(prev => prev.filter(t => t.name !== item.name)),
    className: "text-rose-400 hover:text-rose-600 shrink-0"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 14
  })))), (inactiveOfftimeTasks || []).map(item => /*#__PURE__*/React.createElement("li", {
    key: item.name,
    className: "px-4 py-3 flex items-center gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded shrink-0"
  }, "Offtime"), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-slate-700"
  }, item.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveOfftimeTasks(prev => prev.filter(t => t.name !== item.name)),
    className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0"
  }, "Reaktivieren"))), (inactiveSupportTasks || []).map(task => /*#__PURE__*/React.createElement("li", {
    key: task,
    className: "px-4 py-3 flex items-center gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded shrink-0"
  }, "Support"), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-slate-700"
  }, task), /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveSupportTasks(prev => prev.filter(t => t !== task)),
    className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0"
  }, "Reaktivieren"))), (inactiveTrainingTasks || []).map(task => /*#__PURE__*/React.createElement("li", {
    key: task,
    className: "px-4 py-3 flex items-center gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded shrink-0"
  }, "Training"), /*#__PURE__*/React.createElement("span", {
    className: "flex-1 text-slate-700"
  }, task), /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveTrainingTasks(prev => prev.filter(t => t !== task)),
    className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100 shrink-0"
  }, "Reaktivieren"))))))));
};