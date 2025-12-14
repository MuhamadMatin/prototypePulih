// UI Utilities: Modals and Toasts

export function setupUI() {
    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.currentTarget.dataset.target; // Use currentTarget to get the button
            toggleModal(modalId, false);
        });
    });

    // Close on click outside (backdrop)
    ['mood-modal', 'journal-modal', 'breathing-modal'].forEach(id => {
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

export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-14 left-1/2 transform -translate-x-1/2 z-[70] px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-[slideDown_0.3s_ease-out] border ${type === 'success'
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
