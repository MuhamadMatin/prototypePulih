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

    const togglePassBtn = document.getElementById('toggle-modal-password');
    const passInput = document.getElementById('modal-password-input');

    togglePassBtn.addEventListener('click', () => {
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        togglePassBtn.querySelector('span').textContent = isPassword ? 'visibility_off' : 'visibility';
    });

    modalCancel.addEventListener('click', () => {
        toggleModal(false);
    });

    const handleAnonLogin = async () => {
        const nickname = modalInput.value.trim();
        const username = document.getElementById('modal-username-input').value.trim();
        const password = document.getElementById('modal-password-input').value;

        if (!username || !password) {
            alert("Username dan Password wajib diisi untuk keamanan akun.");
            return;
        }

        try {
            const res = await fetch('/api/auth/anonymous', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname, username: username, password: password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'chat.html';
            } else if (res.status === 409) {
                // Username conflict with suggestion
                alert(`Username '${username}' sudah dipakai.\nCoba: ${data.suggestion}`);
                document.getElementById('modal-username-input').value = data.suggestion;
                document.getElementById('modal-username-input').focus();
            } else {
                alert("Gagal: " + data.error);
            }
        } catch (err) {
            alert("Terjadi kesalahan koneksi saat mencoba masuk anonim.");
        }
    };

    modalConfirm.addEventListener('click', handleAnonLogin);
    // Bind enter to the last input (password)
    document.getElementById('modal-password-input').addEventListener('keypress', (e) => {
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
        const username = document.getElementById('signup-username').value;

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, username })
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

console.log("Auth script loaded");

// Check if already logged in
const existingUser = localStorage.getItem('user');
if (existingUser) {
    console.log("User found, redirecting");
    window.location.href = 'chat.html';
} else {
    console.log("Rendering Login");
    renderLogin();
}
