// Achievements Module - Gamification system
// Modular ES6 implementation

import { showToast } from './ui.js';

let achievementsConfig = null;
let userAchievements = [];
const userId = JSON.parse(localStorage.getItem('user'))?.id;

/**
 * Initialize achievements module
 */
export async function initAchievements() {
    try {
        await loadAchievementsConfig();
        await loadUserAchievements();
        checkTimeBasedAchievements();
    } catch (error) {
        console.error('Failed to initialize achievements:', error);
    }
}

/**
 * Load achievements configuration
 */
async function loadAchievementsConfig() {
    if (achievementsConfig) return achievementsConfig;

    try {
        const response = await fetch('/data/achievements-config.json');
        if (!response.ok) throw new Error('Failed to fetch achievements config');
        achievementsConfig = await response.json();
        return achievementsConfig;
    } catch (error) {
        console.error('Error loading achievements config:', error);
        return null;
    }
}

/**
 * Load user's unlocked achievements
 */
async function loadUserAchievements() {
    if (!userId) return [];

    try {
        const response = await fetch(`/api/achievements?userId=${userId}`);
        if (response.ok) {
            const data = await response.json();
            userAchievements = data.achievements || [];
        }
    } catch (error) {
        console.error('Error loading user achievements:', error);
        // Use localStorage as fallback
        userAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    }

    return userAchievements;
}

/**
 * Check if user has a specific achievement
 * @param {string} achievementId - Achievement ID to check
 * @returns {boolean}
 */
export function hasAchievement(achievementId) {
    return userAchievements.some(a => a.achievementType === achievementId || a.id === achievementId);
}

/**
 * Unlock an achievement
 * @param {string} achievementId - Achievement ID to unlock
 * @returns {Promise<boolean>} Success status
 */
export async function unlockAchievement(achievementId) {
    if (hasAchievement(achievementId)) return false;

    const achievement = achievementsConfig?.achievements.find(a => a.id === achievementId);
    if (!achievement) return false;

    try {
        // Try to save to backend
        if (userId) {
            const response = await fetch('/api/achievements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, achievementType: achievementId })
            });

            if (response.ok) {
                userAchievements.push({ achievementType: achievementId, unlockedAt: new Date() });
            }
        }

        // Also save to localStorage as backup
        const localAchievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (!localAchievements.includes(achievementId)) {
            localAchievements.push(achievementId);
            localStorage.setItem('achievements', JSON.stringify(localAchievements));
        }

        // Show unlock notification
        showAchievementUnlock(achievement);

        return true;
    } catch (error) {
        console.error('Error unlocking achievement:', error);
        return false;
    }
}

/**
 * Show achievement unlock notification
 * @param {object} achievement - Achievement object
 */
function showAchievementUnlock(achievement) {
    const colors = achievementsConfig?.colorMap[achievement.color] || {};

    // Create achievement toast
    const toastHtml = `
        <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl ${colors.bg || 'bg-green-100'}">
                <span class="material-symbols-outlined ${colors.text || 'text-green-600'}">${achievement.icon}</span>
            </div>
            <div>
                <p class="font-bold text-sm">🏆 Achievement Unlocked!</p>
                <p class="text-xs opacity-80">${achievement.name}</p>
            </div>
        </div>
    `;

    showToast(toastHtml, 'achievement', 4000);

    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('achievementUnlocked', {
        detail: { achievement }
    }));
}

/**
 * Check and unlock achievements based on counts
 * @param {string} triggerType - Type of trigger (chat_count, mood_count, etc.)
 * @param {number} count - Current count
 */
export async function checkAchievements(triggerType, count) {
    if (!achievementsConfig) await loadAchievementsConfig();

    const matchingAchievements = achievementsConfig.achievements.filter(
        a => a.trigger === triggerType && a.threshold <= count
    );

    for (const achievement of matchingAchievements) {
        await unlockAchievement(achievement.id);
    }
}

/**
 * Check time-based achievements
 */
function checkTimeBasedAchievements() {
    const hour = new Date().getHours();

    // Night owl: 00:00 - 04:00
    if (hour >= 0 && hour < 4) {
        unlockAchievement('night_owl');
    }

    // Early bird: 05:00 - 07:00
    if (hour >= 5 && hour <= 7) {
        unlockAchievement('early_bird');
    }
}

/**
 * Get all achievements with unlock status
 * @returns {Array} Achievements with status
 */
export function getAllAchievements() {
    if (!achievementsConfig) return [];

    return achievementsConfig.achievements.map(achievement => ({
        ...achievement,
        unlocked: hasAchievement(achievement.id),
        unlockedAt: userAchievements.find(a => a.achievementType === achievement.id)?.unlockedAt || null,
        colors: achievementsConfig.colorMap[achievement.color] || {}
    }));
}

/**
 * Get unlocked achievements count
 * @returns {object} Count object { unlocked, total }
 */
export function getAchievementStats() {
    const total = achievementsConfig?.achievements.length || 0;
    const unlocked = userAchievements.length;

    return { unlocked, total, percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
}

/**
 * Render achievements grid
 * @param {HTMLElement} container - Container element
 */
export function renderAchievementsGrid(container) {
    if (!container) return;

    const achievements = getAllAchievements();

    container.innerHTML = achievements.map(a => `
        <div class="relative p-4 rounded-2xl border ${a.unlocked ? a.colors.bg + ' ' + a.colors.border : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'} ${a.unlocked ? '' : 'opacity-50 grayscale'}">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-2xl ${a.unlocked ? a.colors.text : 'text-gray-400'}">${a.icon}</span>
                <div>
                    <p class="font-bold text-sm ${a.unlocked ? '' : 'text-gray-500'}">${a.name}</p>
                    <p class="text-xs ${a.unlocked ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}">${a.description}</p>
                </div>
            </div>
            ${a.unlocked ? '<span class="absolute top-2 right-2 text-xs">✨</span>' : ''}
        </div>
    `).join('');
}

export default {
    initAchievements,
    hasAchievement,
    unlockAchievement,
    checkAchievements,
    getAllAchievements,
    getAchievementStats,
    renderAchievementsGrid
};
