// ─── SYSTEM & EXPORT – kombinierter Verwaltungsreiter ────────────────────────
// Enthält: Benutzerverwaltung, Auto-Backup, Email-Vorlage, Daten-Export/Import,
// Rechnungsempfänger und System-Reset. Ersetzt den früher separaten
// "Benutzer"-Reiter.
const DataView = ({ s, h }) => {
    const { useState } = React;
    const { currentUser, appUsers, autoBackup, lastBackupAt, emailTemplate,
            invoiceRecipient } = s;
    const { setAppUsers, loginUser, setAutoBackup, runBackup, setEmailTemplate,
            setInvoiceRecipient, exportData, importData } = h;

    const isAdmin = currentUser?.role === 'admin';

    // ── User-Edit-State ──
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
        return (
            <main className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Kein Zugriff – bitte anmelden.
            </main>
        );
    }

    const showSuccess = (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 2500);
    };

    const handleAdd = async () => {
        if (!newName.trim()) { setNewError('Name darf nicht leer sein.'); return; }
        if (newPin.length < 4) { setNewError('PIN muss mindestens 4 Zeichen haben.'); return; }
        if (newPin !== newPinConfirm) { setNewError('PINs stimmen nicht überein.'); return; }
        if (appUsers.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) {
            setNewError('Ein Nutzer mit diesem Namen existiert bereits.'); return;
        }
        const pinSalt = generatePinSalt();
        const pinHash = await hashPin(newPin, pinSalt);
        const user = { id: makeId('usr'), name: newName.trim(), pinHash, pinSalt, role: 'active' };
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
        setEditingId(user.id); setEditName(user.name);
        setEditPin(''); setEditPinConfirm(''); setEditError('');
    };

    const handleSaveEdit = async (user) => {
        if (isAdmin && !editName.trim()) { setEditError('Name darf nicht leer sein.'); return; }
        if (editPin && editPin.length < 4) { setEditError('PIN muss mindestens 4 Zeichen haben.'); return; }
        if (editPin && editPin !== editPinConfirm) { setEditError('PINs stimmen nicht überein.'); return; }
        if (!editPin) { setEditError('Bitte einen neuen PIN eingeben.'); return; }
        const pinSalt = generatePinSalt();
        const pinHash = await hashPin(editPin, pinSalt);
        const { pin: _legacyPin, ...rest } = user;
        const updated = {
            ...rest,
            name: isAdmin ? editName.trim() : user.name,
            pinHash, pinSalt,
        };
        setAppUsers(prev => prev.map(u => u.id === user.id ? updated : u));
        if (currentUser.id === user.id) loginUser(updated);
        setEditingId(null);
        showSuccess(`PIN für „${updated.name}" wurde gespeichert.`);
    };

    const canEdit = (user) => isAdmin ? user.role !== 'admin' : user.id === currentUser.id;

    const section = (title, body) => (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
            </div>
            {body}
        </div>
    );

    return (
        <main className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto p-6 space-y-6">

                <div className="flex items-center gap-4">
                    <IconSettings size={36} className="text-slate-300 shrink-0"/>
                    <div>
                        <h2 className="text-xl text-slate-900 font-medium">System &amp; Export</h2>
                        <p className="text-sm text-slate-500">Benutzer, Sicherung, Vorlagen, Import/Export und System-Wartung.</p>
                    </div>
                </div>

                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-4 py-3 text-sm">
                        {successMsg}
                    </div>
                )}

                {/* ── Benutzer ─────────────────────────────────────────── */}
                {section('Benutzer', (
                    appUsers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-slate-400 text-sm">Keine Nutzer vorhanden.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {appUsers.map(user => (
                                <div key={user.id}>
                                    {editingId === user.id ? (
                                        <div className="p-4 space-y-3 bg-gea-50">
                                            {isAdmin && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                                                    <input type="text" value={editName}
                                                        onChange={e => { setEditName(e.target.value); setEditError(''); }}
                                                        className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"/>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Neuer PIN</label>
                                                    <input type="password" value={editPin} autoFocus
                                                        onChange={e => { setEditPin(e.target.value); setEditError(''); }}
                                                        className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                                        placeholder="Min. 4 Zeichen"/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">PIN bestätigen</label>
                                                    <input type="password" value={editPinConfirm}
                                                        onChange={e => { setEditPinConfirm(e.target.value); setEditError(''); }}
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveEdit(user)}
                                                        className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                                        placeholder="Wiederholen"/>
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
                                            {canEdit(user) && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => startEdit(user)} className="px-2.5 py-1.5 text-xs rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                                        {isAdmin ? 'Bearbeiten' : 'PIN ändern'}
                                                    </button>
                                                    {isAdmin && (
                                                        <button onClick={() => handleDelete(user.id)} className="px-2.5 py-1.5 text-xs rounded text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors">
                                                            Löschen
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ))}

                {/* Neuen Nutzer anlegen – Admins */}
                {isAdmin && section('Neuen Nutzer anlegen', (
                    <div className="p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                                <input type="text" value={newName}
                                    onChange={e => { setNewName(e.target.value); setNewError(''); }}
                                    className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                    placeholder="z.B. Max Mustermann"/>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">PIN</label>
                                <input type="password" value={newPin}
                                    onChange={e => { setNewPin(e.target.value); setNewError(''); }}
                                    className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                    placeholder="Min. 4 Zeichen"/>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">PIN bestätigen</label>
                                <input type="password" value={newPinConfirm}
                                    onChange={e => { setNewPinConfirm(e.target.value); setNewError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                    className="w-full p-2 border border-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gea-400"
                                    placeholder="Wiederholen"/>
                            </div>
                        </div>
                        {newError && <p className="text-rose-600 text-xs">{newError}</p>}
                        <button onClick={handleAdd}
                            className="px-4 py-2 bg-gea-600 text-white rounded-lg text-sm font-medium hover:bg-gea-700 transition-colors">
                            Nutzer anlegen
                        </button>
                        <p className="text-xs text-slate-400">Neue Nutzer erhalten die Rolle „Aktiver Nutzer".</p>
                    </div>
                ))}

                {/* Auto-Backup – Admins */}
                {isAdmin && autoBackup && section('Auto-Backup', (
                    <div className="p-4 space-y-3">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={!!autoBackup.enabled}
                                onChange={e => setAutoBackup(prev => ({ ...prev, enabled: e.target.checked }))}/>
                            Periodisches Backup nach SharePoint aktivieren
                        </label>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <span>Intervall:</span>
                            <input type="number" min="5" step="5"
                                value={autoBackup.intervalMinutes || 60}
                                onChange={e => {
                                    const v = parseInt(e.target.value, 10);
                                    if (!Number.isFinite(v) || v < 5) return;
                                    setAutoBackup(prev => ({ ...prev, intervalMinutes: v }));
                                }}
                                className="w-20 p-1 border border-slate-300 rounded text-sm"/>
                            <span>Minuten</span>
                        </div>
                        <div className="text-xs text-slate-500">
                            Letztes Backup: {lastBackupAt ? new Date(lastBackupAt).toLocaleString('de-DE') : '—'}
                        </div>
                        <button
                            onClick={async () => {
                                const res = await runBackup('manual');
                                showSuccess(res.ok
                                    ? `Backup wurde erstellt (${res.target === 'fs' ? 'lokal' : 'SharePoint'}).`
                                    : `Backup fehlgeschlagen: ${res.error || 'unbekannter Fehler'}`);
                            }}
                            className="px-3 py-1.5 text-xs rounded bg-gea-600 text-white hover:bg-gea-700 transition-colors">
                            Jetzt sichern
                        </button>
                        <p className="text-xs text-slate-400">
                            Backups landen in <code className="text-slate-600">planner-data/backups/</code>
                            {' '}als zeitgestempelte JSON-Dateien.
                        </p>
                    </div>
                ))}

                {/* Email-Vorlage – Admins */}
                {isAdmin && emailTemplate && section('Email-Vorlage (Planungs-Benachrichtigung)', (
                    <div className="p-4 space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Betreff</label>
                            <input type="text" value={emailTemplate.subject || ''}
                                onChange={e => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                                className="w-full p-2 border border-slate-300 rounded text-sm font-mono"/>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Text</label>
                            <textarea value={emailTemplate.body || ''}
                                onChange={e => setEmailTemplate(prev => ({ ...prev, body: e.target.value }))}
                                rows={12}
                                className="w-full p-2 border border-slate-300 rounded text-xs font-mono leading-relaxed"/>
                        </div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                            Verfügbare Platzhalter:
                            {' '}<code>{'{firstName}'}</code>,
                            {' '}<code>{'{refLabel}'}</code>,
                            {' '}<code>{'{typeLabel}'}</code>,
                            {' '}<code>{'{weekRange}'}</code>,
                            {' '}<code>{'{comment}'}</code>,
                            {' '}<code>{'{attachmentNote}'}</code>.<br/>
                            Optionale Blöcke (werden nur eingefügt, wenn der Wert vorhanden ist):
                            {' '}<code>{'{{#comment}}…{{/comment}}'}</code>,
                            {' '}<code>{'{{#attachmentNote}}…{{/attachmentNote}}'}</code>.
                        </div>
                        <button
                            onClick={() => { setEmailTemplate(DEFAULT_EMAIL_TEMPLATE); showSuccess('Vorlage zurückgesetzt.'); }}
                            className="px-3 py-1.5 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            Auf Standard zurücksetzen
                        </button>
                    </div>
                ))}

                {/* Rechnungsempfänger */}
                {section('Rechnungsempfänger', (
                    <div className="p-4">
                        <input type="email" value={invoiceRecipient}
                            onChange={e => setInvoiceRecipient(e.target.value)}
                            placeholder="rechnung@kunde.de"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gea-400"/>
                        <p className="text-xs text-slate-400 mt-1">Standard-Empfänger für den „Per E-Mail"-Button im Rechnungsdialog.</p>
                    </div>
                ))}

                {/* Export / Import */}
                {section('Export & Import', (
                    <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={exportData} className="bg-gea-600 hover:bg-gea-700 text-white py-3 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors">
                                <IconDownload size={18}/> Backup exportieren (JSON)
                            </button>
                            <div className="relative">
                                <input type="file" accept=".json" onChange={importData} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <button className="w-full bg-white border-2 border-dashed border-slate-300 hover:border-gea-400 text-slate-600 py-3 rounded-lg flex justify-center items-center gap-2 font-medium transition-colors">
                                    <IconUpload size={18}/> Daten importieren (JSON)
                                </button>
                            </div>
                        </div>
                        <DepsSection/>
                    </div>
                ))}

                {/* Reset */}
                {isAdmin && (
                    <button onClick={async () => {
                        if(confirm('Alle Daten unwiderruflich löschen?')) {
                            localStorage.removeItem('teamMasterProData');
                            if (SP_CONTEXT) {
                                try {
                                    const digest = await spGetDigest(SP_CONTEXT.siteUrl);
                                    await fetch(`${SP_CONTEXT.siteUrl}/_api/web/GetFileByServerRelativeUrl('${SP_ENC(SP_CONTEXT.stateFilePath)}')/recycle()`, {
                                        method: 'POST', credentials: 'include',
                                        headers: { 'X-RequestDigest': digest, 'Accept': 'application/json;odata=verbose' }
                                    }).catch(() => {});
                                    const dataFolder = SP_CONTEXT.folderPath + '/' + PLANNER_DATA_DIR;
                                    await fetch(`${SP_CONTEXT.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${SP_ENC(dataFolder)}')/recycle()`, {
                                        method: 'POST', credentials: 'include',
                                        headers: { 'X-RequestDigest': digest, 'Accept': 'application/json;odata=verbose' }
                                    }).catch(() => {});
                                } catch(e) {}
                            }
                            window.location.reload();
                        }
                    }} className="w-full text-rose-500 hover:bg-rose-50 py-3 rounded-lg text-sm font-medium transition-colors">
                        System zurücksetzen
                    </button>
                )}
            </div>
        </main>
    );
};
