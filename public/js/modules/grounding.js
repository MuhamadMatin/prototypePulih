// Grounding Exercise Module (5-4-3-2-1 Technique)
// Modular ES6 implementation

import { toggleModal, showToast } from './ui.js';

const GROUNDING_STEPS = [
    {
        count: 5,
        sense: 'lihat',
        icon: 'visibility',
        color: 'blue',
        instruction: 'Sebutkan 5 hal yang dapat kamu LIHAT di sekitarmu.',
        placeholder: 'Contoh: meja, kursi, lampu, tanaman, foto...',
        emojis: ['👀', '🔍', '👁️']
    },
    {
        count: 4,
        sense: 'sentuh',
        icon: 'pan_tool',
        color: 'green',
        instruction: 'Sebutkan 4 hal yang dapat kamu SENTUH atau rasakan teksturnya.',
        placeholder: 'Contoh: meja yang halus, kain baju, karpet...',
        emojis: ['🤚', '✋', '👆']
    },
    {
        count: 3,
        sense: 'dengar',
        icon: 'hearing',
        color: 'purple',
        instruction: 'Sebutkan 3 hal yang dapat kamu DENGAR saat ini.',
        placeholder: 'Contoh: suara kipas, kendaraan, napasmu...',
        emojis: ['👂', '🔊', '🎵']
    },
    {
        count: 2,
        sense: 'cium',
        icon: 'air',
        color: 'orange',
        instruction: 'Sebutkan 2 hal yang dapat kamu CIUM baunya.',
        placeholder: 'Contoh: kopi, parfum, udara segar...',
        emojis: ['👃', '🌸', '☕']
    },
    {
        count: 1,
        sense: 'rasa',
        icon: 'restaurant',
        color: 'pink',
        instruction: 'Sebutkan 1 hal yang dapat kamu RASAKAN di lidah atau mulut.',
        placeholder: 'Contoh: rasa air, pasta gigi, makanan terakhir...',
        emojis: ['👅', '🍵', '🍪']
    }
];

let currentStep = 0;
let groundingAnswers = [];

/**
 * Initialize grounding exercise
 */
export function setupGrounding() {
    const startBtn = document.getElementById('btn-start-grounding');
    const backBtn = document.getElementById('btn-grounding-back');
    const skipBtn = document.getElementById('btn-grounding-skip');
    const nextBtn = document.getElementById('btn-grounding-next');

    if (startBtn) {
        startBtn.addEventListener('click', startGrounding);
    }

    if (backBtn) {
        backBtn.addEventListener('click', previousStep);
    }

    if (skipBtn) {
        skipBtn.addEventListener('click', skipStep);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
    }

    // Reset on modal open
    window.addEventListener('modalOpened', (e) => {
        if (e.detail.id === 'grounding-modal') {
            resetGrounding();
        }
    });
}

/**
 * Start the grounding exercise
 */
function startGrounding() {
    const introView = document.getElementById('grounding-intro');
    const exerciseView = document.getElementById('grounding-exercise');
    const completeView = document.getElementById('grounding-complete');

    if (introView) introView.classList.add('hidden');
    if (completeView) completeView.classList.add('hidden');
    if (exerciseView) exerciseView.classList.remove('hidden');

    currentStep = 0;
    groundingAnswers = [];
    renderCurrentStep();
}

/**
 * Reset grounding exercise
 */
function resetGrounding() {
    const introView = document.getElementById('grounding-intro');
    const exerciseView = document.getElementById('grounding-exercise');
    const completeView = document.getElementById('grounding-complete');

    if (introView) introView.classList.remove('hidden');
    if (exerciseView) exerciseView.classList.add('hidden');
    if (completeView) completeView.classList.add('hidden');

    currentStep = 0;
    groundingAnswers = [];
}

/**
 * Render current step UI
 */
function renderCurrentStep() {
    const step = GROUNDING_STEPS[currentStep];
    if (!step) return;

    // Update progress
    const progressContainer = document.getElementById('grounding-progress');
    if (progressContainer) {
        progressContainer.innerHTML = GROUNDING_STEPS.map((s, i) => `
            <div class="flex-1 h-2 rounded-full transition-all duration-300 ${i < currentStep ? 'bg-primary' :
                i === currentStep ? 'bg-primary animate-pulse' :
                    'bg-gray-200 dark:bg-gray-700'
            }"></div>
        `).join('');
    }

    // Update step indicator
    const stepIndicator = document.getElementById('grounding-step-indicator');
    if (stepIndicator) {
        stepIndicator.textContent = `${currentStep + 1} / ${GROUNDING_STEPS.length}`;
    }

    // Update content
    const contentContainer = document.getElementById('grounding-content');
    if (contentContainer) {
        const colorClasses = {
            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200',
            green: 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200',
            purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border-purple-200',
            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-orange-200',
            pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 border-pink-200'
        };

        const colors = colorClasses[step.color] || colorClasses.blue;

        contentContainer.innerHTML = `
            <div class="text-center mb-6 animate-[fadeIn_0.3s_ease-out]">
                <div class="inline-flex items-center justify-center size-20 rounded-3xl ${colors} mb-4 shadow-lg">
                    <span class="material-symbols-outlined text-4xl">${step.icon}</span>
                </div>
                <div class="text-4xl mb-2">${step.emojis[0]}</div>
                <h3 class="text-3xl font-black text-gray-800 dark:text-white mb-2">
                    ${step.count} Hal yang Bisa Kamu <span class="capitalize ${colors.split(' ')[1]}">${step.sense.toUpperCase()}</span>
                </h3>
                <p class="text-gray-500 dark:text-gray-400">${step.instruction}</p>
            </div>
            
            <div class="space-y-3">
                ${Array.from({ length: step.count }, (_, i) => `
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl">${step.emojis[i % step.emojis.length]}</span>
                        <input 
                            type="text" 
                            class="grounding-input w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-gray-800 dark:text-white placeholder-gray-400"
                            placeholder="${step.placeholder}"
                            data-step="${currentStep}"
                            data-index="${i}"
                        >
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Update navigation buttons
    const backBtn = document.getElementById('btn-grounding-back');
    if (backBtn) {
        backBtn.classList.toggle('invisible', currentStep === 0);
    }

    const nextBtn = document.getElementById('btn-grounding-next');
    if (nextBtn) {
        nextBtn.textContent = currentStep === GROUNDING_STEPS.length - 1 ? 'Selesai' : 'Lanjut';
    }
}

/**
 * Go to next step
 */
function nextStep() {
    // Save current answers
    saveCurrentAnswers();

    if (currentStep < GROUNDING_STEPS.length - 1) {
        currentStep++;
        renderCurrentStep();
    } else {
        completeGrounding();
    }
}

/**
 * Go to previous step
 */
function previousStep() {
    if (currentStep > 0) {
        currentStep--;
        renderCurrentStep();
    }
}

/**
 * Skip current step
 */
function skipStep() {
    nextStep();
}

/**
 * Save answers from current step
 */
function saveCurrentAnswers() {
    const inputs = document.querySelectorAll('.grounding-input');
    const answers = Array.from(inputs).map(input => input.value.trim()).filter(v => v);
    groundingAnswers[currentStep] = answers;
}

/**
 * Complete the grounding exercise
 */
async function completeGrounding() {
    const exerciseView = document.getElementById('grounding-exercise');
    const completeView = document.getElementById('grounding-complete');

    if (exerciseView) exerciseView.classList.add('hidden');
    if (completeView) completeView.classList.remove('hidden');

    // Log completion
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (userId) {
        try {
            await fetch('/api/grounding/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
        } catch (e) {
            console.error('Error logging grounding completion:', e);
        }
    }

    // Update summary
    const summaryContainer = document.getElementById('grounding-summary');
    if (summaryContainer) {
        const totalAnswers = groundingAnswers.flat().length;
        summaryContainer.innerHTML = `
            <p class="text-lg text-gray-600 dark:text-gray-300">
                Kamu berhasil mengidentifikasi <strong class="text-primary">${totalAnswers} hal</strong> di sekitarmu.
            </p>
            <p class="text-sm text-gray-500 mt-2">
                Semoga latihan ini membantu kamu merasa lebih hadir dan tenang.
            </p>
        `;
    }

    // Dispatch completion event for achievements
    window.dispatchEvent(new CustomEvent('groundingCompleted'));

    showToast('Latihan grounding selesai! 🌿', 'success');
}

export default { setupGrounding };
