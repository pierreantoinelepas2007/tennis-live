import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'12px',padding:'2rem',textAlign:'center'}}>
      <div style={{fontSize:'60px'}}>🎾</div>
      <h1 style={{fontSize:'28px',fontWeight:'800',color:'#111',letterSpacing:'-1px'}}>Page introuvable</h1>
      <p style={{fontSize:'15px',color:'#888',maxWidth:'320px',lineHeight:'1.6'}}>Cette page n'existe pas ou a été supprimée.</p>
      <button
        onClick={() => navigate('/')}
        style={{marginTop:'8px',padding:'12px 28px',background:'#1D9E75',color:'#fff',border:'none',borderRadius:'10px',fontSize:'15px',fontWeight:'600',cursor:'pointer',fontFamily:'inherit'}}
      >
        Retour à l'accueil
      </button>
    </div>
  );
}