// Breathing Logic
import { toggleModal, showToast } from './ui.js';

export function setupBreathing() {
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

    window.addEventListener('modalOpened', (e) => {
        if (e.detail.id === 'breathing-modal') {
            // Reset state if needed
            const startBtn = document.getElementById('btn-start-breathing');
            const text = document.getElementById('breathing-text');
            if (startBtn) startBtn.classList.remove('hidden');
            if (text) text.innerText = "Siap?";
        }
    });
}

function runBreathingCycle(circle, text) {
    if (document.getElementById('breathing-modal')?.classList.contains('hidden')) return; // Stop if closed

    setTimeout(() => {
        if (circle) circle.classList.add('scale-150');
    }, 100);

    setTimeout(() => {
        if (text) text.innerText = "Tahan... (7s)";
        setTimeout(() => {
            if (text) text.innerText = "Hembuskan... (8s)";
            if (circle) {
                circle.classList.remove('scale-150');
                circle.classList.add('scale-75');
                circle.style.transitionDuration = "8000ms";
            }

            setTimeout(() => {
                if (text) text.innerText = "Selesai. Ulangi?";
                const startBtn = document.getElementById('btn-start-breathing');
                if (startBtn) startBtn.classList.remove('hidden');

                if (circle) {
                    circle.style.transitionDuration = "4000ms";
                    circle.classList.remove('scale-75');
                }

                // Dispatch completion event for achievements
                window.dispatchEvent(new CustomEvent('breathingCompleted'));
                showToast('Latihan napas selesai! 🧘', 'success');
            }, 8000);
        }, 7000);
    }, 4000);
}

