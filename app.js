/**
 * Applicazione principale - orchestrazione e gestione eventi
 */

// Elementi DOM (cached)
let calendarContainer;
let yearSelector;
let userNameInput;
let userNameDisplay;
let availableFerieInput;
let availablePARInput;
let usedFerieSpan;
let usedPARSpan;
let remainingFerieSpan;
let remainingPARSpan;
let entryModal;
let entryForm;
let modalDate;
let hoursInput;
let deleteBtn;
let closeBtn;
let exportBtn;
let importBtn;
let importFileInput;

// Stato corrente
let currentSelectedDate = null;

/**
 * Inizializza l'applicazione
 */
async function init() {
    // Carica dati da localStorage
    loadData();

    // Cache elementi DOM
    calendarContainer = document.getElementById('calendarContainer');
    yearSelector = document.getElementById('yearSelector');
    userNameInput = document.getElementById('userName');
    userNameDisplay = document.getElementById('userNameDisplay');
    availableFerieInput = document.getElementById('availableFerie');
    availablePARInput = document.getElementById('availablePAR');
    usedFerieSpan = document.getElementById('usedFerie');
    usedPARSpan = document.getElementById('usedPAR');
    remainingFerieSpan = document.getElementById('remainingFerie');
    remainingPARSpan = document.getElementById('remainingPAR');
    entryModal = document.getElementById('entryModal');
    entryForm = document.getElementById('entryForm');
    modalDate = document.getElementById('modalDate');
    hoursInput = document.getElementById('hoursInput');
    deleteBtn = document.getElementById('deleteBtn');
    closeBtn = document.getElementById('closeBtn');
    exportBtn = document.getElementById('exportBtn');
    importBtn = document.getElementById('importBtn');
    importFileInput = document.getElementById('importFileInput');

    // Inizializza selettore anni (da 5 anni fa a 5 anni avanti)
    const currentYear = getSettings().currentYear;
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        if (year === currentYear) {
            option.selected = true;
        }
        yearSelector.appendChild(option);
    }

    // Imposta valori iniziali contatori per l'anno corrente
    const availableHours = getAvailableHours(currentYear);
    availableFerieInput.value = availableHours.availableVacationHours;
    availablePARInput.value = availableHours.availablePARHours;

    // Imposta nome utente
    const settings = getSettings();
    userNameInput.value = settings.userName || '';
    updateUserNameDisplay();

    // Setup event listeners
    setupEventListeners();

    // Renderizza calendario iniziale
    await refreshCalendar();

    // Aggiorna contatori
    updateCounters();
}

/**
 * Configura tutti gli event listeners
 */
function setupEventListeners() {
    // Click su giorni (event delegation)
    calendarContainer.addEventListener('click', (e) => {
        const dayElement = e.target.closest('.day:not(.empty)');
        if (dayElement) {
            const date = dayElement.getAttribute('data-date');
            handleDayClick(date);
        }
    });

    // Cambio anno
    yearSelector.addEventListener('change', async (e) => {
        await handleYearChange(parseInt(e.target.value));
    });

    // Cambio ore disponibili (con debounce)
    let debounceTimer;
    const handleAvailableHoursChangeDebounced = async () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            await handleAvailableHoursChange();
        }, 500);
    };

    availableFerieInput.addEventListener('input', handleAvailableHoursChangeDebounced);
    availablePARInput.addEventListener('input', handleAvailableHoursChangeDebounced);

    // Cambio nome utente (con debounce)
    let userNameDebounceTimer;
    const handleUserNameChangeDebounced = async () => {
        clearTimeout(userNameDebounceTimer);
        userNameDebounceTimer = setTimeout(async () => {
            await handleUserNameChange();
        }, 500);
    };

    userNameInput.addEventListener('input', handleUserNameChangeDebounced);

    // Export/Import
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });
    importFileInput.addEventListener('change', handleImport);

    // Form modal
    entryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleEntrySave();
    });

    deleteBtn.addEventListener('click', async () => {
        await handleEntryDelete();
    });

    closeBtn.addEventListener('click', () => {
        entryModal.close();
    });

    // Chiudi modal con ESC
    entryModal.addEventListener('cancel', (e) => {
        e.preventDefault();
        entryModal.close();
    });
}

/**
 * Gestisce il click su un giorno
 * @param {string} dateStr - Data in formato YYYY-MM-DD
 */
function handleDayClick(dateStr) {
    currentSelectedDate = dateStr;

    // Formatta data per visualizzazione
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    modalDate.textContent = date.toLocaleDateString('it-IT', options);

    // Carica entry esistente se presente
    const entry = getEntry(dateStr);
    if (entry) {
        // Seleziona il tipo
        const typeRadio = entryForm.querySelector(`input[name="type"][value="${entry.type}"]`);
        if (typeRadio) {
            typeRadio.checked = true;
        }
        hoursInput.value = entry.hours;
        deleteBtn.style.display = 'inline-block';
    } else {
        // Reset form per nuovo entry
        entryForm.querySelector('input[name="type"][value="ferie"]').checked = true;
        hoursInput.value = '';
        deleteBtn.style.display = 'none';
    }

    // Apri modal
    entryModal.showModal();
    hoursInput.focus();
}

/**
 * Gestisce il salvataggio di un entry
 */
async function handleEntrySave() {
    const type = entryForm.querySelector('input[name="type"]:checked').value;
    const hours = parseFloat(hoursInput.value);

    // Validazione
    if (isNaN(hours) || hours <= 0 || hours > 24) {
        alert('Inserisci un numero di ore valido (0-24)');
        return;
    }

    try {
        // Salva entry
        setEntry(currentSelectedDate, type, hours);

        // Chiudi modal
        entryModal.close();

        // Aggiorna UI
        await refreshCalendar();
        updateCounters();
    } catch (error) {
        alert('Errore durante il salvataggio: ' + error.message);
    }
}

/**
 * Gestisce l'eliminazione di un entry
 */
async function handleEntryDelete() {
    if (!confirm('Vuoi eliminare questa voce?')) {
        return;
    }

    try {
        deleteEntry(currentSelectedDate);

        // Chiudi modal
        entryModal.close();

        // Aggiorna UI
        await refreshCalendar();
        updateCounters();
    } catch (error) {
        alert('Errore durante l\'eliminazione: ' + error.message);
    }
}

/**
 * Gestisce il cambio anno
 * @param {number} year - Nuovo anno
 */
async function handleYearChange(year) {
    try {
        setCurrentYear(year);

        // Carica le ore disponibili per il nuovo anno
        const availableHours = getAvailableHours(year);
        availableFerieInput.value = availableHours.availableVacationHours;
        availablePARInput.value = availableHours.availablePARHours;

        await refreshCalendar();
        updateCounters();
    } catch (error) {
        alert('Errore durante il cambio anno: ' + error.message);
    }
}

/**
 * Gestisce il cambio delle ore disponibili
 */
async function handleAvailableHoursChange() {
    const vacationHours = parseInt(availableFerieInput.value) || 0;
    const parHours = parseInt(availablePARInput.value) || 0;
    const currentYear = getSettings().currentYear;

    try {
        setAvailableHours(currentYear, vacationHours, parHours);
        updateCounters();
    } catch (error) {
        alert('Errore durante l\'aggiornamento delle ore disponibili: ' + error.message);
    }
}

/**
 * Aggiorna i contatori
 */
function updateCounters() {
    const currentYear = getSettings().currentYear;
    const totals = calculateTotals(currentYear);
    const availableHours = getAvailableHours(currentYear);

    // Ore usate
    usedFerieSpan.textContent = totals.ferie.toFixed(1);
    usedPARSpan.textContent = totals.par.toFixed(1);

    // Ore rimanenti
    const remainingFerie = availableHours.availableVacationHours - totals.ferie;
    const remainingPAR = availableHours.availablePARHours - totals.par;

    remainingFerieSpan.textContent = remainingFerie.toFixed(1);
    remainingPARSpan.textContent = remainingPAR.toFixed(1);

    // Cambia colore se negativo
    remainingFerieSpan.style.color = remainingFerie < 0 ? '#f44336' : '#667eea';
    remainingPARSpan.style.color = remainingPAR < 0 ? '#f44336' : '#667eea';
}

/**
 * Ricarica il calendario
 */
async function refreshCalendar() {
    const settings = getSettings();
    const currentYear = settings.currentYear;
    const entries = getEntriesForYear(currentYear);

    calendarContainer.innerHTML = renderCalendar(currentYear, entries);
}

/**
 * Gestisce il cambio del nome utente
 */
async function handleUserNameChange() {
    const userName = userNameInput.value.trim();

    try {
        updateSettings({ userName: userName });
        updateUserNameDisplay();
    } catch (error) {
        alert('Errore durante l\'aggiornamento del nome: ' + error.message);
    }
}

/**
 * Aggiorna la visualizzazione del nome utente nel titolo
 */
function updateUserNameDisplay() {
    const settings = getSettings();
    const userName = settings.userName || '';

    if (userName) {
        userNameDisplay.textContent = ' ' + userName;
    } else {
        userNameDisplay.textContent = '';
    }
}

/**
 * Gestisce l'export dei dati in JSON
 */
function handleExport() {
    try {
        const jsonData = exportToJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        const settings = getSettings();
        const userName = settings.userName ? `_${settings.userName.replace(/\s+/g, '_')}` : '';
        const fileName = `calendario_ferie${userName}_${new Date().toISOString().split('T')[0]}.json`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ Dati esportati con successo!');
    } catch (error) {
        alert('Errore durante l\'esportazione: ' + error.message);
    }
}

/**
 * Gestisce l'import dei dati da JSON
 */
async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const success = importFromJSON(text);

        if (success) {
            // Ricarica l'interfaccia con i nuovi dati
            const settings = getSettings();
            const currentYear = settings.currentYear;

            // Aggiorna selettore anno
            yearSelector.value = currentYear;

            // Aggiorna ore disponibili
            const availableHours = getAvailableHours(currentYear);
            availableFerieInput.value = availableHours.availableVacationHours;
            availablePARInput.value = availableHours.availablePARHours;

            // Aggiorna nome utente
            userNameInput.value = settings.userName || '';
            updateUserNameDisplay();

            // Ricarica calendario e contatori
            await refreshCalendar();
            updateCounters();

            alert('✅ Dati importati con successo!');
        }
    } catch (error) {
        alert('Errore durante l\'importazione: ' + error.message);
    } finally {
        // Reset input file per permettere lo stesso file
        importFileInput.value = '';
    }
}

// Avvia l'applicazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
