import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Home.module.css';

export default function Home() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>🎾</div>
          <h1 className={styles.heroTitle}>TennisLive</h1>
          <p className={styles.heroSub}>
            Score en direct · Encouragements de tes proches · Historique · Classement AFT
          </p>
          <button className={styles.heroBtn} onClick={() => navigate('/login')}>
            Commencer gratuitement →
          </button>
          <div className={styles.features}>
            <div className={styles.feature}>
              <span>📡</span>
              <span>Score live partageable</span>
            </div>
            <div className={styles.feature}>
              <span>💬</span>
              <span>Messages d'encouragement en temps réel</span>
            </div>
            <div className={styles.feature}>
              <span>📊</span>
              <span>Stats et historique</span>
            </div>
            <div className={styles.feature}>
              <span>🏆</span>
              <span>Classement AFT intégré</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.welcome}>
        <h1>Bonjour, {profile?.name?.split(' ')[0] || 'joueur'} 👋</h1>
        <p className={styles.welcomeSub}>Prêt à jouer ?</p>
      </div>

      <button className={styles.bigBtn} onClick={() => navigate('/match/new')}>
        <span className={styles.bigBtnIcon}>🎾</span>
        <span>
          <strong>Nouveau match</strong>
          <span className={styles.bigBtnSub}>Score live + partage instantané</span>
        </span>
      </button>

      <div className={styles.quickLinks}>
        <div className={styles.quickCard} onClick={() => navigate('/history')}>
          <div className={styles.quickIcon}>📊</div>
          <div className={styles.quickLabel}>Historique</div>
        </div>
        <div className={styles.quickCard} onClick={() => navigate('/rankings')}>
          <div className={styles.quickIcon}>🏆</div>
          <div className={styles.quickLabel}>Classement</div>
        </div>
        <div className={styles.quickCard} onClick={() => navigate('/profile')}>
          <div className={styles.quickIcon}>👤</div>
          <div className={styles.quickLabel}>Profil AFT</div>
        </div>
      </div>
    </div>
  );
}
