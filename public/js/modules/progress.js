// Progress Dashboard Module
// Modular ES6 implementation

import { toggleModal, showToast } from './ui.js';
import { getAllAchievements, getAchievementStats, renderAchievementsGrid } from './achievements.js';
import { getAssessmentHistory } from './assessment.js';

const userId = JSON.parse(localStorage.getItem('user'))?.id;
let moodChartInstance = null;

/**
 * Initialize progress dashboard
 */
export function setupProgress() {
    // Tab switching
    document.querySelectorAll('.progress-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Date range selector
    document.getElementById('progress-range')?.addEventListener('change', (e) => {
        loadMoodProgress(parseInt(e.target.value));
    });

    // Load on modal open
    window.addEventListener('modalOpened', async (e) => {
        if (e.detail.id === 'progress-modal') {
            await loadProgressData();
        }
    });
}

/**
 * Switch between tabs
 */
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.progress-tab').forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('bg-primary', 'text-black');
            tab.classList.remove('bg-gray-100', 'dark:bg-gray-800', 'text-gray-600');
        } else {
            tab.classList.remove('bg-primary', 'text-black');
            tab.classList.add('bg-gray-100', 'dark:bg-gray-800', 'text-gray-600');
        }
    });

    // Show/hide content
    document.querySelectorAll('.progress-content').forEach(content => {
        content.classList.toggle('hidden', content.id !== `progress-${tabId}`);
    });
}

/**
 * Load all progress data
 */
async function loadProgressData() {
    await Promise.all([
        loadMoodProgress(30),
        loadAchievementsProgress(),
        loadAssessmentProgress(),
        loadStreakProgress()
    ]);
}

/**
 * Load mood progress chart
 */
async function loadMoodProgress(days = 30) {
    if (!userId) return;

    try {
        const res = await fetch(`/api/mood/history?userId=${userId}&days=${days}`);
        if (!res.ok) return;

        const data = await res.json();
        renderMoodProgressChart(data, days);
        renderMoodStats(data);
    } catch (e) {
        console.error('Error loading mood progress:', e);
    }
}

/**
 * Render mood progress chart
 */
function renderMoodProgressChart(data, days) {
    const ctx = document.getElementById('progress-mood-chart')?.getContext('2d');
    if (!ctx || typeof Chart === 'undefined') return;

    // Prepare data with date labels
    const labels = data.map(d => {
        const date = new Date(d.createdAt);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });
    const values = data.map(d => d.moodLevel);

    if (moodChartInstance) moodChartInstance.destroy();

    moodChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Mood Level',
                data: values,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: (value) => {
                            const emojis = ['', '😭', '😢', '😐', '🙂', '😁'];
                            return emojis[value] || value;
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const emojis = ['', '😭 Sangat Buruk', '😢 Buruk', '😐 Biasa', '🙂 Baik', '😁 Sangat Baik'];
                            return emojis[context.raw] || context.raw;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Render mood statistics
 */
function renderMoodStats(data) {
    const container = document.getElementById('progress-mood-stats');
    if (!container || data.length === 0) return;

    const avg = (data.reduce((sum, d) => sum + d.moodLevel, 0) / data.length).toFixed(1);
    const best = Math.max(...data.map(d => d.moodLevel));
    const worst = Math.min(...data.map(d => d.moodLevel));

    // Count occurrences
    const counts = [0, 0, 0, 0, 0, 0];
    data.forEach(d => counts[d.moodLevel]++);
    const mostCommon = counts.indexOf(Math.max(...counts.slice(1)));

    const emojis = ['', '😭', '😢', '😐', '🙂', '😁'];

    container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p class="text-3xl font-black text-primary">${avg}</p>
                <p class="text-xs text-gray-500">Rata-rata</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p class="text-3xl">${emojis[best]}</p>
                <p class="text-xs text-gray-500">Terbaik</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p class="text-3xl">${emojis[mostCommon]}</p>
                <p class="text-xs text-gray-500">Paling Sering</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
                <p class="text-3xl font-black text-gray-800 dark:text-white">${data.length}</p>
                <p class="text-xs text-gray-500">Total Log</p>
            </div>
        </div>
    `;
}

/**
 * Load achievements progress
 */
function loadAchievementsProgress() {
    const container = document.getElementById('progress-achievements');
    if (!container) return;

    const stats = getAchievementStats();

    container.innerHTML = `
        <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Progress Achievement</span>
                <span class="text-sm font-bold text-primary">${stats.unlocked}/${stats.total}</span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500" style="width: ${stats.percentage}%"></div>
            </div>
        </div>
        <div id="achievements-grid" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2"></div>
    `;

    // Render achievements grid
    const grid = document.getElementById('achievements-grid');
    if (grid) {
        renderAchievementsGrid(grid);
    }
}

/**
 * Load assessment history progress
 */
async function loadAssessmentProgress() {
    const container = document.getElementById('progress-assessments');
    if (!container) return;

    const history = await getAssessmentHistory();

    if (history.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-2">psychology</span>
                <p>Belum ada assessment. Coba PHQ-9 atau GAD-7!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            ${history.map(a => {
        const typeLabel = a.type === 'PHQ9' ? 'Depresi (PHQ-9)' : 'Kecemasan (GAD-7)';
        const maxScore = a.type === 'PHQ9' ? 27 : 21;
        const percent = Math.round((a.score / maxScore) * 100);
        const date = new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const severityColors = {
            minimal: 'bg-green-100 text-green-700',
            mild: 'bg-yellow-100 text-yellow-700',
            moderate: 'bg-orange-100 text-orange-700',
            moderately_severe: 'bg-red-100 text-red-700',
            severe: 'bg-red-200 text-red-800'
        };

        return `
                    <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium text-gray-800 dark:text-white">${typeLabel}</span>
                            <span class="text-xs text-gray-400">${date}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div class="h-full bg-primary" style="width: ${percent}%"></div>
                            </div>
                            <span class="text-sm font-bold text-gray-800 dark:text-white">${a.score}/${maxScore}</span>
                        </div>
                        <span class="inline-block mt-2 text-xs px-2 py-1 rounded-full ${severityColors[a.severity] || 'bg-gray-100 text-gray-600'}">${a.severity}</span>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

/**
 * Load streak progress
 */
async function loadStreakProgress() {
    const container = document.getElementById('progress-streak');
    if (!container) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const streak = user?.streak || 0;

    // Calculate badges
    const milestones = [3, 7, 14, 30, 60, 100];
    const nextMilestone = milestones.find(m => m > streak) || 100;
    const progress = Math.min((streak / nextMilestone) * 100, 100);

    container.innerHTML = `
        <div class="text-center mb-6">
            <div class="inline-flex items-center justify-center size-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-xl mb-4">
                <div class="text-center">
                    <span class="material-symbols-outlined text-3xl">local_fire_department</span>
                    <p class="text-2xl font-black">${streak}</p>
                </div>
            </div>
            <h3 class="text-xl font-bold text-gray-800 dark:text-white">${streak} Hari Berturut-turut!</h3>
            <p class="text-sm text-gray-500">Terus semangat! 💪</p>
        </div>
        
        <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-500">Milestone berikutnya: ${nextMilestone} hari</span>
                <span class="text-sm font-bold text-primary">${streak}/${nextMilestone}</span>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all" style="width: ${progress}%"></div>
            </div>
        </div>
        
        <div class="flex justify-center gap-2 flex-wrap">
            ${milestones.map(m => `
                <div class="px-3 py-1.5 rounded-full text-xs font-bold ${streak >= m ? 'bg-primary text-black' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}">${m} 🔥</div>
            `).join('')}
        </div>
    `;
}

export default { setupProgress };
