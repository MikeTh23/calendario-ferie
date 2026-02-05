/**
 * Modulo per la gestione della persistenza dei dati tramite localStorage
 */

const STORAGE_KEY = 'calendarioFerieData';

// Valori di default per nuovi anni (21 giorni ferie = 168 ore, 14 giorni PAR = 112 ore)
const DEFAULT_VACATION_HOURS = 168;
const DEFAULT_PAR_HOURS = 112;

let data = {
    settings: {
        currentYear: new Date().getFullYear(),
        userName: ''
    },
    years: {}
};

/**
 * Carica i dati da localStorage
 */
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const loadedData = JSON.parse(stored);

            // Valida struttura dati
            if (loadedData.settings && loadedData.years) {
                data = loadedData;
            } else {
                console.warn('Struttura dati non valida, uso dati di default');
            }
        }

        // Assicurati che l'anno corrente esista con valori di default
        ensureYearExists(data.settings.currentYear);

        // Salva per assicurare che userName esista
        saveData();

        return data;
    } catch (error) {
        console.error('Errore caricamento dati:', error);
        // In caso di errore, usa dati di default
        return data;
    }
}

/**
 * Salva i dati in localStorage
 */
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Errore salvataggio dati:', error);
        alert('Errore durante il salvataggio: ' + error.message);
    }
}

/**
 * Assicura che un anno esista nella struttura dati con valori di default
 * @param {number} year - Anno da verificare/creare
 */
function ensureYearExists(year) {
    if (!data.years[year]) {
        data.years[year] = {
            availableVacationHours: DEFAULT_VACATION_HOURS,
            availablePARHours: DEFAULT_PAR_HOURS,
            entries: {}
        };
    } else {
        // Assicura che le proprietà esistano anche per anni creati con vecchia struttura
        if (data.years[year].availableVacationHours === undefined) {
            data.years[year].availableVacationHours = DEFAULT_VACATION_HOURS;
        }
        if (data.years[year].availablePARHours === undefined) {
            data.years[year].availablePARHours = DEFAULT_PAR_HOURS;
        }
        if (!data.years[year].entries) {
            data.years[year].entries = {};
        }
    }

    // Assicura che userName esista in settings
    if (data.settings.userName === undefined) {
        data.settings.userName = '';
    }
}

/**
 * Ottiene un'entry per una data specifica
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 * @returns {Object|null} Entry o null se non esiste
 */
function getEntry(dateStr) {
    const year = dateStr.split('-')[0];

    if (!data.years[year] || !data.years[year].entries) {
        return null;
    }

    return data.years[year].entries[dateStr] || null;
}

/**
 * Imposta un'entry per una data specifica
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 * @param {string} type - Tipo ('ferie' o 'par')
 * @param {number} hours - Numero di ore
 */
function setEntry(dateStr, type, hours) {
    const year = dateStr.split('-')[0];

    // Assicurati che l'anno esista con valori di default
    ensureYearExists(year);

    // Imposta l'entry
    data.years[year].entries[dateStr] = {
        type: type,
        hours: parseFloat(hours)
    };

    saveData();
}

/**
 * Elimina un'entry per una data specifica
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 */
function deleteEntry(dateStr) {
    const year = dateStr.split('-')[0];

    if (data.years[year] && data.years[year].entries) {
        delete data.years[year].entries[dateStr];
        saveData();
    }
}

/**
 * Calcola i totali per un anno specifico
 * @param {number} year - Anno da analizzare
 * @returns {Object} Oggetto con totali separati per ferie e PAR
 */
function calculateTotals(year) {
    const totals = {
        ferie: 0,
        par: 0
    };

    if (data.years[year] && data.years[year].entries) {
        const entries = data.years[year].entries;

        for (const dateStr in entries) {
            const entry = entries[dateStr];
            if (entry.type === 'ferie') {
                totals.ferie += entry.hours;
            } else if (entry.type === 'par') {
                totals.par += entry.hours;
            }
        }
    }

    return totals;
}

/**
 * Ottiene le entries per un anno specifico
 * @param {number} year - Anno
 * @returns {Object} Oggetto con le entries
 */
function getEntriesForYear(year) {
    if (data.years[year] && data.years[year].entries) {
        return data.years[year].entries;
    }
    return {};
}

/**
 * Aggiorna le impostazioni
 * @param {Object} newSettings - Nuove impostazioni
 */
function updateSettings(newSettings) {
    data.settings = { ...data.settings, ...newSettings };
    saveData();
}

/**
 * Ottiene le impostazioni correnti
 * @returns {Object} Impostazioni
 */
function getSettings() {
    return data.settings;
}

/**
 * Cambia l'anno corrente (solo in memoria, salvataggio automatico)
 * @param {number} year - Nuovo anno
 */
function setCurrentYear(year) {
    data.settings.currentYear = year;

    // Assicurati che l'anno esista con valori di default
    ensureYearExists(year);

    // Non serve più salvare qui, verrà salvato automaticamente con altre modifiche
}

/**
 * Ottiene le ore disponibili per un anno specifico
 * @param {number} year - Anno
 * @returns {Object} Oggetto con availableVacationHours e availablePARHours
 */
function getAvailableHours(year) {
    ensureYearExists(year);
    return {
        availableVacationHours: data.years[year].availableVacationHours,
        availablePARHours: data.years[year].availablePARHours
    };
}

/**
 * Imposta le ore disponibili per un anno specifico
 * @param {number} year - Anno
 * @param {number} vacationHours - Ore ferie disponibili
 * @param {number} parHours - Ore PAR disponibili
 */
function setAvailableHours(year, vacationHours, parHours) {
    ensureYearExists(year);
    data.years[year].availableVacationHours = vacationHours;
    data.years[year].availablePARHours = parHours;
    saveData();
}

/**
 * Esporta i dati come JSON
 * @returns {string} Dati in formato JSON
 */
function exportToJSON() {
    return JSON.stringify(data, null, 2);
}

/**
 * Importa i dati da JSON
 * @param {string} jsonString - Dati in formato JSON
 * @returns {boolean} True se importazione riuscita
 */
function importFromJSON(jsonString) {
    try {
        const importedData = JSON.parse(jsonString);

        // Valida struttura dati
        if (!importedData.settings || !importedData.years) {
            alert('File JSON non valido: struttura dati non corretta');
            return false;
        }

        // Sovrascrive i dati
        data = importedData;

        // Assicura che l'anno corrente esista
        ensureYearExists(data.settings.currentYear);

        // Salva in localStorage
        saveData();

        return true;
    } catch (error) {
        console.error('Errore importazione JSON:', error);
        alert('Errore durante l\'importazione: ' + error.message);
        return false;
    }
}

/**
 * Cancella tutti i dati
 */
function clearAllData() {
    if (confirm('Sei sicuro di voler cancellare TUTTI i dati? Questa operazione non può essere annullata!')) {
        localStorage.removeItem(STORAGE_KEY);
        data = {
            settings: {
                currentYear: new Date().getFullYear(),
                userName: ''
            },
            years: {}
        };
        ensureYearExists(data.settings.currentYear);
        saveData();
        return true;
    }
    return false;
}
