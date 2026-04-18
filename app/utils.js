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
    const jan4 = new Date(year, 0, 4);
    const dow = jan4.getDay() || 7;
    const monday = new Date(year, jan4.getMonth(), jan4.getDate() - dow + 1 + (week - 1) * 7);
    return getWeekString(new Date(monday.getTime() + n * 7 * 86400000));
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
                sub: `${d.getDate()}.${d.getMonth() + 1}.`,
                month: `${MONTH_NAMES[d.getMonth()]} ${weekYear}`,
                holidays: weekHolidays
            });
        }
    }
    return w;
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
