import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { getScore, getSetsWon } from '../utils/tennisLogic';
import LiveChat from '../components/LiveChat';
import styles from './WatchMatch.module.css';

export default function WatchMatch() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spectatorName, setSpectatorName] = useState('');
  const [nameSet, setNameSet] = useState(false);

  useEffect(() => {
    const matchRef = ref(db, `matches/${matchId}`);
    const unsub = onValue(matchRef, snap => {
      setMatch(snap.exists() ? snap.val() : null);
      setLoading(false);
    });
    return unsub;
  }, [matchId]);

  if (loading) return (
    <div style={{textAlign:'center',padding:'4rem',color:'#999'}}>
      <div style={{fontSize:'40px',marginBottom:'10px'}}>🎾</div>
      <p>Connexion au match…</p>
    </div>
  );

  if (!match) return (
    <div style={{textAlign:'center',padding:'4rem',color:'#999'}}>
      <div style={{fontSize:'40px',marginBottom:'10px'}}>🎾</div>
      <h2>Match introuvable</h2>
    </div>
  );

  const score = getScore(match);
  const isFinished = match.status === 'finished';
  const firstName = score.playerA ? score.playerA.split(' ')[0] : 'le joueur';

  if (!nameSet) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f0fdf8',padding:'1.5rem'}}>
        <div style={{background:'#fff',borderRadius:'20px',padding:'2rem',maxWidth:'340px',width:'100%',textAlign:'center',boxShadow:'0 4px 30px rgba(0,0,0,0.08)'}}>
          <div style={{fontSize:'36px',marginBottom:'0.5rem'}}>👋</div>
          <h2 style={{fontSize:'18px',fontWeight:'700',marginBottom:'8px'}}>Tu suis {firstName} en direct !</h2>
          <p style={{fontSize:'14px',color:'#777',marginBottom:'1.5rem',lineHeight:'1.5'}}>
            Entre ton prénom pour qu'il sache que tu le soutiens 💪
          </p>
          <input
            style={{width:'100%',padding:'11px 14px',border:'1.5px solid #ddd',borderRadius:'10px',fontSize:'16px',fontFamily:'inherit',outline:'none',marginBottom:'12px',boxSizing:'border-box'}}
            value={spectatorName}
            onChange={e => setSpectatorName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && spectatorName.trim() && setNameSet(true)}
            placeholder="Ton prénom"
            autoFocus
          />
          <button
            style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',marginBottom:'8px',opacity:spectatorName.trim()?1:0.5}}
            onClick={() => spectatorName.trim() && setNameSet(true)}
          >
            Voir le score et encourager →
          </button>
          <button
            style={{background:'none',border:'none',color:'#bbb',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}
            onClick={() => { setSpectatorName('Un supporter'); setNameSet(true); }}
          >
            Continuer sans prénom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{maxWidth:'480px',margin:'0 auto',padding:'1rem 1rem 3rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.5rem 0'}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#1D9E75'}}>🎾 TennisLive</div>
        {isFinished
          ? <span style={{fontSize:'13px',color:'#1D9E75',fontWeight:'600'}}>✓ Match terminé</span>
          : <span style={{fontSize:'13px',color:'#ff4757',fontWeight:'600'}}>● Live</span>
        }
      </div>

      <div style={{background:'#fff',borderRadius:'16px',padding:'1.25rem',border:'1px solid #eee'}}>
        <div style={{fontSize:'12px',color:'#aaa',marginBottom:'12px'}}>{match.surface}</div>
        {['a','b'].map(p => {
          const name = p === 'a' ? score.playerA : score.playerB;
          const pointLabel = p === 'a' ? score.labelA : score.labelB;
          const isServing = score.serving === p && !isFinished;
          const isWinner = isFinished && match.winner === p;
          return (
            <div key={p} style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 0',borderBottom:p==='a'?'1px solid #f5f5f5':'none',background:isWinner?'#f5fdf9':'transparent'}}>
              <div style={{width:'20px',textAlign:'center',fontSize:'10px',color:'#f5c518'}}>{isServing?'●':''}{isWinner?'🏆':''}</div>
              <span style={{flex:1,fontSize:'16px',fontWeight:isWinner?'700':'500',color:isWinner?'#0F6E56':'#111'}}>{name}</span>
              <div style={{display:'flex',gap:'4px'}}>
                {(match.sets||[]).map((s,i) => {
                  const mine = s[p]; const opp = s[p==='a'?'b':'a'];
                  return <span key={i} style={{width:'26px',height:'26px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'600',borderRadius:'6px',background:mine>opp?'#E1F5EE':'transparent',color:mine>opp?'#0F6E56':'#ccc'}}>{mine}</span>;
                })}
              </div>
              <div style={{width:'34px',height:'34px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:'700',borderRadius:'8px',border:`1px solid ${isServing?'#1D9E75':'#eee'}`,color:isServing?'#0F6E56':'#333',background:isServing?'#f0fdf9':'#fff'}}>{score.games[p]}</div>
              {!isFinished && <div style={{width:'70px',height:'36px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'17px',fontWeight:'700',borderRadius:'8px',border:`1.5px solid ${pointLabel==='Avantage'?'#f5c518':'#eee'}`,background:pointLabel==='Avantage'?'#FFF8E1':'#fff',color:pointLabel==='Avantage'?'#8a6d00':'#222'}}>{pointLabel}</div>}
            </div>
          );
        })}
        {isFinished && <div style={{textAlign:'center',fontSize:'13px',color:'#888',marginTop:'12px',paddingTop:'10px',borderTop:'1px solid #f5f5f5'}}>Score final : {(match.sets||[]).map(s=>`${s.a}-${s.b}`).join(', ')}</div>}
      </div>

      {!isFinished && (
        <>
          <div style={{background:'#E1F5EE',borderRadius:'12px',padding:'12px 16px',fontSize:'14px',color:'#0F6E56',textAlign:'center'}}>
            💬 Envoie un message à {firstName} — il le verra sur son écran !
          </div>
          <LiveChat matchId={matchId} playerName={score.playerA} spectatorName={spectatorName} isPlayer={false} />
        </>
      )}

      <div style={{textAlign:'center',fontSize:'12px',color:'#ccc'}}>
        TennisLive · <a href="/" style={{color:'#1D9E75',textDecoration:'none'}}>Créer ton compte</a>
      </div>
    </div>
  );
}