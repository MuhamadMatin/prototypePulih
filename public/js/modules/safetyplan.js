// Safety Plan Builder Module
// Modular ES6 implementation

import { toggleModal, showToast } from './ui.js';

const userId = JSON.parse(localStorage.getItem('user'))?.id;

const SAFETY_PLAN_SECTIONS = [
    {
        id: 'warningSignals',
        title: 'Tanda-tanda Peringatan',
        icon: 'warning',
        color: 'orange',
        description: 'Apa tanda-tanda yang menunjukkan krisis mungkin terjadi?',
        placeholder: 'Contoh: Tidak bisa tidur, menarik diri dari teman, pikiran negatif berulang...'
    },
    {
        id: 'copingStrategies',
        title: 'Strategi Coping',
        icon: 'self_improvement',
        color: 'blue',
        description: 'Apa yang bisa kamu lakukan sendiri untuk menenangkan diri?',
        placeholder: 'Contoh: Latihan napas, jalan-jalan, mendengarkan musik, menulis jurnal...'
    },
    {
        id: 'reasonsToLive',
        title: 'Alasan untuk Hidup',
        icon: 'favorite',
        color: 'pink',
        description: 'Apa yang paling penting bagimu? Apa yang membuat hidupmu bermakna?',
        placeholder: 'Contoh: Keluarga, teman, impian masa depan, hobi yang dicintai...'
    },
    {
        id: 'supportContacts',
        title: 'Kontak Pendukung',
        icon: 'group',
        color: 'green',
        description: 'Siapa yang bisa kamu hubungi saat butuh bantuan?',
        placeholder: 'Contoh: Nama - Nomor HP (satu per baris)'
    },
    {
        id: 'safeEnvironmentSteps',
        title: 'Langkah Keselamatan Lingkungan',
        icon: 'home',
        color: 'purple',
        description: 'Bagaimana kamu bisa membuat lingkunganmu lebih aman?',
        placeholder: 'Contoh: Menyimpan obat-obatan di tempat yang tidak mudah dijangkau...'
    },
    {
        id: 'professionalContacts',
        title: 'Kontak Profesional',
        icon: 'medical_services',
        color: 'red',
        description: 'Profesional kesehatan mental yang bisa dihubungi',
        placeholder: 'Contoh: Dr. Nama - RS/Klinik - Nomor\nHotline 119'
    }
];

let safetyPlanData = {};

/**
 * Initialize safety plan module
 */
export function setupSafetyPlan() {
    // Save button
    document.getElementById('btn-save-safetyplan')?.addEventListener('click', saveSafetyPlan);

    // Export button
    document.getElementById('btn-export-safetyplan')?.addEventListener('click', exportSafetyPlan);

    // Load on modal open
    window.addEventListener('modalOpened', async (e) => {
        if (e.detail.id === 'safetyplan-modal') {
            await loadSafetyPlan();
            renderSafetyPlanForm();
        }
    });
}

/**
 * Load existing safety plan
 */
async function loadSafetyPlan() {
    if (!userId) return;

    try {
        const res = await fetch(`/api/safetyplan?userId=${userId}`);
        if (res.ok) {
            const data = await res.json();
            if (data) {
                safetyPlanData = data;
            }
        }
    } catch (e) {
        console.error('Error loading safety plan:', e);
    }
}

/**
 * Render safety plan form
 */
function renderSafetyPlanForm() {
    const container = document.getElementById('safetyplan-content');
    if (!container) return;

    const colorClasses = {
        orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    };

    const iconColorClasses = {
        orange: 'text-orange-500',
        blue: 'text-blue-500',
        pink: 'text-pink-500',
        green: 'text-green-500',
        purple: 'text-purple-500',
        red: 'text-red-500'
    };

    container.innerHTML = SAFETY_PLAN_SECTIONS.map((section, index) => `
        <div class="rounded-2xl border ${colorClasses[section.color]} p-5 transition-all hover:shadow-md">
            <div class="flex items-start gap-3 mb-3">
                <div class="p-2 rounded-xl ${colorClasses[section.color]}">
                    <span class="material-symbols-outlined ${iconColorClasses[section.color]}">${section.icon}</span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">${index + 1}</span>
                        ${section.title}
                    </h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${section.description}</p>
                </div>
            </div>
            <textarea 
                id="safetyplan-${section.id}"
                class="w-full h-24 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="${section.placeholder}"
            >${safetyPlanData[section.id] || ''}</textarea>
        </div>
    `).join('');
}

/**
 * Save safety plan
 */
async function saveSafetyPlan() {
    if (!userId) {
        showToast('Silakan login untuk menyimpan', 'error');
        return;
    }

    // Collect data
    const data = {};
    SAFETY_PLAN_SECTIONS.forEach(section => {
        const textarea = document.getElementById(`safetyplan-${section.id}`);
        if (textarea) {
            data[section.id] = textarea.value.trim();
        }
    });

    // Parse contacts as JSON
    if (data.supportContacts) {
        data.supportContacts = data.supportContacts.split('\n').filter(c => c.trim()).map(c => {
            const parts = c.split(' - ');
            return { name: parts[0]?.trim(), contact: parts[1]?.trim() || '' };
        });
    }

    if (data.professionalContacts) {
        data.professionalContacts = data.professionalContacts.split('\n').filter(c => c.trim()).map(c => {
            const parts = c.split(' - ');
            return { name: parts[0]?.trim(), location: parts[1]?.trim() || '', contact: parts[2]?.trim() || '' };
        });
    }

    try {
        const res = await fetch('/api/safetyplan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...data })
        });

        if (res.ok) {
            safetyPlanData = data;
            showToast('Safety plan tersimpan! 🛡️', 'success');

            // Trigger achievement
            window.dispatchEvent(new CustomEvent('safetyPlanSaved'));
        } else {
            showToast('Gagal menyimpan', 'error');
        }
    } catch (e) {
        console.error('Error saving safety plan:', e);
        showToast('Gagal menyimpan', 'error');
    }
}

/**
 * Export safety plan as text/PDF
 */
function exportSafetyPlan() {
    // Create printable content
    let content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Safety Plan - Pulih</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
                h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 30px; }
                .section { background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 10px 0; }
                .emergency { background: #fef2f2; border: 2px solid #ef4444; }
                p { white-space: pre-wrap; line-height: 1.6; }
            </style>
        </head>
        <body>
            <h1>🛡️ Safety Plan Saya</h1>
            <p><em>Dibuat dengan Pulih - ${new Date().toLocaleDateString('id-ID')}</em></p>
    `;

    SAFETY_PLAN_SECTIONS.forEach((section, index) => {
        const value = safetyPlanData[section.id];
        const formattedValue = Array.isArray(value)
            ? value.map(v => typeof v === 'object' ? Object.values(v).filter(x => x).join(' - ') : v).join('\n')
            : value || '(Belum diisi)';

        content += `
            <h2>${index + 1}. ${section.title}</h2>
            <div class="section ${section.id === 'professionalContacts' ? 'emergency' : ''}">
                <p>${formattedValue}</p>
            </div>
        `;
    });

    content += `
            <div class="section emergency" style="margin-top: 40px;">
                <h2>📞 Hotline Darurat</h2>
                <p><strong>119</strong> - Hotline Nasional</p>
                <p><strong>Into The Light Indonesia</strong> - intothelightid.org</p>
            </div>
        </body>
        </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
}

export default { setupSafetyPlan };
