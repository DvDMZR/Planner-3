// ─── VERLAUF / AUDIT-LOG ─────────────────────────────────────────────────────
const AuditView = ({
  s,
  h
}) => {
  const {
    useState
  } = React;
  const {
    currentUser,
    auditLog,
    employees,
    projects
  } = s;
  const {
    setAssignments,
    setEmployees,
    setProjects,
    setAuditLog
  } = h;
  const [filter, setFilter] = useState('all'); // 'all' | '7d' | '24h'
  const [undoConfirm, setUndoConfirm] = useState(null); // id of entry being confirmed

  if (!currentUser) {
    return /*#__PURE__*/React.createElement("main", {
      className: "flex-1 flex items-center justify-center text-slate-400 text-sm"
    }, "Bitte anmelden, um das \xC4nderungsprotokoll zu sehen.");
  }
  const now = Date.now();
  const filtered = auditLog.filter(entry => {
    if (filter === '24h') return now - new Date(entry.timestamp).getTime() < 86400000;
    if (filter === '7d') return now - new Date(entry.timestamp).getTime() < 604800000;
    return true;
  });
  const applyUndo = entry => {
    const {
      undoData
    } = entry;
    if (!undoData) return;
    const {
      type
    } = undoData;
    if (type === 'del_assignment') {
      setAssignments(prev => prev.filter(a => !undoData.ids.includes(a.id)));
    } else if (type === 'restore_assignment') {
      if (!undoData.prev) return;
      setAssignments(prev => {
        const exists = prev.some(a => a.id === undoData.prev.id);
        if (exists) return prev.map(a => a.id === undoData.prev.id ? undoData.prev : a);
        return [...prev, undoData.prev];
      });
    } else if (type === 'del_assignments') {
      setAssignments(prev => prev.filter(a => !undoData.ids.includes(a.id)));
    } else if (type === 'restore_assignments') {
      setAssignments(prev => {
        const restoreIds = new Set(undoData.prevItems.map(a => a.id));
        const kept = prev.filter(a => !restoreIds.has(a.id));
        return [...kept, ...undoData.prevItems];
      });
    } else if (type === 'del_employee') {
      setEmployees(prev => prev.filter(e => e.id !== undoData.id));
    } else if (type === 'restore_employee') {
      if (!undoData.prev) return;
      setEmployees(prev => {
        const exists = prev.some(e => e.id === undoData.prev.id);
        if (exists) return prev.map(e => e.id === undoData.prev.id ? undoData.prev : e);
        return [...prev, undoData.prev];
      });
    } else if (type === 'del_project') {
      setProjects(prev => prev.filter(p => p.id !== undoData.id));
    } else if (type === 'restore_project') {
      if (!undoData.prev) return;
      setProjects(prev => {
        const exists = prev.some(p => p.id === undoData.prev.id);
        if (exists) return prev.map(p => p.id === undoData.prev.id ? undoData.prev : p);
        return [...prev, undoData.prev];
      });
    }

    // Remove this entry from the log after undo
    setAuditLog(prev => prev.filter(e => e.id !== entry.id));
    setUndoConfirm(null);
  };
  const actionLabels = {
    assignment_create: 'Zuweisung erstellt',
    assignment_copy: 'Zuweisung(en) kopiert',
    assignment_update: 'Zuweisung bearbeitet',
    assignment_delete: 'Zuweisung gelöscht',
    assignment_delete_series: 'Terminserie gelöscht',
    assignment_drop: 'Zuweisung verschoben',
    employee_create: 'Mitarbeiter angelegt',
    employee_update: 'Mitarbeiter bearbeitet',
    employee_delete: 'Mitarbeiter gelöscht',
    project_create: 'Projekt angelegt',
    project_update: 'Projekt bearbeitet',
    project_delete: 'Projekt gelöscht'
  };
  const actionColors = {
    assignment_create: 'bg-emerald-100 text-emerald-800',
    assignment_copy: 'bg-blue-100 text-blue-800',
    assignment_update: 'bg-amber-100 text-amber-800',
    assignment_delete: 'bg-rose-100 text-rose-800',
    assignment_delete_series: 'bg-rose-100 text-rose-800',
    assignment_drop: 'bg-amber-100 text-amber-800',
    employee_create: 'bg-emerald-100 text-emerald-800',
    employee_update: 'bg-amber-100 text-amber-800',
    employee_delete: 'bg-rose-100 text-rose-800',
    project_create: 'bg-emerald-100 text-emerald-800',
    project_update: 'bg-amber-100 text-amber-800',
    project_delete: 'bg-rose-100 text-rose-800'
  };
  return /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-4xl mx-auto p-6 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-semibold text-slate-900 mb-1"
  }, "\xC4nderungsprotokoll"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, "Zeigt wer wann was ge\xE4ndert hat. Die R\xFCckg\xE4ngig-Funktion stellt den Zustand ", /*#__PURE__*/React.createElement("strong", null, "vor"), " der jeweiligen \xC4nderung wieder her.")), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-1 shrink-0"
  }, [['all', 'Alle'], ['7d', '7 Tage'], ['24h', '24 Std.']].map(([val, label]) => /*#__PURE__*/React.createElement("button", {
    key: val,
    onClick: () => setFilter(val),
    className: `px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filter === val ? 'bg-gea-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`
  }, label)))), filtered.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 text-sm"
  }, "Keine Eintr\xE4ge f\xFCr den gew\xE4hlten Zeitraum.") : /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    className: "bg-slate-50 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44"
  }, "Zeitpunkt"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-28"
  }, "Nutzer"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-40"
  }, "Aktion"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
  }, "Beschreibung"), /*#__PURE__*/React.createElement("th", {
    className: "px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide w-32"
  }))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-slate-100"
  }, filtered.map(entry => /*#__PURE__*/React.createElement("tr", {
    key: entry.id,
    className: "hover:bg-slate-50 transition-colors"
  }, /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-500 whitespace-nowrap"
  }, new Date(entry.timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-medium text-slate-700 truncate block max-w-[6rem]",
    title: entry.userName
  }, entry.userName)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: `text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[entry.action] || 'bg-slate-100 text-slate-600'}`
  }, actionLabels[entry.action] || entry.action)), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-xs text-slate-700",
    title: entry.description
  }, entry.description), /*#__PURE__*/React.createElement("td", {
    className: "px-4 py-3 text-right"
  }, entry.undoData && (undoConfirm === entry.id ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 justify-end"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-slate-500"
  }, "Sicher?"), /*#__PURE__*/React.createElement("button", {
    onClick: () => applyUndo(entry),
    className: "px-2 py-1 text-xs rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors font-medium"
  }, "Ja"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setUndoConfirm(null),
    className: "px-2 py-1 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
  }, "Nein")) : /*#__PURE__*/React.createElement("button", {
    onClick: () => setUndoConfirm(entry.id),
    title: "Zustand vor dieser \xC4nderung wiederherstellen",
    className: "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-auto"
  }, /*#__PURE__*/React.createElement(IconUndo, {
    size: 13
  }), " R\xFCckg\xE4ngig")))))))), auditLog.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400 text-right"
  }, auditLog.length, " Eintrag", auditLog.length !== 1 ? 'e' : '', " gespeichert (max. 500)")));
};