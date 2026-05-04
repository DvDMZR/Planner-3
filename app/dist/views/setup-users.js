// ─── BENUTZERVERWALTUNG ──────────────────────────────────────────────────────
const SetupUsersView = ({
  s,
  h
}) => {
  const {
    useState
  } = React;
  const {
    currentUser,
    appUsers
  } = s;
  const {
    setAppUsers,
    loginUser
  } = h;
  const isAdmin = currentUser?.role === 'admin';

  // Shared edit state (used by both admin full-edit and self-PIN-only edit)
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [newError, setNewError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPin, setEditPin] = useState('');
  const [editPinConfirm, setEditPinConfirm] = useState('');
  const [editError, setEditError] = useState('');
  const [editName, setEditName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  if (!currentUser) {
    return /*#__PURE__*/React.createElement("main", {
      className: "flex-1 flex items-center justify-center text-slate-400 text-sm"
    }, "Kein Zugriff \u2013 bitte anmelden.");
  }
  const showSuccess = msg => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 2500);
  };
  const handleAdd = () => {
    if (!newName.trim()) {
      setNewError('Name darf nicht leer sein.');
      return;
    }
    if (newPin.length < 4) {
      setNewError('PIN muss mindestens 4 Zeichen haben.');
      return;
    }
    if (newPin !== newPinConfirm) {
      setNewError('PINs stimmen nicht überein.');
      return;
    }
    if (appUsers.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) {
      setNewError('Ein Nutzer mit diesem Namen existiert bereits.');
      return;
    }
    const user = {
      id: makeId('usr'),
      name: newName.trim(),
      pin: newPin,
      role: 'active'
    };
    setAppUsers(prev => [...prev, user]);
    setNewName('');
    setNewPin('');
    setNewPinConfirm('');
    setNewError('');
    showSuccess(`Nutzer „${user.name}" wurde angelegt.`);
  };
  const handleDelete = id => {
    const user = appUsers.find(u => u.id === id);
    if (!user) return;
    if (!window.confirm(`Nutzer „${user.name}" wirklich löschen?`)) return;
    setAppUsers(prev => prev.filter(u => u.id !== id));
    showSuccess(`Nutzer „${user.name}" wurde gelöscht.`);
  };
  const startEdit = user => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditPin('');
    setEditPinConfirm('');
    setEditError('');
  };
  const handleSaveEdit = user => {
    if (isAdmin && !editName.trim()) {
      setEditError('Name darf nicht leer sein.');
      return;
    }
    if (editPin && editPin.length < 4) {
      setEditError('PIN muss mindestens 4 Zeichen haben.');
      return;
    }
    if (editPin && editPin !== editPinConfirm) {
      setEditError('PINs stimmen nicht überein.');
      return;
    }
    if (!editPin) {
      setEditError('Bitte einen neuen PIN eingeben.');
      return;
    }
    const updated = {
      ...user,
      name: isAdmin ? editName.trim() : user.name,
      pin: editPin
    };
    setAppUsers(prev => prev.map(u => u.id === user.id ? updated : u));
    if (currentUser.id === user.id) loginUser(updated);
    setEditingId(null);
    showSuccess(`PIN für „${updated.name}" wurde gespeichert.`);
  };

  // Whether this row is editable by the current user
  const canEdit = user => isAdmin ? user.role !== 'admin' : user.id === currentUser.id;
  return /*#__PURE__*/React.createElement("main", {
    className: "flex-1 overflow-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-2xl mx-auto p-6 space-y-8"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-semibold text-slate-900 mb-1"
  }, "Benutzer"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-slate-500"
  }, isAdmin ? 'Aktive Nutzer können sich anmelden und Änderungen vornehmen.' : 'Sie können Ihren eigenen PIN hier ändern.')), successMsg && /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm"
  }, successMsg), /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 bg-slate-50 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-700 uppercase tracking-wide"
  }, "Nutzer")), appUsers.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-6 text-center text-slate-400 text-sm"
  }, "Keine Nutzer vorhanden.") : /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-slate-100"
  }, appUsers.map(user => /*#__PURE__*/React.createElement("div", {
    key: user.id
  }, editingId === user.id ? /*#__PURE__*/React.createElement("div", {
    className: "p-4 space-y-3 bg-gea-50"
  }, isAdmin && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-600 mb-1"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: editName,
    onChange: e => {
      setEditName(e.target.value);
      setEditError('');
    },
    className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-600 mb-1"
  }, "Neuer PIN"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: editPin,
    autoFocus: true,
    onChange: e => {
      setEditPin(e.target.value);
      setEditError('');
    },
    className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400",
    placeholder: "Min. 4 Zeichen"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-600 mb-1"
  }, "PIN best\xE4tigen"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: editPinConfirm,
    onChange: e => {
      setEditPinConfirm(e.target.value);
      setEditError('');
    },
    onKeyDown: e => e.key === 'Enter' && handleSaveEdit(user),
    className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400",
    placeholder: "Wiederholen"
  }))), editError && /*#__PURE__*/React.createElement("p", {
    className: "text-rose-600 text-xs"
  }, editError), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditingId(null),
    className: "px-3 py-1.5 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
  }, "Abbrechen"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleSaveEdit(user),
    className: "px-3 py-1.5 text-xs rounded bg-gea-600 text-white hover:bg-gea-700 transition-colors"
  }, "Speichern"))) : /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 px-4 py-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.role === 'admin' ? 'bg-gea-100 text-gea-700' : 'bg-slate-100 text-slate-600'}`
  }, user.name.slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-medium text-slate-900 truncate"
  }, user.name), user.role === 'admin' && /*#__PURE__*/React.createElement("span", {
    className: "text-xs px-1.5 py-0.5 rounded-full bg-gea-100 text-gea-700 font-medium shrink-0"
  }, "Admin"), currentUser.id === user.id && /*#__PURE__*/React.createElement("span", {
    className: "text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0"
  }, "Ich"))), canEdit(user) && /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 shrink-0"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => startEdit(user),
    className: "px-2.5 py-1.5 text-xs rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
  }, isAdmin ? 'Bearbeiten' : 'PIN ändern'), isAdmin && /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDelete(user.id),
    className: "px-2.5 py-1.5 text-xs rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
  }, "L\xF6schen"))))))), isAdmin && /*#__PURE__*/React.createElement("div", {
    className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "px-4 py-3 bg-slate-50 border-b border-slate-200"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-semibold text-slate-700 uppercase tracking-wide"
  }, "Neuen Nutzer anlegen")), /*#__PURE__*/React.createElement("div", {
    className: "p-4 space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-600 mb-1"
  }, "Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: newName,
    onChange: e => {
      setNewName(e.target.value);
      setNewError('');
    },
    className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400",
    placeholder: "z.B. Max Mustermann"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-600 mb-1"
  }, "PIN"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: newPin,
    onChange: e => {
      setNewPin(e.target.value);
      setNewError('');
    },
    className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400",
    placeholder: "Min. 4 Zeichen"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold text-slate-600 mb-1"
  }, "PIN best\xE4tigen"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    value: newPinConfirm,
    onChange: e => {
      setNewPinConfirm(e.target.value);
      setNewError('');
    },
    onKeyDown: e => e.key === 'Enter' && handleAdd(),
    className: "w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400",
    placeholder: "Wiederholen"
  }))), newError && /*#__PURE__*/React.createElement("p", {
    className: "text-rose-600 text-xs"
  }, newError), /*#__PURE__*/React.createElement("button", {
    onClick: handleAdd,
    className: "px-4 py-2 bg-gea-600 text-white rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors"
  }, "Nutzer anlegen"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-slate-400"
  }, "Neue Nutzer erhalten die Rolle \u201EAktiver Nutzer\".")))));
};