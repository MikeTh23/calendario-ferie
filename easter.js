/**
 * Calcola la data della Pasqua usando l'algoritmo Computus (Gregoriano anonimo)
 * @param {number} year - Anno per cui calcolare la Pasqua
 * @returns {Object} Oggetto con month (3=marzo, 4=aprile) e day
 */
function calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return { month, day };
}

/**
 * Calcola la data del Lunedì di Pasqua (Pasquetta)
 * @param {number} year - Anno per cui calcolare Pasquetta
 * @returns {Object} Oggetto con month e day
 */
function getEasterMonday(year) {
    const easter = calculateEaster(year);
    const easterDate = new Date(year, easter.month - 1, easter.day);

    // Aggiungi un giorno per ottenere il lunedì
    easterDate.setDate(easterDate.getDate() + 1);

    return {
        month: easterDate.getMonth() + 1,
        day: easterDate.getDate()
    };
}

/**
 * Restituisce un array di tutte le festività italiane per l'anno specificato
 * @param {number} year - Anno per cui ottenere le festività
 * @returns {Array} Array di stringhe in formato YYYY-MM-DD
 */
function getItalianHolidays(year) {
    const holidays = [];

    // Festività fisse
    const fixedHolidays = [
        { month: 1, day: 1, name: 'Capodanno' },
        { month: 1, day: 6, name: 'Epifania' },
        { month: 4, day: 25, name: 'Festa della Liberazione' },
        { month: 5, day: 1, name: 'Festa dei Lavoratori' },
        { month: 6, day: 2, name: 'Festa della Repubblica' },
        { month: 8, day: 15, name: 'Ferragosto' },
        { month: 11, day: 1, name: 'Ognissanti' },
        { month: 12, day: 8, name: 'Immacolata Concezione' },
        { month: 12, day: 25, name: 'Natale' },
        { month: 12, day: 26, name: 'Santo Stefano' }
    ];

    fixedHolidays.forEach(holiday => {
        const dateStr = `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`;
        holidays.push(dateStr);
    });

    // Aggiungi Pasquetta (festività mobile)
    const easterMonday = getEasterMonday(year);
    const easterMondayStr = `${year}-${String(easterMonday.month).padStart(2, '0')}-${String(easterMonday.day).padStart(2, '0')}`;
    holidays.push(easterMondayStr);

    return holidays;
}

/**
 * Verifica se una data è una festività italiana
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 * @returns {boolean} True se è una festività
 */
function isItalianHoliday(dateStr) {
    const year = parseInt(dateStr.split('-')[0]);
    const holidays = getItalianHolidays(year);
    return holidays.includes(dateStr);
}
