import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './History.module.css';

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Charger directement tous les matchs de Firebase où ownerUid = user.uid
    const matchesRef = ref(db, 'matches');
    return onValue(matchesRef, snap => {
      if (!snap.exists()) { setMatches([]); setLoading(false); return; }
      const all = Object.values(snap.val());
      const mine = all
        .filter(m => m.ownerUid === user.uid)
        .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0));
      setMatches(mine);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
  if (!user) navigate('/login');
}, [user]);

  const finished = matches.filter(m => m.status === 'finished');
  const live = matches.filter(m => m.status === 'live');

  const wins = finished.filter(m => m.winner === 'a').length;
  const losses = finished.filter(m => m.winner === 'b').length;
  const winRate = finished.length ? Math.round((wins / finished.length) * 100) : 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Historique</h1>

      {/* Stats */}
      {finished.length > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{ color: '#1D9E75' }}>{wins}–{losses}</div>
            <div className={styles.statLabel}>Bilan</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{winRate}%</div>
            <div className={styles.statLabel}>Win rate</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{finished.length}</div>
            <div className={styles.statLabel}>Matchs joués</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{live.length}</div>
            <div className={styles.statLabel}>En cours</div>
          </div>
        </div>
      )}

      {/* Matchs en cours */}
      {live.length > 0 && (
        <>
          <div className={styles.sectionLabel}>🎾 En cours</div>
          {live.map(m => (
            <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </>
      )}

      {/* Matchs terminés */}
      {finished.length > 0 && (
        <>
          <div className={styles.sectionLabel}>Terminés</div>
          {finished.map(m => (
            <MatchRow key={m.id} match={m} onClick={() => navigate(`/watch/${m.id}`)} />
          ))}
        </>
      )}

      {loading && <div className={styles.loading}>Chargement…</div>}

      {!loading && matches.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎾</div>
          <p>Pas encore de match enregistré.</p>
          <button className={styles.newBtn} onClick={() => navigate('/match/new')}>
            Démarrer un match
          </button>
        </div>
      )}
    </div>
  );
}

function MatchRow({ match, onClick }) {
  const isLive = match.status === 'live';
  const isWin = match.status === 'finished' && match.winner === 'a';
  const isLoss = match.status === 'finished' && match.winner === 'b';
  const score = (match.sets || []).map(s => `${s.a}-${s.b}`).join(', ');
  const date = new Date(match.startedAt).toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const duration = match.updatedAt && match.startedAt
    ? Math.round((match.updatedAt - match.startedAt) / 60000)
    : null;

  return (
    <div className={styles.matchRow} onClick={onClick}>
      <div className={`${styles.resultBadge} ${isLive ? styles.badgeLive : isWin ? styles.badgeWin : styles.badgeLoss}`}>
        {isLive ? '●' : isWin ? 'V' : 'D'}
      </div>
      <div className={styles.matchInfo}>
        <div className={styles.opponent}>
          vs {match.playerB}
          {isLive && <span className={styles.livePill}>Live</span>}
        </div>
        <div className={styles.matchMeta}>
          {date} · {match.surface}
          {duration && duration > 0 && ` · ${duration} min`}
        </div>
      </div>
      <div className={styles.matchScore}>
        {isLive ? (
          <span style={{ color: '#ff4757', fontSize: '12px' }}>En cours</span>
        ) : score}
      </div>
    </div>
  );
}