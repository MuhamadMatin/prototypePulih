// Self-Assessment Module (PHQ-9 & GAD-7)
// Modular ES6 implementation

import { toggleModal, showToast } from './ui.js';

const userId = JSON.parse(localStorage.getItem('user'))?.id;

// PHQ-9 (Patient Health Questionnaire - 9 items for Depression)
const PHQ9_QUESTIONS = [
    "Kurang berminat atau bergairah dalam melakukan apapun",
    "Merasa sedih, murung, atau putus asa",
    "Sulit tidur/mudah terbangun, atau terlalu banyak tidur",
    "Merasa lelah atau tidak bertenaga",
    "Tidak nafsu makan atau makan berlebihan",
    "Merasa buruk tentang diri sendiri, merasa gagal, atau mengecewakan keluarga",
    "Sulit berkonsentrasi pada sesuatu, seperti membaca atau menonton TV",
    "Bergerak atau berbicara sangat lambat, atau sebaliknya gelisah dan tidak bisa diam",
    "Pikiran bahwa lebih baik mati atau ingin menyakiti diri sendiri"
];

// GAD-7 (Generalized Anxiety Disorder - 7 items)
const GAD7_QUESTIONS = [
    "Merasa gugup, cemas, atau tegang",
    "Tidak mampu menghentikan atau mengendalikan rasa khawatir",
    "Terlalu mengkhawatirkan berbagai hal",
    "Sulit untuk rileks",
    "Sangat gelisah sehingga sulit untuk duduk diam",
    "Mudah kesal atau tersinggung",
    "Merasa takut seolah-olah sesuatu yang buruk akan terjadi"
];

const ANSWER_OPTIONS = [
    { value: 0, label: "Tidak pernah", color: "green" },
    { value: 1, label: "Beberapa hari", color: "yellow" },
    { value: 2, label: "Lebih dari separuh waktu", color: "orange" },
    { value: 3, label: "Hampir setiap hari", color: "red" }
];

let currentAssessmentType = null;
let currentQuestionIndex = 0;
let answers = [];

/**
 * Initialize assessment module
 */
export function setupAssessment() {
    // Type selection buttons
    document.getElementById('btn-phq9')?.addEventListener('click', () => startAssessment('PHQ9'));
    document.getElementById('btn-gad7')?.addEventListener('click', () => startAssessment('GAD7'));

    // Navigation buttons
    document.getElementById('btn-assessment-back')?.addEventListener('click', previousQuestion);
    document.getElementById('btn-assessment-next')?.addEventListener('click', nextQuestion);
    document.getElementById('btn-assessment-restart')?.addEventListener('click', resetAssessment);

    // Reset on modal open
    window.addEventListener('modalOpened', (e) => {
        if (e.detail.id === 'assessment-modal') {
            resetAssessment();
        }
    });
}

/**
 * Start a specific assessment type
 */
function startAssessment(type) {
    currentAssessmentType = type;
    currentQuestionIndex = 0;
    answers = [];

    const selectView = document.getElementById('assessment-select');
    const questionView = document.getElementById('assessment-question');
    const resultView = document.getElementById('assessment-result');

    if (selectView) selectView.classList.add('hidden');
    if (resultView) resultView.classList.add('hidden');
    if (questionView) questionView.classList.remove('hidden');

    // Update title
    const title = document.getElementById('assessment-title');
    if (title) {
        title.textContent = type === 'PHQ9' ? 'Kuesioner Depresi (PHQ-9)' : 'Kuesioner Kecemasan (GAD-7)';
    }

    renderQuestion();
}

/**
 * Reset to initial state
 */
function resetAssessment() {
    currentAssessmentType = null;
    currentQuestionIndex = 0;
    answers = [];

    const selectView = document.getElementById('assessment-select');
    const questionView = document.getElementById('assessment-question');
    const resultView = document.getElementById('assessment-result');

    if (selectView) selectView.classList.remove('hidden');
    if (questionView) questionView.classList.add('hidden');
    if (resultView) resultView.classList.add('hidden');
}

/**
 * Get questions for current assessment type
 */
function getQuestions() {
    return currentAssessmentType === 'PHQ9' ? PHQ9_QUESTIONS : GAD7_QUESTIONS;
}

/**
 * Render current question
 */
function renderQuestion() {
    const questions = getQuestions();
    const question = questions[currentQuestionIndex];

    // Update progress
    const progressBar = document.getElementById('assessment-progress-bar');
    const progressText = document.getElementById('assessment-progress-text');
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${currentQuestionIndex + 1} dari ${questions.length}`;

    // Update question
    const questionContainer = document.getElementById('assessment-question-content');
    if (questionContainer) {
        questionContainer.innerHTML = `
            <div class="animate-[fadeIn_0.3s_ease-out]">
                <p class="text-xs text-gray-400 uppercase tracking-wider mb-2">Dalam 2 minggu terakhir, seberapa sering kamu mengalami...</p>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-8">${question}</h3>
                
                <div class="grid gap-3">
                    ${ANSWER_OPTIONS.map((opt, i) => {
            const isSelected = answers[currentQuestionIndex] === opt.value;
            const colorClasses = {
                green: 'border-green-300 bg-green-50 dark:bg-green-900/20',
                yellow: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20',
                orange: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20',
                red: 'border-red-300 bg-red-50 dark:bg-red-900/20'
            };
            return `
                            <button 
                                class="assessment-option p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${isSelected ? colorClasses[opt.color] + ' ring-2 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }"
                                data-value="${opt.value}"
                            >
                                <span class="font-medium text-gray-800 dark:text-white">${opt.label}</span>
                            </button>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        // Attach click handlers
        questionContainer.querySelectorAll('.assessment-option').forEach(btn => {
            btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.value)));
        });
    }

    // Update navigation
    const backBtn = document.getElementById('btn-assessment-back');
    if (backBtn) backBtn.classList.toggle('invisible', currentQuestionIndex === 0);
}

/**
 * Select an answer
 */
function selectAnswer(value) {
    answers[currentQuestionIndex] = value;

    // Re-render to show selection
    renderQuestion();

    // Auto-advance after short delay
    setTimeout(() => {
        if (currentQuestionIndex < getQuestions().length - 1) {
            nextQuestion();
        } else {
            completeAssessment();
        }
    }, 300);
}

/**
 * Go to next question
 */
function nextQuestion() {
    if (answers[currentQuestionIndex] === undefined) {
        showToast('Silakan pilih jawaban', 'warning');
        return;
    }

    if (currentQuestionIndex < getQuestions().length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        completeAssessment();
    }
}

/**
 * Go to previous question
 */
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

/**
 * Calculate and show results
 */
async function completeAssessment() {
    const totalScore = answers.reduce((sum, val) => sum + (val || 0), 0);
    const maxScore = currentAssessmentType === 'PHQ9' ? 27 : 21;
    const severity = getSeverity(totalScore, currentAssessmentType);

    // Save to backend
    if (userId) {
        try {
            await fetch('/api/assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    type: currentAssessmentType,
                    score: totalScore,
                    severity: severity.level,
                    answers
                })
            });
        } catch (e) {
            console.error('Error saving assessment:', e);
        }
    }

    // Show result view
    const questionView = document.getElementById('assessment-question');
    const resultView = document.getElementById('assessment-result');

    if (questionView) questionView.classList.add('hidden');
    if (resultView) resultView.classList.remove('hidden');

    // Render result
    const resultContainer = document.getElementById('assessment-result-content');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="text-center animate-[fadeIn_0.3s_ease-out]">
                <div class="inline-flex items-center justify-center size-24 rounded-full ${severity.bgColor} mb-6">
                    <span class="material-symbols-outlined text-5xl ${severity.textColor}">${severity.icon}</span>
                </div>
                
                <h3 class="text-2xl font-black text-gray-800 dark:text-white mb-2">
                    Skor: ${totalScore}/${maxScore}
                </h3>
                
                <div class="inline-block px-4 py-2 rounded-full ${severity.bgColor} ${severity.textColor} font-bold text-sm mb-6">
                    ${severity.label}
                </div>
                
                <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 text-left mb-6">
                    <h4 class="font-bold text-gray-800 dark:text-white mb-2">Apa artinya ini?</h4>
                    <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">${severity.description}</p>
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-left border border-blue-100 dark:border-blue-800">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined text-blue-500">info</span>
                        <div>
                            <h4 class="font-bold text-blue-800 dark:text-blue-300 mb-1">Catatan Penting</h4>
                            <p class="text-blue-700 dark:text-blue-400 text-sm">
                                Kuesioner ini bukan diagnosis medis. Jika kamu merasa membutuhkan bantuan, 
                                silakan konsultasikan dengan profesional kesehatan mental.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Trigger achievement
    window.dispatchEvent(new CustomEvent('assessmentCompleted', {
        detail: { type: currentAssessmentType, score: totalScore }
    }));

    showToast('Assessment selesai!', 'success');
}

/**
 * Get severity interpretation based on score
 */
function getSeverity(score, type) {
    if (type === 'PHQ9') {
        if (score <= 4) return {
            level: 'minimal',
            label: 'Minimal / Tidak Ada',
            icon: 'sentiment_very_satisfied',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-600 dark:text-green-400',
            description: 'Skor kamu menunjukkan gejala depresi yang minimal atau tidak ada. Tetap jaga kesehatan mentalmu dengan aktivitas positif dan self-care.'
        };
        if (score <= 9) return {
            level: 'mild',
            label: 'Ringan',
            icon: 'sentiment_satisfied',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            textColor: 'text-yellow-600 dark:text-yellow-400',
            description: 'Skor kamu menunjukkan gejala depresi ringan. Pertimbangkan untuk melakukan aktivitas self-care, olahraga, dan menjaga pola tidur. Pantau perasaanmu secara berkala.'
        };
        if (score <= 14) return {
            level: 'moderate',
            label: 'Sedang',
            icon: 'sentiment_neutral',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            textColor: 'text-orange-600 dark:text-orange-400',
            description: 'Skor kamu menunjukkan gejala depresi sedang. Disarankan untuk berkonsultasi dengan konselor atau psikolog untuk mendapatkan dukungan yang tepat.'
        };
        if (score <= 19) return {
            level: 'moderately_severe',
            label: 'Cukup Berat',
            icon: 'sentiment_dissatisfied',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            textColor: 'text-red-600 dark:text-red-400',
            description: 'Skor kamu menunjukkan gejala depresi yang cukup berat. Sangat disarankan untuk segera berkonsultasi dengan profesional kesehatan mental.'
        };
        return {
            level: 'severe',
            label: 'Berat',
            icon: 'sentiment_very_dissatisfied',
            bgColor: 'bg-red-200 dark:bg-red-900/50',
            textColor: 'text-red-700 dark:text-red-300',
            description: 'Skor kamu menunjukkan gejala depresi berat. Mohon segera mencari bantuan profesional. Kamu tidak sendirian, dan bantuan tersedia.'
        };
    } else { // GAD-7
        if (score <= 4) return {
            level: 'minimal',
            label: 'Minimal / Tidak Ada',
            icon: 'sentiment_very_satisfied',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            textColor: 'text-green-600 dark:text-green-400',
            description: 'Skor kamu menunjukkan tingkat kecemasan yang minimal. Tetap jaga keseimbangan hidupmu.'
        };
        if (score <= 9) return {
            level: 'mild',
            label: 'Ringan',
            icon: 'sentiment_satisfied',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            textColor: 'text-yellow-600 dark:text-yellow-400',
            description: 'Skor kamu menunjukkan kecemasan ringan. Teknik relaksasi seperti pernapasan dan grounding dapat membantu.'
        };
        if (score <= 14) return {
            level: 'moderate',
            label: 'Sedang',
            icon: 'sentiment_neutral',
            bgColor: 'bg-orange-100 dark:bg-orange-900/30',
            textColor: 'text-orange-600 dark:text-orange-400',
            description: 'Skor kamu menunjukkan kecemasan sedang. Pertimbangkan untuk berkonsultasi dengan konselor untuk strategi coping yang efektif.'
        };
        return {
            level: 'severe',
            label: 'Berat',
            icon: 'sentiment_very_dissatisfied',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            textColor: 'text-red-600 dark:text-red-400',
            description: 'Skor kamu menunjukkan kecemasan berat. Sangat disarankan untuk berkonsultasi dengan profesional kesehatan mental.'
        };
    }
}

/**
 * Get assessment history
 */
export async function getAssessmentHistory() {
    if (!userId) return [];

    try {
        const res = await fetch(`/api/assessment/history?userId=${userId}`);
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.error('Error fetching assessment history:', e);
    }
    return [];
}

export default { setupAssessment, getAssessmentHistory };
