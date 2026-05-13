import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop navbar */}
      <nav className={styles.nav}>
        <div className={styles.logo} onClick={() => navigate('/')}>
          <span className={styles.logoIcon}>🎾</span>
          <span className={styles.logoText}>TennisLive</span>
        </div>
        <div className={styles.links}>

          <NavLink to="/club" className={({ isActive }) => isActive ? styles.linkActive : styles.link}>Club</NavLink>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.linkActive : styles.link}>En direct</NavLink>
          <NavLink to="/players" className={({ isActive }) => isActive ? styles.linkActive : styles.link}>Joueurs</NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? styles.linkActive : styles.link}>Historique</NavLink>
          <NavLink to="/rankings" className={({ isActive }) => isActive ? styles.linkActive : styles.link}>Classement</NavLink>
        </div>
        <div className={styles.right}>
          {user ? (
            <div className={styles.userMenu}>
              <NavLink to="/profile">
                <img
                  src={profile?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'U')}&background=1D9E75&color=fff`}
                  alt="profil"
                  className={styles.avatar}
                />
              </NavLink>
              <button className={styles.logout} onClick={logout}>Déco</button>
            </div>
          ) : (
            <NavLink to="/login" className={styles.loginBtn}>Se connecter</NavLink>
          )}
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <nav className={styles.mobileNav}>
        <NavLink to="/" end className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <span className={styles.mobileIcon}>📡</span>
          <span className={styles.mobileLabel}>Direct</span>
        </NavLink>
        <NavLink to="/players" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <span className={styles.mobileIcon}>👥</span>
          <span className={styles.mobileLabel}>Joueurs</span>
        </NavLink>
        <NavLink to="/match/new" className={({ isActive }) => `${styles.mobileLink} ${styles.mobileLinkNew} ${isActive ? styles.mobileLinkActive : ''}`}>
          <span className={styles.mobileNewBtn}>🎾</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <span className={styles.mobileIcon}>📊</span>
          <span className={styles.mobileLabel}>Historique</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <span className={styles.mobileIcon}>👤</span>
          <span className={styles.mobileLabel}>Profil</span>
        </NavLink>
      </nav>
    </>
  );
}