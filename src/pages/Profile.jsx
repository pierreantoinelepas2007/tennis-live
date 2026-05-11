import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Profile.module.css';

const BACKEND = 'https://tennis-live-backend-1.onrender.com';

export default function Profile() {
  const { user, profile, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
    }
  }, [profile]);

  async function searchAFT() {
    if (!search.trim() || search.length < 2) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(BACKEND + '/api/search-players?q=' + encodeURIComponent(search) + '&limit=10');
      const data = await res.json();
      if (data.success) setResults(data.players);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function linkAFT(player) {
    setSaving(true);
    try {
      const res = await fetch(BACKEND + '/api/player/' + player.aft_id);
      const data = await res.json();
      const fullProfile = data.player || player;
      await updateProfile({
        aftNumber: String(player.aft_id),
        aftRanking: player.ranking,
        aftPoints: parseFloat(player.points),
        aftVictories: player.victories,
        aftDefeats: player.defeats,
        club: fullProfile.club || null,
        aftName: player.name,
        aftLinked: true,
        aftLinkedAt: Date.now(),
      });
      setResults([]);
      setSearch('');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la liaison AFT');
    } finally {
      setSaving(false);
    }
  }

  async function unlinkAFT() {
    if (!confirm('Delier ton profil AFT ?')) return;
    await updateProfile({
      aftNumber: null,
      aftRanking: null,
      aftPoints: null,
      aftVictories: null,
      aftDefeats: null,
      club: null,
      aftName: null,
      aftLinked: false,
    });
  }

  async function saveProfile() {
    if (!name.trim()) return;
    setSaving(true);
    await updateProfile({ name: name.trim() });
    setSaving(false);
    setEditing(false);
  }

  function shareProfile() {
    const url = window.location.origin + '/u/' + user.uid;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!user) { navigate('/login'); return null; }

  const initials = (profile?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mon profil</h1>

      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {profile?.photoURL
              ? <img src={profile.photoURL} alt="avatar" className={styles.avatarImg} />
              : <span>{initials}</span>
            }
          </div>
          <div style={{flex:1}}>
            {editing ? (
              <div className={styles.editRow}>
                <input className={styles.nameInput} value={name} onChange={e => setName(e.target.value)} autoFocus />
                <button className={styles.saveBtn} onClick={saveProfile} disabled={saving}>{saving ? '...' : 'OK'}</button>
                <button className={styles.cancelBtn} onClick={() => setEditing(false)}>X</button>
              </div>
            ) : (
              <div className={styles.nameRow}>
                <h2 className={styles.profileName}>{profile?.name}</h2>
                <button className={styles.editBtn} onClick={() => { setName(profile?.name || ''); setEditing(true); }}>
                  edit
                </button>
              </div>
            )}
            <p className={styles.email}>{user.email}</p>
            <div className={styles.badges}>
              {profile?.aftLinked && (
                <span className={styles.aftBadge}>AFT #{profile.aftNumber}</span>
              )}
              {profile?.club && (
                <span className={styles.clubBadge}>{profile.club}</span>
              )}
            </div>
          </div>
        </div>

        {profile?.aftLinked && (
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statVal}>{profile.aftRanking}</div>
              <div className={styles.statLbl}>Classement AFT</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>{profile.aftVictories}V-{profile.aftDefeats}D</div>
              <div className={styles.statLbl}>Bilan officiel</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statVal}>{profile.aftPoints?.toFixed(1)}</div>
              <div className={styles.statLbl}>Points AFT</div>
            </div>
            <div className={styles.statItem}>
              <div
                className={styles.statVal}
                style={{fontSize:'13px',color:'#1D9E75',cursor:'pointer'}}
                onClick={() => navigate('/player/' + profile.aftNumber)}
              >
                Voir
              </div>
              <div className={styles.statLbl}>Profil complet</div>
            </div>
          </div>
        )}
      </div>

      <button className={styles.shareProfileBtn} onClick={shareProfile}>
        {copied ? 'Lien copie !' : 'Partager mon profil'}
      </button>

      {!profile?.aftLinked ? (
        <div className={styles.aftCard}>
          <div className={styles.aftTitle}>
            <span className={styles.aftBadgeSmall}>AFT</span>
            Lier ton profil Tennis Wallonie-Bruxelles
          </div>
          <p className={styles.aftDesc}>
            En liant ton profil AFT, tes matchs TennisLive apparaitront a cote de ton historique officiel.
          </p>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchAFT()}
              placeholder="Tape ton nom (ex: Dupont)"
              disabled={loading}
            />
            <button className={styles.searchBtn} onClick={searchAFT} disabled={loading || search.length < 2}>
              {loading ? '...' : 'Chercher'}
            </button>
          </div>
          {results.length > 0 && (
            <div className={styles.results}>
              {results.map(player => (
                <div key={player.aft_id} className={styles.resultRow} onClick={() => linkAFT(player)}>
                  <div>
                    <div className={styles.resultName}>{player.name}</div>
                    <div className={styles.resultMeta}>{player.victories}V - {player.defeats}D - {parseFloat(player.points).toFixed(1)} pts</div>
                  </div>
                  <span className={styles.resultRank}>{player.ranking}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={styles.aftCard}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div className={styles.aftTitle} style={{color:'#1D9E75'}}>Profil AFT lie</div>
              <div style={{fontSize:'13px',color:'#888',marginTop:'2px'}}>{profile.aftName}</div>
            </div>
            <button className={styles.unlinkBtn} onClick={unlinkAFT}>Delier</button>
          </div>
        </div>
      )}

      <button className={styles.logoutBtn} onClick={logout}>Se deconnecter</button>
    </div>
  );
}