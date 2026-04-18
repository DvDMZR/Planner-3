// ─── FILE SYSTEM SYNC (lokal via OneDrive) ───────────────────────────────────
const FS_MODE = window.location.protocol === 'file:' && 'showDirectoryPicker' in window;

async function idbGetHandle() {
    return new Promise(resolve => {
        const req = indexedDB.open('PlannerSyncDB', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
        req.onsuccess = e => {
            const tx = e.target.result.transaction('handles', 'readonly');
            const get = tx.objectStore('handles').get('syncFolder');
            get.onsuccess = () => resolve(get.result || null);
            get.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
    });
}

async function idbSaveHandle(handle) {
    return new Promise(resolve => {
        const req = indexedDB.open('PlannerSyncDB', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('handles');
        req.onsuccess = e => {
            const tx = e.target.result.transaction('handles', 'readwrite');
            tx.objectStore('handles').put(handle, 'syncFolder');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => resolve(false);
        };
        req.onerror = () => resolve(false);
    });
}

async function fsLoad(dirHandle) {
    try {
        const fh = await dirHandle.getFileHandle('planner-state.json');
        const file = await fh.getFile();
        return { data: JSON.parse(await file.text()), lastModified: file.lastModified };
    } catch(e) {
        if (e.name === 'NotFoundError') return null;
        throw e;
    }
}

async function fsSave(dirHandle, data) {
    const fh = await dirHandle.getFileHandle('planner-state.json', { create: true });
    const writable = await fh.createWritable();
    await writable.write(JSON.stringify(data));
    await writable.close();
}

// Get the planner-data subdirectory handle (create if requested).
async function fsGetDataDir(dirHandle, create = false) {
    try {
        return await dirHandle.getDirectoryHandle(PLANNER_DATA_DIR, { create });
    } catch(e) {
        if (e.name === 'NotFoundError') return null;
        throw e;
    }
}

async function fsLoadFile(dirHandle, filename) {
    const data = await fsGetDataDir(dirHandle, false);
    if (!data) return null;
    try {
        const fh = await data.getFileHandle(filename);
        const file = await fh.getFile();
        return { data: JSON.parse(await file.text()), lastModified: file.lastModified };
    } catch(e) {
        if (e.name === 'NotFoundError') return null;
        throw e;
    }
}

async function fsSaveFile(dirHandle, filename, payload) {
    const dataDir = await fsGetDataDir(dirHandle, true);
    const fh = await dataDir.getFileHandle(filename, { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(payload));
    await w.close();
}

async function fsGetFolderTimestamps(dirHandle) {
    const dataDir = await fsGetDataDir(dirHandle, false);
    if (!dataDir) return {};
    const map = {};
    try {
        for await (const [name, handle] of dataDir.entries()) {
            if (handle.kind !== 'file' || !name.endsWith('.json')) continue;
            try {
                const file = await handle.getFile();
                map[name] = file.lastModified;
            } catch(e) {}
        }
    } catch(e) {}
    return map;
}
// ─────────────────────────────────────────────────────────────────────────────
