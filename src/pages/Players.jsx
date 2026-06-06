import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './Players.module.css';

const CF_BASE = 'https://railway-init-production-f1ae.up.railway.app';

export default function Players() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('aft');

  useEffect(() => {
    if (!user) return;
    onValue(ref(db, 'users'), snap => {
      if (!snap.exists()) return;
      const users = Object.values(snap.val()).filter(u => u.uid !== user.uid);
      setAllUsers(users);
    });
    onValue(ref(db, `users/${user.uid}/favorites`), snap => {
      setFavorites(snap.exists() ? Object.values(snap.val()) : []);
    });
  }, [user]);

  // Recherche TWB via backend
  async function searchAFT() {
    if (!search.trim() || search.length < 2) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`${CF_BASE}/api/search-players?q=${encodeURIComponent(search)}&limit=15`);
      const data = await res.json();
      if (data.success) setResults(data.players);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Recherche dans les utilisateurs TennisLive
  const localResults = search.trim()
    ? allUsers.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.club?.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 10)
    : [];

  async function toggleFavorite(player) {
    if (!user) return;
    const id = player.aft_id || player.uid;
    const favRef = ref(db, `users/${user.uid}/favorites/${id}`);
    const isFav = favorites.some(f => (f.aft_id || f.uid) === id);
    if (isFav) {
      await remove(favRef);
    } else {
      await set(favRef, {
        aft_id: player.aft_id || null,
        uid: player.uid || null,
        name: player.name,
        ranking: player.ranking || player.aftRanking || '—',
        club: player.club || '—',
      });
    }
  }

  function isFav(player) {
    const id = player.aft_id || player.uid;
    return favorites.some(f => (f.aft_id || f.uid) === id);
  }

  const initials = name => (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Joueurs</h1>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'aft' ? styles.tabActive : ''}`} onClick={() => setTab('aft')}>
          🎾 Base TWB
        </button>
        <button className={`${styles.tab} ${tab === 'app' ? styles.tabActive : ''}`} onClick={() => setTab('app')}>
          👥 TennisLive
        </button>
        <button className={`${styles.tab} ${tab === 'favs' ? styles.tabActive : ''}`} onClick={() => setTab('favs')}>
          ⭐ Favoris ({favorites.length})
        </button>
      </div>

      {/* Recherche */}
      {(tab === 'aft' || tab === 'app') && (
        <div className={styles.searchBox}>
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tab === 'aft' && searchAFT()}
            placeholder={tab === 'aft' ? "Chercher dans la base TWB (nom)..." : "Chercher un joueur TennisLive..."}
            autoFocus
          />
          {tab === 'aft' && (
            <button className={styles.searchBtn} onClick={searchAFT} disabled={loading || search.length < 2}>
              {loading ? '⟳' : 'Chercher'}
            </button>
          )}
        </div>
      )}

      {/* Résultats TWB */}
      {tab === 'aft' && (
        <>
          {results.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>{results.length} joueurs trouvés</div>
              {results.map(player => (
                <div key={player.aft_id} className={styles.playerRow}>
                  <div className={styles.avatarWrap} onClick={() => navigate(`/player/${player.aft_id}`)}>
                    <div className={styles.avatar}>{initials(player.name)}</div>
                  </div>
                  <div className={styles.playerInfo} onClick={() => navigate(`/player/${player.aft_id}`)}>
                    <div className={styles.playerName}>{player.name}</div>
                    <div className={styles.playerMeta}>
                      {player.victories}V – {player.defeats}D · {parseFloat(player.points || 0).toFixed(1)} pts
                    </div>
                  </div>
                  <span className={styles.rankingBadge}>{player.ranking}</span>
                  <button
                    className={`${styles.favBtn} ${isFav(player) ? styles.favBtnActive : ''}`}
                    onClick={() => toggleFavorite(player)}
                  >
                    {isFav(player) ? '★' : '☆'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && search.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>Cherche n'importe quel joueur belge par nom.</p>
              <p style={{fontSize:'13px',color:'#bbb',marginTop:'6px'}}>
                Données officielles Tennis Wallonie-Bruxelles
              </p>
            </div>
          )}
        </>
      )}

      {/* Résultats TennisLive */}
      {tab === 'app' && (
        <>
          {localResults.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Joueurs sur TennisLive</div>
              {localResults.map(player => (
                <div key={player.uid} className={styles.playerRow}>
                  <div className={styles.avatar}>
                    {player.photoURL
                      ? <img src={player.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                      : initials(player.name)
                    }
                  </div>
                  <div className={styles.playerInfo}>
                    <div className={styles.playerName}>{player.name}</div>
                    <div className={styles.playerMeta}>{player.aftRanking || '—'} · {player.club || '—'}</div>
                  </div>
                  <button
                    className={`${styles.favBtn} ${isFav(player) ? styles.favBtnActive : ''}`}
                    onClick={() => toggleFavorite(player)}
                  >
                    {isFav(player) ? '★ Suivi' : '☆ Suivre'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>👥</div>
              <p>{search ? `Aucun résultat pour "${search}"` : 'Recherche des joueurs inscrits sur TennisLive.'}</p>
            </div>
          )}
        </>
      )}

      {/* Favoris */}
      {tab === 'favs' && (
        <>
          {favorites.length > 0 ? (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Tes favoris</div>
              {favorites.map(player => (
                <div key={player.aft_id || player.uid} className={styles.playerRow}>
                  <div
                    className={styles.avatar}
                    onClick={() => player.aft_id && navigate(`/player/${player.aft_id}`)}
                    style={{cursor: player.aft_id ? 'pointer' : 'default'}}
                  >
                    {initials(player.name)}
                  </div>
                  <div
                    className={styles.playerInfo}
                    onClick={() => player.aft_id && navigate(`/player/${player.aft_id}`)}
                    style={{cursor: player.aft_id ? 'pointer' : 'default'}}
                  >
                    <div className={styles.playerName}>{player.name}</div>
                    <div className={styles.playerMeta}>{player.ranking} · {player.club}</div>
                  </div>
                  <button
                    className={`${styles.favBtn} ${styles.favBtnActive}`}
                    onClick={() => toggleFavorite(player)}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⭐</div>
              <p>Pas encore de favoris.</p>
              <p style={{fontSize:'13px',color:'#bbb',marginTop:'6px'}}>
                Cherche des joueurs dans l'onglet TWB et clique ☆ pour les suivre.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}