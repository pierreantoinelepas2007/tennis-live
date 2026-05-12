import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { addPoint, undoPoint, getScore, getSetsWon, formatScore } from '../utils/tennisLogic';

export default function MatchMode() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastPoint, setLastPoint] = useState(null);

  // Garde l'écran allumé
  useEffect(() => {
    let wakeLock = null;
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) {}
    }
    requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, 'matches/' + matchId), snap => {
      if (snap.exists()) setMatch(snap.val());
      setLoading(false);
    });
    return unsub;
  }, [matchId]);

  async function handlePoint(player) {
    if (!match || match.status === 'finished') return;
    // Vibration
    if (navigator.vibrate) navigator.vibrate(50);
    const updated = addPoint(match, player);
    setMatch(updated);
    setLastPoint(player);
    setTimeout(() => setLastPoint(null), 600);
    const { history, ...toSave } = updated;
    await set(ref(db, 'matches/' + matchId), toSave);
    if (updated.status === 'finished') {
      const winner = updated.winner === 'a' ? updated.playerA : updated.playerB;
      setTimeout(() => {
        alert('Match termine ! Victoire de ' + winner);
        navigate('/match/' + matchId);
      }, 300);
    }
  }

  async function handleUndo() {
    if (!match || !match.history?.length) return;
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    const restored = undoPoint(match);
    setMatch(restored);
    const { history, ...toSave } = restored;
    await set(ref(db, 'matches/' + matchId), toSave);
  }

  if (loading || !match) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a5c40',color:'#fff',fontSize:'20px'}}>
      Chargement...
    </div>
  );

  const score = getScore(match);
  const setsWon = getSetsWon(match);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a5c40',
      color: '#fff',
      userSelect: 'none',
      overflow: 'hidden',
    }}>
      {/* Header score */}
      <div style={{padding:'16px 20px 8px',background:'rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
          <button
            onClick={() => navigate('/match/' + matchId)}
            style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}
          >
            ← Retour
          </button>
          <span style={{fontSize:'13px',opacity:0.7}}>
            Set {(match.sets || []).length + 1} · {match.surface}
          </span>
          <button
            onClick={handleUndo}
            disabled={!match.history?.length}
            style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit',opacity:match.history?.length?1:0.4}}
          >
            ↩
          </button>
        </div>

        {/* Scores */}
        {['a','b'].map(p => {
          const name = p === 'a' ? score.playerA : score.playerB;
          const pts = p === 'a' ? score.labelA : score.labelB;
          const isServing = score.serving === p;
          const isWinner = match.status === 'finished' && match.winner === p;
          return (
            <div key={p} style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 0'}}>
              <span style={{fontSize:'11px',color:'#f5c518',opacity:isServing?1:0}}>●</span>
              <span style={{flex:1,fontSize:'18px',fontWeight:'600',opacity:isWinner?1:0.9}}>
                {name.split(' ')[0]}
              </span>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                {(match.sets||[]).map((s,i) => (
                  <span key={i} style={{
                    width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'14px',fontWeight:'700',borderRadius:'5px',
                    background: s[p] > s[p==='a'?'b':'a'] ? 'rgba(255,255,255,0.3)' : 'transparent',
                  }}>{s[p]}</span>
                ))}
                <span style={{width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:'700',background:'rgba(255,255,255,0.15)',borderRadius:'6px'}}>
                  {score.games[p]}
                </span>
                <span style={{width:'48px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'700',background: pts==='Avantage'?'#f5c518':isServing?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.1)',borderRadius:'6px',color:pts==='Avantage'?'#333':'#fff'}}>
                  {pts}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Boutons énormes */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:'8px',padding:'12px'}}>
        <button
          onClick={() => handlePoint('a')}
          style={{
            flex:1,
            background: lastPoint==='a' ? '#fff' : '#1D9E75',
            color: lastPoint==='a' ? '#1D9E75' : '#fff',
            border: '3px solid rgba(255,255,255,0.3)',
            borderRadius:'20px',
            fontSize:'28px',
            fontWeight:'800',
            cursor:'pointer',
            fontFamily:'inherit',
            transition:'all 0.1s',
            transform: lastPoint==='a' ? 'scale(0.97)' : 'scale(1)',
            letterSpacing:'-0.5px',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:'4px',
          }}
        >
          <span>{score.playerA.split(' ')[0]}</span>
          <span style={{fontSize:'14px',fontWeight:'400',opacity:0.8}}>Point ▶</span>
        </button>

        <button
          onClick={() => handlePoint('b')}
          style={{
            flex:1,
            background: lastPoint==='b' ? '#fff' : '#378ADD',
            color: lastPoint==='b' ? '#378ADD' : '#fff',
            border: '3px solid rgba(255,255,255,0.3)',
            borderRadius:'20px',
            fontSize:'28px',
            fontWeight:'800',
            cursor:'pointer',
            fontFamily:'inherit',
            transition:'all 0.1s',
            transform: lastPoint==='b' ? 'scale(0.97)' : 'scale(1)',
            letterSpacing:'-0.5px',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:'4px',
          }}
        >
          <span>{score.playerB.split(' ')[0]}</span>
          <span style={{fontSize:'14px',fontWeight:'400',opacity:0.8}}>Point ▶</span>
        </button>
      </div>

      {/* Stats bas */}
      <div style={{padding:'10px 20px',background:'rgba(0,0,0,0.2)',display:'flex',justifyContent:'center',gap:'2rem',fontSize:'13px',opacity:0.7}}>
        <span>Sets : {setsWon.a}–{setsWon.b}</span>
        <span>Points : {match.totalPoints||0}</span>
        <span>Jeux : {match.games?.a||0}–{match.games?.b||0}</span>
      </div>
    </div>
  );
}