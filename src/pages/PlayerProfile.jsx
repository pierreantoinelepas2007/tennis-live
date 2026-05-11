import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PlayerProfile.module.css';

const BACKEND = 'http://localhost:4000';

export default function PlayerProfile() {
  const { aftId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    fetch(`${BACKEND}/api/player/${aftId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [aftId]);

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.spinner}>🎾</div>
      <p>Chargement du profil...</p>
    </div>
  );

  if (!data?.player) return (
    <div className={styles.loading}>
      <p>Joueur introuvable.</p>
      <button onClick={() => navigate(-1)}>← Retour</button>
    </div>
  );

  const { player, matches, stats, yearly_performance, tournament_wins } = data;
  const wins = stats?.periods?.['12m']?.wins || 0;
  const losses = stats?.periods?.['12m']?.losses || 0;
  const winRate = stats?.periods?.['12m']?.win_rate || 0;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <div className={styles.heroInner}>
          <div className={styles.avatar}>
            {player.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.name}>{player.name}</h1>
            <div className={styles.heroMeta}>
              <span className={styles.rankBadge}>{player.ranking}</span>
              <span className={styles.club}>🎾 {player.club}</span>
              <span className={styles.nat}>{player.nationality}</span>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>{player.points?.toFixed(1)}</span>
                <span className={styles.heroStatLbl}>Points</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>{wins}V–{losses}D</span>
                <span className={styles.heroStatLbl}>12 mois</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>{winRate}%</span>
                <span className={styles.heroStatLbl}>Win rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['overview', 'matchs', 'classement', 'stats'].map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Vue d\'ensemble' : t === 'matchs' ? 'Matchs' : t === 'classement' ? 'Classement' : 'Stats'}
          </button>
        ))}
      </div>

      <div className={styles.content}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            {/* Performance par année */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>📈 Performance par année</div>
              <div className={styles.yearGrid}>
                {(yearly_performance || []).slice().reverse().map(y => (
                  <div key={y.year} className={styles.yearCard}>
                    <div className={styles.yearNum}>{y.year}</div>
                    <div className={styles.yearVic}>{y.total_victories}V</div>
                    {y.ceiling_breakthrough && <div className={styles.breakthrough}>↑ Progression</div>}
                    <div className={styles.yearBest}>Meilleur : {y.best_victory_ranking}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tournois gagnés */}
            {tournament_wins?.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardTitle}>🏆 Tournois gagnés</div>
                {tournament_wins.map((t, i) => (
                  <div key={i} className={styles.tournamentRow}>
                    <div className={styles.tournamentName}>{t.tournament_name}</div>
                    <div className={styles.tournamentMeta}>{t.category} · {new Date(t.tournament_date).toLocaleDateString('fr-BE')} · {t.matches_played} matchs</div>
                  </div>
                ))}
              </div>
            )}

            {/* Stats rapides */}
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{data.match_analysis?.total_matches || 0}</div>
                <div className={styles.statBoxLbl}>Matchs totaux</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{data.advanced_stats?.match_details?.wins_2_sets || 0}</div>
                <div className={styles.statBoxLbl}>Victoires en 2 sets</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{data.advanced_stats?.match_details?.wins_3_sets || 0}</div>
                <div className={styles.statBoxLbl}>Victoires en 3 sets</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statBoxVal}>{data.advanced_stats?.performance_vs_ranking?.vs_weaker || 0}%</div>
                <div className={styles.statBoxLbl}>Win% vs moins classés</div>
              </div>
            </div>
          </>
        )}

        {/* MATCHS */}
        {tab === 'matchs' && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Historique des matchs</div>
            {(matches || []).map(m => (
              <div key={m.match_id} className={`${styles.matchRow} ${m.result === 'W' ? styles.matchWin : styles.matchLoss}`}>
                <div className={`${styles.matchResult} ${m.result === 'W' ? styles.win : styles.loss}`}>
                  {m.result === 'W' ? 'V' : 'D'}
                </div>
                <div className={styles.matchInfo}>
                  <div className={styles.matchOpp}>
                    vs {m.opponent?.name}
                    <span className={styles.matchOppRank}>{m.opponent?.ranking}</span>
                  </div>
                  <div className={styles.matchMeta}>
                    {new Date(m.date).toLocaleDateString('fr-BE')} · {m.tournament_name} · {m.round || m.category}
                  </div>
                  <div className={styles.matchScore}>{m.score}</div>
                </div>
                <div className={styles.matchType}>{m.match_type === 'Tournament' ? '🏆' : '👥'}</div>
              </div>
            ))}
          </div>
        )}

        {/* CLASSEMENT */}
        {tab === 'classement' && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>Évolution du classement</div>
            {(player.ranking_history || []).map((r, i) => (
              <div key={i} className={styles.rankRow}>
                <div className={styles.rankPeriod}>{r.period.split('VAUTOUR')[0].trim()}</div>
                <div className={styles.rankVal}>{r.ranking}</div>
              </div>
            ))}
          </div>
        )}

        {/* STATS */}
        {tab === 'stats' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Stats détaillées</div>
              <div className={styles.statsList}>
                <div className={styles.statsRow}><span>Tournois</span><span>{stats?.by_type?.tournament?.matches || 0} matchs · {stats?.by_type?.tournament?.win_rate || 0}% win</span></div>
                <div className={styles.statsRow}><span>Interclub</span><span>{stats?.by_type?.interclub?.matches || 0} matchs · {stats?.by_type?.interclub?.win_rate || 0}% win</span></div>
                <div className={styles.statsRow}><span>Matchs en 2 sets</span><span>{data.advanced_stats?.match_details?.wins_2_sets || 0}V / {data.advanced_stats?.match_details?.losses_2_sets || 0}D</span></div>
                <div className={styles.statsRow}><span>Matchs en 3 sets</span><span>{data.advanced_stats?.match_details?.wins_3_sets || 0}V / {data.advanced_stats?.match_details?.losses_3_sets || 0}D</span></div>
                <div className={styles.statsRow}><span>Points actuels</span><span>{player.points?.toFixed(2)}</span></div>
                <div className={styles.statsRow}><span>Classement mondial</span><span>#{data.player?.global_ranking?.Position}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}