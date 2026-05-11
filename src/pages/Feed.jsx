import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getScore, getSetsWon } from '../utils/tennisLogic';
import styles from './Feed.module.css';

export default function Feed() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notified, setNotified] = useState({});

  // Charger les favoris de l'utilisateur
  useEffect(() => {
    if (!user) return;
    const favRef = ref(db, `users/${user.uid}/favorites`);
    return onValue(favRef, snap => {
      setFavorites(snap.exists() ? Object.values(snap.val()) : []);
    });
  }, [user]);

  // Charger tous les matchs live
  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    return onValue(matchesRef, snap => {
      if (!snap.exists()) { setLiveMatches([]); setLoading(false); return; }
      const all = Object.values(snap.val());
      const live = all.filter(m => m.status === 'live' || 
        (m.status === 'finished' && Date.now() - m.updatedAt < 3600000));
      live.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setLiveMatches(live);
      setLoading(false);

      // Notifications pour les favoris
      live.forEach(m => {
        if (m.status === 'live' && !notified[m.id]) {
          const favNames = favorites.map(f => f.name?.toLowerCase());
          const isTracked = favNames.some(n => 
            m.playerA?.toLowerCase().includes(n) || 
            m.playerB?.toLowerCase().includes(n)
          );
          if (isTracked && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🎾 Match en cours !', {
              body: `${m.playerA} vs ${m.playerB} — Score live disponible`,
            });
            setNotified(prev => ({ ...prev, [m.id]: true }));
          }
        }
      });
    });
  }, [favorites]);

  function requestNotifications() {
    if ('Notification' in window) Notification.requestPermission();
  }

  const favNames = favorites.map(f => f.name?.toLowerCase());
  const favMatches = liveMatches.filter(m =>
    favNames.some(n => m.playerA?.toLowerCase().includes(n) || m.playerB?.toLowerCase().includes(n))
  );
  const otherMatches = liveMatches.filter(m => !favMatches.includes(m));

  if (!user) {
    return (
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>🎾</div>
          <h1 className={styles.heroTitle}>TennisLive</h1>
          <p className={styles.heroSub}>Score en direct · Suis tes joueurs favoris · Encouragements live</p>
          <button className={styles.heroBtn} onClick={() => navigate('/login')}>Commencer gratuitement →</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>En direct</h1>
        <button className={styles.notifBtn} onClick={requestNotifications} title="Activer les notifications">
          🔔
        </button>
      </div>

      {loading && <div className={styles.loading}>Chargement des matchs…</div>}

      {/* Matchs de tes favoris */}
      {favMatches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>⭐ Tes favoris jouent</div>
          {favMatches.map(m => <MatchCard key={m.id} match={m} onClick={() => navigate(`/watch/${m.id}`)} highlight />)}
        </div>
      )}

      {/* Tous les matchs live */}
      {otherMatches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>🎾 Matchs en cours</div>
          {otherMatches.map(m => <MatchCard key={m.id} match={m} onClick={() => navigate(`/watch/${m.id}`)} />)}
        </div>
      )}

      {!loading && liveMatches.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎾</div>
          <p>Aucun match en cours pour l'instant.</p>
          <button className={styles.newBtn} onClick={() => navigate('/match/new')}>
            Démarrer un match
          </button>
        </div>
      )}

      <button className={styles.bigBtn} onClick={() => navigate('/match/new')}>
        ⊕ Nouveau match
      </button>
    </div>
  );
}

function MatchCard({ match, onClick, highlight }) {
  const [liveMatch, setLiveMatch] = useState(match);

  useEffect(() => {
    const unsub = onValue(ref(db, `matches/${match.id}`), snap => {
      if (snap.exists()) setLiveMatch(snap.val());
    });
    return unsub;
  }, [match.id]);

  const score = getScore(liveMatch);
  const setsWon = getSetsWon(liveMatch);
  const isLive = liveMatch.status === 'live';
  const elapsed = Math.round((Date.now() - liveMatch.startedAt) / 60000);

  return (
    <div className={`${styles.matchCard} ${highlight ? styles.matchCardHighlight : ''}`} onClick={onClick}>
      <div className={styles.cardHeader}>
        <span className={isLive ? styles.livePill : styles.finishedPill}>
          {isLive ? '● Live' : '✓ Terminé'}
        </span>
        <span className={styles.cardMeta}>{liveMatch.surface} · {isLive ? `${elapsed} min` : formatScore(liveMatch)}</span>
      </div>

      {['a', 'b'].map(p => {
        const name = p === 'a' ? score.playerA : score.playerB;
        const pts = p === 'a' ? score.labelA : score.labelB;
        const isServing = score.serving === p && isLive;
        const isWinner = !isLive && liveMatch.winner === p;
        return (
          <div key={p} className={`${styles.playerLine} ${isWinner ? styles.winnerLine : ''}`}>
            <span className={styles.serveDot}>{isServing ? '●' : ''}</span>
            <span className={`${styles.playerLineName} ${isWinner ? styles.winnerLineName : ''}`}>{name}</span>
            <div className={styles.setsRow}>
              {(liveMatch.sets || []).map((s, i) => (
                <span key={i} className={s[p] > s[p === 'a' ? 'b' : 'a'] ? styles.setW : styles.setL}>{s[p]}</span>
              ))}
              <span className={styles.currentGame}>{score.games[p]}</span>
            </div>
            {isLive && <span className={`${styles.ptScore} ${pts === 'Avantage' ? styles.adv : ''}`}>{pts}</span>}
          </div>
        );
      })}
    </div>
  );
}

function formatScore(match) {
  if (!match.sets || !match.sets.length) return '';
  return match.sets.map(s => `${s.a}-${s.b}`).join(' ');
}