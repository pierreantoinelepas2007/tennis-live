import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

export default function Toss() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [phase, setPhase] = useState('choice'); // 'choice', 'toss', 'result', 'serve'
  const [coin, setCoin] = useState(null);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [tossWinner, setTossWinner] = useState(null);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    get(ref(db, 'matches/' + matchId)).then(snap => {
      if (snap.exists()) setMatch(snap.val());
    });
  }, [matchId]);

  async function setServer(player) {
    await set(ref(db, 'matches/' + matchId + '/serving'), player);
    navigate('/match/' + matchId);
  }

  function startToss(choice) {
    setPlayerChoice(choice);
    setPhase('toss');
    setFlipping(true);
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 'pile' : 'face';
      setCoin(result);
      setFlipping(false);
      const won = result === choice;
      setTossWinner(won ? 'a' : 'b');
      setPhase('result');
    }, 2000);
  }

  if (!match) return (
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a5c40',color:'#fff'}}>
      Chargement...
    </div>
  );

  const nameA = match.playerA?.split(' ')[0] || 'Joueur A';
  const nameB = match.playerB?.split(' ')[0] || 'Joueur B';

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(135deg, #1a5c40, #1D9E75)',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      padding:'2rem',
      color:'#fff',
      textAlign:'center',
    }}>

      {/* CHOIX */}
      {phase === 'choice' && (
        <>
          <div style={{fontSize:'48px',marginBottom:'1rem'}}>🎾</div>
          <h1 style={{fontSize:'24px',fontWeight:'700',marginBottom:'8px'}}>Avant de commencer</h1>
          <p style={{fontSize:'16px',opacity:0.85,marginBottom:'2.5rem'}}>
            {match.playerA} vs {match.playerB}
          </p>

          <div style={{display:'flex',flexDirection:'column',gap:'12px',width:'100%',maxWidth:'320px'}}>
            <button
              onClick={() => setPhase('toss')}
              style={{padding:'18px',background:'rgba(255,255,255,0.2)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'14px',color:'#fff',fontSize:'18px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
            >
              🪙 Faire le toss
            </button>
            <button
              onClick={() => setPhase('serve')}
              style={{padding:'18px',background:'rgba(255,255,255,0.1)',border:'2px solid rgba(255,255,255,0.3)',borderRadius:'14px',color:'#fff',fontSize:'18px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
            >
              Choisir qui sert
            </button>
          </div>
        </>
      )}

      {/* TOSS */}
      {phase === 'toss' && !flipping && !coin && (
        <>
          <div style={{fontSize:'48px',marginBottom:'1rem'}}>🪙</div>
          <h2 style={{fontSize:'22px',fontWeight:'700',marginBottom:'8px'}}>{nameA}, tu choisis !</h2>
          <p style={{opacity:0.85,marginBottom:'2rem'}}>Pile ou face ?</p>
          <div style={{display:'flex',gap:'16px'}}>
            <button
              onClick={() => startToss('pile')}
              style={{padding:'20px 32px',background:'rgba(255,255,255,0.25)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'14px',color:'#fff',fontSize:'20px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
            >
              PILE
            </button>
            <button
              onClick={() => startToss('face')}
              style={{padding:'20px 32px',background:'rgba(255,255,255,0.25)',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'14px',color:'#fff',fontSize:'20px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
            >
              FACE
            </button>
          </div>
        </>
      )}

      {/* ANIMATION TOSS */}
      {flipping && (
        <>
          <div style={{fontSize:'80px',animation:'spin 0.3s linear infinite',marginBottom:'1rem'}}>🪙</div>
          <p style={{fontSize:'20px',opacity:0.85}}>La pièce tourne...</p>
          <style>{`@keyframes spin { from{transform:rotateY(0deg)} to{transform:rotateY(360deg)} }`}</style>
        </>
      )}

      {/* RESULTAT TOSS */}
      {phase === 'result' && (
        <>
          <div style={{fontSize:'72px',marginBottom:'1rem'}}>{coin === 'pile' ? '⬆️' : '⬇️'}</div>
          <h2 style={{fontSize:'28px',fontWeight:'800',marginBottom:'8px'}}>{coin?.toUpperCase()} !</h2>
          <p style={{fontSize:'18px',marginBottom:'2rem',opacity:0.9}}>
            {tossWinner === 'a' ? nameA : nameB} a gagné le toss !
          </p>
          <p style={{fontSize:'16px',marginBottom:'1.5rem',opacity:0.8}}>
            Qui commence à servir ?
          </p>
          <div style={{display:'flex',gap:'12px',flexDirection:'column',width:'100%',maxWidth:'280px'}}>
            <button
              onClick={() => setServer('a')}
              style={{padding:'16px',background:'#fff',color:'#1D9E75',border:'none',borderRadius:'12px',fontSize:'17px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
            >
              {nameA} sert
            </button>
            <button
              onClick={() => setServer('b')}
              style={{padding:'16px',background:'rgba(255,255,255,0.2)',color:'#fff',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'12px',fontSize:'17px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
            >
              {nameB} sert
            </button>
          </div>
        </>
      )}

      {/* CHOISIR DIRECTEMENT */}
      {phase === 'serve' && (
        <>
          <div style={{fontSize:'48px',marginBottom:'1rem'}}>🎾</div>
          <h2 style={{fontSize:'22px',fontWeight:'700',marginBottom:'8px'}}>Qui commence à servir ?</h2>
          <p style={{opacity:0.85,marginBottom:'2rem'}}>{match.playerA} vs {match.playerB}</p>
          <div style={{display:'flex',gap:'12px',flexDirection:'column',width:'100%',maxWidth:'280px'}}>
            <button
              onClick={() => setServer('a')}
              style={{padding:'18px',background:'#fff',color:'#1D9E75',border:'none',borderRadius:'12px',fontSize:'18px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
            >
              {nameA} sert
            </button>
            <button
              onClick={() => setServer('b')}
              style={{padding:'18px',background:'rgba(255,255,255,0.2)',color:'#fff',border:'2px solid rgba(255,255,255,0.5)',borderRadius:'12px',fontSize:'18px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
            >
              {nameB} sert
            </button>
          </div>
          <button
            onClick={() => setPhase('choice')}
            style={{marginTop:'16px',background:'none',border:'none',color:'rgba(255,255,255,0.6)',fontSize:'14px',cursor:'pointer',fontFamily:'inherit'}}
          >
            ← Retour
          </button>
        </>
      )}
    </div>
  );
}