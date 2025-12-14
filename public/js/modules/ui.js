// UI Utilities: Modals and Toasts

export function setupUI() {
    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.target; // Use currentTarget to get the button
            toggleModal(modalId, false);
        });
    });

    // Close on click outside (backdrop) - All modals
    const allModals = [
        'mood-modal', 'journal-modal', 'breathing-modal',
        'grounding-modal', 'assessment-modal', 'progress-modal', 'safetyplan-modal'
    ];

    allModals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) toggleModal(id, false);
            });
        }
    });
}

export function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;

    if (show) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        // Dispatch event for other modules to hook into
        window.dispatchEvent(new CustomEvent('modalOpened', { detail: { id } }));
    } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
        window.dispatchEvent(new CustomEvent('modalClosed', { detail: { id } }));
    }
}

export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');

    // Style based on type
    let bgClass, textClass, borderClass, icon;
    switch (type) {
        case 'success':
            bgClass = 'bg-white dark:bg-green-900/90';
            textClass = 'text-green-800 dark:text-green-100';
            borderClass = 'border-green-100 dark:border-green-800';
            icon = 'check_circle';
            break;
        case 'error':
            bgClass = 'bg-white dark:bg-red-900/90';
            textClass = 'text-red-800 dark:text-red-100';
            borderClass = 'border-red-100 dark:border-red-800';
            icon = 'error';
            break;
        case 'warning':
            bgClass = 'bg-white dark:bg-yellow-900/90';
            textClass = 'text-yellow-800 dark:text-yellow-100';
            borderClass = 'border-yellow-100 dark:border-yellow-800';
            icon = 'warning';
            break;
        case 'achievement':
            bgClass = 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/90 dark:to-yellow-900/90';
            textClass = 'text-amber-800 dark:text-amber-100';
            borderClass = 'border-amber-200 dark:border-amber-800';
            icon = 'emoji_events';
            break;
        default:
            bgClass = 'bg-white dark:bg-gray-900/90';
            textClass = 'text-gray-800 dark:text-gray-100';
            borderClass = 'border-gray-100 dark:border-gray-800';
            icon = 'info';
    }

    toast.className = `fixed top-14 left-1/2 transform -translate-x-1/2 z-[70] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-[slideDown_0.3s_ease-out] border ${bgClass} ${textClass} ${borderClass}`;

    toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">${icon}</span>
        <span class="text-sm font-semibold">${message}</span>
    `;

    document.body.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        toast.style.transition = 'all 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

