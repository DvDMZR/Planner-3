// ─── SHAREPOINT SYNC ──────────────────────────────────────────────────────────

// Auto-detect SharePoint Online context from the current URL
const SP_CONTEXT = (() => {
    const loc = window.location;
    if (loc.protocol === 'file:' || !loc.hostname.includes('sharepoint.com')) return null;
    const pathParts = decodeURIComponent(loc.pathname).split('/').filter(Boolean);
    let siteParts = [];
    if ((pathParts[0] === 'personal' || pathParts[0] === 'sites') && pathParts[1]) {
        siteParts = [pathParts[0], pathParts[1]];
    }
    const siteUrl = loc.origin + (siteParts.length ? '/' + siteParts.join('/') : '');
    const currentPath = decodeURIComponent(loc.pathname);
    const folderPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    return { siteUrl, folderPath, stateFilePath: folderPath + '/planner-state.json' };
})();

// Escape single quotes and spaces for SharePoint REST API paths
const SP_ENC = (path) => path.replace(/'/g, "''").replace(/ /g, '%20');

// Signals that SharePoint refused the request because the browser session /
// form digest has expired. Recovery layer catches this specifically.
class SpAuthError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'SpAuthError';
        this.status = status || 0;
    }
}

// Cached form digest. SharePoint digests are usually valid for 1800 s; we
// refresh one minute before they expire to absorb clock skew.
const spDigestCache = { value: null, expiresAt: 0 };

// Detect auth failures. We intentionally stay conservative here: SharePoint
// occasionally redirects valid REST responses (e.g. URL normalisation on
// personal sites), so reacting to `r.redirected` alone caused the recovery
// layer to kick in on successful loads and leave the app stuck in
// "reconnecting". Trust only explicit 401/403 and the opaqueredirect type
// (used when we manually opt out of following redirects).
function spIsAuthResponse(r) {
    if (r.status === 401 || r.status === 403) return true;
    if (r.type === 'opaqueredirect') return true;
    return false;
}

// Uniform fetch wrapper for all SharePoint REST calls: always includes
// credentials, converts auth failures into SpAuthError, and lets callers
// handle remaining HTTP errors as before.
async function spFetch(url, init) {
    const opts = Object.assign({}, init, { credentials: 'include' });
    const r = await fetch(url, opts);
    if (spIsAuthResponse(r)) {
        spDigestCache.expiresAt = 0;
        throw new SpAuthError('SharePoint auth required', r.status);
    }
    return r;
}

async function spGetDigest(siteUrl) {
    const now = Date.now();
    if (spDigestCache.value && now < spDigestCache.expiresAt - 60_000) {
        return spDigestCache.value;
    }
    const r = await spFetch(`${siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=verbose', 'Content-Type': 'application/json;odata=verbose' }
    });
    if (!r.ok) throw new Error('digest ' + r.status);
    const info = (await r.json()).d.GetContextWebInformation;
    spDigestCache.value = info.FormDigestValue;
    const timeoutSec = Number(info.FormDigestTimeoutSeconds) || 1800;
    spDigestCache.expiresAt = Date.now() + timeoutSec * 1000;
    return spDigestCache.value;
}

// Silent re-auth via a hidden iframe. If the user's Entra ID / AD session is
// still valid, navigating to a SharePoint endpoint refreshes the FedAuth /
// rtFa cookies without any visible UI. We can't read the iframe content
// cross-origin – we just wait for load or a timeout and then retry.
let spSilentAuthInFlight = null;
function spSilentReauth(ctx, timeoutMs = 8000) {
    if (spSilentAuthInFlight) return spSilentAuthInFlight;
    spSilentAuthInFlight = new Promise((resolve) => {
        let done = false;
        const finish = (ok) => {
            if (done) return;
            done = true;
            try { iframe.remove(); } catch(e) {}
            resolve(ok);
        };
        let iframe;
        try {
            iframe = document.createElement('iframe');
            iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden;';
            iframe.setAttribute('aria-hidden', 'true');
            iframe.addEventListener('load', () => finish(true));
            iframe.addEventListener('error', () => finish(false));
            setTimeout(() => finish(false), timeoutMs);
            // Hit a cheap authenticated endpoint; if cookies are stale, the
            // SP front-door runs the cookie refresh dance through Entra.
            iframe.src = `${ctx.siteUrl}/_api/contextinfo`;
            document.body.appendChild(iframe);
        } catch(e) {
            finish(false);
        }
    }).finally(() => { spSilentAuthInFlight = null; });
    return spSilentAuthInFlight;
}

// Interactive re-auth via popup. MUST be called from within a user gesture
// or the browser will block the popup.
let spInteractiveAuthInFlight = null;
function spInteractiveReauth(ctx) {
    if (spInteractiveAuthInFlight) return spInteractiveAuthInFlight;
    spInteractiveAuthInFlight = new Promise((resolve) => {
        let win;
        try {
            win = window.open(`${ctx.siteUrl}/_layouts/15/start.aspx`, 'sp-reauth',
                'width=520,height=640,menubar=no,toolbar=no,location=yes');
        } catch(e) { win = null; }
        if (!win) { resolve(false); return; }
        const pollTimer = setInterval(() => {
            if (win.closed) {
                clearInterval(pollTimer);
                clearTimeout(safety);
                resolve(true);
            }
        }, 400);
        const safety = setTimeout(() => {
            try { if (!win.closed) win.close(); } catch(e) {}
            clearInterval(pollTimer);
            resolve(true);
        }, 5 * 60 * 1000);
    }).finally(() => { spInteractiveAuthInFlight = null; });
    return spInteractiveAuthInFlight;
}

// Ensure there is a usable SharePoint session. Returns true once a fresh
// digest has been obtained, false when even interactive re-auth failed.
async function spEnsureSession(ctx, { interactive = false } = {}) {
    spDigestCache.expiresAt = 0;
    try { await spGetDigest(ctx.siteUrl); return true; }
    catch (e) { if (!(e instanceof SpAuthError)) throw e; }

    await spSilentReauth(ctx);
    spDigestCache.expiresAt = 0;
    try { await spGetDigest(ctx.siteUrl); return true; }
    catch (e) { if (!(e instanceof SpAuthError)) throw e; }

    if (!interactive) return false;

    await spInteractiveReauth(ctx);
    spDigestCache.expiresAt = 0;
    try { await spGetDigest(ctx.siteUrl); return true; }
    catch (e) { return false; }
}

async function spLoad(ctx) {
    const r = await spFetch(`${ctx.siteUrl}/_api/web/GetFileByServerRelativeUrl('${SP_ENC(ctx.stateFilePath)}')/$value`, {
        headers: { 'Accept': 'text/plain' }
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('load ' + r.status);
    return JSON.parse(await r.text());
}

async function spGetTimestamp(ctx) {
    const r = await spFetch(`${ctx.siteUrl}/_api/web/GetFileByServerRelativeUrl('${SP_ENC(ctx.stateFilePath)}')?$select=TimeLastModified`, {
        headers: { 'Accept': 'application/json;odata=verbose' }
    });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('ts ' + r.status);
    return (await r.json()).d.TimeLastModified;
}

async function spSave(ctx, data) {
    const digest = await spGetDigest(ctx.siteUrl);
    const r = await spFetch(`${ctx.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${SP_ENC(ctx.folderPath)}')/Files/Add(url='planner-state.json',overwrite=true)`, {
        method: 'POST',
        headers: { 'Accept': 'application/json;odata=verbose', 'X-RequestDigest': digest, 'Content-Type': 'application/octet-stream' },
        body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('save ' + r.status);
}

// Ensure a subfolder exists under the planner folder. 400 = already present,
// which SharePoint returns on the second call – we swallow that. Auth errors
// still need to bubble up so the recovery layer can react.
async function spEnsureFolder(ctx, subPath) {
    try {
        const digest = await spGetDigest(ctx.siteUrl);
        await spFetch(
            `${ctx.siteUrl}/_api/web/folders/add('${SP_ENC(ctx.folderPath + '/' + subPath)}')`,
            {
                method: 'POST',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'X-RequestDigest': digest,
                    'Content-Type': 'application/json;odata=verbose'
                }
            }
        );
    } catch(e) {
        if (e instanceof SpAuthError) throw e;
        /* already exists or transient – ignore */
    }
}

async function spLoadFile(ctx, filename) {
    const path = ctx.folderPath + '/' + PLANNER_DATA_DIR + '/' + filename;
    const r = await spFetch(
        `${ctx.siteUrl}/_api/web/GetFileByServerRelativeUrl('${SP_ENC(path)}')/$value`,
        { headers: { 'Accept': 'text/plain' } }
    );
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('spLoadFile ' + filename + ' ' + r.status);
    return JSON.parse(await r.text());
}

async function spSaveFile(ctx, filename, data) {
    const digest = await spGetDigest(ctx.siteUrl);
    const folder = ctx.folderPath + '/' + PLANNER_DATA_DIR;
    const r = await spFetch(
        `${ctx.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${SP_ENC(folder)}')/Files/Add(url='${filename}',overwrite=true)`,
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json;odata=verbose',
                'X-RequestDigest': digest,
                'Content-Type': 'application/octet-stream'
            },
            body: JSON.stringify(data)
        }
    );
    if (!r.ok) throw new Error('spSaveFile ' + filename + ' ' + r.status);
}

// Fetch all timestamps of the planner-data folder in a SINGLE request so
// polling does not scale linearly with the number of split files.
async function spGetFolderTimestamps(ctx) {
    const folder = ctx.folderPath + '/' + PLANNER_DATA_DIR;
    const r = await spFetch(
        `${ctx.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${SP_ENC(folder)}')/Files?$select=Name,TimeLastModified`,
        { headers: { 'Accept': 'application/json;odata=verbose' } }
    );
    if (r.status === 404) return {};
    if (!r.ok) throw new Error('spGetFolderTimestamps ' + r.status);
    const json = await r.json();
    const map = {};
    (json.d?.results || []).forEach(f => { map[f.Name] = f.TimeLastModified; });
    return map;
}
// ─────────────────────────────────────────────────────────────────────────────
