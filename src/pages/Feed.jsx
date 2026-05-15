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
    const favRef = ref(db, 'users/' + user.uid + '/favorites');
    return onValue(favRef, snap => {
      setFavorites(snap.exists() ? Object.values(snap.val()) : []);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const matchesRef = ref(db, 'matches');
    return onValue(matchesRef, snap => {
      if (!snap.exists()) { setLiveMatches([]); setLoading(false); return; }
      const all = Object.values(snap.val());

      const favUids = favorites.map(f => f.uid).filter(Boolean);
      const favNames = favorites.map(f => f.name?.toLowerCase()).filter(Boolean);

      const filtered = all.filter(m => {
        if (m.ownerUid === user.uid) return true;
        if (favUids.includes(m.ownerUid)) return true;
        if (favNames.some(n =>
          m.playerA?.toLowerCase().includes(n) ||
          m.playerB?.toLowerCase().includes(n)
        )) return true;
        return false;
      });

      const live = filtered.filter(m => {
        if (m.status === 'live') return true;
        if (m.status === 'finished' && Date.now() - (m.updatedAt || 0) < 3600000) return true;
        return false;
      });

      live.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      // Notification nouveau match favori
      live.forEach(m => {
        if (m.status === 'live' && !prevMatchIds.current.has(m.id)) {
          const isFavMatch = favNames.some(n =>
            m.playerA?.toLowerCase().includes(n) ||
            m.playerB?.toLowerCase().includes(n)
          );
          if (isFavMatch && prevMatchIds.current.size > 0) {
            setNewMatchAlert(m.playerA + ' vs ' + m.playerB + ' vient de commencer !');
            if (Notification.permission === 'granted') {
              new Notification('🎾 Match en cours !', { body: m.playerA + ' vs ' + m.playerB });
            }
            setTimeout(() => setNewMatchAlert(null), 5000);
          }
          prevMatchIds.current.add(m.id);
        }
      });

      setLiveMatches(live);
      setLoading(false);
    });
  }, [favorites, user]);

  function requestNotifications() {
    if ('Notification' in window) {
      Notification.requestPermission().then(p => {
        if (p === 'granted') alert('Notifications activees !');
      });
    }
  }

  const favNames = favorites.map(f => f.name?.toLowerCase()).filter(Boolean);
  const myMatches = liveMatches.filter(m => m.ownerUid === user?.uid);
  const favMatches = liveMatches.filter(m =>
    m.ownerUid !== user?.uid &&
    favNames.some(n => m.playerA?.toLowerCase().includes(n) || m.playerB?.toLowerCase().includes(n))
  );

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
            <div className={styles.feature}><span>🏆</span><span>Classement AFT integre</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {newMatchAlert && <div className={styles.alert}>⭐ {newMatchAlert}</div>}

      <div className={styles.topBar}>
        <h1 className={styles.title}>En direct</h1>
        <button className={styles.notifBtn} onClick={requestNotifications} title="Activer les notifications">🔔</button>
      </div>

      {loading && <div className={styles.loading}>Chargement...</div>}

      {favMatches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>⭐ Tes favoris jouent</div>
          {favMatches.map(m => <MatchCard key={m.id} match={m} favorites={favorites} onClick={() => navigate('/watch/' + m.id)} highlight />)}
        </div>
      )}

      {myMatches.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>🎾 Mes matchs</div>
          {myMatches.map(m => <MatchCard key={m.id} match={m} favorites={favorites} onClick={() => navigate('/match/' + m.id)} />)}
        </div>
      )}

      {!loading && liveMatches.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎾</div>
          <p>Aucun match en cours.</p>
          <p style={{fontSize:'13px',color:'#bbb',marginTop:'4px'}}>Suis des joueurs pour voir leurs matchs ici.</p>
          <button className={styles.newBtn} onClick={() => navigate('/match/new')}>Demarrer un match</button>
        </div>
      )}

      <button className={styles.bigBtn} onClick={() => navigate('/match/new')}>
        + Nouveau match
      </button>
    </div>
  );
}

function MatchCard({ match, onClick, highlight, favorites }) {
  const [liveMatch, setLiveMatch] = useState(match);

  useEffect(() => {
    const unsub = onValue(ref(db, 'matches/' + match.id), snap => {
      if (snap.exists()) setLiveMatch(snap.val());
    });
    return unsub;
  }, [match.id]);

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
          {isLive ? '● Live' : '✓ Termine'}
        </span>
        <span className={styles.cardMeta}>
          {matchTypeIcon} {liveMatch.surface} · {isLive ? elapsed + ' min' : (liveMatch.sets || []).map(s => s.a + '-' + s.b).join(' ')}
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