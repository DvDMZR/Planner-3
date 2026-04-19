// ─── MODAL COMPONENTS ───────────────────────────────────────────────────────
// All modals receive explicit props; none closes over App() state.
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
const AssignmentModal = ({
  assignContext,
  employeeById,
  basicTasks,
  basicTasksMeta,
  offtimeTasks,
  inactiveOfftimeTasks,
  inactiveSupportTasks,
  inactiveTrainingTasks,
  projects,
  computeAutoStatus,
  getUtilization,
  getEmpWeeklyHours,
  setBasicTasks,
  setBasicTasksMeta,
  onClose,
  onSave,
  onDelete,
  onDeleteSeries
}) => {
  const empWeeklyHours = employeeById.get(assignContext.empId)?.weeklyHours ?? HOURS_PER_WEEK;
  const activeSupportTasks = useMemo(() => SUPPORT_TASKS.filter(t => !(inactiveSupportTasks || []).includes(t)), [inactiveSupportTasks]);
  const activeTrainingTasks = useMemo(() => TRAINING_TASKS.filter(t => !(inactiveTrainingTasks || []).includes(t)), [inactiveTrainingTasks]);
  const activeOfftimeTasks = useMemo(() => offtimeTasks.filter(t => !(inactiveOfftimeTasks || []).some(iot => iot.name === t)), [offtimeTasks, inactiveOfftimeTasks]);
  const otherTasks = useMemo(() => basicTasks.filter(t => basicTasksMeta && basicTasksMeta[t]), [basicTasks, basicTasksMeta]);
  const getInitialType = () => {
    const ex = assignContext.existing;
    if (!ex) return 'basic';
    return ex.type || 'basic';
  };
  const getInitialRef = type => {
    const ex = assignContext.existing;
    if (ex) return ex.reference || '';
    if (type === 'project') return projects.find(p => ['active', 'planned'].includes(computeAutoStatus(p)))?.id || '';
    if (type === 'basic') return basicTasks.filter(t => !basicTasksMeta?.[t])[0] || basicTasks[0] || '';
    if (type === 'support') return activeSupportTasks[0] || '';
    if (type === 'training') return activeTrainingTasks[0] || '';
    if (type === 'other') return otherTasks[0] || '';
    if (type === 'offtime') return activeOfftimeTasks[0] || '';
    return '';
  };
  const initType = getInitialType();
  const [formData, setFormData] = useState(assignContext.existing || {
    empId: assignContext.empId,
    week: assignContext.week,
    type: initType,
    reference: getInitialRef(initType),
    hours: empWeeklyHours
  });
  const [newTaskName, setNewTaskName] = useState('');
  const [recurRule, setRecurRule] = useState({
    enabled: false,
    everyXWeeks: 1,
    endWeek: addWeeks(assignContext.week || formData.week, 4)
  });
  const emp = employeeById.get(formData.empId);
  const pct = Math.round((formData.hours ?? empWeeklyHours) / empWeeklyHours * 100);
  const handleTypeChange = type => {
    let ref = '';
    if (type === 'project') ref = projects.find(p => ['active', 'planned'].includes(computeAutoStatus(p)))?.id || '';else if (type === 'basic') ref = basicTasks.filter(t => !basicTasksMeta?.[t])[0] || basicTasks[0] || '';else if (type === 'support') ref = activeSupportTasks[0] || '';else if (type === 'training') ref = activeTrainingTasks[0] || '';else if (type === 'other') ref = otherTasks[0] || '';else if (type === 'offtime') ref = activeOfftimeTasks[0] || '';
    setFormData({
      ...formData,
      type,
      reference: ref
    });
    setNewTaskName('');
  };
  const handleSave = () => {
    let data = {
      ...formData
    };
    if (formData.type === 'new') {
      const trimmed = newTaskName.trim();
      if (!trimmed) return;
      if (!basicTasks.includes(trimmed)) {
        setBasicTasks(prev => [...prev, trimmed]);
        setBasicTasksMeta(prev => ({
          ...prev,
          [trimmed]: {
            createdAt: new Date().toISOString(),
            permanent: false
          }
        }));
      }
      data = {
        ...formData,
        type: 'other',
        reference: trimmed
      };
    }
    const weeklyH = getEmpWeeklyHours(formData.empId);
    const {
      total: currentTotal
    } = getUtilization(formData.empId, formData.week);
    const existingH = assignContext?.existing ? assignContext.existing.hours ?? (assignContext.existing.percent ?? 100) / 100 * weeklyH : 0;
    const newH = data.hours ?? weeklyH;
    const newTotal = currentTotal - existingH / weeklyH * 100 + newH / weeklyH * 100;
    if (newTotal > 100) {
      const empName = employeeById.get(formData.empId)?.name || '';
      if (!window.confirm(`${empName} wäre diese Woche bei ${Math.round(newTotal)} % — trotzdem speichern?`)) return;
    }
    if (recurRule.enabled && !data.id && recurRule.endWeek > formData.week) {
      const ruleId = makeId('rule');
      const series = [];
      let cur = formData.week;
      while (cur <= recurRule.endWeek) {
        series.push({
          ...data,
          week: cur,
          id: makeId('ass'),
          ruleId
        });
        cur = addWeeks(cur, recurRule.everyXWeeks);
      }
      onSave(series);
      return;
    }
    onSave(data);
  };
  const TYPE_BUTTONS = [{
    value: 'training',
    label: 'Training'
  }, {
    value: 'support',
    label: 'Support'
  }, {
    value: 'basic',
    label: 'Basic'
  }, {
    value: 'other',
    label: 'Other'
  }, {
    value: 'project',
    label: 'Projekt'
  }, {
    value: 'offtime',
    label: 'Offtime'
  }, {
    value: 'new',
    label: '+ Neu'
  }];
  const hardcodedBasicTasks = basicTasks.filter(t => !basicTasksMeta?.[t]);
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
  }, /*#__PURE__*/React.createElement(ModalHeader, {
    title: formData.id ? 'Planung bearbeiten' : 'Planung hinzufügen',
    onClose: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "p-6 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-sm text-slate-500"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-slate-900 font-medium"
  }, emp?.name), /*#__PURE__*/React.createElement("span", {
    className: "mx-2"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-slate-700"
  }, formData.week)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide"
  }, "Typ"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-4 gap-1"
  }, TYPE_BUTTONS.map(opt => /*#__PURE__*/React.createElement("button", {
    key: opt.value,
    onClick: () => handleTypeChange(opt.value),
    className: `py-2 px-1 text-xs rounded-md border font-medium transition-colors ${formData.type === opt.value ? 'bg-gea-600 text-white border-gea-600' : 'bg-white text-slate-600 border-slate-300 hover:border-gea-400'}`
  }, opt.label)))), formData.type === 'new' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Neuer Task-Name (Other)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newTaskName,
    onChange: e => setNewTaskName(e.target.value),
    autoFocus: true,
    placeholder: "z.B. Meeting, Workshop, \u2026",
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-1"
  }, "Wird als Other-Task gespeichert und zur Liste hinzugef\xFCgt.")), formData.type !== 'new' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide"
  }, "Auswahl"), formData.type === 'project' && /*#__PURE__*/React.createElement("select", {
    value: formData.reference,
    onChange: e => setFormData({
      ...formData,
      reference: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, projects.filter(p => ['active', 'planned'].includes(computeAutoStatus(p))).map(p => /*#__PURE__*/React.createElement("option", {
    key: p.id,
    value: p.id
  }, p.name))), formData.type === 'basic' && /*#__PURE__*/React.createElement("select", {
    value: formData.reference,
    onChange: e => setFormData({
      ...formData,
      reference: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, hardcodedBasicTasks.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t))), formData.type === 'other' && /*#__PURE__*/React.createElement("select", {
    value: formData.reference,
    onChange: e => setFormData({
      ...formData,
      reference: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, otherTasks.length > 0 ? otherTasks.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t)) : /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Noch keine Other-Tasks (+ Neu verwenden) \u2014")), formData.type === 'support' && /*#__PURE__*/React.createElement("select", {
    value: formData.reference,
    onChange: e => setFormData({
      ...formData,
      reference: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, activeSupportTasks.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t))), formData.type === 'training' && /*#__PURE__*/React.createElement("select", {
    value: formData.reference,
    onChange: e => setFormData({
      ...formData,
      reference: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, activeTrainingTasks.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t))), formData.type === 'offtime' && /*#__PURE__*/React.createElement("select", {
    value: formData.reference,
    onChange: e => setFormData({
      ...formData,
      reference: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, activeOfftimeTasks.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide"
  }, "Auslastung: ", /*#__PURE__*/React.createElement("span", {
    className: "text-gea-600 font-medium"
  }, pct, "%"), /*#__PURE__*/React.createElement("span", {
    className: "text-slate-400 ml-2"
  }, "(", formData.hours ?? HOURS_PER_WEEK, "h)")), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0",
    max: "200",
    step: "10",
    value: pct,
    onChange: e => setFormData({
      ...formData,
      hours: Math.round(parseInt(e.target.value) / 100 * empWeeklyHours)
    }),
    className: "w-full accent-gea-600"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-xs text-slate-400 mt-1"
  }, /*#__PURE__*/React.createElement("span", null, "0%"), /*#__PURE__*/React.createElement("span", null, "50%"), /*#__PURE__*/React.createElement("span", null, "100%"), /*#__PURE__*/React.createElement("span", null, "150%"), /*#__PURE__*/React.createElement("span", null, "200%"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide"
  }, "Kommentar (optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: formData.comment || '',
    onChange: e => setFormData({
      ...formData,
      comment: e.target.value
    }),
    placeholder: "Notiz zu dieser Planung\u2026",
    rows: 2,
    className: "w-full p-2 border border-slate-300 rounded-md text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gea-400"
  })), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-slate-100 pt-3"
  }, !formData.id && /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 cursor-pointer select-none"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: recurRule.enabled,
    onChange: e => setRecurRule(r => ({
      ...r,
      enabled: e.target.checked
    })),
    className: "rounded accent-gea-600"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium uppercase tracking-wide text-slate-500 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(IconRepeat, {
    size: 12
  }), " Wiederkehrend (Regel)")), recurRule.enabled && !formData.id && /*#__PURE__*/React.createElement("div", {
    className: "mt-2 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-400 mb-1"
  }, "Alle X Wochen"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    max: "52",
    value: recurRule.everyXWeeks,
    onChange: e => setRecurRule(r => ({
      ...r,
      everyXWeeks: Math.max(1, parseInt(e.target.value) || 1)
    })),
    className: "w-20 p-2 border border-slate-300 rounded-md text-sm text-center"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-400 mb-1"
  }, "Bis Woche"), /*#__PURE__*/React.createElement("input", {
    type: "week",
    value: recurRule.endWeek,
    min: addWeeks(formData.week, 1),
    onChange: e => setRecurRule(r => ({
      ...r,
      endWeek: e.target.value
    })),
    className: "w-full p-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gea-400"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-slate-50 border-t border-slate-100 flex justify-between"
  }, formData.id ? /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onDelete(formData.id),
    className: "text-rose-600 text-sm hover:bg-rose-50 px-3 py-2 rounded font-medium"
  }, "L\xF6schen"), formData.ruleId && onDeleteSeries && /*#__PURE__*/React.createElement("button", {
    onClick: () => onDeleteSeries(formData.id),
    className: "text-rose-500 text-xs hover:bg-rose-50 px-2 py-1 rounded font-medium border border-rose-200 flex items-center gap-1",
    title: "Diese und alle sp\xE4teren Instanzen der Serie l\xF6schen"
  }, /*#__PURE__*/React.createElement(IconRepeat, {
    size: 11
  }), " Serie ab hier l\xF6schen")) : /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium"
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    className: "px-4 py-2 text-sm text-white bg-gea-600 rounded-md hover:bg-gea-700 font-medium"
  }, "Speichern")))));
};
const CopyModal = ({
  copyContext,
  activeEmps,
  empsByCategory,
  empCategories,
  weeks,
  projectById,
  assignments,
  setAssignments,
  onClose
}) => {
  const {
    assignment
  } = copyContext;
  const [selWeeks, setSelWeeks] = useState({});
  const [selEmps, setSelEmps] = useState({});
  const [collapsedTeams, setCollapsedTeams] = useState(() => {
    const init = {};
    (empCategories || []).forEach(cat => {
      init[cat] = true;
    });
    return init;
  });
  const toggleWeek = wId => setSelWeeks(prev => ({
    ...prev,
    [wId]: !prev[wId]
  }));
  const toggleEmp = eId => setSelEmps(prev => ({
    ...prev,
    [eId]: !prev[eId]
  }));
  const toggleTeam = cat => setCollapsedTeams(prev => ({
    ...prev,
    [cat]: !prev[cat]
  }));
  const toggleAllWeeks = () => {
    const allSelected = weeks.every(w => selWeeks[w.id]);
    const next = {};
    weeks.forEach(w => {
      next[w.id] = !allSelected;
    });
    setSelWeeks(next);
  };
  const toggleAllInTeam = cat => {
    const catEmps = empsByCategory?.get(cat) || [];
    const allSel = catEmps.every(e => selEmps[e.id]);
    setSelEmps(prev => {
      const next = {
        ...prev
      };
      catEmps.forEach(e => {
        next[e.id] = !allSel;
      });
      return next;
    });
  };
  let label = assignment.reference;
  if (assignment.type === 'project') {
    const p = projectById.get(assignment.reference);
    label = p ? p.name : assignment.reference;
  }
  const handleCopy = () => {
    const targetWeeks = weeks.filter(w => selWeeks[w.id]).map(w => w.id);
    const targetEmps = activeEmps.filter(e => selEmps[e.id]).map(e => e.id);
    if (targetWeeks.length === 0 || targetEmps.length === 0) return;
    const newAssignments = [];
    targetEmps.forEach(empId => {
      targetWeeks.forEach(week => {
        if (empId === assignment.empId && week === assignment.week) return;
        const exists = assignments.some(a => a.empId === empId && a.week === week && a.reference === assignment.reference && a.type === assignment.type);
        if (!exists) {
          newAssignments.push({
            ...assignment,
            id: makeId('ass'),
            empId,
            week
          });
        }
      });
    });
    setAssignments(prev => [...prev, ...newAssignments]);
    onClose();
  };
  const pct = Math.round((assignment.hours ?? HOURS_PER_WEEK) / HOURS_PER_WEEK * 100);
  const selEmpCount = Object.values(selEmps).filter(Boolean).length;
  const selWeekCount = Object.values(selWeeks).filter(Boolean).length;

  // Use team grouping if available, otherwise fall back to flat list
  const useTeams = empsByCategory && empCategories && empCategories.length > 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
  }, /*#__PURE__*/React.createElement(ModalHeader, {
    title: "Task kopieren",
    subtitle: `"${label}" · ${pct}%`,
    onClose: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 overflow-y-auto p-6 space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-medium text-slate-700 mb-3"
  }, "Mitarbeiter ausw\xE4hlen"), useTeams ? /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 border border-slate-200 rounded-lg overflow-hidden"
  }, empCategories.map(cat => {
    const catEmps = empsByCategory.get(cat) || [];
    if (catEmps.length === 0) return null;
    const isCollapsed = collapsedTeams[cat];
    const selInTeam = catEmps.filter(e => selEmps[e.id]).length;
    const allInTeam = catEmps.every(e => selEmps[e.id]);
    return /*#__PURE__*/React.createElement("div", {
      key: cat,
      className: "border-b border-slate-100 last:border-0"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors"
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleTeam(cat),
      className: "flex items-center gap-2 flex-1 text-left"
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: `text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`
    }, /*#__PURE__*/React.createElement("polyline", {
      points: "6 9 12 15 18 9"
    })), /*#__PURE__*/React.createElement("span", {
      className: "text-xs font-semibold text-slate-600 uppercase tracking-wide"
    }, cat), selInTeam > 0 && /*#__PURE__*/React.createElement("span", {
      className: "ml-1 text-xs bg-gea-100 text-gea-700 px-1.5 py-0.5 rounded-full font-medium"
    }, selInTeam, "/", catEmps.length)), /*#__PURE__*/React.createElement("button", {
      onClick: () => toggleAllInTeam(cat),
      className: `text-xs font-medium px-2 py-0.5 rounded transition-colors ${allInTeam ? 'text-gea-600 hover:text-gea-800' : 'text-slate-500 hover:text-gea-600'}`
    }, allInTeam ? 'Alle ab' : 'Alle')), !isCollapsed && /*#__PURE__*/React.createElement("div", {
      className: "flex flex-wrap gap-2 px-3 py-2.5 bg-white"
    }, catEmps.map(e => /*#__PURE__*/React.createElement("button", {
      key: e.id,
      onClick: () => toggleEmp(e.id),
      className: `px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${selEmps[e.id] ? 'bg-gea-600 text-white border-gea-600' : 'bg-white text-slate-600 border-slate-300 hover:border-gea-400'}`
    }, e.name))));
  })) : /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, activeEmps.map(e => /*#__PURE__*/React.createElement("button", {
    key: e.id,
    onClick: () => toggleEmp(e.id),
    className: `px-3 py-1.5 rounded-full text-sm border font-medium transition-colors ${selEmps[e.id] ? 'bg-gea-600 text-white border-gea-600' : 'bg-white text-slate-600 border-slate-300 hover:border-gea-400'}`
  }, e.name)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center mb-3"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-sm font-medium text-slate-700"
  }, "Wochen ausw\xE4hlen"), /*#__PURE__*/React.createElement("button", {
    onClick: toggleAllWeeks,
    className: "text-xs text-gea-600 hover:text-gea-700 font-medium"
  }, "Alle ", weeks.every(w => selWeeks[w.id]) ? 'abwählen' : 'auswählen')), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap gap-1.5 max-h-48 overflow-y-auto"
  }, weeks.map(w => {
    const isSource = w.id === assignment.week;
    return /*#__PURE__*/React.createElement("button", {
      key: w.id,
      onClick: () => toggleWeek(w.id),
      title: isSource ? 'Ursprungswoche (für andere MA kopierbar)' : '',
      className: `px-2.5 py-1 rounded text-xs border font-medium transition-colors ${selWeeks[w.id] ? 'bg-gea-600 text-white border-gea-600' : isSource ? 'bg-amber-50 text-amber-700 border-amber-300 hover:border-gea-400' : 'bg-white text-slate-600 border-slate-200 hover:border-gea-300'}`
    }, w.label, isSource ? ' ★' : '');
  })))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-400"
  }, selEmpCount, " MA \xD7 ", selWeekCount, " KW = ", selEmpCount * selWeekCount, " Eintr\xE4ge"), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium"
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCopy,
    className: "px-4 py-2 text-sm text-white bg-gea-600 rounded-md hover:bg-gea-700 font-medium flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(IconCopy, {
    size: 15
  }), " Kopieren")))));
};
const CostItemModal = ({
  projectId,
  existingItem,
  assignments,
  employees,
  costItems,
  setCostItems,
  onClose
}) => {
  const projAssignments = assignments.filter(a => a.reference === projectId);
  const empIds = [...new Set(projAssignments.map(a => a.empId))];
  const projEmployees = employees.filter(e => empIds.includes(e.id));
  const kwRangeFromDates = (from, to) => {
    if (!from) return null;
    const kwFrom = parseInt(getWeekString(new Date(from)).split('-W')[1]);
    const kwTo = to ? parseInt(getWeekString(new Date(to)).split('-W')[1]) : kwFrom;
    return kwFrom === kwTo ? `KW${kwFrom}` : `KW${kwFrom}–${kwTo}`;
  };
  const [form, setForm] = useState({
    empId: existingItem?.empId || projEmployees[0]?.id || '',
    type: existingItem?.type || 'Reisekosten',
    description: existingItem?.description || '',
    dateFrom: existingItem?.dateFrom || '',
    dateTo: existingItem?.dateTo || '',
    hours: existingItem?.hours != null ? String(existingItem.hours) : '',
    hourlyRate: existingItem?.hourlyRate != null ? String(existingItem.hourlyRate) : '',
    amount: existingItem?.amount != null ? String(existingItem.amount) : ''
  });
  const [extraCosts, setExtraCosts] = useState(existingItem?.extraCosts || []);
  const updateExtra = (i, field, val) => setExtraCosts(prev => prev.map((c, idx) => idx === i ? {
    ...c,
    [field]: val
  } : c));
  const addExtra = () => setExtraCosts(prev => [...prev, {
    id: makeId('ec'),
    type: '',
    amount: ''
  }]);
  const removeExtra = i => setExtraCosts(prev => prev.filter((_, idx) => idx !== i));
  const autoAmount = form.hours !== '' && form.hourlyRate !== '' ? (parseFloat(form.hours) || 0) * (parseFloat(form.hourlyRate) || 0) : null;
  const handleSave = () => {
    if (!form.empId) return;
    const mainAmount = autoAmount !== null ? autoAmount : parseFloat(form.amount) || 0;
    const extraTotal = extraCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
    const item = {
      id: existingItem?.id || makeId('ci'),
      projectId,
      empId: form.empId,
      type: form.type,
      description: form.description,
      dateFrom: form.dateFrom || null,
      dateTo: form.dateTo || null,
      week: form.dateFrom ? getWeekString(new Date(form.dateFrom)) : null,
      hours: form.hours !== '' ? parseFloat(form.hours) : null,
      hourlyRate: form.hourlyRate !== '' ? parseFloat(form.hourlyRate) : null,
      amount: mainAmount + extraTotal,
      mainAmount,
      extraCosts: extraCosts.filter(c => c.type || c.amount).map(c => ({
        ...c,
        amount: parseFloat(c.amount) || 0
      }))
    };
    if (existingItem) {
      setCostItems(costItems.map(c => c.id === existingItem.id ? item : c));
    } else {
      setCostItems([...costItems, item]);
    }
    onClose();
  };
  const handleDelete = () => {
    setCostItems(costItems.filter(c => c.id !== existingItem.id));
    onClose();
  };
  const kwLabel = kwRangeFromDates(form.dateFrom, form.dateTo);
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
  }, /*#__PURE__*/React.createElement(ModalHeader, {
    title: existingItem ? 'Kostenpunkt bearbeiten' : 'Kostenpunkt erfassen',
    onClose: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "p-6 space-y-4 overflow-y-auto max-h-[80vh]"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Mitarbeiter"), /*#__PURE__*/React.createElement("select", {
    value: form.empId,
    onChange: e => setForm({
      ...form,
      empId: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Bitte w\xE4hlen\u2026"), projEmployees.map(e => /*#__PURE__*/React.createElement("option", {
    key: e.id,
    value: e.id
  }, e.name)), employees.filter(e => !empIds.includes(e.id)).map(e => /*#__PURE__*/React.createElement("option", {
    key: e.id,
    value: e.id
  }, e.name, " (nicht verplant)")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Art"), /*#__PURE__*/React.createElement("select", {
    value: form.type,
    onChange: e => setForm({
      ...form,
      type: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  }, /*#__PURE__*/React.createElement("option", {
    value: "Reisekosten"
  }, "Reisekosten"), /*#__PURE__*/React.createElement("option", {
    value: "Dienstleistung"
  }, "Dienstleistung"), /*#__PURE__*/React.createElement("option", {
    value: "Sonstiges"
  }, "Sonstiges"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Beschreibung"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: form.description,
    onChange: e => setForm({
      ...form,
      description: e.target.value
    }),
    placeholder: "z.B. Vor-Ort-Einsatz",
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Zeitraum (optional)", kwLabel && /*#__PURE__*/React.createElement("span", {
    className: "ml-2 text-gea-600 font-medium"
  }, kwLabel)), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "block text-xs text-slate-400 mb-1"
  }, "Von"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.dateFrom,
    onChange: e => setForm({
      ...form,
      dateFrom: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "block text-xs text-slate-400 mb-1"
  }, "Bis"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    value: form.dateTo,
    min: form.dateFrom,
    onChange: e => setForm({
      ...form,
      dateTo: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Stunden (opt.)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    step: "0.5",
    value: form.hours,
    onChange: e => setForm({
      ...form,
      hours: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm",
    placeholder: "z.B. 40"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "\u20AC/Std. (opt.)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    step: "1",
    value: form.hourlyRate,
    onChange: e => setForm({
      ...form,
      hourlyRate: e.target.value
    }),
    className: "w-full p-2 border border-slate-300 rounded-md text-sm",
    placeholder: `${DEFAULT_HOURLY_RATE}`
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-slate-500 mb-1 font-medium"
  }, "Betrag (\u20AC)", autoAmount !== null && /*#__PURE__*/React.createElement("span", {
    className: "ml-1 text-gea-600"
  }, "= ", autoAmount.toFixed(2))), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    step: "0.01",
    value: autoAmount !== null ? autoAmount.toFixed(2) : form.amount,
    onChange: e => setForm({
      ...form,
      amount: e.target.value
    }),
    disabled: autoAmount !== null,
    className: `w-full p-2 border border-slate-300 rounded-md text-sm ${autoAmount !== null ? 'bg-slate-50 text-slate-400' : ''}`,
    placeholder: "0.00"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "border border-slate-200 rounded-lg overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium text-slate-600"
  }, "Weitere Kosten"), /*#__PURE__*/React.createElement("button", {
    onClick: addExtra,
    className: "text-xs text-gea-600 hover:text-gea-700 font-medium flex items-center gap-1"
  }, /*#__PURE__*/React.createElement(IconPlus, {
    size: 12
  }), " Hinzuf\xFCgen")), extraCosts.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 text-xs text-slate-400"
  }, "Noch keine Zusatzkosten. Auf ", /*#__PURE__*/React.createElement("strong", null, "+ Hinzuf\xFCgen"), " klicken.") : /*#__PURE__*/React.createElement("div", {
    className: "p-3 space-y-2"
  }, extraCosts.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    className: "flex gap-2 items-center"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: c.type,
    onChange: e => updateExtra(i, 'type', e.target.value),
    placeholder: "Kostenart (z.B. Dienstleistung)",
    className: "flex-1 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "0",
    step: "0.01",
    value: c.amount,
    onChange: e => updateExtra(i, 'amount', e.target.value),
    placeholder: "\u20AC",
    className: "w-28 p-2 border border-slate-300 rounded text-sm"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeExtra(i),
    className: "text-slate-400 hover:text-rose-500 p-1 flex-shrink-0"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 14
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-slate-50 border-t border-slate-100 flex justify-between"
  }, existingItem ? /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete,
    className: "text-rose-600 text-sm hover:bg-rose-50 px-3 py-2 rounded font-medium"
  }, "L\xF6schen") : /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    className: "px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 font-medium"
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    onClick: handleSave,
    className: "px-4 py-2 text-sm text-white bg-gea-600 rounded-md hover:bg-gea-700 font-medium"
  }, "Speichern")))));
};

// --- DEPENDENCIES / SECURITY INFO ---
const DEPS_LIST = [{
  name: 'React',
  pkg: 'react',
  cdnUrl: 'https://unpkg.com/react@18.3.1/umd/react.development.js',
  getLoaded: () => window.React?.version,
  desc: 'Kern-Bibliothek für die UI-Komponenten. Verwaltet den Anwendungsstatus und sorgt für effizientes Neurendering bei Datenänderungen.'
}, {
  name: 'ReactDOM',
  pkg: 'react-dom',
  cdnUrl: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  getLoaded: () => window.ReactDOM?.version,
  desc: 'Verbindet React mit dem Browser-DOM. Rendert die React-Komponentenstruktur in die HTML-Seite.'
}, {
  name: 'Babel Standalone',
  pkg: '@babel/standalone',
  cdnUrl: 'https://unpkg.com/@babel/standalone@7.27.1/babel.min.js',
  getLoaded: () => window.Babel?.version,
  desc: 'Kompiliert JSX-Syntax (HTML-in-JavaScript) direkt im Browser zu normalem JavaScript, da kein Build-Server vorhanden ist.'
}, {
  name: 'Tailwind CSS',
  pkg: 'tailwindcss',
  cdnUrl: 'https://cdn.tailwindcss.com',
  getLoaded: () => window.tailwind?.version || '(Play CDN)',
  desc: 'CSS-Utility-Framework für das gesamte Styling der App. Die Play-CDN-Version wird direkt im Browser generiert – keine separate CSS-Datei nötig.'
}];
const DepsSection = () => {
  const [latest, setLatest] = React.useState({});
  const [checking, setChecking] = React.useState(false);
  const [checked, setChecked] = React.useState(false);
  const checkUpdates = async () => {
    setChecking(true);
    const results = {};
    await Promise.all(DEPS_LIST.map(async dep => {
      try {
        const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(dep.pkg)}/latest`, {
          cache: 'no-store'
        });
        if (!r.ok) throw new Error('http ' + r.status);
        const d = await r.json();
        results[dep.pkg] = d.version || '–';
      } catch (e) {
        results[dep.pkg] = '–';
      }
    }));
    setLatest(results);
    setChecking(false);
    setChecked(true);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "mt-8 text-left border border-slate-200 rounded-lg overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-semibold text-slate-700"
  }, "Verwendete Bibliotheken"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 mt-0.5"
  }, "Externe Skripte, die beim Laden der Seite eingebunden werden (CDN).")), /*#__PURE__*/React.createElement("button", {
    onClick: checkUpdates,
    disabled: checking,
    className: "text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-600 hover:border-gea-400 hover:text-gea-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
  }, checking ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("svg", {
    className: "animate-spin",
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  })), "Pr\xFCfe\u2026") : 'Auf Updates prüfen')), /*#__PURE__*/React.createElement("table", {
    className: "w-full text-xs"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "text-left text-slate-500 border-b border-slate-100"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-medium"
  }, "Bibliothek"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-medium"
  }, "Geladen"), checked && /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-medium"
  }, "Aktuell"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-2 font-medium"
  }, "Quelle"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-50"
  }, DEPS_LIST.map(dep => {
    const loaded = dep.getLoaded();
    const latestVer = latest[dep.pkg];
    const isUpToDate = latestVer && loaded && latestVer === loaded;
    const isOutdated = latestVer && loaded && latestVer !== loaded && loaded !== '(Play CDN)';
    return /*#__PURE__*/React.createElement("tr", {
      key: dep.pkg,
      className: "hover:bg-slate-50"
    }, /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-2.5 font-medium text-slate-700"
    }, /*#__PURE__*/React.createElement("span", {
      className: "flex items-center gap-1.5"
    }, dep.name, /*#__PURE__*/React.createElement("span", {
      className: "relative group/tip cursor-help"
    }, /*#__PURE__*/React.createElement("span", {
      className: "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-xs font-bold leading-none select-none"
    }, "?"), /*#__PURE__*/React.createElement("span", {
      className: "pointer-events-none absolute left-5 top-0 z-50 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg",
      style: {
        whiteSpace: 'normal'
      }
    }, dep.desc)))), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-2.5"
    }, loaded ? /*#__PURE__*/React.createElement("span", {
      className: "font-mono text-slate-600"
    }, loaded) : /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "\u2013")), checked && /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-2.5"
    }, latestVer && latestVer !== '–' ? /*#__PURE__*/React.createElement("span", {
      className: `font-mono px-1.5 py-0.5 rounded text-xs ${isUpToDate ? 'bg-emerald-50 text-emerald-700' : isOutdated ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`
    }, latestVer, " ", isUpToDate ? '✓' : isOutdated ? '↑' : '') : /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400"
    }, "\u2013")), /*#__PURE__*/React.createElement("td", {
      className: "px-4 py-2.5 max-w-xs"
    }, /*#__PURE__*/React.createElement("a", {
      href: dep.cdnUrl,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "text-gea-600 hover:text-gea-800 underline truncate block font-mono",
      style: {
        maxWidth: '220px'
      }
    }, dep.cdnUrl.replace('https://', ''))));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-2.5 bg-slate-50 border-t border-slate-100"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, "Alle Verbindungen erfolgen \xFCber ", /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-500"
  }, "HTTPS"), ". Quellen: ", /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-500"
  }, "unpkg.com"), ", ", /*#__PURE__*/React.createElement("strong", {
    className: "text-slate-500"
  }, "cdn.tailwindcss.com"), ". Die App l\xE4uft vollst\xE4ndig im Browser \u2013 kein Backend, keine Telemetrie.")));
};

// --- MAIN APP ---