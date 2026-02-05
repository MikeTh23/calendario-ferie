/**
 * Verifica se una data è un weekend (sabato o domenica)
 * @param {Date} date - Data da verificare
 * @returns {boolean} True se è weekend
 */
function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = domenica, 6 = sabato
}

/**
 * Restituisce le classi CSS appropriate per un giorno
 * @param {Date} date - Data del giorno
 * @param {Object} entry - Entry dal storage (se esiste)
 * @returns {string} Classi CSS separate da spazio
 */
function getDayClass(date, entry) {
    const classes = ['day'];
    // Costruisci la stringa manualmente per evitare problemi di fuso orario
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isWeekend(date)) {
        classes.push('weekend');
    }

    if (isItalianHoliday(dateStr)) {
        classes.push('holiday');
    }

    if (date.getTime() === today.getTime()) {
        classes.push('today');
    }

    if (entry) {
        if (entry.type === 'ferie') {
            classes.push('has-ferie');
        } else if (entry.type === 'par') {
            classes.push('has-par');
        }
    }

    return classes.join(' ');
}

/**
 * Ottiene i dati di tutti i giorni di un mese
 * @param {number} year - Anno
 * @param {number} month - Mese (0-11)
 * @returns {Array} Array di oggetti giorno con metadata
 */
function getMonthData(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Converti domenica da 0 a 7 per avere lunedì come primo giorno
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];

    // Aggiungi celle vuote per i giorni prima del primo del mese
    for (let i = 0; i < adjustedStartDay; i++) {
        days.push({ isEmpty: true });
    }

    // Aggiungi tutti i giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        // Costruisci la stringa manualmente per evitare problemi di fuso orario
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        days.push({
            isEmpty: false,
            date: date,
            dateStr: dateStr,
            dayNumber: day
        });
    }

    return days;
}

/**
 * Renderizza un singolo mese
 * @param {number} year - Anno
 * @param {number} month - Mese (0-11)
 * @param {Object} entries - Oggetto con le entries dal storage
 * @returns {string} HTML del mese
 */
function renderMonth(year, month, entries = {}) {
    const monthNames = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

    const days = getMonthData(year, month);

    let html = `
        <div class="month">
            <div class="month-header">
                <h2>${monthNames[month]} ${year}</h2>
            </div>
            <div class="days-header">
                ${dayNames.map(name => `<div class="day-name">${name}</div>`).join('')}
            </div>
            <div class="days-grid">
    `;

    days.forEach(day => {
        if (day.isEmpty) {
            html += '<div class="day empty"></div>';
        } else {
            const entry = entries[day.dateStr];
            const classes = getDayClass(day.date, entry);
            const title = entry ? `${entry.type.toUpperCase()}: ${entry.hours}h` : '';

            html += `
                <div class="${classes}" data-date="${day.dateStr}" title="${title}">
                    ${day.dayNumber}
                </div>
            `;
        }
    });

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Renderizza il calendario completo per un anno
 * @param {number} year - Anno da renderizzare
 * @param {Object} entries - Oggetto con le entries dal storage
 * @returns {string} HTML completo del calendario
 */
function renderCalendar(year, entries = {}) {
    let html = '';

    for (let month = 0; month < 12; month++) {
        html += renderMonth(year, month, entries);
    }

    return html;
}
