
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

let allJournalEntries = []; // Store for client-side search

// --- JOURNALING (NEW DASHBOARD) ---
function setupJournaling() {
    // View Switching
    const btnWrite = document.getElementById('btn-write-journal');
    const btnBack = document.getElementById('btn-back-journal');
    const btnCancel = document.getElementById('btn-cancel-journal');
    const viewList = document.getElementById('journal-list-view');
    const viewWrite = document.getElementById('journal-write-view');
    const searchInput = document.getElementById('journal-search');

    const switchView = (toWrite) => {
        if (toWrite) {
            viewList.classList.add('hidden');
            viewWrite.classList.remove('hidden');
            viewWrite.classList.add('flex');
            document.getElementById('journal-content-new').focus();
        } else {
            viewWrite.classList.add('hidden');
            viewWrite.classList.remove('flex');
            viewList.classList.remove('hidden');
            document.getElementById('journal-content-new').value = ''; // Reset
        }
    };

    btnWrite?.addEventListener('click', () => switchView(true));
    btnBack?.addEventListener('click', () => switchView(false));
    btnCancel?.addEventListener('click', () => switchView(false));

    // Search Logic
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allJournalEntries.filter(entry =>
            entry.content.toLowerCase().includes(query) ||
            (entry.aiFeedback && entry.aiFeedback.toLowerCase().includes(query))
        );
        renderJournalEntries(filtered);
    });

    // Save Logic
    const btnSave = document.getElementById('btn-save-journal-new');
    btnSave?.addEventListener('click', async () => {
        const content = document.getElementById('journal-content-new').value;
        if (!content.trim()) return showToast('Tulis sesuatu dulu ya!', 'error');

        btnSave.innerText = "Menyimpan...";
        btnSave.disabled = true;

        try {
            const res = await fetch('/api/journal/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, content })
            });
            const data = await res.json();

            showToast('Jurnal berhasil disimpan', 'success');

            // Analyze Feedback (Optional: show in a modal or just save it)
            // For now, just reset and go back
            switchView(false);
            loadJournalList(); // Refresh list

            // Dispatch Event to Chat
            window.dispatchEvent(new CustomEvent('journalUpdated', {
                detail: { content: content }
            }));

        } catch (e) {
            showToast('Error menyimpan jurnal', 'error');
            console.error(e);
        } finally {
            btnSave.innerText = "Simpan";
            btnSave.disabled = false;
        }
    });

    // Initial Load when modal opens
    // We hook into the global toggleModal or just listen for clicks
    document.getElementById('btn-journal')?.addEventListener('click', () => {
        loadJournalList();
        // Also update weekly mood bars if needed, but renderMoodChart updates that
    });
}

async function loadJournalList() {
    const container = document.getElementById('journal-entries-container');
    const countLabel = document.getElementById('journal-count');
    if (!container) return;

    container.innerHTML = `<div class="flex flex-col items-center justify-center h-40 text-gray-400"><span class="material-symbols-outlined text-4xl mb-2 animate-spin">progress_activity</span><p class="text-xs">Memuat...</p></div>`;

    try {
        const res = await fetch(`/api/journal/history?userId=${userId}`);
        const entries = await res.json();

        allJournalEntries = entries; // Update store
        renderJournalEntries(entries);
    } catch (e) {
        container.innerHTML = `<p class="text-center text-red-400 text-sm mt-10">Gagal memuat jurnal.</p>`;
    }
}

function renderJournalEntries(entries) {
    const container = document.getElementById('journal-entries-container');
    const countLabel = document.getElementById('journal-count');
    if (!container) return;

    container.innerHTML = '';
    countLabel.innerText = `Menampilkan ${entries.length} entri`;

    if (entries.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-gray-400 opacity-60">
                <span class="material-symbols-outlined text-6xl mb-4 text-gray-300 dark:text-gray-700">book_4</span>
                <p class="text-sm font-medium">Jurnal kamu masih kosong</p>
                <p class="text-xs mt-1">Mulai tulis ceritamu hari ini.</p>
            </div>
        `;
        return;
    }

    entries.forEach(entry => {
        const dateObj = new Date(entry.createdAt);
        const dateStr = dateObj.getDate().toString();
        const monthStr = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Mocking Mood Icon/Color based on something (random or future implementation)
        // Since Journal db doesn't strictly link to a mood_id, we just show a generic icon or analyze text sentiment (too complex for now)
        // Let's use a generic 'article' icon or specific icons if tags exist

        const card = document.createElement('div');
        card.className = "group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md transition-all cursor-pointer animate-[fadeIn_0.3s_ease-out]";
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex flex-col items-center justify-center text-purple-600 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30">
                        <span class="text-[10px] font-bold tracking-wider">${monthStr}</span>
                        <span class="text-lg font-bold leading-none">${dateStr}</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base group-hover:text-primary transition-colors line-clamp-1">Catatan Harian</h3>
                        <p class="text-xs text-text-muted dark:text-gray-400 mt-0.5">${timeStr} WIB • Jurnal Pribadi</p>
                    </div>
                </div>
                <!-- <span class="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">navigate_next</span> -->
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-3 font-body">
                ${entry.content}
            </p>
            ${entry.aiFeedback ? `
            <div class="mt-3 pt-3 border-t border-gray-50 dark:border-gray-700/50">
                 <p class="text-xs text-purple-600 dark:text-purple-300 flex items-center gap-1.5 font-medium">
                    <span class="material-symbols-outlined text-[14px]">psychology</span>
                    Insight: <span class="text-gray-500 dark:text-gray-400 font-normal italic truncate max-w-[200px]">${entry.aiFeedback}</span>
                 </p>
            </div>
            ` : ''}
        `;

        // Expand/View Details Logic (Optional: simple alert or modal swap)
        card.onclick = () => {
            // For now, no detail view, just maybe show full text?
            // Let's just keep it simple.
        };

        container.appendChild(card);
    });
}


// --- BREATHING ---
function setupBreathing() {
    // ... existing breathing code ...
    const startBtn = document.getElementById('btn-start-breathing');
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');

    if (!startBtn) return;

    startBtn.addEventListener('click', () => {
        startBtn.classList.add('hidden');
        text.innerText = "Tarik Napas... (4s)";
        circle.className = "size-32 rounded-full bg-green-400 transition-all duration-[4000ms] scale-100 ease-in-out";
        runBreathingCycle(circle, text);
    });
}

function runBreathingCycle(circle, text) {
    // ... same as before
    setTimeout(() => {
        circle.classList.add('scale-150');
    }, 100);

    setTimeout(() => {
        text.innerText = "Tahan... (7s)";
        setTimeout(() => {
            text.innerText = "Hembuskan... (8s)";
            circle.classList.remove('scale-150');
            circle.classList.add('scale-75');
            circle.style.transitionDuration = "8000ms";

            setTimeout(() => {
                text.innerText = "Selesai. Ulangi?";
                document.getElementById('btn-start-breathing').classList.remove('hidden');
                circle.style.transitionDuration = "4000ms";
                circle.classList.remove('scale-75');
            }, 8000);
        }, 7000);
    }, 4000);
}

// Updated Render Mood Chart to include Sidebar Bars
function renderMoodChart(data) {
    // 1. Chart.js Implementation
    const ctx = document.getElementById('mood-chart')?.getContext('2d');
    if (ctx) {
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

    // 2. Sidebar Bars Implementation (Weekly Mood)
    const barsContainer = document.getElementById('weekly-mood-bars');
    const summaryText = document.getElementById('weekly-mood-text');

    if (barsContainer && data.length > 0) {
        // Get last 7 entries or all if less
        const recent = data.slice(-7);

        // Clear mock bars
        barsContainer.innerHTML = '';

        recent.forEach(d => {
            const div = document.createElement('div');
            div.className = "flex-1 rounded-full transition-all hover:scale-110";

            // Color map
            const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];
            div.classList.add(colors[d.moodLevel - 1] || 'bg-gray-300');
            div.title = `Level ${d.moodLevel}`;

            barsContainer.appendChild(div);
        });

        // Fill empty slots if less than 7
        for (let i = recent.length; i < 7; i++) {
            const div = document.createElement('div');
            div.className = "flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full";
            barsContainer.appendChild(div);
        }

        if (summaryText) {
            const avg = recent.reduce((a, b) => a + b.moodLevel, 0) / recent.length;
            let msg = "Mood kamu cukup stabil.";
            if (avg >= 4) msg = "Minggu ini penuh energi positif! 🌟";
            if (avg <= 2) msg = "Minggu yang berat ya? Tetap semangat. 🫂";
            summaryText.innerText = msg;
        }
    }
}
