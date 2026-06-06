import { useState } from 'react';
import styles from './AFTImport.module.css';

const CF_BASE = 'https://railway-init-production-f1ae.up.railway.app';

export default function AFTImport({ onImport }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  async function searchPlayers() {
    if (!search.trim() || search.length < 2) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const res = await fetch(`${CF_BASE}/api/search-players?q=${encodeURIComponent(search)}&limit=10`);
      const data = await res.json();
      if (data.success && data.players.length > 0) {
        setResults(data.players);
      } else {
        setError('Aucun joueur trouvé.');
      }
    } catch (e) {
      setError('Erreur de connexion au backend.');
    } finally {
      setLoading(false);
    }
  }

  function selectPlayer(player) {
    setSelected(player);
    setResults([]);
    setSearch(player.name);
    onImport?.({
      aftNumber: String(player.aft_id),
      name: player.name,
      ranking: player.ranking,
      points: player.points,
      victories: player.victories,
      defeats: player.defeats,
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <span className={styles.badge}>AFT</span>
        Connecter ton profil Tennis Wallonie-Bruxelles
      </div>

      <div className={styles.row}>
        <input
          className={styles.input}
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null); setResults([]); }}
          onKeyDown={e => e.key === 'Enter' && searchPlayers()}
          placeholder="Tape ton nom (ex: Dupont)"
          disabled={loading}
        />
        <button className={styles.btn} onClick={searchPlayers} disabled={loading || search.length < 2}>
          {loading ? '⟳' : 'Chercher'}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map(player => (
            <div key={player.aft_id} className={styles.resultRow} onClick={() => selectPlayer(player)}>
              <div>
                <div className={styles.resultName}>{player.name}</div>
                <div className={styles.resultMeta}>
                  {new Date(player.birth_date).getFullYear()} · {player.victories}V – {player.defeats}D
                </div>
              </div>
              <span className={styles.ranking}>{player.ranking}</span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className={styles.result}>
          <div className={styles.resultRow2}>
            <span className={styles.check}>✓</span>
            <div>
              <div style={{fontWeight:600, fontSize:'15px'}}>{selected.name}</div>
              <div className={styles.resultNote}>
                Classement : <strong>{selected.ranking}</strong> · {selected.victories}V – {selected.defeats}D · {parseFloat(selected.points).toFixed(1)} pts
              </div>
              <div className={styles.sourceNote}>AFT #{selected.aft_id} · Source : Tennis Wallonie-Bruxelles</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.note}>
        Données officielles TWB · Mises à jour automatiquement
      </div>
    </div>
  );
}