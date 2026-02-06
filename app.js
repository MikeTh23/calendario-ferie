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
let usedRegaloSpan;
let remainingRegaloSpan;
let usedVolontariatoSpan;
let remainingVolontariatoSpan;
let usedVisiteMedicheSpan;
let entryModal;
let entryForm;
let modalDate;
let hoursInput;
let deleteBtn;
let closeBtn;
let exportBtn;
let importBtn;
let importFileInput;
let printBtn;
let riepilogoBtn;
let riepilogoView;
let riepilogoContent;
let closeRiepilogoBtn;
let printRiepilogoBtn;
let exportYearBtn;
let sidebarToggle;
let sidebar;
let sidebarClose;
let setUserIdBtn;
let userIdDisplay;
let userIdModal;
let passphraseInput;
let togglePassphraseBtn;
let confirmUserIdBtn;
let cancelUserIdBtn;

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
    usedRegaloSpan = document.getElementById('usedRegalo');
    remainingRegaloSpan = document.getElementById('remainingRegalo');
    usedVolontariatoSpan = document.getElementById('usedVolontariato');
    remainingVolontariatoSpan = document.getElementById('remainingVolontariato');
    usedVisiteMedicheSpan = document.getElementById('usedVisiteMediche');
    entryModal = document.getElementById('entryModal');
    entryForm = document.getElementById('entryForm');
    modalDate = document.getElementById('modalDate');
    hoursInput = document.getElementById('hoursInput');
    deleteBtn = document.getElementById('deleteBtn');
    closeBtn = document.getElementById('closeBtn');
    exportBtn = document.getElementById('exportBtn');
    importBtn = document.getElementById('importBtn');
    importFileInput = document.getElementById('importFileInput');
    printBtn = document.getElementById('printBtn');
    riepilogoBtn = document.getElementById('riepilogoBtn');
    riepilogoView = document.getElementById('riepilogoView');
    riepilogoContent = document.getElementById('riepilogoContent');
    closeRiepilogoBtn = document.getElementById('closeRiepilogoBtn');
    printRiepilogoBtn = document.getElementById('printRiepilogoBtn');
    exportYearBtn = document.getElementById('exportYearBtn');
    sidebarToggle = document.getElementById('sidebarToggle');
    sidebar = document.getElementById('sidebar');
    sidebarClose = document.getElementById('sidebarClose');
    setUserIdBtn = document.getElementById('setUserIdBtn');
    userIdDisplay = document.getElementById('userIdDisplay');
    userIdModal = document.getElementById('userIdModal');
    passphraseInput = document.getElementById('passphraseInput');
    togglePassphraseBtn = document.getElementById('togglePassphraseBtn');
    confirmUserIdBtn = document.getElementById('confirmUserIdBtn');
    cancelUserIdBtn = document.getElementById('cancelUserIdBtn');

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

    // Aggiorna display ID utente
    updateUserIdDisplay();

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

    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', toggleSidebar);

    // Riepilogo view
    riepilogoBtn.addEventListener('click', showRiepilogo);
    closeRiepilogoBtn.addEventListener('click', hideRiepilogo);
    printRiepilogoBtn.addEventListener('click', printRiepilogo);
    exportYearBtn.addEventListener('click', handleExportYear);

    // User ID
    setUserIdBtn.addEventListener('click', openUserIdModal);
    confirmUserIdBtn.addEventListener('click', handleConfirmUserId);
    cancelUserIdBtn.addEventListener('click', closeUserIdModal);
    togglePassphraseBtn.addEventListener('click', togglePassphraseVisibility);

    // Export/Import/Print
    exportBtn.addEventListener('click', handleExport);
    printBtn.addEventListener('click', handlePrint);
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

    // Gestione cambio tipo per compleanno/wellbeing (forza 8 ore)
    const typeRadios = entryForm.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', handleTypeChange);
    });
}

/**
 * Gestisce il cambio del tipo di entry (abilita/disabilita ore per compleanno/wellbeing)
 */
function handleTypeChange() {
    const selectedType = entryForm.querySelector('input[name="type"]:checked').value;

    if (selectedType === 'compleanno' || selectedType === 'wellbeing' || selectedType === 'volontariato') {
        hoursInput.value = '8';
        hoursInput.readOnly = true;
        hoursInput.style.background = '#f0f0f0';
    } else {
        hoursInput.readOnly = false;
        hoursInput.style.background = 'white';
    }
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

    // Gestisci readonly per compleanno/wellbeing
    handleTypeChange();

    // Apri modal
    entryModal.showModal();
    hoursInput.focus();
}

/**
 * Gestisce il salvataggio di un entry
 */
async function handleEntrySave() {
    const type = entryForm.querySelector('input[name="type"]:checked').value;
    let hours = parseFloat(hoursInput.value);

    // Validazione ore base
    if (isNaN(hours) || hours <= 0 || hours > 24) {
        alert('Inserisci un numero di ore valido (0-24)');
        return;
    }

    // Validazione: max 8 ore per ferie e PAR
    if ((type === 'ferie' || type === 'par') && hours > 8) {
        alert('⚠️ Non puoi inserire più di 8 ore per un singolo giorno!\n\nUna giornata lavorativa standard è di 8 ore.');
        return;
    }

    // Validazione: max 3 ore per visite mediche
    if (type === 'visiteMediche' && hours > 3) {
        alert('⚠️ Non puoi inserire più di 3 ore di visite mediche per un singolo giorno!');
        return;
    }

    // Validazione: verifica se ci sono già altre entry nello stesso giorno (tipo diverso)
    const currentEntry = getEntry(currentSelectedDate);

    if (currentEntry && currentEntry.type !== type) {
        const currentHours = currentEntry.hours;
        if (hours + currentHours > 8) {
            const remaining = 8 - currentHours;
            alert(`⚠️ Hai già inserito ${currentHours}h di ${currentEntry.type.toUpperCase()} in questo giorno!\n\nPuoi inserire al massimo ${remaining}h aggiuntive (totale giornaliero: 8h).`);
            return;
        }
    }

    // Validazioni speciali per compleanno, wellbeing e volontariato
    if (type === 'compleanno' || type === 'wellbeing' || type === 'volontariato') {
        // Forza sempre 8 ore
        if (hours !== 8) {
            const typeName = type === 'compleanno' ? 'Compleanno' : type === 'wellbeing' ? 'Well Being' : 'Volontariato';
            alert(`${typeName} deve essere una giornata intera (8 ore)`);
            hoursInput.value = '8';
            return;
        }

        // Calcola totali attuali (escludendo l'entry corrente se stiamo modificando)
        const currentYear = getSettings().currentYear;
        const totals = calculateTotals(currentYear);
        const currentEntry = getEntry(currentSelectedDate);

        let currentTypeHours = 0;
        if (type === 'compleanno') {
            currentTypeHours = totals.regalo;
            // Sottrai le ore dell'entry corrente se è dello stesso tipo
            if (currentEntry && currentEntry.type === 'compleanno') {
                currentTypeHours -= currentEntry.hours;
            }
        } else if (type === 'wellbeing') {
            // Determina il semestre della data corrente
            const currentDate = new Date(currentSelectedDate + 'T00:00:00');
            const currentMonth = currentDate.getMonth() + 1; // 1-12
            const currentSemester = currentMonth <= 6 ? 1 : 2;

            // Calcola ore wellbeing per semestre (1° sem: Gen-Giu, 2° sem: Lug-Dic)
            const entries = getEntriesForYear(currentYear);
            let semesterHours = 0;

            for (const dateStr in entries) {
                const entry = entries[dateStr];
                if (entry.type === 'wellbeing' && dateStr !== currentSelectedDate) {
                    const entryDate = new Date(dateStr + 'T00:00:00');
                    const entryMonth = entryDate.getMonth() + 1;
                    const entrySemester = entryMonth <= 6 ? 1 : 2;

                    // Conta solo le ore dello stesso semestre
                    if (entrySemester === currentSemester) {
                        semesterHours += entry.hours;
                    }
                }
            }

            currentTypeHours = semesterHours;
        } else if (type === 'volontariato') {
            currentTypeHours = totals.volontariato;
            // Sottrai le ore dell'entry corrente se è dello stesso tipo
            if (currentEntry && currentEntry.type === 'volontariato') {
                currentTypeHours -= currentEntry.hours;
            }
        }

        // Verifica limiti
        if (type === 'compleanno' && currentTypeHours + hours > 8) {
            alert('⚠️ Hai già usato il giorno di compleanno per quest\'anno!\n\nPuoi inserire solo 1 giorno (8 ore) di compleanno per anno.');
            return;
        }

        if (type === 'wellbeing' && currentTypeHours + hours > 8) {
            const currentDate = new Date(currentSelectedDate + 'T00:00:00');
            const currentMonth = currentDate.getMonth() + 1;
            const semesterName = currentMonth <= 6 ? '1° semestre (Gennaio-Giugno)' : '2° semestre (Luglio-Dicembre)';

            alert(`⚠️ Hai già usato 1 giorno di Well Being nel ${semesterName}!\n\nPuoi inserire massimo 1 giorno (8 ore) di Well Being per semestre:\n• 1° semestre: Gennaio-Giugno\n• 2° semestre: Luglio-Dicembre`);
            return;
        }

        if (type === 'volontariato' && currentTypeHours + hours > 24) {
            alert('⚠️ Hai già usato tutte le giornate di volontariato per quest\'anno!\n\nPuoi inserire massimo 3 giorni (24 ore) di volontariato per anno.');
            return;
        }
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
    usedRegaloSpan.textContent = totals.regalo.toFixed(1);
    usedVolontariatoSpan.textContent = totals.volontariato.toFixed(1);
    usedVisiteMedicheSpan.textContent = totals.visiteMediche.toFixed(1);

    // Ore rimanenti
    const remainingFerie = availableHours.availableVacationHours - totals.ferie;
    const remainingPAR = availableHours.availablePARHours - totals.par;
    const remainingRegalo = 24 - totals.regalo;
    const remainingVolontariato = 24 - totals.volontariato;

    remainingFerieSpan.textContent = remainingFerie.toFixed(1);
    remainingPARSpan.textContent = remainingPAR.toFixed(1);
    remainingRegaloSpan.textContent = remainingRegalo.toFixed(1);
    remainingVolontariatoSpan.textContent = remainingVolontariato.toFixed(1);

    // Cambia colore se negativo
    remainingFerieSpan.style.color = remainingFerie < 0 ? '#f44336' : '#667eea';
    remainingPARSpan.style.color = remainingPAR < 0 ? '#f44336' : '#667eea';
    remainingRegaloSpan.style.color = remainingRegalo < 0 ? '#f44336' : '#667eea';
    remainingVolontariatoSpan.style.color = remainingVolontariato < 0 ? '#f44336' : '#667eea';
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

/**
 * Gestisce la stampa/esportazione PDF
 */
function handlePrint() {
    try {
        const settings = getSettings();
        const currentYear = settings.currentYear;
        const userName = settings.userName || 'Utente';
        const totals = calculateTotals(currentYear);
        const availableHours = getAvailableHours(currentYear);

        // Popola dati nell'header di stampa
        document.getElementById('printYear').textContent = currentYear;
        document.getElementById('printUserName').textContent = userName;

        // Ferie
        document.getElementById('printAvailableFerie').textContent = availableHours.availableVacationHours;
        document.getElementById('printUsedFerie').textContent = totals.ferie.toFixed(1);
        const remainingFerie = availableHours.availableVacationHours - totals.ferie;
        document.getElementById('printRemainingFerie').textContent = remainingFerie.toFixed(1);

        // PAR
        document.getElementById('printAvailablePAR').textContent = availableHours.availablePARHours;
        document.getElementById('printUsedPAR').textContent = totals.par.toFixed(1);
        const remainingPAR = availableHours.availablePARHours - totals.par;
        document.getElementById('printRemainingPAR').textContent = remainingPAR.toFixed(1);

        // Ore Regalo
        document.getElementById('printUsedRegalo').textContent = totals.regalo.toFixed(1);
        const remainingRegalo = 24 - totals.regalo;
        document.getElementById('printRemainingRegalo').textContent = remainingRegalo.toFixed(1);

        // Volontariato
        document.getElementById('printUsedVolontariato').textContent = totals.volontariato.toFixed(1);
        const remainingVolontariato = 24 - totals.volontariato;
        document.getElementById('printRemainingVolontariato').textContent = remainingVolontariato.toFixed(1);

        // Visite Mediche
        document.getElementById('printUsedVisiteMediche').textContent = totals.visiteMediche.toFixed(1);

        // Chiudi sidebar se aperta
        sidebar.classList.remove('open');

        // Apri dialog di stampa
        window.print();
    } catch (error) {
        alert('Errore durante la preparazione della stampa: ' + error.message);
    }
}

/**
 * Mostra la vista riepilogo anno
 */
function showRiepilogo() {
    try {
        const settings = getSettings();
        const currentYear = settings.currentYear;
        const userName = settings.userName || 'Utente';
        const totals = calculateTotals(currentYear);
        const availableHours = getAvailableHours(currentYear);

        // Aggiorna header
        document.getElementById('riepilogoYear').textContent = currentYear;
        document.getElementById('riepilogoUserName').textContent = userName;

        // Popola totalizzatori per stampa
        document.getElementById('riepilogoAvailableFerie').textContent = availableHours.availableVacationHours;
        document.getElementById('riepilogoUsedFerie').textContent = totals.ferie.toFixed(1);
        const remainingFerie = availableHours.availableVacationHours - totals.ferie;
        document.getElementById('riepilogoRemainingFerie').textContent = remainingFerie.toFixed(1);

        document.getElementById('riepilogoAvailablePAR').textContent = availableHours.availablePARHours;
        document.getElementById('riepilogoUsedPAR').textContent = totals.par.toFixed(1);
        const remainingPAR = availableHours.availablePARHours - totals.par;
        document.getElementById('riepilogoRemainingPAR').textContent = remainingPAR.toFixed(1);

        document.getElementById('riepilogoUsedRegalo').textContent = totals.regalo.toFixed(1);
        const remainingRegalo = 24 - totals.regalo;
        document.getElementById('riepilogoRemainingRegalo').textContent = remainingRegalo.toFixed(1);

        document.getElementById('riepilogoUsedVolontariato').textContent = totals.volontariato.toFixed(1);
        const remainingVolontariato = 24 - totals.volontariato;
        document.getElementById('riepilogoRemainingVolontariato').textContent = remainingVolontariato.toFixed(1);

        document.getElementById('riepilogoUsedVisiteMediche').textContent = totals.visiteMediche.toFixed(1);

        // Genera contenuto riepilogo
        riepilogoContent.innerHTML = renderRiepilogo(currentYear);

        // Mostra vista
        riepilogoView.classList.remove('hidden');

        // Aggiungi classe al body per la stampa
        document.body.classList.add('riepilogo-open');

        // Chiudi sidebar se aperta
        sidebar.classList.remove('open');
    } catch (error) {
        alert('Errore durante la generazione del riepilogo: ' + error.message);
    }
}

/**
 * Nascondi la vista riepilogo
 */
function hideRiepilogo() {
    riepilogoView.classList.add('hidden');
    document.body.classList.remove('riepilogo-open');
}

/**
 * Stampa la vista riepilogo
 */
function printRiepilogo() {
    window.print();
}

/**
 * Genera HTML per la vista riepilogo anno
 */
function renderRiepilogo(year) {
    const entries = getEntriesForYear(year);
    const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    let html = '';

    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        html += `<div class="riepilogo-month">`;
        html += `<div class="month-label">${monthNames[month]}</div>`;
        html += `<div class="days-row">`;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const entry = entries[dateStr];
            const classes = ['day-cell'];

            // Weekend
            if (date.getDay() === 0 || date.getDay() === 6) {
                classes.push('weekend');
            }

            // Festività
            if (isItalianHoliday(dateStr)) {
                classes.push('holiday');
            }

            // Entry con ore
            if (entry) {
                if (entry.type === 'ferie') {
                    classes.push('has-ferie');
                } else if (entry.type === 'par') {
                    classes.push('has-par');
                } else if (entry.type === 'compleanno') {
                    classes.push('has-compleanno');
                } else if (entry.type === 'wellbeing') {
                    classes.push('has-wellbeing');
                } else if (entry.type === 'volontariato') {
                    classes.push('has-volontariato');
                } else if (entry.type === 'visiteMediche') {
                    classes.push('has-visite-mediche');
                }
            }

            // Calcola stile per riempimento proporzionale
            let style = '';
            if (entry && entry.hours) {
                const maxHours = entry.type === 'visiteMediche' ? 3 : 8;
                const percentage = (entry.hours / maxHours) * 100;
                let color1, color2;

                if (entry.type === 'ferie') {
                    color1 = '#4CAF50';
                    color2 = '#e8f5e9';
                } else if (entry.type === 'par') {
                    color1 = '#FF9800';
                    color2 = '#fff3e0';
                } else if (entry.type === 'compleanno') {
                    color1 = '#2196F3';
                    color2 = '#e3f2fd';
                } else if (entry.type === 'wellbeing') {
                    color1 = '#9595FF';
                    color2 = '#ede7f6';
                } else if (entry.type === 'volontariato') {
                    color1 = '#BC7A7A';
                    color2 = '#fceaea';
                } else if (entry.type === 'visiteMediche') {
                    color1 = '#00BCD4';
                    color2 = '#e0f7fa';
                }

                style = `background: linear-gradient(to top, ${color1} ${percentage}%, ${color2} ${percentage}%);`;
            }

            html += `<div class="${classes.join(' ')}" style="${style}">${day}</div>`;
        }

        html += `</div>`; // days-row
        html += `</div>`; // riepilogo-month
    }

    return html;
}

/**
 * Aggiorna il display dell'ID utente
 */
function updateUserIdDisplay() {
    const userId = getUserId();
    if (userId) {
        // Mostra primi 8 caratteri + "..."
        userIdDisplay.textContent = userId.substring(0, 8) + '...';
        userIdDisplay.classList.remove('not-set');
    } else {
        userIdDisplay.textContent = 'Non impostato';
        userIdDisplay.classList.add('not-set');
    }
}

/**
 * Apri modal per impostare ID utente
 */
function openUserIdModal() {
    passphraseInput.value = '';
    passphraseInput.type = 'password';
    userIdModal.showModal();
    passphraseInput.focus();
}

/**
 * Chiudi modal ID utente
 */
function closeUserIdModal() {
    userIdModal.close();
}

/**
 * Toggle visibilità passphrase
 */
function togglePassphraseVisibility() {
    if (passphraseInput.type === 'password') {
        passphraseInput.type = 'text';
        togglePassphraseBtn.textContent = '🙈';
    } else {
        passphraseInput.type = 'password';
        togglePassphraseBtn.textContent = '👁️';
    }
}

/**
 * Conferma e imposta ID utente
 */
async function handleConfirmUserId() {
    const passphrase = passphraseInput.value.trim();

    if (!passphrase) {
        alert('⚠️ Inserisci una frase segreta!');
        return;
    }

    if (passphrase.length < 8) {
        alert('⚠️ La frase segreta deve essere lunga almeno 8 caratteri!\n\nSuggerimento: usa una frase lunga e memorabile.');
        return;
    }

    try {
        const userId = await setUserId(passphrase);
        updateUserIdDisplay();
        closeUserIdModal();
        alert('✅ Chiave personale impostata con successo!\n\nID: ' + userId.substring(0, 12) + '...');
    } catch (error) {
        alert('❌ Errore durante l\'impostazione della chiave: ' + error.message);
    }
}

/**
 * Esporta solo l'anno corrente come JSON
 */
function handleExportYear() {
    try {
        const currentYear = getSettings().currentYear;
        const jsonData = exportYearToJSON(currentYear);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        const settings = getSettings();
        const userName = settings.userName ? `_${settings.userName.replace(/\s+/g, '_')}` : '';
        const fileName = `calendario_anno_${currentYear}${userName}.json`;

        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('✅ Anno esportato con successo!');
    } catch (error) {
        alert('Errore durante l\'esportazione: ' + error.message);
    }
}

/**
 * Toggle apertura/chiusura sidebar
 */
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// Avvia l'applicazione quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
