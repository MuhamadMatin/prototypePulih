export async function fetchChatHistory(userId) {
    const res = await fetch(`/api/chat/history?userId=${userId}`);
    return await res.json();
}

export async function saveSessionToBackend(userId, sessionId, title, messages) {
    const res = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            sessionId,
            title,
            messages
        })
    });
    return await res.json();
}

export async function fetchSuggestions(history) {
    const res = await fetch('/api/chat/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history })
    });
    return await res.json();
}

// Streaming is handled differently in the controller because of its stateful nature with the reader,
// but we could expose the fetch promise here.
export function initiateChatStream(message, history, userId, sessionId) {
    return fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            history,
            userId,
            sessionId
        })
    });
}
