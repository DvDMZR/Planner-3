// ─── BENUTZERVERWALTUNG (Admin only) ────────────────────────────────────────
const SetupUsersView = ({ s, h }) => {
    const { useState } = React;
    const { currentUser, appUsers } = s;
    const { setAppUsers, loginUser } = h;

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

    if (currentUser?.role !== 'admin') {
        return (
            <main className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Kein Zugriff – nur für Administratoren.
            </main>
        );
    }

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 2500);
    };

    const handleAdd = () => {
        if (!newName.trim()) { setNewError('Name darf nicht leer sein.'); return; }
        if (newPin.length < 4) { setNewError('PIN muss mindestens 4 Zeichen haben.'); return; }
        if (newPin !== newPinConfirm) { setNewError('PINs stimmen nicht überein.'); return; }
        if (appUsers.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) {
            setNewError('Ein Nutzer mit diesem Namen existiert bereits.'); return;
        }
        const user = { id: makeId('usr'), name: newName.trim(), pin: newPin, role: 'active' };
        setAppUsers(prev => [...prev, user]);
        setNewName(''); setNewPin(''); setNewPinConfirm(''); setNewError('');
        showSuccess(`Nutzer „${user.name}" wurde angelegt.`);
    };

    const handleDelete = (id) => {
        const user = appUsers.find(u => u.id === id);
        if (!user) return;
        if (!window.confirm(`Nutzer „${user.name}" wirklich löschen?`)) return;
        setAppUsers(prev => prev.filter(u => u.id !== id));
        showSuccess(`Nutzer „${user.name}" wurde gelöscht.`);
    };

    const startEdit = (user) => {
        setEditingId(user.id);
        setEditName(user.name);
        setEditPin('');
        setEditPinConfirm('');
        setEditError('');
    };

    const handleSaveEdit = (user) => {
        if (!editName.trim()) { setEditError('Name darf nicht leer sein.'); return; }
        if (editPin && editPin.length < 4) { setEditError('PIN muss mindestens 4 Zeichen haben.'); return; }
        if (editPin && editPin !== editPinConfirm) { setEditError('PINs stimmen nicht überein.'); return; }
        const updated = {
            ...user,
            name: editName.trim(),
            pin: editPin || user.pin,
        };
        setAppUsers(prev => prev.map(u => u.id === user.id ? updated : u));
        // Update session if editing yourself
        if (currentUser.id === user.id) {
            loginUser(updated);
        }
        setEditingId(null);
        showSuccess(`Nutzer „${updated.name}" wurde gespeichert.`);
    };

    return (
        <main className="flex-1 overflow-auto">
            <div className="max-w-2xl mx-auto p-6 space-y-8">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-1">Benutzerverwaltung</h2>
                    <p className="text-sm text-slate-500">Aktive Nutzer können sich anmelden und Änderungen vornehmen. Passive Nutzer sehen die Planung ohne sich anzumelden.</p>
                </div>

                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm">
                        {successMsg}
                    </div>
                )}

                {/* Nutzerliste */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Aktive Nutzer</h3>
                    </div>
                    {appUsers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Keine Nutzer vorhanden.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {appUsers.map(user => (
                                <div key={user.id}>
                                    {editingId === user.id ? (
                                        <div className="p-4 space-y-3 bg-gea-50">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={e => { setEditName(e.target.value); setEditError(''); }}
                                                        className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                        Rolle
                                                    </label>
                                                    <input type="text" disabled value={user.role === 'admin' ? 'Administrator' : 'Aktiver Nutzer'} className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50 text-slate-400"/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Neuer PIN <span className="text-slate-400 font-normal">(leer lassen = unverändert)</span></label>
                                                    <input
                                                        type="password"
                                                        value={editPin}
                                                        onChange={e => { setEditPin(e.target.value); setEditError(''); }}
                                                        className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                                        placeholder="Neuer PIN"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">PIN bestätigen</label>
                                                    <input
                                                        type="password"
                                                        value={editPinConfirm}
                                                        onChange={e => { setEditPinConfirm(e.target.value); setEditError(''); }}
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(user)}
                                                        className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                                        placeholder="Wiederholen"
                                                    />
                                                </div>
                                            </div>
                                            {editError && <p className="text-rose-600 text-xs">{editError}</p>}
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Abbrechen</button>
                                                <button onClick={() => handleSaveEdit(user)} className="px-3 py-1.5 text-xs rounded bg-gea-600 text-white hover:bg-gea-700 transition-colors">Speichern</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.role === 'admin' ? 'bg-gea-100 text-gea-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {user.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-slate-900 truncate">{user.name}</span>
                                                    {user.role === 'admin' && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gea-100 text-gea-700 font-medium shrink-0">Admin</span>
                                                    )}
                                                    {currentUser.id === user.id && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0">Ich</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {user.role !== 'admin' && (<>
                                                    <button onClick={() => startEdit(user)} className="px-2.5 py-1.5 text-xs rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                                        Bearbeiten
                                                    </button>
                                                    <button onClick={() => handleDelete(user.id)} className="px-2.5 py-1.5 text-xs rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors">
                                                        Löschen
                                                    </button>
                                                </>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Neuen Nutzer anlegen */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Neuen Nutzer anlegen</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => { setNewName(e.target.value); setNewError(''); }}
                                    className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                    placeholder="z.B. Max Mustermann"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">PIN</label>
                                <input
                                    type="password"
                                    value={newPin}
                                    onChange={e => { setNewPin(e.target.value); setNewError(''); }}
                                    className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                    placeholder="Min. 4 Zeichen"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">PIN bestätigen</label>
                                <input
                                    type="password"
                                    value={newPinConfirm}
                                    onChange={e => { setNewPinConfirm(e.target.value); setNewError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                    placeholder="Wiederholen"
                                />
                            </div>
                        </div>
                        {newError && <p className="text-rose-600 text-xs">{newError}</p>}
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-gea-600 text-white rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors"
                        >
                            Nutzer anlegen
                        </button>
                        <p className="text-xs text-slate-400">Neue Nutzer erhalten die Rolle „Aktiver Nutzer".</p>
                    </div>
                </div>
            </div>
        </main>
    );
};
