const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let messageHistory = [];

// Auto-resize textarea
userInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    if (this.value === '') this.style.height = 'auto'; // Reset if empty
});

// Handle send
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Add user message to UI
    appendMessage(text, 'user');
    userInput.value = '';
    userInput.style.height = 'auto';
    userInput.focus();

    // Create a placeholder for bot message (streaming)
    const botMessageDiv = appendMessage('', 'bot', true);
    const botContentDiv = botMessageDiv.querySelector('.markdown-content');

    let fullReply = "";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                history: messageHistory
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
            buffer = lines.pop(); // Keep the last partial line in buffer

            for (const line of lines) {
                const trimmed = line.trim();
                // Check specifically for "data: " prefix which contains the content
                if (trimmed.startsWith('data:')) {
                    const dataStr = trimmed.replace('data:', '').trim();
                    if (dataStr === '[DONE]') continue;

                    try {
                        const json = JSON.parse(dataStr);
                        if (json.choices && json.choices[0].delta && json.choices[0].delta.content) {
                            const content = json.choices[0].delta.content;
                            fullReply += content;

                            // Re-render markdown progressively (might be imperfect for partial markdown, but acceptable simple text)
                            // A better simple way for now is just setting Text, then parse Markdown at end?
                            // But user wants "real time". Marked handles partials okay mostly.
                            botContentDiv.innerHTML = marked.parse(fullReply);
                            scrollToBottom();
                        }
                    } catch (e) {
                        // ignore parse errors for non-json data like 'event: message' lines if they somehow get here, though usually they are separate lines
                    }
                }
            }
        }

        // Final parse to ensure everything is correct
        botContentDiv.innerHTML = marked.parse(fullReply);

        // Update history
        messageHistory.push({ role: "user", content: text });
        messageHistory.push({ role: "assistant", content: fullReply });

    } catch (error) {
        console.error('Error:', error);
        botContentDiv.innerHTML += "\n\n[Terputus...]";
    }
}

// Modified appendMessage to return the div and handle empty text init
function appendMessage(text, sender, returnElement = false) {
    const div = document.createElement('div');
    div.classList.add('message', `message-${sender}`);

    if (sender === 'bot') {
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('markdown-content');
        contentDiv.innerHTML = text ? marked.parse(text) : '<span class="typing-dot-static">...</span>';
        div.appendChild(contentDiv);
    } else {
        div.textContent = text;
    }

    chatArea.appendChild(div);
    scrollToBottom();

    if (returnElement) return div;
}

function showTyping() {
    const div = document.createElement('div');
    div.classList.add('typing-indicator');
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    div.style.display = 'flex'; // override display:none locally
    chatArea.appendChild(div);
    scrollToBottom();
    return div;
}

function removeTyping(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
