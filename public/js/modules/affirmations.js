// Affirmations Module - Daily motivational quotes
// Modular ES6 implementation

let affirmationsData = null;

/**
 * Initialize affirmations module
 * Loads data and displays random affirmation
 */
export async function initAffirmations() {
    try {
        await loadAffirmations();
        displayRandomAffirmation();
        
        // Set up click to refresh
        const container = document.getElementById('affirmation-container');
        if (container) {
            container.style.cursor = 'pointer';
            container.title = 'Klik untuk kata bijak baru';
            container.addEventListener('click', () => {
                displayRandomAffirmation(true);
            });
        }
    } catch (error) {
        console.error('Failed to initialize affirmations:', error);
    }
}

/**
 * Load affirmations from JSON file
 */
async function loadAffirmations() {
    if (affirmationsData) return affirmationsData;
    
    try {
        const response = await fetch('/data/affirmations.json');
        if (!response.ok) throw new Error('Failed to fetch affirmations');
        affirmationsData = await response.json();
        return affirmationsData;
    } catch (error) {
        console.error('Error loading affirmations:', error);
        // Fallback data
        affirmationsData = {
            affirmations: [
                { id: 1, text: "Kamu layak mendapat cinta dan kebahagiaan.", category: "self-love" },
                { id: 2, text: "Setiap langkah kecil adalah kemajuan.", category: "progress" },
                { id: 3, text: "Kamu lebih kuat dari yang kamu kira.", category: "strength" }
            ]
        };
        return affirmationsData;
    }
}

/**
 * Get a random affirmation
 * @param {string} category - Optional category filter
 * @returns {object} Random affirmation object
 */
export function getRandomAffirmation(category = null) {
    if (!affirmationsData) return null;
    
    let pool = affirmationsData.affirmations;
    
    if (category) {
        pool = pool.filter(a => a.category === category);
    }
    
    if (pool.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}

/**
 * Get affirmation based on mood level
 * @param {number} moodLevel - Mood level (1-5)
 * @returns {object} Mood-appropriate affirmation
 */
export function getAffirmationByMood(moodLevel) {
    const moodCategories = {
        1: ['validation', 'support', 'healing', 'hope'],
        2: ['strength', 'courage', 'resilience', 'self-compassion'],
        3: ['mindfulness', 'patience', 'peace', 'self-care'],
        4: ['progress', 'growth', 'effort', 'gratitude'],
        5: ['celebration', 'happiness', 'self-love', 'empowerment']
    };
    
    const categories = moodCategories[moodLevel] || moodCategories[3];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return getRandomAffirmation(randomCategory) || getRandomAffirmation();
}

/**
 * Display random affirmation in the container
 * @param {boolean} animate - Whether to animate the change
 */
export function displayRandomAffirmation(animate = false) {
    const container = document.getElementById('affirmation-container');
    if (!container) return;
    
    const affirmation = getRandomAffirmation();
    if (!affirmation) return;
    
    if (animate) {
        // Fade out
        container.style.opacity = '0';
        container.style.transform = 'translateY(5px)';
        
        setTimeout(() => {
            container.innerHTML = `"${affirmation.text}"`;
            // Fade in
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 200);
    } else {
        container.innerHTML = `"${affirmation.text}"`;
    }
    
    // Add transition styles
    container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
}

/**
 * Get affirmation of the day (consistent for 24 hours)
 * Uses date-based seeding for consistency
 * @returns {object} Affirmation object
 */
export function getAffirmationOfTheDay() {
    if (!affirmationsData) return null;
    
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    
    // Simple hash function for date-based index
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
        hash = ((hash << 5) - hash) + dateString.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % affirmationsData.affirmations.length;
    return affirmationsData.affirmations[index];
}

export default {
    initAffirmations,
    getRandomAffirmation,
    getAffirmationByMood,
    displayRandomAffirmation,
    getAffirmationOfTheDay
};
