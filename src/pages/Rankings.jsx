import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './Rankings.module.css';

export default function Rankings() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('winRate');

  useEffect(() => {
    // Charger tous les utilisateurs
    onValue(ref(db, 'users'), snap => {
      if (snap.exists()) setPlayers(Object.values(snap.val()));
    });

    // Charger tous les matchs terminés
    onValue(ref(db, 'matches'), snap => {
      if (!snap.exists()) { setLoading(false); return; }
      const all = Object.values(snap.val());
      setMatches(all.filter(m => m.status === 'finished'));
      setLoading(false);
    });
  }, []);

  // Calculer les stats de chaque joueur
  function buildRanking() {
    return players.map(player => {
      const myMatches = matches.filter(m => m.ownerUid === player.uid);
      const wins = myMatches.filter(m => m.winner === 'a').length;
      const losses = myMatches.filter(m => m.winner === 'b').length;
      const total = wins + losses;
      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
      const totalPoints = myMatches.reduce((sum, m) => sum + (m.totalPoints || 0), 0);
      return {
        uid: player.uid,
        name: player.name || 'Joueur',
        club: player.club || '—',
        aftRanking: player.aftRanking || '—',
        photoURL: player.photoURL,
        wins, losses, total, winRate, totalPoints,
        isMe: player.uid === user?.uid,
      };
    }).filter(p => p.total > 0); // seulement ceux qui ont joué
  }

  const ranking = buildRanking().sort((a, b) => {
    if (sortBy === 'winRate') return b.winRate - a.winRate || b.wins - a.wins;
    if (sortBy === 'wins') return b.wins - a.wins;
    if (sortBy === 'total') return b.total - a.total;
    return 0;
  });

  const filtered = search.trim()
    ? ranking.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.club.toLowerCase().includes(search.toLowerCase())
      )
    : ranking;

  const myRank = ranking.findIndex(p => p.isMe) + 1;
  const me = ranking.find(p => p.isMe);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Classement</h1>

      {/* Ma position */}
      {me && (
        <div className={styles.myCard}>
          <div className={styles.myRank}>#{myRank}</div>
          <div className={styles.myInfo}>
            <div className={styles.myName}>{me.name} <span className={styles.meBadge}>moi</span></div>
            <div className={styles.myStats}>{me.wins}V · {me.losses}D · {me.winRate}% win rate</div>
          </div>
          {me.aftRanking !== '—' && <div className={styles.myAft}>{me.aftRanking}</div>}
        </div>
      )}

      {/* Filtres */}
      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un joueur…"
        />
        <select className={styles.select} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="winRate">Par win rate</option>
          <option value="wins">Par victoires</option>
          <option value="total">Par matchs joués</option>
        </select>
      </div>

      {loading && <div className={styles.loading}>Calcul du classement…</div>}

      {!loading && filtered.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🏆</div>
          <p>Aucun joueur classé pour l'instant.</p>
          <p style={{fontSize:'13px',color:'#bbb',marginTop:'6px'}}>
            Joue des matchs pour apparaître dans le classement !
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>#</span>
            <span>Joueur</span>
            <span>Bilan</span>
            <span>Win%</span>
            <span>AFT</span>
          </div>
          {filtered.map((p, i) => (
            <div key={p.uid} className={`${styles.row} ${p.isMe ? styles.meRow : ''}`}>
              <div className={styles.rankNum}>
                {i + 1 <= 3 ? ['🥇','🥈','🥉'][i] : i + 1}
              </div>
              <div className={styles.nameCol}>
                <div className={styles.avatar} style={p.isMe ? {background:'#1D9E75',color:'#fff'} : {}}>
                  {p.photoURL
                    ? <img src={p.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                    : p.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
                  }
                </div>
                <div>
                  <div className={`${styles.playerName} ${p.isMe ? styles.meName : ''}`}>
                    {p.name}{p.isMe && ' ★'}
                  </div>
                  {p.club !== '—' && <div className={styles.playerClub}>{p.club}</div>}
                </div>
              </div>
              <div className={styles.bilan}>{p.wins}V–{p.losses}D</div>
              <div className={styles.winRateCol}>
                <div className={styles.winRateBar}>
                  <div className={styles.winRateFill} style={{width:`${p.winRate}%`, background: p.isMe ? '#1D9E75' : '#9FE1CB'}} />
                </div>
                <span className={styles.winRatePct}>{p.winRate}%</span>
              </div>
              <div className={styles.aftBadge}>{p.aftRanking}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.note}>
        Classement basé sur les matchs joués sur TennisLive · Mis à jour en temps réel
      </div>
    </div>
  );
}