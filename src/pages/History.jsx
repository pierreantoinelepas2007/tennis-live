import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, remove } from 'firebase/database';
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

  async function deleteMatch(match) {
    if (!confirm('Supprimer ce match ?')) return;
    try {
      await remove(ref(db, 'matches/' + match.id));
      await remove(ref(db, 'users/' + user.uid + '/matches/' + match.id));
    } catch (e) {
      console.error(e);
    }
  }

  const finished = matches.filter(m => m.status === 'finished');
  const live = matches.filter(m => m.status === 'live');
  const wins = finished.filter(m => m.winner === 'a').length;
  const losses = finished.filter(m => m.winner === 'b').length;
  const winRate = finished.length ? Math.round((wins / finished.length) * 100) : 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Historique</h1>

      {finished.length > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{color:'#1D9E75'}}>{wins}–{losses}</div>
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

      {live.length > 0 && (
        <>
          <div className={styles.sectionLabel}>🎾 En cours</div>
          {live.map(m => (
            <MatchRow
              key={m.id}
              match={m}
              onClick={() => navigate('/match/' + m.id)}
              onDelete={deleteMatch}
            />
          ))}
        </>
      )}

      {finished.length > 0 && (
        <>
          <div className={styles.sectionLabel}>Terminés</div>
          {finished.map(m => (
            <MatchRow
              key={m.id}
              match={m}
              onClick={() => navigate('/watch/' + m.id)}
              onDelete={deleteMatch}
            />
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

function MatchRow({ match, onClick, onDelete }) {
  const isLive = match.status === 'live';
  const isWin = match.status === 'finished' && match.winner === 'a';
  const score = (match.sets || []).map(s => s.a + '-' + s.b).join(', ');
  const date = new Date(match.startedAt).toLocaleDateString('fr-BE', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  });
  const typeIcon = match.matchType === 'tournament' ? '🏆' :
                   match.matchType === 'interclub' ? '👥' :
                   match.matchType === 'training' ? '💪' : '🎾';

  return (
    <div className={styles.matchItem} onClick={onClick}>
      <div className={`${styles.resultBadge} ${isLive ? styles.badgeLive : isWin ? styles.badgeWin : styles.badgeLoss}`}>
        {isLive ? '●' : isWin ? 'V' : 'D'}
      </div>
      <div className={styles.matchInfo}>
        <div className={styles.opponent}>
          {typeIcon} vs {match.playerB}
          {isLive && <span className={styles.livePill}>Live</span>}
        </div>
        <div className={styles.matchMeta}>{date} · {match.surface}</div>
      </div>
      <div className={styles.matchScore}>{isLive ? 'En cours' : score}</div>
      <button
        className={styles.deleteBtn}
        onClick={e => { e.stopPropagation(); onDelete(match); }}
      >
        🗑
      </button>
    </div>
  );
}