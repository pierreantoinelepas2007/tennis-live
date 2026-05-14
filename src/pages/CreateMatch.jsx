import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { createMatch } from '../utils/tennisLogic';
import styles from './CreateMatch.module.css';

const SURFACES = ['Terre battue', 'Dur', 'Gazon', 'Moquette', 'Synthétique'];
const BACKEND = 'http://localhost:4000';

export default function CreateMatch() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    playerB: '',
    surface: 'Terre battue',
    format: '3',
    matchType: 'friendly',
  });
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function searchOpponent() {
    if (!search.trim() || search.length < 2) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`${BACKEND}/api/search-players?q=${encodeURIComponent(search)}&limit=8`);
      const data = await res.json();
      if (data.success) setSearchResults(data.players);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }

  function selectOpponent(player) {
    setSelectedOpponent(player);
    setForm(prev => ({ ...prev, playerB: player.name }));
    setSearch(player.name);
    setSearchResults([]);
  }

  async function handleStart() {
    if (!form.playerB.trim()) return;
    setLoading(true);
    try {
      const matchData = createMatch({
        playerA: profile?.name || user?.displayName || 'Joueur A',
        playerB: form.playerB.trim(),
        surface: form.surface,
        format: parseInt(form.format),
      });

      const matchRef = push(ref(db, 'matches'));
      const matchId = matchRef.key;

      const matchToSave = {
        ...matchData,
        id: matchId,
        ownerUid: user.uid,
        ownerAftId: profile?.aftNumber || null,
        ownerAftRanking: profile?.aftRanking || null,
        opponentAftId: selectedOpponent?.aft_id || null,
        opponentAftRanking: selectedOpponent?.ranking || null,
        matchType: form.matchType,
        history: [],
      };

      await set(matchRef, matchToSave);

      // Sauvegarder dans le profil du joueur
      await set(ref(db, `users/${user.uid}/matches/${matchId}`), {
        id: matchId,
        playerB: form.playerB.trim(),
        surface: form.surface,
        startedAt: Date.now(),
        status: 'live',
        matchType: form.matchType,
      });

      navigate(`/match/${matchId}/toss`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la création du match.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) { navigate('/login'); return null; }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Nouveau match</h1>

        {/* Type de match */}
        <div className={styles.field}>
          <label className={styles.label}>Type de match</label>
          <div className={styles.typeGrid}>
            <button
              className={`${styles.typeBtn} ${form.matchType === 'friendly' ? styles.typeBtnActive : ''}`}
              onClick={() => update('matchType', 'friendly')}
            >
              <span className={styles.typeIcon}>🎾</span>
              <span className={styles.typeName}>Amical</span>
              <span className={styles.typeDesc}>Match entre amis</span>
            </button>
            <button
              className={`${styles.typeBtn} ${form.matchType === 'tournament' ? styles.typeBtnActive : ''}`}
              onClick={() => update('matchType', 'tournament')}
            >
              <span className={styles.typeIcon}>🏆</span>
              <span className={styles.typeName}>Tournoi</span>
              <span className={styles.typeDesc}>Compétition officielle</span>
            </button>
            <button
              className={`${styles.typeBtn} ${form.matchType === 'interclub' ? styles.typeBtnActive : ''}`}
              onClick={() => update('matchType', 'interclub')}
            >
              <span className={styles.typeIcon}>👥</span>
              <span className={styles.typeName}>Interclub</span>
              <span className={styles.typeDesc}>Match par équipe</span>
            </button>
            <button
              className={`${styles.typeBtn} ${form.matchType === 'training' ? styles.typeBtnActive : ''}`}
              onClick={() => update('matchType', 'training')}
            >
              <span className={styles.typeIcon}>💪</span>
              <span className={styles.typeName}>Entraînement</span>
              <span className={styles.typeDesc}>Séance de pratique</span>
            </button>
          </div>
        </div>

        {/* Joueur A */}
        <div className={styles.field}>
          <label className={styles.label}>Toi</label>
          <div className={styles.playerARow}>
            <div className={styles.playerAInfo}>
              <span className={styles.playerAName}>{profile?.name || user?.displayName}</span>
              {profile?.aftRanking && <span className={styles.playerARank}>{profile.aftRanking}</span>}
            </div>
          </div>
        </div>

        {/* Recherche adversaire */}
        <div className={styles.field}>
          <label className={styles.label}>Adversaire</label>
          <div className={styles.searchRow}>
            <input
              className={styles.input}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setSelectedOpponent(null);
                update('playerB', e.target.value);
              }}
              onKeyDown={e => e.key === 'Enter' && searchOpponent()}
              placeholder="Nom de l'adversaire..."
              autoFocus
            />
            <button className={styles.searchBtn} onClick={searchOpponent} disabled={searching || search.length < 2}>
              {searching ? '⟳' : '🔍'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(player => (
                <div key={player.aft_id} className={styles.searchResult} onClick={() => selectOpponent(player)}>
                  <div>
                    <div className={styles.resultName}>{player.name}</div>
                    <div className={styles.resultMeta}>{player.victories}V – {player.defeats}D</div>
                  </div>
                  <span className={styles.resultRank}>{player.ranking}</span>
                </div>
              ))}
            </div>
          )}

          {selectedOpponent && (
            <div className={styles.selectedOpponent}>
              <span className={styles.selectedCheck}>✓</span>
              <span>{selectedOpponent.name}</span>
              <span className={styles.selectedRank}>{selectedOpponent.ranking}</span>
            </div>
          )}
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Surface</label>
            <select className={styles.select} value={form.surface} onChange={e => update('surface', e.target.value)}>
              {SURFACES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Format</label>
            <select className={styles.select} value={form.format} onChange={e => update('format', e.target.value)}>
              <option value="1">1 set gagnant</option>
              <option value="3">2 sets gagnants</option>
              <option value="5">3 sets gagnants</option>
            </select>
          </div>
        </div>

        <div style={{position:'sticky',bottom:'0',background:'#fff',padding:'12px 0 8px',marginTop:'1rem'}}>
  <button className={styles.startBtn} onClick={handleStart} disabled={loading || !form.playerB.trim()}>
    {loading ? 'Création...' : '🎾 Démarrer le match'}
  </button>
</div>
    </div>
  );
}