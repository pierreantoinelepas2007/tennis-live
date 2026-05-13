import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { addPoint, getScore, getSetsWon, formatScore } from '../utils/tennisLogic';
import LiveChat from '../components/LiveChat';
import styles from './ScoreMatch.module.css';

export default function ScoreMatch() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [localHistory, setLocalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  const shareUrl = window.location.origin + '/watch/' + matchId;

  useEffect(() => {
    const matchRef = ref(db, 'matches/' + matchId);
    const unsub = onValue(matchRef, (snap) => {
      if (snap.exists()) setMatch(snap.val());
      setLoading(false);
    });
    return unsub;
  }, [matchId]);

  async function saveMatch(updatedMatch) {
    setSaving(true);
    try {
      const { history, ...toSave } = updatedMatch;
      await set(ref(db, 'matches/' + matchId), toSave);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  }

  async function handlePoint(player) {
    if (!match || match.status === 'finished') return;
    const snapshot = JSON.parse(JSON.stringify(match));
    setLocalHistory(prev => [...prev, snapshot]);
    const updated = addPoint(match, player);
    setMatch(updated);
    await saveMatch(updated);
    if (updated.status === 'finished') {
      const winnerName = updated.winner === 'a' ? updated.playerA : updated.playerB;
      setTimeout(() => {
        alert('Match termine ! Victoire de ' + winnerName + ' (' + formatScore(updated) + ')');
      }, 300);
    }
  }

  async function handleUndo() {
    if (localHistory.length === 0) return;
    const history = [...localHistory];
    const previous = history.pop();
    setLocalHistory(history);
    setMatch(previous);
    await saveMatch(previous);
  }

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  }

  if (loading) return <div className={styles.loading}>Chargement du match</div>;
  if (!match) return <div className={styles.loading}>Match introuvable.</div>;

  const score = getScore(match);
  const setsWon = getSetsWon(match);
  const waText = encodeURIComponent('Suis mon match en direct\n' + shareUrl);
  const smsText = encodeURIComponent('Suis mon match ' + shareUrl);

  return (
    <div className={styles.page}>
      <div className={styles.matchCard}>
        <div className={styles.matchHeader}>
          <div className={styles.headerLeft}>
            <span className={match.status === 'live' ? styles.liveBadge : styles.finishedBadge}>
              {match.status === 'live' ? '● Live' : 'Termine'}
            </span>
            <span className={styles.surface}>{match.surface}</span>
          </div>
          <span className={styles.setInfo}>Set {(match.sets || []).length + 1}</span>
          {saving && <span className={styles.saving}>...</span>}
        </div>

        <div className={styles.scoreBoard}>
          {['a', 'b'].map(p => {
            const name = p === 'a' ? score.playerA : score.playerB;
            const pointLabel = p === 'a' ? score.labelA : score.labelB;
            const isServing = score.serving === p;
            const isAdvantage = pointLabel === 'Avantage';
            return (
              <div key={p} className={isAdvantage ? styles.playerRow + ' ' + styles.advantage : styles.playerRow}>
                <div className={styles.serveIndicator}>
                  {isServing && <span className={styles.serveBall}>●</span>}
                </div>
                <span className={styles.playerName}>{name}</span>
                <div className={styles.pastSets}>
                  {(match.sets || []).map((s, i) => {
                    const myGames = s[p];
                    const oppGames = s[p === 'a' ? 'b' : 'a'];
                    return (
                      <span key={i} className={myGames > oppGames ? styles.setWon : styles.setLost}>
                        {myGames}
                      </span>
                    );
                  })}
                </div>
                <div className={isServing ? styles.currentGames + ' ' + styles.currentGamesServing : styles.currentGames}>
                  {score.games[p]}
                </div>
                <div className={isAdvantage ? styles.pointScore + ' ' + styles.pointScoreAdv : isServing ? styles.pointScore + ' ' + styles.pointScoreServing : styles.pointScore}>
                  {pointLabel}
                </div>
              </div>
            );
          })}
        </div>

        {match.status === 'live' && (
          <div className={styles.controls}>
            <button className={styles.pointBtn + ' ' + styles.pointBtnA} onClick={() => handlePoint('a')}>
              <span className={styles.btnName}>{score.playerA.split(' ')[0]}</span>
              <span className={styles.btnSub}>Point</span>
            </button>
            <button className={styles.pointBtn + ' ' + styles.pointBtnB} onClick={() => handlePoint('b')}>
              <span className={styles.btnName}>{score.playerB.split(' ')[0]}</span>
              <span className={styles.btnSub}>Point</span>
            </button>
          </div>
        )}

        <button
          className={styles.undoBtn}
          onClick={handleUndo}
          disabled={localHistory.length === 0}
        >
          ↩ Annuler dernier point
        </button>

        <div className={styles.stats}>
          <span>Points : {match.totalPoints || 0}</span>
          <span>Sets : {setsWon.a} - {setsWon.b}</span>
          <span>Jeux : {(match.games && match.games.a) || 0} - {(match.games && match.games.b) || 0}</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/match/' + matchId + '/play')}
        style={{width:'100%',padding:'12px',background:'#1a5c40',color:'#fff',border:'none',borderRadius:'6px',fontSize:'15px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit',marginBottom:'8px'}}
      >
        Mode match plein ecran →
      </button>

      <div className={styles.shareCard}>
        <div className={styles.shareTitle}>Partager le score live</div>
        <p className={styles.shareDesc}>Tes proches peuvent suivre le match et envoyer des encouragements.</p>
        <div className={styles.shareRow}>
          <input className={styles.shareUrl} value={shareUrl} readOnly />
          <button className={styles.copyBtn} onClick={copyShareLink}>
            {shareToast ? 'Copie !' : 'Copier'}
          </button>
        </div>
        <div className={styles.shareActions}>
          <a href={'https://wa.me/?text=' + waText} target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
            WhatsApp
          </a>
          <a href={'sms:?body=' + smsText} className={styles.smsBtn}>
            SMS
          </a>
        </div>
      </div>

      <LiveChat matchId={matchId} playerName={score.playerA} spectatorName="Moi" isPlayer={true} />
    </div>
  );
}