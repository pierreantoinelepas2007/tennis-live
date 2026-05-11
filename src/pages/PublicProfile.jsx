import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import styles from './PlayerProfile.module.css';

const BACKEND = 'https://tennis-live-backend-1.onrender.com';

export default function PublicProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [aftData, setAftData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Charger profil Firebase
    onValue(ref(db, `users/${uid}`), snap => {
      if (snap.exists()) {
        const p = snap.val();
        setProfile(p);
        // Charger données AFT si lié
        if (p.aftNumber) {
          fetch(`${BACKEND}/api/player/${p.aftNumber}`)
            .then(r => r.json())
            .then(d => setAftData(d))
            .catch(() => {});
        }
      }
      setLoading(false);
    });

    // Charger matchs TennisLive
    onValue(ref(db, 'matches'), snap => {
      if (!snap.exists()) return;
      const all = Object.values(snap.val());
      const playerMatches = all.filter(m =>
        m.ownerUid === uid && m.status === 'finished'
      ).sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)).slice(0, 10);
      setMatches(playerMatches);
    });
  }, [uid]);

  function copyProfileLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner}>🎾</div><p>Chargement...</p></div>;
  if (!profile) return <div className={styles.loading}><p>Profil introuvable.</p></div>;

  const wins = matches.filter(m => m.winner === 'a').length;
  const losses = matches.filter(m => m.winner === 'b').length;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;
  const initials = (profile.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <button className={styles.back} onClick={() => navigate(-1)}>←</button>
        <div className={styles.heroInner}>
          <div className={styles.avatar}>
            {profile.photoURL
              ? <img src={profile.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
              : initials
            }
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.name}>{profile.name}</h1>
            <div className={styles.heroMeta}>
              {profile.aftRanking && <span className={styles.rankBadge}>{profile.aftRanking}</span>}
              {profile.club && <span className={styles.club}>🎾 {profile.club}</span>}
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>{wins}V–{losses}D</span>
                <span className={styles.heroStatLbl}>TennisLive</span>
              </div>
              {profile.aftPoints && (
                <div className={styles.heroStat}>
                  <span className={styles.heroStatVal}>{parseFloat(profile.aftPoints).toFixed(1)}</span>
                  <span className={styles.heroStatLbl}>Points AFT</span>
                </div>
              )}
              <div className={styles.heroStat}>
                <span className={styles.heroStatVal}>{winRate}%</span>
                <span className={styles.heroStatLbl}>Win rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton partage */}
        <button
          onClick={copyProfileLink}
          style={{marginTop:'12px',padding:'8px 16px',background:'rgba(255,255,255,0.2)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}
        >
          {copied ? <button
  onClick={() => {
    navigator.clipboard.writeText(window.location.origin + '/u/' + user.uid);
    alert('Lien de ton profil copié !');
  }}
  className={styles.shareProfileBtn}
>
  🔗 Partager mon profil
</button>'✓ Lien copié !' : '🔗 Partager ce profil'}
        </button>
      </div>

      {/* Matchs TennisLive */}
      {matches.length > 0 && (
        <div className={styles.content}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>🎾 Matchs TennisLive</div>
            {matches.map(m => (
              <div key={m.id} className={styles.matchRow}>
                <div className={`${styles.matchResult} ${m.winner === 'a' ? styles.win : styles.loss}`}>
                  {m.winner === 'a' ? 'V' : 'D'}
                </div>
                <div className={styles.matchInfo}>
                  <div className={styles.matchOpp}>vs {m.playerB}</div>
                  <div className={styles.matchMeta}>
                    {new Date(m.startedAt).toLocaleDateString('fr-BE')} · {m.surface} · {m.matchType === 'friendly' ? 'Amical' : m.matchType === 'tournament' ? 'Tournoi' : 'Interclub'}
                  </div>
                  <div className={styles.matchScore}>{(m.sets || []).map(s => `${s.a}-${s.b}`).join(', ')}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Lien vers profil AFT complet */}
          {profile.aftNumber && (
            <button
              onClick={() => navigate(`/player/${profile.aftNumber}`)}
              style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
            >
              Voir le profil AFT complet →
            </button>
          )}
        </div>
      )}
    </div>
  );
}