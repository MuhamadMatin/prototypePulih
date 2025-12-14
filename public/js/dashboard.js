
// Dashboard Logic: Mood, Journal, Breathing
import { saveSessionToBackend } from './services/chat-service.js';

let moodChartInstance = null;
const userId = JSON.parse(localStorage.getItem('user'))?.id;

export function initDashboard() {
    setupMoodTracker();
    setupJournaling();
    setupBreathing();
    setupToolsUI();
    fetchDailyAffirmation();
}

function setupToolsUI() {
    // Open Modals
    document.getElementById('btn-mood')?.addEventListener('click', () => toggleModal('mood-modal', true));
    document.getElementById('btn-journal')?.addEventListener('click', () => toggleModal('journal-modal', true));
    document.getElementById('btn-breathing')?.addEventListener('click', () => toggleModal('breathing-modal', true));

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.dataset.target;
            toggleModal(modalId, false);
        });
    });
}

function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        if (id === 'mood-modal') loadMoodHistory();
    } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
    }
}

// --- Status Affirmation ---
async function fetchDailyAffirmation() {
    try {
        const res = await fetch('/api/utils/affirmation');
        const data = await res.json();
        const container = document.getElementById('affirmation-container');
        if (container && data.text) {
            container.innerText = `"${data.text}"`;
        }
    } catch (e) { console.error(e); }
}

// --- MOOD TRACKER ---
function setupMoodTracker() {
    const emojis = document.querySelectorAll('.mood-emoji');
    emojis.forEach(btn => {
        btn.addEventListener('click', async () => {
            const level = btn.dataset.level;
            const note = document.getElementById('mood-note').value;

            try {
                await fetch('/api/mood', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, moodLevel: level, note })
                });
                // alert('Mood tercatat!'); // Removed
                toggleModal('mood-modal', false); // Auto-close modal
                showToast('Mood berhasil dicatat', 'success');

                loadMoodHistory(); // Refresh chart

                // Dispatch Event to Chat
                window.dispatchEvent(new CustomEvent('moodUpdated', {
                    detail: { level: level, note: note }
                }));

            } catch (e) {
                showToast('Gagal menyimpan mood', 'error');
            }
        });
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-[slideDown_0.3s_ease-out] border ${type === 'success'
            ? 'bg-white dark:bg-green-900/90 text-green-800 dark:text-green-100 border-green-100 dark:border-green-800'
            : 'bg-white dark:bg-red-900/90 text-red-800 dark:text-red-100 border-red-100 dark:border-red-800'
        }`;

    // Add icon based on type
    const icon = type === 'success' ? 'check_circle' : 'error';

    toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">${icon}</span>
        <span class="text-sm font-semibold">${message}</span>
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        toast.style.transition = 'all 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function loadMoodHistory() {
    if (!userId) return;
    try {
        const res = await fetch(`/api/mood/history?userId=${userId}`);
        const data = await res.json();
        renderMoodChart(data);
    } catch (e) { console.error(e); }
}

function renderMoodChart(data) {
    const ctx = document.getElementById('mood-chart')?.getContext('2d');
    if (!ctx) return;

    const labels = data.map(d => new Date(d.createdAt).toLocaleDateString('id-ID', { weekday: 'short' }));
    const values = data.map(d => d.moodLevel);

    if (moodChartInstance) moodChartInstance.destroy();

    moodChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Mood Level',
                data: values,
                borderColor: '#10b981',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }]
        },
        options: {
            scales: {
                y: { min: 1, max: 5, ticks: { stepSize: 1 } }
            },
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

// --- JOURNALING ---
function setupJournaling() {
    const saveBtn = document.getElementById('btn-save-journal');
    saveBtn?.addEventListener('click', async () => {
        const content = document.getElementById('journal-content').value;
        if (!content) return;

        saveBtn.innerText = "Menganalisis...";
        saveBtn.disabled = true;

        try {
            const res = await fetch('/api/journal/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content })
            });
            const data = await res.json();

            // Show Feedback
            document.getElementById('journal-feedback').innerHTML = marked.parse(data.entry.aiFeedback);
            document.getElementById('journal-result').classList.remove('hidden');

            saveBtn.innerText = "Simpan & Analisis";
            saveBtn.disabled = false;

            // Dispatch Event to Chat
            window.dispatchEvent(new CustomEvent('journalUpdated', {
                detail: { content: content }
            }));

        } catch (e) {
            alert('Error');
            saveBtn.disabled = false;
        }
    });
}

// --- BREATHING ---
function setupBreathing() {
    const startBtn = document.getElementById('btn-start-breathing');
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');

    if (!startBtn) return;

    startBtn.addEventListener('click', () => {
        startBtn.classList.add('hidden');
        text.innerText = "Tarik Napas... (4s)";
        circle.className = "size-32 rounded-full bg-green-400 transition-all duration-[4000ms] scale-100 ease-in-out";

        // 4-7-8 Cycle
        runBreathingCycle(circle, text);
    });
}

function runBreathingCycle(circle, text) {
    // Inhale 4s
    setTimeout(() => {
        circle.classList.add('scale-150');
    }, 100);

    setTimeout(() => {
        text.innerText = "Tahan... (7s)";
        // Hold 7s
        setTimeout(() => {
            text.innerText = "Hembuskan... (8s)";
            circle.classList.remove('scale-150');
            circle.classList.add('scale-75'); // Shrink
            circle.style.transitionDuration = "8000ms"; // update duration for exhale

            setTimeout(() => {
                text.innerText = "Selesai. Ulangi?";
                document.getElementById('btn-start-breathing').classList.remove('hidden');
                circle.style.transitionDuration = "4000ms"; // reset
                circle.classList.remove('scale-75');
            }, 8000);
        }, 7000);
    }, 4000);
}
