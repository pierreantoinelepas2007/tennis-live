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
          <img src="/logo.png" alt="TennisLive" className={styles.logoImg} />
          <span className={styles.logoText}>TennisLive</span>
        </div>
        <div className={styles.links}>
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
                  src={profile?.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile?.name || 'U') + '&background=1D9E75&color=fff'}
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

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav}>
        <NavLink to="/" end className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
          <span className={styles.mobileLabel}>Direct</span>
        </NavLink>

        <NavLink to="/players" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span className={styles.mobileLabel}>Joueurs</span>
        </NavLink>

        <NavLink to="/match/new" className={({ isActive }) => `${styles.mobileLink} ${styles.mobileLinkNew} ${isActive ? styles.mobileLinkActive : ''}`}>
          <div className={styles.mobileNewBtn}>
            <img src="/logo.png" alt="+" style={{width:'26px',height:'26px',objectFit:'contain'}} />
          </div>
        </NavLink>

        <NavLink to="/history" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span className={styles.mobileLabel}>Historique</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`}>
          {user && profile?.photoURL ? (
            <img src={profile.photoURL} alt="" style={{width:'24px',height:'24px',borderRadius:'50%',objectFit:'cover',border:'2px solid currentColor'}} />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          )}
          <span className={styles.mobileLabel}>Profil</span>
        </NavLink>
      </nav>
    </>
  );
}