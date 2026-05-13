import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { addPoint, getScore, getSetsWon, formatScore } from '../utils/tennisLogic';

export default function MatchMode() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

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
    if (navigator.vibrate) navigator.vibrate(40);
    const snapshot = JSON.parse(JSON.stringify(match));
    setLocalHistory(prev => [...prev, snapshot]);
    setFlash(player);
    setTimeout(() => setFlash(null), 400);
    const updated = addPoint(match, player);
    setMatch(updated);
    const { history, ...toSave } = updated;
    await set(ref(db, 'matches/' + matchId), toSave);
    if (updated.status === 'finished') {
      const winner = updated.winner === 'a' ? updated.playerA : updated.playerB;
      setTimeout(() => {
        alert('Match termine ! Victoire de ' + winner + ' (' + formatScore(updated) + ')');
        navigate('/match/' + matchId);
      }, 300);
    }
  }

  async function handleUndo() {
    if (localHistory.length === 0) return;
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    const history = [...localHistory];
    const previous = history.pop();
    setLocalHistory(history);
    setMatch(previous);
    const { history: h, ...toSave } = previous;
    await set(ref(db, 'matches/' + matchId), toSave);
  }

  if (loading || !match) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a5c40',color:'#fff',fontSize:'20px'}}>
      Chargement...
    </div>
  );

  const score = getScore(match);
  const setsWon = getSetsWon(match);
  const nameA = score.playerA.split(' ')[0];
  const nameB = score.playerB.split(' ')[0];

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#1a5c40',
      color: '#fff',
      userSelect: 'none',
      overflow: 'hidden',
      touchAction: 'manipulation',
    }}>
      {/* Header */}
      <div style={{padding:'10px 16px 6px',background:'rgba(0,0,0,0.25)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <button
          onClick={() => navigate('/match/' + matchId)}
          style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:'6px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}
        >
          ← Retour
        </button>

        {/* Score compact */}
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          {['a','b'].map(p => {
            const name = p === 'a' ? nameA : nameB;
            const pts = p === 'a' ? score.labelA : score.labelB;
            const isServing = score.serving === p;
            return (
              <div key={p} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <span style={{fontSize:'11px',color:'#f5c518',opacity:isServing?1:0}}>●</span>
                <span style={{fontSize:'14px',fontWeight:'600'}}>{name}</span>
                <div style={{display:'flex',gap:'3px',alignItems:'center'}}>
                  {(match.sets||[]).map((s,i) => (
                    <span key={i} style={{width:'20px',height:'20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'700',borderRadius:'3px',background:s[p]>s[p==='a'?'b':'a']?'rgba(255,255,255,0.3)':'transparent'}}>
                      {s[p]}
                    </span>
                  ))}
                  <span style={{width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'16px',fontWeight:'700',background:'rgba(255,255,255,0.2)',borderRadius:'4px'}}>
                    {score.games[p]}
                  </span>
                  <span style={{width:'40px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'700',background:pts==='Avantage'?'#f5c518':isServing?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.1)',borderRadius:'4px',color:pts==='Avantage'?'#333':'#fff'}}>
                    {pts}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleUndo}
          disabled={localHistory.length === 0}
          style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'6px 12px',borderRadius:'6px',fontSize:'16px',cursor:'pointer',fontFamily:'inherit',opacity:localHistory.length>0?1:0.3}}
        >
          ↩
        </button>
      </div>

      {/* Boutons énormes */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:'6px',padding:'8px'}}>
        <button
          onClick={() => handlePoint('a')}
          style={{
            flex:1,
            background: flash==='a' ? 'rgba(255,255,255,0.9)' : '#1D9E75',
            color: flash==='a' ? '#1D9E75' : '#fff',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius:'14px',
            fontSize:'32px',
            fontWeight:'800',
            cursor:'pointer',
            fontFamily:'inherit',
            transition:'all 0.1s',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:'4px',
            letterSpacing:'-0.5px',
          }}
        >
          <span>{nameA}</span>
          <span style={{fontSize:'14px',fontWeight:'500',opacity:0.8}}>Point ▶</span>
        </button>

        <button
          onClick={() => handlePoint('b')}
          style={{
            flex:1,
            background: flash==='b' ? 'rgba(255,255,255,0.9)' : '#2563EB',
            color: flash==='b' ? '#2563EB' : '#fff',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius:'14px',
            fontSize:'32px',
            fontWeight:'800',
            cursor:'pointer',
            fontFamily:'inherit',
            transition:'all 0.1s',
            display:'flex',
            flexDirection:'column',
            alignItems:'center',
            justifyContent:'center',
            gap:'4px',
            letterSpacing:'-0.5px',
          }}
        >
          <span>{nameB}</span>
          <span style={{fontSize:'14px',fontWeight:'500',opacity:0.8}}>Point ▶</span>
        </button>
      </div>

      {/* Stats bas */}
      <div style={{padding:'8px 16px',background:'rgba(0,0,0,0.2)',display:'flex',justifyContent:'center',gap:'2rem',fontSize:'12px',opacity:0.7}}>
        <span>Sets : {setsWon.a}–{setsWon.b}</span>
        <span>Points : {match.totalPoints||0}</span>
        <span>Jeux : {match.games?.a||0}–{match.games?.b||0}</span>
        <span style={{opacity:localHistory.length>0?1:0.3}}>↩ {localHistory.length}</span>
      </div>
    </div>
  );
}