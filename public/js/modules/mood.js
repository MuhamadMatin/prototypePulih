// Mood Logic
import { toggleModal, showToast } from './ui.js';

let moodChartInstance = null;
const userId = JSON.parse(localStorage.getItem('user'))?.id;

export function setupMoodTracker() {
    const emojis = document.querySelectorAll('.mood-emoji');
    emojis.forEach(btn => {
        btn.addEventListener('click', async () => {
            const level = btn.dataset.level;
            const note = document.getElementById('mood-note').value;

            try {
                const res = await fetch('/api/mood', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, moodLevel: level, note })
                });

                if (res.status === 401) {
                    showToast('Sesi habis, silakan login ulang', 'error');
                    setTimeout(() => window.location.href = 'index.html', 1500);
                    return;
                }

                toggleModal('mood-modal', false);
                showToast('Mood berhasil dicatat', 'success');

                // Clear inputs
                document.getElementById('mood-note').value = '';

                // Refresh chart logic is triggered by toggleModal opening, but we should also refresh if open
                loadMoodHistory();

                // Dispatch Event to Chat (for AI context)
                window.dispatchEvent(new CustomEvent('moodUpdated', {
                    detail: { level: level, note: note }
                }));

            } catch (e) {
                showToast('Gagal menyimpan mood', 'error');
                console.error(e);
            }
        });
    });

    // Hook into modal open to load history
    window.addEventListener('modalOpened', (e) => {
        if (e.detail.id === 'mood-modal') loadMoodHistory();
    });
}

export async function loadMoodHistory() {
    if (!userId) return;
    try {
        const res = await fetch(`/api/mood/history?userId=${userId}`);
        const data = await res.json();
        renderMoodChart(data);
    } catch (e) { console.error("Mood load error", e); }
}

function renderMoodChart(data) {
    // 1. Chart.js Implementation
    const ctx = document.getElementById('mood-chart')?.getContext('2d');
    if (ctx && typeof Chart !== 'undefined') {
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
