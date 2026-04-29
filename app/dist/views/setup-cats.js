const SetupCatsView = ({
  s,
  h
}) => {
  const {
    activeTab,
    employees,
    projects,
    assignments,
    expenses,
    costItems,
    empCategories,
    projCategories,
    basicTasks,
    basicTasksMeta,
    inactiveBasicTasks,
    basicTasksSubTab,
    offtimeTasks,
    inactiveOfftimeTasks,
    inactiveSupportTasks,
    inactiveTrainingTasks,
    isChangelogOpen,
    weeks,
    selectedProject,
    collapsedCategories,
    collapsedProjCategories,
    collapsedEmpSetup,
    selectedProjectDetails,
    weeksAhead,
    isAssignModalOpen,
    assignContext,
    isCostItemModalOpen,
    editingCostItem,
    isCopyModalOpen,
    copyContext,
    isDeleteMode,
    pastProjectsExpanded,
    isInvoiceModalOpen,
    invoiceSelection,
    invoiceRecipient,
    isProjFormOpen,
    isHelpModalOpen,
    timelineYear,
    empForm,
    editingEmpId,
    projForm,
    editingProjectId,
    newEmpCat,
    newProjCat,
    newBasicTask,
    newOfftimeTask,
    expandedSetupCats,
    syncStatus,
    fsStatus,
    employeeById,
    projectById,
    assignmentsByEmpWeek,
    assignmentsByProject,
    assignmentsByProjectWeek,
    costItemsByProject,
    projectStatusById,
    activeEmployees,
    activeEmpsByCategory,
    activeEmpCategories,
    projectsByCategory,
    projCategoriesFromProjects,
    timelineWeeks,
    currentWeekColRef,
    resourceScrollRef,
    timelineScrollRef
  } = s;
  const {
    customTrainingTasks
  } = s;
  const [newTrainingTask, setNewTrainingTask] = React.useState('');
  const {
    setActiveTab,
    setEmployees,
    setProjects,
    setAssignments,
    setCostItems,
    setEmpCategories,
    setProjCategories,
    setBasicTasks,
    setBasicTasksMeta,
    setInactiveBasicTasks,
    setBasicTasksSubTab,
    setOfftimeTasks,
    setInactiveOfftimeTasks,
    setInactiveSupportTasks,
    setInactiveTrainingTasks,
    setCustomTrainingTasks,
    setIsChangelogOpen,
    setSelectedProject,
    setCollapsedCategories,
    setCollapsedProjCategories,
    setCollapsedEmpSetup,
    setSelectedProjectDetails,
    setWeeksAhead,
    setIsAssignModalOpen,
    setAssignContext,
    setIsCostItemModalOpen,
    setEditingCostItem,
    setIsCopyModalOpen,
    setCopyContext,
    setIsDeleteMode,
    setPastProjectsExpanded,
    setIsInvoiceModalOpen,
    setInvoiceSelection,
    setInvoiceRecipient,
    setIsProjFormOpen,
    setIsHelpModalOpen,
    setTimelineYear,
    setEmpForm,
    setEditingEmpId,
    setProjForm,
    setEditingProjectId,
    setNewEmpCat,
    setNewProjCat,
    setNewBasicTask,
    setNewOfftimeTask,
    setExpandedSetupCats,
    setSyncStatus,
    setFsStatus,
    getEmpWeeklyHours,
    computeAutoStatus,
    getWeeksForYear,
    getUtilization,
    toggleCategory,
    toggleProjCategory,
    toggleEmpSetup,
    handleSaveAssignment,
    handleDeleteAssignment,
    handleDeleteAssignmentSeries,
    handleDrop,
    exportData,
    importData,
    buildInvoiceData,
    openInvoiceModal,
    scrollToCurrentWeek
  } = h;
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
  const renderColorPicker = (taskName, metaKey = 'basicTasksMeta') => /*#__PURE__*/React.createElement("div", {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-auto p-8 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      basic: !prev.basic
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Basic Tasks"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.basic ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.basic && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex border-b border-slate-200 bg-slate-50"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setBasicTasksSubTab('aktiv'),
    className: `px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${basicTasksSubTab === 'aktiv' ? 'border-gea-600 text-gea-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`
  }, "Aktiv"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setBasicTasksSubTab('inaktiv'),
    className: `px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${basicTasksSubTab === 'inaktiv' ? 'border-gea-600 text-gea-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`
  }, "Inaktiv ", inactiveBasicTasks.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-slate-200 text-slate-600 text-xs font-semibold px-1.5 py-0.5 rounded-full"
  }, inactiveBasicTasks.length))), basicTasksSubTab === 'aktiv' && /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, basicTasks.filter(t => !basicTasksMeta?.[t]).map(task => /*#__PURE__*/React.createElement("li", {
    key: task,
    className: "p-4 flex justify-between items-center gap-3 text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 min-w-0"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-800 font-medium"
  }, task), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(IconPin, {
    size: 10
  }), "Permanent")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 flex-shrink-0"
  }, renderColorPicker(task), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setBasicTasks(prev => prev.filter(t => t !== task));
      setInactiveBasicTasks(prev => [...prev, {
        name: task,
        createdAt: new Date().toISOString()
      }]);
    },
    className: "px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
  }, "Set Inactive"))))), basicTasksSubTab === 'inaktiv' && /*#__PURE__*/React.createElement("div", null, inactiveBasicTasks.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Keine inaktiven Kategorien") : /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, inactiveBasicTasks.map(task => /*#__PURE__*/React.createElement("li", {
    key: task.name,
    className: "p-4 flex justify-between items-center text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-800"
  }, task.name), /*#__PURE__*/React.createElement("span", {
    className: "ml-2 text-xs text-slate-400"
  }, "(inaktiv seit ", new Date(task.createdAt).toLocaleDateString('de-DE'), ")")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setBasicTasks(prev => [...prev, task.name]);
      setBasicTasksMeta(prev => ({
        ...prev,
        [task.name]: {
          ...(prev[task.name] || {}),
          createdAt: new Date().toISOString(),
          permanent: false
        }
      }));
      setInactiveBasicTasks(prev => prev.filter(t => t.name !== task.name));
    },
    className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100"
  }, "Reaktivieren"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setInactiveBasicTasks(prev => prev.filter(t => t.name !== task.name)),
    className: "px-2.5 py-1 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded hover:bg-rose-100"
  }, "L\xF6schen")))))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      other: !prev.other
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Other Tasks ", /*#__PURE__*/React.createElement("span", {
    className: "text-sm text-slate-500 font-normal ml-2"
  }, "(benutzerdefiniert)")), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.other ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.other && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newBasicTask,
    onChange: e => setNewBasicTask(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        const t = newBasicTask.trim();
        if (t && !basicTasks.includes(t)) {
          setBasicTasks(prev => [...prev, t]);
          setBasicTasksMeta(prev => ({
            ...prev,
            [t]: {
              createdAt: new Date().toISOString(),
              permanent: false
            }
          }));
          setNewBasicTask('');
        }
      }
    },
    placeholder: "Neuer Other Task",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const t = newBasicTask.trim();
      if (t && !basicTasks.includes(t)) {
        setBasicTasks(prev => [...prev, t]);
        setBasicTasksMeta(prev => ({
          ...prev,
          [t]: {
            createdAt: new Date().toISOString(),
            permanent: false
          }
        }));
        setNewBasicTask('');
      }
    },
    className: "bg-gea-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-gea-700"
  }, "Hinzuf\xFCgen")), /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, basicTasks.filter(t => basicTasksMeta?.[t]).map(task => {
    const meta = basicTasksMeta[task] || {};
    const isPerm = !!meta.permanent;
    const weeksLeft = meta.createdAt && !isPerm ? Math.max(0, BASIC_TASK_EXPIRY_WEEKS - Math.floor((Date.now() - new Date(meta.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000))) : null;
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
    }, renderColorPicker(task), /*#__PURE__*/React.createElement("button", {
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
      onClick: () => {
        setBasicTasks(prev => prev.filter(t => t !== task));
        setInactiveBasicTasks(prev => [...prev, {
          name: task,
          createdAt: meta.createdAt || new Date().toISOString()
        }]);
      },
      className: "px-2 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Set Inactive"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setBasicTasks(basicTasks.filter(t => t !== task)),
      className: "text-rose-500 hover:text-rose-700"
    }, /*#__PURE__*/React.createElement(IconX, {
      size: 14
    }))));
  }), basicTasks.filter(t => basicTasksMeta?.[t]).length === 0 && /*#__PURE__*/React.createElement("li", {
    className: "p-6 text-sm text-slate-400 text-center"
  }, "Noch keine benutzerdefinierten Tasks.")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      support: !prev.support
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Support"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.support ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.support && /*#__PURE__*/React.createElement("ul", {
    className: "divide-y divide-slate-200"
  }, SUPPORT_TASKS.map(task => {
    const isInactive = inactiveSupportTasks.includes(task);
    const sc = SUPPORT_CHIP_COLORS[task] || {};
    return /*#__PURE__*/React.createElement("li", {
      key: task,
      className: "p-4 flex justify-between items-center text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: `w-3 h-3 rounded-full ${sc.dot || 'bg-slate-400'}`
    }), /*#__PURE__*/React.createElement("span", {
      className: `font-medium ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`
    }, task), /*#__PURE__*/React.createElement("span", {
      className: "text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(IconPin, {
      size: 10
    }), "Permanent")), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, isInactive ? /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveSupportTasks(prev => prev.filter(t => t !== task)),
      className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100"
    }, "Reaktivieren") : /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveSupportTasks(prev => [...prev, task]),
      className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Set Inactive")));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      training: !prev.training
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Trainings"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.training ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.training && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  }, TRAINING_TASKS.map(task => {
    const isInactive = inactiveTrainingTasks.includes(task);
    return /*#__PURE__*/React.createElement("li", {
      key: task,
      className: "p-4 flex justify-between items-center text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-3 h-3 rounded-full bg-sky-500"
    }), /*#__PURE__*/React.createElement("span", {
      className: `font-medium ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`
    }, task), /*#__PURE__*/React.createElement("span", {
      className: "text-xs bg-gea-50 text-gea-700 border border-gea-200 px-1.5 py-0.5 rounded flex items-center gap-1"
    }, /*#__PURE__*/React.createElement(IconPin, {
      size: 10
    }), "Permanent")), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, isInactive ? /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveTrainingTasks(prev => prev.filter(t => t !== task)),
      className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100"
    }, "Reaktivieren") : /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveTrainingTasks(prev => [...prev, task]),
      className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Set Inactive")));
  }), (customTrainingTasks || []).map(task => {
    const isInactive = inactiveTrainingTasks.includes(task);
    return /*#__PURE__*/React.createElement("li", {
      key: `custom-${task}`,
      className: "p-4 flex justify-between items-center text-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: "w-3 h-3 rounded-full bg-sky-500"
    }), /*#__PURE__*/React.createElement("span", {
      className: `font-medium ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`
    }, task)), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, isInactive ? /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveTrainingTasks(prev => prev.filter(t => t !== task)),
      className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100"
    }, "Reaktivieren") : /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveTrainingTasks(prev => [...prev, task]),
      className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Set Inactive"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setCustomTrainingTasks(prev => (prev || []).filter(t => t !== task)),
      className: "text-rose-500 hover:text-rose-700"
    }, /*#__PURE__*/React.createElement(IconX, {
      size: 16
    }))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      offtime: !prev.offtime
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Abwesenheiten (Offtime)"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.offtime ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.offtime && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-4 flex gap-2 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newOfftimeTask,
    onChange: e => setNewOfftimeTask(e.target.value),
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
  }, offtimeTasks.map(task => {
    const isInactive = (inactiveOfftimeTasks || []).some(t => t.name === task);
    return /*#__PURE__*/React.createElement("li", {
      key: task,
      className: "p-4 flex justify-between items-center text-sm"
    }, /*#__PURE__*/React.createElement("span", {
      className: `${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`
    }, task), /*#__PURE__*/React.createElement("div", {
      className: "flex gap-2"
    }, isInactive ? /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveOfftimeTasks(prev => prev.filter(t => t.name !== task)),
      className: "px-2.5 py-1 text-xs bg-gea-50 text-gea-700 border border-gea-200 rounded hover:bg-gea-100"
    }, "Reaktivieren") : /*#__PURE__*/React.createElement("button", {
      onClick: () => setInactiveOfftimeTasks(prev => [...prev, {
        name: task
      }]),
      className: "px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded hover:bg-slate-100"
    }, "Set Inactive"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setOfftimeTasks(offtimeTasks.filter(t => t !== task)),
      className: "text-rose-500 hover:text-rose-700"
    }, /*#__PURE__*/React.createElement(IconX, {
      size: 16
    }))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      empCats: !prev.empCats
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Mitarbeiter-Kategorien"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.empCats ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.empCats && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setExpandedSetupCats(prev => ({
      ...prev,
      projCats: !prev.projCats
    })),
    className: "w-full p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center hover:bg-slate-100 transition-colors"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-lg text-slate-900 font-medium"
  }, "Projekt-Kategorien"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-500"
  }, expandedSetupCats.projCats ? /*#__PURE__*/React.createElement(IconChevronDown, {
    size: 20
  }) : /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 20
  }))), expandedSetupCats.projCats && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  })))))))));
};