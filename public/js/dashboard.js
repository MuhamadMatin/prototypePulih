// Dashboard Aggregator
import { setupUI } from './modules/ui.js';
import { setupMoodTracker } from './modules/mood.js';
import { setupJournaling } from './modules/journal.js';
import { setupBreathing } from './modules/breathing.js';

export function initDashboard() {
    console.log("Initializing Dashboard Modules...");

    // UI Setup (Modals, etc)
    setupUI();

    // Features
    setupMoodTracker();
    setupJournaling();
    setupBreathing();

    // Daily Affirmation
    fetchDailyAffirmation();

    // Setup Tools Buttons (connecting sidebar buttons to UI toggleModal)
    // Note: We need to import toggleModal to use it, OR UI setup handles open events?
    // In ui.js we only handled close and backdrop.
    // We should probably move the OPEN button listeners to ui.js or keep them here.
    // Let's keep them here but update ui.js to export toggleModal
    attachSidebarListeners();
}

function attachSidebarListeners() {
    const attach = (btnId, modalId) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                import('./modules/ui.js').then(({ toggleModal }) => {
                    toggleModal(modalId, true);
                });
            });
        }
    };

    attach('btn-mood', 'mood-modal');
    attach('btn-journal', 'journal-modal');
    attach('btn-breathing', 'breathing-modal');
}

async function fetchDailyAffirmation() {
    try {
        const res = await fetch('/api/utils/affirmation');
        const data = await res.json();
        const container = document.getElementById('affirmation-container');
        if (container && data.text) {
            container.innerText = `"${data.text}"`;
        }
    } catch (e) {
        console.error("Affirmation Error:", e);
        const container = document.getElementById('affirmation-container');
        if (container) container.innerText = '"Bernafaslah, satu demi satu."';
    }
}
