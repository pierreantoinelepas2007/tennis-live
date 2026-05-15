import { useState, useEffect, useRef } from 'react';
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
  const [newMatchAlert, setNewMatchAlert] = useState(null);
  const prevMatchIds = useRef(new Set());

  useEffect(() => {
    if (!user) return;
    const favRef = ref(db, `users/${user.uid}/favorites`);
    return onValue(favRef, snap => {
      setFavorites(snap.exists() ? Object.values(snap.val()) : []);
    });
  }, [user]);

  useEffect(() => {
    const matchesRef = ref(db, 'matches');
    return onValue(matchesRef, snap => {
      if (!snap.exists()) { setLiveMatches([]); setLoading(false); return; }
      const all = Object.values(snap.val());
      const live = all.filter(m => {
        if (m.status === 'live') return true;
        if (m.status === 'finished' && Date.now() - (m.updatedAt || 0) < 3600000) return true;
        return false;
      });
      live.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      // Détecter nouveaux matchs de favoris
      const favNames = favorites.map(f => f.name?.toLowerCase());
      live.forEach(m => {
        if (m.status === 'live' && !prevMatchIds.current.has(m.id)) {
          const isFavMatch = favNames.some(n =>
            m.playerA?.toLowerCase().includes(n) ||
            m.playerB?.toLowerCase().includes(n)
          );
          if (isFavMatch && prevMatchIds.current.size > 0) {
            setNewMatchAlert(`${m.playerA} vs ${m.playerB} vient de commencer !`);
            // Notification navigateur
            if (Notification.permission === 'granted') {
              new Notification('🎾 Match en cours !', {
                body: `${m.playerA} vs ${m.playerB}`,
                icon: '/favicon.ico'
              });
            }
            setTimeout(() => setNewMatchAlert(null), 5000);
          }
          prevMatchIds.current.add(m.id);
        }
      });

      setLiveMatches(live);
      setLoading(false);
    });
  }, [favorites]);

  function requestNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        if (p === 'granted') alert('Notifications activées ! Tu seras prévenu quand un favori joue.');
        else alert('Notifications refusées. Active-les dans les paramètres de ton navigateur.');
      });
    }
  }

  const favNames = favorites.map(f => f.name?.toLowerCase());
  const favMatches = liveMatches.filter(m =>
    favNames.some(n => m.playerA?.toLowerCase().includes(n) || m.playerB?.toLowerCase().includes(n))
  );
  const otherMatches = liveMatches.filter(m => !favMatches.includes(m));
  const [following, setFollowing] = useState([]);

useEffect(() => {
  if (!user) return;
  onValue(ref(db, 'users/' + user.uid + '/favorites'), snap => {
    setFollowing(snap.exists() ? Object.values(snap.val()) : []);
  });
}, [user]);
  if (!user) {
    return (
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>🎾</div>
          <h1 className={styles.heroTitle}>TennisLive</h1>
          <p className={styles.heroSub}>Score en direct · Suis tes joueurs favoris · Encouragements live</p>
          <button className={styles.heroBtn} onClick={() => navigate('/login')}>Commencer gratuitement →</button>
          <div className={styles.features}>
            <div className={styles.feature}><span>📡</span><span>Score live partageable</span></div>
            <div className={styles.feature}><span>💬</span><span>Messages d'encouragement</span></div>
            <div className={styles.feature}><span>📊</span><span>Stats et historique</span></div>
            <div className={styles.feature}><span>🏆</span><span>Classement AFT intégré</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Alerte nouveau match favori */}
      {newMatchAlert && (
        <div className={styles.alert}>
          ⭐ {newMatchAlert}
        </div>
      )}

      <div className={styles.topBar}>
        <h1 className={styles.title}>En direct</h1>
        <button className={styles.notifBtn} onClick={requestNotifications} title="Activer les notifications">
          🔔
        </button>
      </div>

      {loading && <div className={styles.loading}>Chargement des matchs…</div>}

      {favMatches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>⭐ Tes favoris jouent</div>
          {favMatches.map(m => <MatchCard key={m.id} match={m} onClick={() => navigate(`/watch/${m.id}`)} highlight />)}
        </div>
      )}

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
          <button className={styles.newBtn} onClick={() => navigate('/match/new')}>Démarrer un match</button>
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
  if (!user) return;
  const matchesRef = ref(db, 'matches');
  return onValue(matchesRef, snap => {
    if (!snap.exists()) { setLiveMatches([]); setLoading(false); return; }
    const all = Object.values(snap.val());

    // Récupérer les UIDs des favoris
    const favUids = favorites
      .map(f => f.uid)
      .filter(Boolean);

    // Garder seulement :
    // 1. Mes propres matchs
    // 2. Les matchs des gens que je suis
    const filtered = all.filter(m => {
      if (m.ownerUid === user.uid) return true;
      if (favUids.includes(m.ownerUid)) return true;
      return false;
    });

    const live = filtered.filter(m => {
      if (m.status === 'live') return true;
      if (m.status === 'finished' && Date.now() - (m.updatedAt || 0) < 3600000) return true;
      return false;
    });

    live.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setLiveMatches(live);
    setLoading(false);
  });
}, [favorites, user]);

  const score = getScore(liveMatch);
  const isLive = liveMatch.status === 'live';
  const elapsed = Math.round((Date.now() - liveMatch.startedAt) / 60000);
  const matchTypeIcon = liveMatch.matchType === 'tournament' ? '🏆' :
                        liveMatch.matchType === 'interclub' ? '👥' :
                        liveMatch.matchType === 'training' ? '💪' : '🎾';

  return (
    <div className={`${styles.matchCard} ${highlight ? styles.matchCardHighlight : ''}`} onClick={onClick}>
      <div className={styles.cardHeader}>
        <span className={isLive ? styles.livePill : styles.finishedPill}>
          {isLive ? '● Live' : '✓ Terminé'}
        </span>
        <span className={styles.cardMeta}>
          {matchTypeIcon} {liveMatch.surface} · {isLive ? `${elapsed} min` : (liveMatch.sets || []).map(s => `${s.a}-${s.b}`).join(' ')}
        </span>
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