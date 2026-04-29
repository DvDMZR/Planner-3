// ─── DATE / WEEK UTILITIES ────────────────────────────────────────────────────

const getWeekString = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const kw = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${kw.toString().padStart(2, '0')}`;
};

const addWeeks = (weekId, n) => {
    const [yearStr, wStr] = weekId.split('-W');
    const year = parseInt(yearStr), week = parseInt(wStr);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dow = jan4.getUTCDay() || 7;
    const monday = new Date(Date.UTC(year, 0, 4 - dow + 1 + (week - 1) * 7));
    return getWeekString(new Date(monday.getTime() + n * 7 * 86400000));
};

// Returns the UTC Date for the Monday of the given ISO week id (YYYY-Www).
const weekIdToMonday = (weekId) => {
    const [yearStr, wStr] = weekId.split('-W');
    const year = parseInt(yearStr), week = parseInt(wStr);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const dow = jan4.getUTCDay() || 7;
    return new Date(Date.UTC(year, 0, 4 - dow + 1 + (week - 1) * 7));
};

// Gaußsche Osterformel
const getEasterDate = (year) => {
    const a = year % 19, b = Math.floor(year/100), c = year % 100;
    const d = Math.floor(b/4), e = b%4, f = Math.floor((b+8)/25);
    const g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15)%30;
    const i = Math.floor(c/4), k = c%4, l = (32+2*e+2*i-h-k)%7;
    const m = Math.floor((a+11*h+22*l)/451);
    const month = Math.floor((h+l-7*m+114)/31)-1;
    const day = ((h+l-7*m+114)%31)+1;
    return new Date(year, month, day);
};

const getGermanHolidays = (year) => {
    const map = {};
    const add = (date, name) => {
        const k = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
        map[k] = map[k] ? map[k]+' · '+name : name;
    };
    const addDays = (d,n) => new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
    const e = getEasterDate(year);
    add(new Date(year,0,1),   'Neujahr');
    add(addDays(e,-2),        'Karfreitag');
    add(addDays(e, 1),        'Ostermontag');
    add(new Date(year,4,1),   '1. Mai');
    add(addDays(e,39),        'Himmelfahrt');
    add(addDays(e,50),        'Pfingstmontag');
    add(new Date(year,9,3),   '3. Oktober');
    add(new Date(year,11,25), '1. Weihnachten');
    add(new Date(year,11,26), '2. Weihnachten');
    return map;
};

const generateWeeksForYear = (year) => {
    // Feiertage für dieses Jahr + Nachbarjahre (KW1/KW52 können Jahresgrenze überschreiten)
    const holidays = { ...getGermanHolidays(year-1), ...getGermanHolidays(year), ...getGermanHolidays(year+1) };
    const w = [];
    const jan4 = new Date(year, 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4.getFullYear(), jan4.getMonth(), jan4.getDate() - dayOfWeek + 1);
    for (let i = 0; i < 54; i++) {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i * 7);
        const dUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        dUTC.setUTCDate(dUTC.getUTCDate() + 4 - (dUTC.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(dUTC.getUTCFullYear(), 0, 1));
        const kw = Math.ceil(((dUTC - yearStart) / 86400000 + 1) / 7);
        const weekYear = dUTC.getUTCFullYear();
        if (weekYear > year) break;
        if (weekYear === year) {
            const weekHolidays = [];
            for (let day = 0; day < 7; day++) {
                const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + day);
                const key = `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
                if (holidays[key]) weekHolidays.push(holidays[key]);
            }
            w.push({
                id: `${weekYear}-W${kw.toString().padStart(2, '0')}`,
                label: `KW ${kw}`,
                sub: `${d.getDate()}.${d.getMonth() + 1}.–${new Date(d.getFullYear(), d.getMonth(), d.getDate() + 4).getDate()}.${new Date(d.getFullYear(), d.getMonth(), d.getDate() + 4).getMonth() + 1}.`,
                month: `${MONTH_NAMES[d.getMonth()]} ${weekYear}`,
                holidays: weekHolidays
            });
        }
    }
    return w;
};

// Country lookup: maps loose human input (German + English names, ISO-2 codes,
// common synonyms) to an uppercase ISO-3166-1 alpha-2 code. Empty input → '/',
// unrecognised input → '??'.
const COUNTRY_CODE_LOOKUP = (() => {
    const codes = ['DE','AT','CH','FR','IT','ES','PT','NL','BE','LU','GB','IE','DK','SE','NO','FI','IS',
        'PL','CZ','SK','HU','RO','BG','GR','HR','SI','RS','BA','MK','AL','ME','MD','UA','BY','RU',
        'EE','LV','LT','TR','CY','MT','LI','MC','SM','VA','AD',
        'US','CA','MX','BR','AR','CL','CO','PE','UY','VE',
        'AU','NZ','JP','CN','IN','SG','TH','VN','MY','ID','PH','KR','TW','HK',
        'AE','SA','QA','KW','BH','OM','IL','EG','ZA','MA','TN','DZ','KE','NG'];
    const m = {};
    codes.forEach(c => { m[c.toLowerCase()] = c; });
    Object.assign(m, {
        'd': 'DE', 'deutschland': 'DE', 'germany': 'DE', 'allemagne': 'DE',
        'österreich': 'AT', 'oesterreich': 'AT', 'austria': 'AT',
        'schweiz': 'CH', 'switzerland': 'CH', 'suisse': 'CH', 'svizzera': 'CH',
        'frankreich': 'FR', 'france': 'FR',
        'italien': 'IT', 'italy': 'IT', 'italia': 'IT',
        'spanien': 'ES', 'spain': 'ES', 'espana': 'ES',
        'portugal': 'PT',
        'niederlande': 'NL', 'netherlands': 'NL', 'holland': 'NL',
        'belgien': 'BE', 'belgium': 'BE', 'belgique': 'BE',
        'luxemburg': 'LU', 'luxembourg': 'LU',
        'großbritannien': 'GB', 'grossbritannien': 'GB', 'vereinigtes königreich': 'GB',
        'vereinigtes koenigreich': 'GB', 'united kingdom': 'GB', 'great britain': 'GB',
        'england': 'GB', 'britain': 'GB', 'uk': 'GB',
        'irland': 'IE', 'ireland': 'IE',
        'dänemark': 'DK', 'daenemark': 'DK', 'denmark': 'DK',
        'schweden': 'SE', 'sweden': 'SE', 'sverige': 'SE',
        'norwegen': 'NO', 'norway': 'NO', 'norge': 'NO',
        'finnland': 'FI', 'finland': 'FI',
        'island': 'IS', 'iceland': 'IS',
        'polen': 'PL', 'poland': 'PL', 'polska': 'PL',
        'tschechien': 'CZ', 'tschechische republik': 'CZ', 'czechia': 'CZ', 'czech republic': 'CZ',
        'slowakei': 'SK', 'slovakia': 'SK',
        'ungarn': 'HU', 'hungary': 'HU',
        'rumänien': 'RO', 'rumaenien': 'RO', 'romania': 'RO',
        'bulgarien': 'BG', 'bulgaria': 'BG',
        'griechenland': 'GR', 'greece': 'GR',
        'kroatien': 'HR', 'croatia': 'HR',
        'slowenien': 'SI', 'slovenia': 'SI',
        'serbien': 'RS', 'serbia': 'RS',
        'bosnien': 'BA', 'bosnia': 'BA', 'bosnien und herzegowina': 'BA',
        'mazedonien': 'MK', 'nordmazedonien': 'MK', 'macedonia': 'MK', 'north macedonia': 'MK',
        'albanien': 'AL', 'albania': 'AL',
        'montenegro': 'ME',
        'moldau': 'MD', 'moldova': 'MD', 'moldawien': 'MD',
        'ukraine': 'UA',
        'weißrussland': 'BY', 'weissrussland': 'BY', 'belarus': 'BY',
        'russland': 'RU', 'russia': 'RU',
        'estland': 'EE', 'estonia': 'EE',
        'lettland': 'LV', 'latvia': 'LV',
        'litauen': 'LT', 'lithuania': 'LT',
        'türkei': 'TR', 'tuerkei': 'TR', 'turkey': 'TR',
        'zypern': 'CY', 'cyprus': 'CY',
        'malta': 'MT',
        'liechtenstein': 'LI',
        'monaco': 'MC',
        'usa': 'US', 'united states': 'US', 'vereinigte staaten': 'US', 'amerika': 'US', 'america': 'US',
        'kanada': 'CA', 'canada': 'CA',
        'mexiko': 'MX', 'mexico': 'MX',
        'brasilien': 'BR', 'brazil': 'BR', 'brasil': 'BR',
        'argentinien': 'AR', 'argentina': 'AR',
        'chile': 'CL',
        'kolumbien': 'CO', 'colombia': 'CO',
        'peru': 'PE',
        'uruguay': 'UY',
        'venezuela': 'VE',
        'australien': 'AU', 'australia': 'AU',
        'neuseeland': 'NZ', 'new zealand': 'NZ',
        'japan': 'JP',
        'china': 'CN', 'volksrepublik china': 'CN',
        'indien': 'IN', 'india': 'IN',
        'singapur': 'SG', 'singapore': 'SG',
        'thailand': 'TH',
        'vietnam': 'VN',
        'malaysia': 'MY',
        'indonesien': 'ID', 'indonesia': 'ID',
        'philippinen': 'PH', 'philippines': 'PH',
        'südkorea': 'KR', 'suedkorea': 'KR', 'korea': 'KR', 'south korea': 'KR',
        'taiwan': 'TW',
        'hongkong': 'HK', 'hong kong': 'HK',
        'vereinigte arabische emirate': 'AE', 'uae': 'AE', 'emirates': 'AE',
        'saudi-arabien': 'SA', 'saudi arabien': 'SA', 'saudi arabia': 'SA',
        'katar': 'QA', 'qatar': 'QA',
        'kuwait': 'KW',
        'bahrain': 'BH',
        'oman': 'OM',
        'israel': 'IL',
        'ägypten': 'EG', 'aegypten': 'EG', 'egypt': 'EG',
        'südafrika': 'ZA', 'suedafrika': 'ZA', 'south africa': 'ZA',
        'marokko': 'MA', 'morocco': 'MA',
        'tunesien': 'TN', 'tunisia': 'TN',
        'algerien': 'DZ', 'algeria': 'DZ',
        'kenia': 'KE', 'kenya': 'KE',
        'nigeria': 'NG',
    });
    return m;
})();

const resolveCountryCode = (input) => {
    if (input == null) return '/';
    const v = String(input).trim();
    if (!v) return '/';
    const lower = v.toLowerCase();
    if (COUNTRY_CODE_LOOKUP[lower]) return COUNTRY_CODE_LOOKUP[lower];
    const norm = lower.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (COUNTRY_CODE_LOOKUP[norm]) return COUNTRY_CODE_LOOKUP[norm];
    return '??';
};

const generateInitialData = (empCats) => {
    const emps = Array.from({ length: 5 }, (_, i) => ({
        id: `emp-${i}`,
        name: `Mitarbeiter ${i + 1}`,
        category: empCats[i % empCats.length],
        active: true
    }));
    return { employees: emps, projects: [], assignments: [], expenses: [] };
};
