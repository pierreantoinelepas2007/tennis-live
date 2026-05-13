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
  const [search, setSearch] = useState('');
  const [filterSurface, setFilterSurface] = useState('Toutes');
  const [filterType, setFilterType] = useState('Tous');
  const [filterResult, setFilterResult] = useState('Tous');
  const [showFilters, setShowFilters] = useState(false);

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

  function resetFilters() {
    setSearch('');
    setFilterSurface('Toutes');
    setFilterType('Tous');
    setFilterResult('Tous');
  }

  const filtered = matches.filter(m => {
    if (search && !m.playerB?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSurface !== 'Toutes' && m.surface !== filterSurface) return false;
    if (filterType !== 'Tous' && m.matchType !== filterType) return false;
    if (filterResult === 'Victoires' && m.winner !== 'a') return false;
    if (filterResult === 'Defaites' && m.winner !== 'b') return false;
    if (filterResult === 'En cours' && m.status !== 'live') return false;
    return true;
  });

  const finished = filtered.filter(m => m.status === 'finished');
  const live = filtered.filter(m => m.status === 'live');
  const allFinished = matches.filter(m => m.status === 'finished');
  const wins = allFinished.filter(m => m.winner === 'a').length;
  const losses = allFinished.filter(m => m.winner === 'b').length;
  const winRate = allFinished.length ? Math.round((wins / allFinished.length) * 100) : 0;

  const hasFilters = search || filterSurface !== 'Toutes' || filterType !== 'Tous' || filterResult !== 'Tous';

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Historique</h1>

      {allFinished.length > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statVal} style={{color:'#1D9E75'}}>{wins}–{losses}</div>
            <div className={styles.statLabel}>Bilan total</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{winRate}%</div>
            <div className={styles.statLabel}>Win rate</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{allFinished.length}</div>
            <div className={styles.statLabel}>Matchs joués</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{matches.filter(m => m.status === 'live').length}</div>
            <div className={styles.statLabel}>En cours</div>
          </div>
        </div>
      )}

      {/* Barre de recherche + filtres */}
      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un adversaire..."
        />
        <button
          className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          ⚙️ {hasFilters ? '•' : ''}
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Surface</label>
            <div className={styles.filterChips}>
              {['Toutes','Terre battue','Dur','Gazon','Moquette'].map(s => (
                <button
                  key={s}
                  className={`${styles.chip} ${filterSurface === s ? styles.chipActive : ''}`}
                  onClick={() => setFilterSurface(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <div className={styles.filterChips}>
              {[
                {val:'Tous', label:'Tous'},
                {val:'friendly', label:'🎾 Amical'},
                {val:'tournament', label:'🏆 Tournoi'},
                {val:'interclub', label:'👥 Interclub'},
                {val:'training', label:'💪 Entraînement'},
              ].map(t => (
                <button
                  key={t.val}
                  className={`${styles.chip} ${filterType === t.val ? styles.chipActive : ''}`}
                  onClick={() => setFilterType(t.val)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Résultat</label>
            <div className={styles.filterChips}>
              {['Tous','Victoires','Defaites','En cours'].map(r => (
                <button
                  key={r}
                  className={`${styles.chip} ${filterResult === r ? styles.chipActive : ''}`}
                  onClick={() => setFilterResult(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {hasFilters && (
            <button className={styles.resetBtn} onClick={resetFilters}>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {hasFilters && (
        <div className={styles.filterSummary}>
          {filtered.length} match{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </div>
      )}

      {live.length > 0 && (
        <>
          <div className={styles.sectionLabel}>🎾 En cours</div>
          {live.map(m => (
            <MatchRow key={m.id} match={m} onClick={() => navigate('/match/' + m.id)} onDelete={deleteMatch} />
          ))}
        </>
      )}

      {finished.length > 0 && (
        <>
          <div className={styles.sectionLabel}>Terminés</div>
          {finished.map(m => (
            <MatchRow key={m.id} match={m} onClick={() => navigate('/watch/' + m.id)} onDelete={deleteMatch} />
          ))}
        </>
      )}

      {loading && <div className={styles.loading}>Chargement…</div>}

      {!loading && filtered.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>{hasFilters ? '🔍' : '🎾'}</div>
          <p>{hasFilters ? 'Aucun match pour ces filtres.' : 'Pas encore de match enregistré.'}</p>
          {hasFilters
            ? <button className={styles.newBtn} onClick={resetFilters}>Effacer les filtres</button>
            : <button className={styles.newBtn} onClick={() => navigate('/match/new')}>Démarrer un match</button>
          }
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