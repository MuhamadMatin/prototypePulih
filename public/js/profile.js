import { updateProfileApi } from './services/profile-service.js';

// Check if logged in
const currentUser = JSON.parse(localStorage.getItem('user'));
if (!currentUser) {
    window.location.href = 'index.html';
}

// Elements
const form = document.getElementById('profile-form');
const logoutBtn = document.querySelectorAll('#logout-btn');

// Populate Data
document.getElementById('display-name').textContent = currentUser.nickname || currentUser.fullName;
document.getElementById('join-date').textContent = "Bergabung sejak " + new Date(currentUser.joinedDate).toLocaleDateString();
document.getElementById('header-avatar').style.backgroundImage = `url("https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=random")`;
document.getElementById('profile-avatar-large').style.backgroundImage = `url("https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=random")`;

// Form Fields
document.getElementById('fullName').value = currentUser.fullName || "";
document.getElementById('nickname').value = currentUser.nickname || "";
document.getElementById('email').value = currentUser.email || "";
document.getElementById('phone').value = currentUser.phone || "";
document.getElementById('bio').value = currentUser.bio || "";
document.getElementById('isAnonymous').checked = currentUser.isAnonymous || false;

// Logout
logoutBtn.forEach(btn => {
    btn.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});

// Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedData = {
        id: currentUser.id,
        fullName: document.getElementById('fullName').value,
        nickname: document.getElementById('nickname').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        bio: document.getElementById('bio').value,
        isAnonymous: document.getElementById('isAnonymous').checked
    };

    try {
        const data = await updateProfileApi(updatedData);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            alert("Profil berhasil diperbarui.");
            // Refresh visuals
            document.getElementById('display-name').textContent = data.user.nickname || data.user.fullName;
        } else {
            alert(data.error || "Gagal memperbarui profil.");
        }
    } catch (err) {
        alert("Terjadi kesalahan koneksi.");
    }
});
