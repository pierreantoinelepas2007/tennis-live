import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, set, push } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { getScore, getSetsWon } from '../utils/tennisLogic';
import LiveChat from '../components/LiveChat';

function speak(text, enabled) {
  if (!enabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'fr-FR';
  utt.rate = 0.9;
  window.speechSynthesis.speak(utt);
}

function buildGameText(prev, next) {
  if (next.status === 'finished') {
    const name = next.winner === 'a' ? next.playerA : next.playerB;
    return `Match terminé ! Victoire de ${name}`;
  }
  const prevSetsLen = (prev.sets || []).length;
  const newSetsLen = (next.sets || []).length;
  if (newSetsLen > prevSetsLen) {
    const s = next.sets[next.sets.length - 1];
    const name = s.a > s.b ? next.playerA : next.playerB;
    return `Set pour ${name} ! ${s.a} jeux à ${s.b}`;
  }
  const ga = next.games.a, gb = next.games.b;
  if (ga === gb) return `${ga} partout`;
  const winnerName = ga > gb ? next.playerA : next.playerB;
  return `${Math.max(ga, gb)} à ${Math.min(ga, gb)} pour ${winnerName}`;
}

export default function WatchMatch() {
  const { matchId } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);
  const [isApprovedScorer, setIsApprovedScorer] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(() =>
    localStorage.getItem('watchVoiceEnabled') !== 'false'
  );
  const voiceEnabledRef = useRef(voiceEnabled);
  const prevMatchRef = useRef(null);

  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  function toggleVoice() {
    setVoiceEnabled(v => {
      const next = !v;
      localStorage.setItem('watchVoiceEnabled', String(next));
      return next;
    });
  }

  useEffect(() => {
    const unsub = onValue(ref(db, 'matches/' + matchId), snap => {
      if (snap.exists()) setMatch(snap.val());
      setLoading(false);
    });
    return unsub;
  }, [matchId]);

  // Déclenche la voix quand le score en jeux change dans Firestore
  useEffect(() => {
    if (!match) return;
    const prev = prevMatchRef.current;
    prevMatchRef.current = match;
    if (!prev) return; // premier chargement, ne pas parler
    const prevSetsLen = (prev.sets || []).length;
    const gameWon =
      (match.sets || []).length > prevSetsLen ||
      match.games.a + match.games.b > prev.games.a + prev.games.b;
    if (gameWon) speak(buildGameText(prev, match), voiceEnabledRef.current);
  }, [match]);

  useEffect(() => {
    if (!user || !matchId) return;
    // Vérifier si on est approuvé comme marqueur
    onValue(ref(db, 'matches/' + matchId + '/scorer'), snap => {
      if (snap.exists()) {
        const scorer = snap.val();
        if (scorer.uid === user.uid && scorer.approved) {
          setIsApprovedScorer(true);
        }
      }
    });
    // Vérifier si demande déjà envoyée
    onValue(ref(db, 'matches/' + matchId + '/scorerRequest'), snap => {
      if (snap.exists() && snap.val().uid === user.uid) {
        setRequestSent(true);
      }
    });
  }, [user, matchId]);

  async function requestScoring() {
    if (!user) { navigate('/login'); return; }
    await set(ref(db, 'matches/' + matchId + '/scorerRequest'), {
      uid: user.uid,
      name: profile?.name || user.displayName,
      requestedAt: Date.now(),
      approved: false,
    });
    // Notifier le joueur
    await push(ref(db, 'users/' + match.ownerUid + '/notifications'), {
      type: 'scorer_request',
      matchId,
      from: profile?.name || user.displayName,
      fromUid: user.uid,
      message: (profile?.name || user.displayName) + ' veut noter ton match',
      createdAt: Date.now(),
      read: false,
    });
    setRequestSent(true);
  }

  async function confirmResult() {
    await set(ref(db, 'matches/' + matchId + '/confirmed'), true);
    alert('Match confirmé ! Il apparaît maintenant sur ton profil.');
  }

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#1a5c40',color:'#fff',fontSize:'18px'}}>
      Chargement...
    </div>
  );

  if (!match) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#888'}}>
      Match introuvable.
    </div>
  );

  const score = getScore(match);
  const setsWon = getSetsWon(match);
  const isOwner = user?.uid === match.ownerUid;
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div style={{maxWidth:'500px',margin:'0 auto',padding:'1rem',minHeight:'100vh',background:'#f4f4f4'}}>

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'1rem'}}>
        <button onClick={() => navigate('/')} style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer'}}>←</button>
        <div>
          <div style={{fontSize:'13px',color:'#888'}}>{match.surface} · {match.matchType === 'friendly' ? 'Amical' : match.matchType === 'tournament' ? 'Tournoi' : 'Interclub'}</div>
          <div style={{fontSize:'12px',color:isLive?'#E8192C':'#1D9E75',fontWeight:'700'}}>
            {isLive ? '● Live' : '✓ Terminé'}
          </div>
        </div>
      </div>

      {/* Score */}
      <div style={{background:'#1a5c40',borderRadius:'12px',padding:'1.5rem',color:'#fff',marginBottom:'1rem'}}>
        {['a','b'].map(p => {
          const name = p === 'a' ? score.playerA : score.playerB;
          const pts = p === 'a' ? score.labelA : score.labelB;
          const isServing = score.serving === p && isLive;
          const isWinner = isFinished && match.winner === p;
          return (
            <div key={p} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:p==='a'?'1px solid rgba(255,255,255,0.15)':'none'}}>
              <span style={{fontSize:'10px',color:'#f5c518',opacity:isServing?1:0}}>●</span>
              <span style={{flex:1,fontSize:'18px',fontWeight:isWinner?'800':'500'}}>{name}</span>
              <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                {(match.sets||[]).map((s,i) => (
                  <span key={i} style={{width:'24px',height:'24px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'700',borderRadius:'4px',background:s[p]>s[p==='a'?'b':'a']?'rgba(255,255,255,0.3)':'transparent'}}>
                    {s[p]}
                  </span>
                ))}
                <span style={{width:'32px',height:'32px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:'700',background:'rgba(255,255,255,0.2)',borderRadius:'6px'}}>
                  {score.games[p]}
                </span>
                {isLive && (
                  <span style={{width:'44px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'700',background:pts==='Avantage'?'#f5c518':'rgba(255,255,255,0.15)',borderRadius:'4px',color:pts==='Avantage'?'#333':'#fff'}}>
                    {pts}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div style={{marginTop:'12px',display:'flex',justifyContent:'center',gap:'2rem',fontSize:'12px',opacity:0.7}}>
          <span>Sets : {setsWon.a}–{setsWon.b}</span>
          <span>Jeux : {match.games?.a||0}–{match.games?.b||0}</span>
        </div>
      </div>

      {/* Bouton voix */}
      <div style={{display:'flex',justifyContent:'center',marginBottom:'1rem'}}>
        <button
          onClick={toggleVoice}
          style={{
            display:'flex',alignItems:'center',gap:'6px',
            padding:'6px 18px',
            border: voiceEnabled ? '1px solid #1D9E75' : '1px solid #ddd',
            borderRadius:'20px',
            background: voiceEnabled ? '#f0fdf9' : '#fafafa',
            color: voiceEnabled ? '#0F6E56' : '#888',
            fontSize:'13px',fontWeight:'500',
            cursor:'pointer',fontFamily:'inherit',
            transition:'all 0.15s',
          }}
        >
          {voiceEnabled ? '🔊 Voix activée' : '🔇 Voix désactivée'}
        </button>
      </div>

      {/* Confirmation résultat pour le joueur */}
      {isOwner && isFinished && !match.confirmed && (
        <div style={{background:'#fff',border:'2px solid #1D9E75',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem',textAlign:'center'}}>
          <div style={{fontSize:'16px',fontWeight:'700',marginBottom:'6px'}}>Match terminé !</div>
          <div style={{fontSize:'14px',color:'#666',marginBottom:'12px'}}>
            Résultat : {score.playerA} {setsWon.a} – {setsWon.b} {score.playerB}
          </div>
          <button
            onClick={confirmResult}
            style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
          >
            ✓ Confirmer ce résultat
          </button>
        </div>
      )}

      {/* Demande de notation pour spectateur */}
      {!isOwner && isLive && user && !isApprovedScorer && (
        <div style={{background:'#fff',border:'1px solid #E8E8E8',borderRadius:'12px',padding:'1.25rem',marginBottom:'1rem',textAlign:'center'}}>
          <div style={{fontSize:'15px',fontWeight:'600',marginBottom:'6px'}}>Tu veux noter ce match ?</div>
          <div style={{fontSize:'13px',color:'#888',marginBottom:'12px'}}>
            Une demande sera envoyée au joueur. Il devra accepter.
          </div>
          {requestSent ? (
            <div style={{padding:'10px',background:'#E8F5F0',borderRadius:'8px',color:'#0F6E56',fontSize:'14px',fontWeight:'500'}}>
              ⏳ Demande envoyée — en attente d'acceptation
            </div>
          ) : (
            <button
              onClick={requestScoring}
              style={{width:'100%',padding:'12px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'8px',fontSize:'15px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
            >
              📝 Demander à noter ce match
            </button>
          )}
        </div>
      )}

      {/* Mode notation approuvé */}
      {isApprovedScorer && isLive && (
        <ScorerMode matchId={matchId} match={match} />
      )}

      {/* Encouragements */}
      <LiveChat
        matchId={matchId}
        playerName={score.playerA}
        spectatorName={profile?.name || 'Spectateur'}
        isPlayer={isOwner}
      />
    </div>
  );
}

function ScorerMode({ matchId, match }) {
  const score = getScore(match);

  async function addPoint(player) {
    const { addPoint: addPt } = await import('../utils/tennisLogic');
    const updated = addPt(match, player);
    const { history, ...toSave } = updated;
    await set(ref(db, 'matches/' + matchId), toSave);
  }

  async function undoPoint() {
    const { undoPoint: undoPt } = await import('../utils/tennisLogic');
    const restored = undoPt(match);
    const { history, ...toSave } = restored;
    await set(ref(db, 'matches/' + matchId), toSave);
  }

  return (
    <div style={{background:'#1a5c40',borderRadius:'12px',padding:'1rem',marginBottom:'1rem'}}>
      <div style={{color:'#fff',fontSize:'13px',fontWeight:'600',marginBottom:'10px',textAlign:'center',opacity:0.8}}>
        Mode marqueur actif
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
        <button
          onClick={() => addPoint('a')}
          style={{flex:1,padding:'14px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'16px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
        >
          {score.playerA.split(' ')[0]} ▶
        </button>
        <button
          onClick={() => addPoint('b')}
          style={{flex:1,padding:'14px',background:'#2563EB',color:'#fff',border:'none',borderRadius:'10px',fontSize:'16px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}
        >
          {score.playerB.split(' ')[0]} ▶
        </button>
      </div>
      <button
        onClick={undoPoint}
        style={{width:'100%',padding:'10px',background:'rgba(255,255,255,0.15)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'14px',cursor:'pointer',fontFamily:'inherit'}}
      >
        ↩ Annuler dernier point
      </button>
    </div>
  );
}