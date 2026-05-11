# 🎾 TennisLive

Score tennis en direct, partageable avec tes proches.  
Encouragements en temps réel · Historique · Classement AFT

---

## Stack

- **React + Vite** — frontend
- **Firebase Realtime Database** — score live + messagerie temps réel
- **Firebase Auth** — connexion Google
- **Render** — hébergement

---

## Setup (15 minutes)

### 1. Firebase

1. Va sur [console.firebase.google.com](https://console.firebase.google.com)
2. Crée un projet → "tennis-live" (ou le nom que tu veux)
3. Active **Authentication** → Sign-in method → Google
4. Active **Realtime Database** → mode test pour commencer
5. Dans les règles de la base, colle le contenu de `firebase.rules.json`
6. Dans Paramètres du projet → Tes applications → Ajouter une app Web
7. Copie la config Firebase

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Remplis `.env.local` avec ta config Firebase :

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=ton-projet.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://ton-projet-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=ton-projet
VITE_FIREBASE_STORAGE_BUCKET=ton-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Lancer en local

```bash
npm install
npm run dev
```

L'app tourne sur http://localhost:3000

### 4. Déployer sur Render

1. Push le projet sur GitHub
2. Va sur [render.com](https://render.com) → New → Static Site
3. Connecte ton repo GitHub
4. **Build command** : `npm install && npm run build`
5. **Publish directory** : `dist`
6. Sous "Environment Variables", ajoute toutes les variables `VITE_*` de ton `.env.local`
7. Clique Deploy → ton site est en ligne !

---

## Structure du projet

```
src/
├── contexts/
│   └── AuthContext.jsx      ← gestion auth + profil utilisateur
├── components/
│   ├── Navbar.jsx            ← navigation
│   ├── LiveChat.jsx          ← messagerie encouragements (⭐ feature principale)
│   └── AFTImport.jsx         ← import profil Tennis Wallonie-Bruxelles
├── pages/
│   ├── Home.jsx              ← accueil
│   ├── Login.jsx             ← connexion Google
│   ├── CreateMatch.jsx       ← création de match
│   ├── ScoreMatch.jsx        ← score live (joueur)
│   ├── WatchMatch.jsx        ← vue spectateur publique
│   ├── History.jsx           ← historique + stats
│   ├── Profile.jsx           ← profil + import AFT
│   └── Rankings.jsx          ← classement club
└── utils/
    └── tennisLogic.js        ← moteur de calcul tennis
```

---

## Fonctionnalités

### Score live
- Calcul automatique complet : 0/15/30/40, égalité, avantage, jeux, sets, tie-break
- Changement de serveur automatique
- Undo (annuler le dernier point)
- Sauvegarde temps réel sur Firebase

### Page spectateur
- Lien public partageable : `tennislive.app/watch/MATCH_ID`
- Score mis à jour instantanément (Realtime DB)
- Pas besoin de compte pour suivre un match

### Messagerie d'encouragement ⭐
- Les spectateurs envoient des messages pendant le match
- Le joueur voit une popup sur son écran avec le message
- Messages rapides pré-définis (boutons)
- Historique du chat dans la page spectateur

### Profil AFT
- Import du numéro AFT depuis Tennis Wallonie-Bruxelles
- Classement, club, catégorie
- Évolution du classement

### Historique
- Tous les matchs sauvegardés
- Statistiques : bilan, win rate, sets
- Durée des matchs

---

## Roadmap

- [ ] Notification push quand un proche envoie un message
- [ ] Intégration API officielle AFT (si partenariat)
- [ ] Mode tournoi (bracket)
- [ ] App mobile (React Native ou PWA)
- [ ] Classement inter-clubs

---

## Licence

MIT — fais-en ce que tu veux.
