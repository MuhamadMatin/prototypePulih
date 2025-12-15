
const chatStream = document.getElementById('chat-stream');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const historyContainer = document.getElementById('history-container');
const logoutBtn = document.getElementById('logout-btn');

// User State
let currentUser = JSON.parse(localStorage.getItem('user'));
if (!currentUser) {
    window.location.href = 'index.html';
}

// Display User Info Sidebar
document.getElementById('user-name-sidebar').textContent = currentUser.fullName;
document.getElementById('user-status-sidebar').textContent = "Member";
document.getElementById('user-avatar-sidebar').style.backgroundImage = `url("https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullName)}&background=random")`;

let messageHistory = []; // Context for API
let currentSessionId = null;

// Initial History Load
loadHistory();

// Events
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
});

document.getElementById('btn-new-chat').addEventListener('click', () => {
    currentSessionId = null;
    messageHistory = [];
    chatStream.innerHTML = '';
    // Add welcome message back
    appendMessage("Halo, saya di sini untuk mendengarkan. Bagaimana perasaanmu hari ini? Apakah ada sesuatu yang mengganggu pikiranmu?", 'bot');
});

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') this.style.height = 'auto';
});


async function loadHistory() {
    // Determine if we should show a disclaimer or just load history.
    // Since we now save anon users to DB, we can load their history just like normal users
    // as long as they are in the same browser session (localStorage).

    // Display Anon Disclaimer if needed, but still load history
    if (currentUser.isAnonymous) {
        const disclaimer = document.createElement('div');
        disclaimer.className = "text-[10px] text-center text-gray-500 mb-2 px-2";
        disclaimer.innerText = "Mode Anonim: Riwayat tersimpan di perangkat ini selama Anda tidak logout.";
        // We'll append this after loading or before
    }

    try {
        const res = await fetch(`/api/chat/history?userId=${currentUser.id}`);
        const chats = await res.json();

        historyContainer.innerHTML = '';

        if (currentUser.isAnonymous) {
            historyContainer.innerHTML += '<p class="text-[10px] text-center text-gray-400 mb-4">Mode Anonim Aktif</p>';
        }

        // Group by Time (Today, Yesterday, etc - simplified for now)
        const wrapper = document.createElement('div');
        wrapper.className = "flex flex-col gap-2";
        wrapper.innerHTML = `<h3 class="px-4 text-xs font-bold text-text-muted uppercase tracking-wider dark:text-gray-400 flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]">calendar_today</span>
            Riwayat Sesi
        </h3>`;

        if (chats.length === 0) {
            wrapper.innerHTML += `<p class="px-4 text-xs text-text-muted italic">Belum ada riwayat.</p>`;
        }

        const iconList = ['psychology', 'spa', 'local_florist', 'favorite', 'wb_sunny', 'diamond', 'star', 'filter_vintage', 'energy_savings_leaf', 'nightlight', 'water_drop', 'forest'];

        chats.forEach(chat => {
            // Pick a random icon based on chat ID hash or just random to ensure variety? 
            // Random might change on reload, which is arguably "variasi". 
            // Better to hash it so it stays consistent per chat? The user just said "ubah ubah agar bervariasi", simple random is fine.
            // Actually, consistent is better UI. Let's use simple hash of ID.
            const iconIndex = chat.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % iconList.length;
            const randomIcon = iconList[iconIndex];

            const item = document.createElement('a');
            item.className = "relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50/80 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 transition-all hover:shadow-md hover:border-primary/30 group cursor-pointer";
            item.innerHTML = `
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl group-hover:h-full transition-all"></div>
                <div class="size-8 rounded-full bg-white dark:bg-green-800 flex items-center justify-center text-primary-dark dark:text-primary shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">${randomIcon}</span>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="text-sm font-semibold text-text-main dark:text-white truncate group-hover:text-primary-dark transition-colors">${chat.title}</span>
                    <span class="text-[11px] text-text-muted dark:text-gray-400 truncate">${new Date(chat.updatedAt).toLocaleDateString()}</span>
                </div>
            `;
            item.onclick = () => loadSession(chat);
            wrapper.appendChild(item);
        });

        historyContainer.appendChild(wrapper);

    } catch (e) {
        console.error("Failed to load history", e);
    }
}

function loadSession(session) {
    currentSessionId = session.id;
    messageHistory = []; // Reset context
    chatStream.innerHTML = '';

    // Replay messages
    session.messages.forEach(msg => {
        // filter out system prompt from display if stored? usually we only store user/assistant
        if (msg.role === 'system') return;
        appendMessage(msg.content, msg.role === 'user' ? 'user' : 'bot');
        // Add to context
        messageHistory.push({ role: msg.role, content: msg.content });
    });
}


async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // UI: User Message
    appendMessage(text, 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatInput.focus();

    // UI: Bot Placeholder
    const botMsgDiv = appendMessage('', 'bot', true);
    const contentDiv = botMsgDiv.querySelector('.markdown-content');

    let fullReply = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                history: messageHistory,
                userId: currentUser.isAnonymous ? null : currentUser.id,
                sessionId: currentSessionId
            })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep partial

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data:')) {
                    const dataStr = trimmed.replace('data:', '').trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const json = JSON.parse(dataStr);
                        if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                            const content = json.choices[0].delta.content;
                            fullReply += content;
                            contentDiv.innerHTML = marked.parse(fullReply);
                            scrollToBottom();
                        }
                    } catch (e) { }
                }
            }
        }

        // Finalize
        contentDiv.innerHTML = marked.parse(fullReply);

        // Update Local History Context
        messageHistory.push({ role: "user", content: text });
        messageHistory.push({ role: "assistant", content: fullReply });

        // Save Session to Backend (for ALL users including anonymous)
        await saveSession(text, messageHistory);

        // --- FETCH & SHOW SUGGESTIONS ---
        try {
            const suggestionMsg = appendMessage('', 'bot', true);
            // We reuse bot bubble but hide the avatar/name logic if we want, OR just append a separate container.
            // Actually, let's append a specific suggestion container *outside* the bubble flow or as a special bot message?
            // User requested "folowup setelah user chating seperti ini... di bawah nya".
            // Let's create a dedicated container below the last message.
            suggestionMsg.remove(); // Remove the temp placeholder if we used it, or better: separate function.

            // Call API
            const suggestRes = await fetch('/api/chat/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: messageHistory })
            });
            const suggestData = await suggestRes.json();

            if (suggestData.suggestions && suggestData.suggestions.length > 0) {
                renderSuggestions(suggestData.suggestions);
            }

        } catch (e) {
            console.error("Suggestion failed", e);
        }

    } catch (e) {
        contentDiv.innerHTML += "\n\n[Koneksi Terputus]";
    }
}

function renderSuggestions(suggestions) {
    const div = document.createElement('div');
    div.className = "flex flex-wrap gap-2 mt-3 ml-1 animate-fade-in-up max-w-[85%]";

    suggestions.forEach(text => {
        const btn = document.createElement('button');
        btn.className = "px-4 py-2.5 bg-white dark:bg-surface-dark border border-green-200 dark:border-green-800 text-text-main dark:text-white rounded-xl text-sm font-medium hover:bg-green-50 hover:border-primary/50 hover:text-primary-dark transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5";
        btn.innerText = text;

        btn.onclick = () => {
            chatInput.value = text;
            chatInput.style.height = 'auto';
            sendMessage();
            div.remove();
        };
        div.appendChild(btn);
    });

    chatStream.appendChild(div);
    scrollToBottom();
}

async function saveSession(lastTitleTrigger, messages) {
    try {
        const isNewSession = !currentSessionId;

        // Generate a title if new session (simple heuristics: first few words of first message)
        let title = "Sesi Baru";
        if (isNewSession && messages.length > 0) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) title = firstUserMsg.content.substring(0, 30) + "...";
        }

        const res = await fetch('/api/chat/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                sessionId: currentSessionId,
                title: isNewSession ? title : undefined, // only update title if new
                messages: messages
            })
        });

        const data = await res.json();
        currentSessionId = data.id;

        // Refresh sidebar if it was a new session
        if (isNewSession) {
            loadHistory();
        }

    } catch (e) {
        console.error("Save failed", e);
    }
}

function appendMessage(text, sender, returnElement = false) {
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sender === 'user') {
        div.className = "flex flex-col items-end gap-1 ml-auto max-w-[85%] animate-fade-in-up";
        div.innerHTML = `
            <div class="bg-gradient-to-br from-green-600 to-green-700 p-5 chat-bubble-user shadow-lg shadow-green-600/20 text-white leading-relaxed relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <p class="font-body relative z-10 font-medium break-words">${text}</p>
            </div>
            <div class="flex items-center gap-1 mr-1">
                <span class="material-symbols-outlined text-[14px] text-primary">done_all</span>
                <span class="text-[10px] text-gray-400 font-medium">${time}</span>
            </div>
        `;
    } else {
        div.className = "flex items-end gap-3 max-w-[85%] animate-fade-in-up";
        div.innerHTML = `
            <div class="size-10 rounded-2xl bg-cover bg-center shrink-0 self-start shadow-md ring-2 ring-white dark:ring-surface-dark" style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBfYuKushqo8EGjLsG0JTRzX-D2FYOvAY2HF-XOPWix2HlCppSE5L6R_94X7XqIXab9GVh2KD2X5c9A8yrhfcCwpaI4a40alPH2JNqe4oXR89jeSBW39lVw7eTrKxFTvnhiLrzAUDhWisprXcGB8NMTTwwBdjNl1mza4CoODQNDnlXEaqFDjmAv3C4LmI1rQVkL8fsq0m4TctJAsQs7wYO1zRTOL2y7BsKJ8Lj0-X2w-6sznASXvKg1vU4AXQYBZ1kjceEslHm7t26J");'></div>
            <div class="flex flex-col gap-1 w-full min-w-0">
                <span class="text-xs font-semibold text-text-muted ml-1 dark:text-green-400 mb-1">Konselor Pulih</span>
                <div class="bg-soft-gradient dark:bg-none bg-white dark:bg-surface-dark p-5 chat-bubble-bot shadow-sm text-text-main dark:text-gray-100 leading-relaxed border border-green-50 dark:border-green-900 relative">
                    <span class="material-symbols-outlined absolute right-2 top-2 text-green-50 dark:text-green-900 text-4xl -z-0 opacity-50 rotate-12">spa</span>
                    <div class="font-body relative z-10 markdown-content break-words">
                        ${text ? marked.parse(text) : '<span class="typing-dot-static">...</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    chatStream.appendChild(div);
    scrollToBottom();
    if (returnElement) return div;
}

function scrollToBottom() {
    chatStream.scrollTop = chatStream.scrollHeight;
}
