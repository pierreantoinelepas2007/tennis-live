import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './Club.module.css';

const BACKEND = 'https://tennis-live-backend-1.onrender.com';

export default function Club() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [searchClub, setSearchClub] = useState('');
  const [clubResults, setClubResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile?.club) return;
    // Charger membres du même club
    onValue(ref(db, 'users'), snap => {
      if (!snap.exists()) return;
      const all = Object.values(snap.val());
      const clubMembers = all.filter(u => u.club === profile.club && u.uid !== user?.uid);
      setMembers(clubMembers);
    });
    // Charger matchs récents du club
    onValue(ref(db, 'matches'), snap => {
      if (!snap.exists()) return;
      const all = Object.values(snap.val());
      const clubMatches = all
        .filter(m => m.status === 'finished')
        .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
        .slice(0, 20);
      setRecentMatches(clubMatches);
    });
  }, [profile?.club]);

  async function searchClubs() {
    if (!searchClub.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(BACKEND + '/api/search-players?q=' + encodeURIComponent(searchClub) + '&limit=5');
      const data = await res.json();
      if (data.success) {
        const clubs = [...new Set(data.players.map(p => p.club).filter(Boolean))];
        setClubResults(clubs);
      }
    } catch (e) {} finally {
      setLoading(false);
    }
  }

  async function joinClub(clubName) {
    await updateProfile({ club: clubName });
    setClubResults([]);
    setSearchClub('');
  }

  async function leaveClub() {
    if (!confirm('Quitter ' + profile.club + ' ?')) return;
    await updateProfile({ club: null });
  }

  const initials = name => (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Mon Club</h1>

      {!profile?.club ? (
        <div className={styles.noClub}>
          <div className={styles.noClubIcon}>🎾</div>
          <h2>Rejoins ton club</h2>
          <p>Trouve ton club pour voir les matchs de tes coéquipiers</p>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              value={searchClub}
              onChange={e => setSearchClub(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchClubs()}
              placeholder="Nom du club (ex: Vautour)"
            />
            <button className={styles.searchBtn} onClick={searchClubs} disabled={loading}>
              {loading ? '...' : 'Chercher'}
            </button>
          </div>
          {clubResults.length > 0 && (
            <div className={styles.clubResults}>
              {clubResults.map(club => (
                <div key={club} className={styles.clubRow} onClick={() => joinClub(club)}>
                  <span className={styles.clubIcon}>🎾</span>
                  <span className={styles.clubName}>{club}</span>
                  <span className={styles.joinBtn}>Rejoindre →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className={styles.clubHeader}>
            <div className={styles.clubIconBig}>🎾</div>
            <div>
              <h2 className={styles.clubTitle}>{profile.club}</h2>
              <p className={styles.clubSub}>{members.length + 1} membre{members.length > 0 ? 's' : ''} sur TennisLive</p>
            </div>
            <button className={styles.leaveBtn} onClick={leaveClub}>Quitter</button>
          </div>

          {/* Membres */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Membres</div>
            <div className={styles.membersList}>
              {/* Moi */}
              <div className={styles.memberRow} onClick={() => navigate('/profile')}>
                <div className={styles.memberAvatar} style={{background:'#1D9E75',color:'#fff'}}>
                  {profile.photoURL
                    ? <img src={profile.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                    : initials(profile.name)
                  }
                </div>
                <div className={styles.memberInfo}>
                  <div className={styles.memberName}>{profile.name} <span className={styles.meBadge}>moi</span></div>
                  <div className={styles.memberMeta}>{profile.aftRanking || '—'}</div>
                </div>
              </div>
              {members.map(m => (
                <div key={m.uid} className={styles.memberRow} onClick={() => navigate('/u/' + m.uid)}>
                  <div className={styles.memberAvatar}>
                    {m.photoURL
                      ? <img src={m.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}} />
                      : initials(m.name)
                    }
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{m.name}</div>
                    <div className={styles.memberMeta}>{m.aftRanking || '—'}</div>
                  </div>
                  {m.aftNumber && (
                    <button className={styles.viewBtn} onClick={e => { e.stopPropagation(); navigate('/player/' + m.aftNumber); }}>
                      Profil AFT
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Matchs récents */}
          {recentMatches.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Matchs récents</div>
              {recentMatches.map(m => (
                <div key={m.id} className={styles.matchRow} onClick={() => navigate('/watch/' + m.id)}>
                  <div className={styles.matchPlayers}>
                    <span className={styles.matchWinner}>{m.playerA}</span>
                    <span className={styles.matchVs}>vs</span>
                    <span>{m.playerB}</span>
                  </div>
                  <div className={styles.matchScore}>
                    {(m.sets || []).map(s => s.a + '-' + s.b).join(' ')}
                  </div>
                  <div className={styles.matchDate}>
                    {new Date(m.startedAt).toLocaleDateString('fr-BE', {day:'2-digit',month:'2-digit'})}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}