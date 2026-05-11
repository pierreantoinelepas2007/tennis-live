import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import styles from './LiveChat.module.css';

const QUICK_MESSAGES = [
  '💪 Allez !!',
  '🔥 T\'assures !',
  '👏 Beau point !',
  '⚡ C\'est parti !',
  '🎾 Champion !',
  '😤 Lâche rien !',
];

export default function LiveChat({ matchId, playerName, spectatorName, isPlayer }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [newMsg, setNewMsg] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const chatRef = ref(db, `matches/${matchId}/chat`);
    const unsub = onValue(chatRef, (snap) => {
      const data = snap.val();
      if (!data) return setMessages([]);
      const msgs = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(msgs);
      // Show popup on player screen for new messages
      if (isPlayer && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (Date.now() - last.timestamp < 5000) {
          setNewMsg(last);
          setTimeout(() => setNewMsg(null), 4000);
        }
      }
    });
    return unsub;
  }, [matchId, isPlayer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setSending(true);
    setInput('');
    try {
      await push(ref(db, `matches/${matchId}/chat`), {
        text: msg,
        sender: spectatorName || 'Supporter',
        timestamp: Date.now(),
        isQuick: text ? true : false,
      });
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className={styles.container}>
      {/* Popup notification on player screen */}
      {isPlayer && newMsg && (
        <div className={styles.popup}>
          <span className={styles.popupSender}>{newMsg.sender}</span>
          <span className={styles.popupText}>{newMsg.text}</span>
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.headerTitle}>💬 Encouragements</span>
        <span className={styles.headerCount}>{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <div className={styles.empty}>
            Envoie un message d'encouragement à {playerName} !
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={styles.message}>
            <span className={styles.msgSender}>{msg.sender}</span>
            <span className={styles.msgText}>{msg.text}</span>
            <span className={styles.msgTime}>{formatTime(msg.timestamp)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!isPlayer && (
        <>
          <div className={styles.quickBtns}>
            {QUICK_MESSAGES.map(q => (
              <button key={q} className={styles.quickBtn} onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message pour ${playerName}...`}
              maxLength={120}
              disabled={sending}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
            >
              {sending ? '…' : 'Envoyer'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
