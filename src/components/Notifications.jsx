import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, 'users/' + user.uid + '/notifications'), snap => {
      if (!snap.exists()) { setNotifs([]); return; }
      const all = Object.entries(snap.val()).map(([id, n]) => ({ id, ...n }));
      setNotifs(all.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, [user]);

  async function acceptScorer(notif) {
    // Approuver le marqueur
    await set(ref(db, 'matches/' + notif.matchId + '/scorer'), {
      uid: notif.fromUid,
      name: notif.from,
      approved: true,
      approvedAt: Date.now(),
    });
    // Marquer notif comme lue
    await update(ref(db, 'users/' + user.uid + '/notifications/' + notif.id), { read: true, accepted: true });
    setShow(false);
  }

  async function refuseScorer(notif) {
    await update(ref(db, 'users/' + user.uid + '/notifications/' + notif.id), { read: true, refused: true });
  }

  const unread = notifs.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <div style={{position:'relative'}}>
      <button
        onClick={() => setShow(!show)}
        style={{background:'none',border:'1px solid #E8E8E8',borderRadius:'6px',padding:'5px 10px',fontSize:'16px',cursor:'pointer',position:'relative'}}
      >
        🔔
        {unread > 0 && (
          <span style={{position:'absolute',top:'-4px',right:'-4px',background:'#E8192C',color:'#fff',borderRadius:'50%',width:'16px',height:'16px',fontSize:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700'}}>
            {unread}
          </span>
        )}
      </button>

      {show && (
        <div style={{position:'absolute',right:0,top:'40px',background:'#fff',border:'1px solid #E8E8E8',borderRadius:'10px',width:'300px',boxShadow:'0 4px 20px rgba(0,0,0,0.12)',zIndex:200}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid #E8E8E8',fontWeight:'600',fontSize:'14px'}}>
            Notifications {unread > 0 && <span style={{color:'#E8192C'}}>({unread})</span>}
          </div>
          {notifs.length === 0 ? (
            <div style={{padding:'20px',textAlign:'center',color:'#aaa',fontSize:'13px'}}>
              Aucune notification
            </div>
          ) : (
            notifs.slice(0, 10).map(notif => (
              <div key={notif.id} style={{padding:'12px 14px',borderBottom:'1px solid #f5f5f5',background:notif.read?'#fff':'#f5fdf9'}}>
                <div style={{fontSize:'13px',fontWeight:'500',color:'#111',marginBottom:'6px'}}>
                  {notif.message}
                </div>
                <div style={{fontSize:'11px',color:'#aaa',marginBottom:'8px'}}>
                  {new Date(notif.createdAt).toLocaleDateString('fr-BE')}
                </div>
                {notif.type === 'scorer_request' && !notif.read && (
                  <div style={{display:'flex',gap:'6px'}}>
                    <button
                      onClick={() => acceptScorer(notif)}
                      style={{flex:1,padding:'7px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'6px',fontSize:'13px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
                    >
                      ✓ Accepter
                    </button>
                    <button
                      onClick={() => refuseScorer(notif)}
                      style={{flex:1,padding:'7px',background:'#f5f5f5',color:'#666',border:'none',borderRadius:'6px',fontSize:'13px',cursor:'pointer',fontFamily:'inherit'}}
                    >
                      ✗ Refuser
                    </button>
                  </div>
                )}
                {notif.type === 'scorer_request' && notif.accepted && (
                  <div style={{fontSize:'12px',color:'#1D9E75',fontWeight:'500'}}>✓ Accepté</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}