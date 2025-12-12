import { loginFormHTML, signupFormHTML } from './components/auth-templates.js';

const authContainer = document.getElementById('auth-container');

function renderLogin() {
    authContainer.innerHTML = loginFormHTML;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'chat.html';
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi.");
        }
    });

    document.getElementById('link-signup').addEventListener('click', renderSignup);

    // Modal Elements
    const modal = document.getElementById('nickname-modal');
    const modalInput = document.getElementById('modal-nickname-input');
    const modalConfirm = document.getElementById('modal-confirm-btn');
    const modalCancel = document.getElementById('modal-cancel-btn');

    function toggleModal(show) {
        if (show) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('div').classList.remove('scale-95');
                modal.querySelector('div').classList.add('scale-100');
            }, 10);
            modalInput.focus();
        } else {
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.remove('scale-100');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    }

    document.getElementById('btn-anon').addEventListener('click', () => {
        toggleModal(true);
    });

    modalCancel.addEventListener('click', () => {
        toggleModal(false);
    });

    const handleAnonLogin = async () => {
        const nickname = modalInput.value.trim();

        try {
            const res = await fetch('/api/auth/anonymous', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'chat.html';
            } else {
                alert("Gagal masuk sebagai anonim: " + data.error);
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi saat mencoba masuk anonim.");
        }
    };

    modalConfirm.addEventListener('click', handleAnonLogin);
    modalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAnonLogin();
    });
}

function renderSignup() {
    authContainer.innerHTML = signupFormHTML;

    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                alert("Akun berhasil dibuat! Silakan masuk.");
                renderLogin();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi.");
        }
    });

    document.getElementById('link-login').addEventListener('click', renderLogin);
}

// Check if already logged in
const existingUser = localStorage.getItem('user');
if (existingUser) {
    window.location.href = 'chat.html';
} else {
    renderLogin();
}
