import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styles from './Club.module.css';

export default function Club() {
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [clubName, setClubName] = useState('');

  useEffect(() => {
    if (!profile?.club) return;
    onValue(ref(db, 'users'), snap => {
      if (!snap.exists()) return;
      const all = Object.values(snap.val());
      setMembers(all.filter(u => u.club === profile.club && u.uid !== user?.uid));
    });
    onValue(ref(db, 'matches'), snap => {
      if (!snap.exists()) return;
      const all = Object.values(snap.val());
      setRecentMatches(
        all.filter(m => m.status === 'finished')
           .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
           .slice(0, 15)
      );
    });
  }, [profile?.club]);

  async function joinClub() {
    if (!clubName.trim()) return;
    await updateProfile({ club: clubName.trim().toUpperCase() });
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
          <p>Entre le nom exact de ton club AFT</p>
          <p style={{fontSize:'12px',color:'#bbb',marginBottom:'1.5rem'}}>
            Ex: VAUTOUR, WOLUWE, UCCLE...
          </p>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              value={clubName}
              onChange={e => setClubName(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinClub()}
              placeholder="NOM DU CLUB"
              autoFocus
            />
            <button
              className={styles.searchBtn}
              onClick={joinClub}
              disabled={!clubName.trim()}
            >
              Rejoindre
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.clubHeader}>
            <div className={styles.clubIconBig}>🎾</div>
            <div style={{flex:1}}>
              <h2 className={styles.clubTitle}>{profile.club}</h2>
              <p className={styles.clubSub}>{members.length + 1} membre{members.length > 0 ? 's' : ''} sur TennisLive</p>
            </div>
            <button className={styles.leaveBtn} onClick={leaveClub}>Quitter</button>
          </div>

          {/* Membres */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Membres</div>
            <div className={styles.membersList}>
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
                    <button
                      className={styles.viewBtn}
                      onClick={e => { e.stopPropagation(); navigate('/player/' + m.aftNumber); }}
                    >
                      Profil AFT
                    </button>
                  )}
                </div>
              ))}
              {members.length === 0 && (
                <div style={{fontSize:'13px',color:'#bbb',padding:'12px',textAlign:'center'}}>
                  Pas encore d'autres membres de {profile.club} sur TennisLive.
                </div>
              )}
            </div>
          </div>

          {/* Matchs récents */}
          {recentMatches.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Matchs récents</div>
              {recentMatches.map(m => (
                <div key={m.id} className={styles.matchRow} onClick={() => navigate('/watch/' + m.id)}>
                  <div className={styles.matchPlayers}>
                    <span className={m.winner === 'a' ? styles.matchWinner : ''}>{m.playerA}</span>
                    <span className={styles.matchVs}>vs</span>
                    <span className={m.winner === 'b' ? styles.matchWinner : ''}>{m.playerB}</span>
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