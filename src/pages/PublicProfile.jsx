import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import styles from './PlayerProfile.module.css';

const BACKEND = 'https://railway-init-production-f1ae.up.railway.app';

export default function PublicProfile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onValue(ref(db, 'users/' + uid), snap => {
      if (snap.exists()) setProfile(snap.val());
      setLoading(false);
    });

    onValue(ref(db, 'matches'), snap => {
      if (!snap.exists()) return;
      const all = Object.values(snap.val());
      const playerMatches = all
        .filter(m => m.ownerUid === uid && m.status === 'finished')
        .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
        .slice(0, 10);
      setMatches(playerMatches);
    });
  }, [uid]);

  function copyProfileLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div style={{textAlign:'center',padding:'4rem',color:'#aaa'}}>
      <div style={{fontSize:'40px',marginBottom:'10px'}}>🎾</div>
      <p>Chargement...</p>
    </div>
  );

  if (!profile) return (
    <div style={{textAlign:'center',padding:'4rem',color:'#aaa'}}>
      <p>Profil introuvable.</p>
    </div>
  );

  const wins = matches.filter(m => m.winner === 'a').length;
  const losses = matches.filter(m => m.winner === 'b').length;
  const winRate = matches.length ? Math.round((wins / matches.length) * 100) : 0;
  const initials = (profile.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{maxWidth:'600px',margin:'0 auto',paddingBottom:'3rem'}}>
      <div style={{background:'linear-gradient(135deg, #1a5c40, #1D9E75)',padding:'1.5rem 1.25rem',position:'relative'}}>
        <button
          onClick={() => navigate(-1)}
          style={{position:'absolute',top:'1rem',left:'1rem',background:'rgba(255,255,255,0.2)',border:'none',color:'#fff',fontSize:'18px',width:'34px',height:'34px',borderRadius:'50%',cursor:'pointer'}}
        >
          ←
        </button>

        <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',marginTop:'0.5rem'}}>
          <div style={{width:'70px',height:'70px',borderRadius:'50%',background:'rgba(255,255,255,0.2)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:'700',flexShrink:0,border:'3px solid rgba(255,255,255,0.4)',overflow:'hidden'}}>
            {profile.photoURL
              ? <img src={profile.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
              : initials
            }
          </div>
          <div style={{flex:1,color:'#fff'}}>
            <h1 style={{fontSize:'22px',fontWeight:'700',marginBottom:'6px'}}>{profile.name}</h1>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
              {profile.aftRanking && (
                <span style={{background:'rgba(255,255,255,0.25)',padding:'3px 10px',borderRadius:'20px',fontSize:'13px',fontWeight:'700'}}>
                  {profile.aftRanking}
                </span>
              )}
              {profile.club && (
                <span style={{fontSize:'13px',opacity:0.85}}>🎾 {profile.club}</span>
              )}
            </div>
            <div style={{display:'flex',gap:'1.5rem'}}>
              <div>
                <div style={{fontSize:'20px',fontWeight:'700'}}>{wins}V–{losses}D</div>
                <div style={{fontSize:'11px',opacity:0.75}}>TennisLive</div>
              </div>
              {profile.aftPoints && (
                <div>
                  <div style={{fontSize:'20px',fontWeight:'700'}}>{parseFloat(profile.aftPoints).toFixed(1)}</div>
                  <div style={{fontSize:'11px',opacity:0.75}}>Points AFT</div>
                </div>
              )}
              <div>
                <div style={{fontSize:'20px',fontWeight:'700'}}>{winRate}%</div>
                <div style={{fontSize:'11px',opacity:0.75}}>Win rate</div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={copyProfileLink}
          style={{marginTop:'12px',padding:'8px 16px',background:'rgba(255,255,255,0.2)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}
        >
          {copied ? 'Lien copie !' : 'Partager ce profil'}
        </button>
      </div>

      <div style={{padding:'1rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
        {matches.length > 0 && (
          <div style={{background:'#fff',border:'1px solid #eee',borderRadius:'14px',padding:'1.25rem'}}>
            <div style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'1rem'}}>
              Matchs TennisLive
            </div>
            {matches.map(m => (
              <div key={m.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
                <div style={{width:'32px',height:'32px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'700',background:m.winner==='a'?'#E1F5EE':'#FCEBEB',color:m.winner==='a'?'#0F6E56':'#A32D2D',flexShrink:0}}>
                  {m.winner === 'a' ? 'V' : 'D'}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'14px',fontWeight:'500',color:'#111'}}>vs {m.playerB}</div>
                  <div style={{fontSize:'12px',color:'#aaa',marginTop:'2px'}}>
                    {new Date(m.startedAt).toLocaleDateString('fr-BE')} · {m.surface} · {m.matchType === 'friendly' ? 'Amical' : m.matchType === 'tournament' ? 'Tournoi' : 'Interclub'}
                  </div>
                </div>
                <div style={{fontSize:'13px',color:'#888'}}>
                  {(m.sets || []).map(s => s.a + '-' + s.b).join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {profile.aftNumber && (
          <button
            onClick={() => navigate('/player/' + profile.aftNumber)}
            style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
          >
            Voir le profil AFT complet →
          </button>
        )}
       </div>
    </div>
  );
}
