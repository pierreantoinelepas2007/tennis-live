export const BADGES = [
  { id: 'first_match', icon: '🎾', name: 'Premier match', desc: 'Tu as joué ton premier match', check: (stats) => stats.total >= 1 },
  { id: 'first_win', icon: '🏆', name: 'Première victoire', desc: 'Tu as gagné ton premier match', check: (stats) => stats.wins >= 1 },
  { id: 'ten_matches', icon: '💪', name: '10 matchs', desc: 'Tu as joué 10 matchs', check: (stats) => stats.total >= 10 },
  { id: 'five_wins', icon: '⭐', name: '5 victoires', desc: 'Tu as gagné 5 matchs', check: (stats) => stats.wins >= 5 },
  { id: 'win_streak_3', icon: '🔥', name: 'En feu', desc: '3 victoires consécutives', check: (stats) => stats.streak >= 3 },
  { id: 'perfect_set', icon: '💎', name: 'Set parfait', desc: 'Tu as gagné un set 6-0', check: (stats) => stats.perfectSet },
  { id: 'social', icon: '📡', name: 'Star du court', desc: '5 encouragements reçus', check: (stats) => stats.encouragements >= 5 },
  { id: 'versatile', icon: '🌍', name: 'All surfaces', desc: 'Joué sur 3 surfaces différentes', check: (stats) => stats.surfaces >= 3 },
  { id: 'twenty_five_matches', icon: '🎖️', name: 'Vétéran', desc: '25 matchs joués', check: (stats) => stats.total >= 25 },
  { id: 'champion', icon: '👑', name: 'Champion', desc: '50 victoires', desc2: '', check: (stats) => stats.wins >= 50 },
];

export function computeStats(matches) {
  const finished = matches.filter(m => m.status === 'finished');
  const wins = finished.filter(m => m.winner === 'a');
  const losses = finished.filter(m => m.winner === 'b');
  const surfaces = new Set(finished.map(m => m.surface)).size;
  const perfectSet = finished.some(m => (m.sets || []).some(s => s.a === 6 && s.b === 0));

  let streak = 0;
  let maxStreak = 0;
  for (const m of [...finished].reverse()) {
    if (m.winner === 'a') { streak++; maxStreak = Math.max(maxStreak, streak); }
    else streak = 0;
  }

  return {
    total: finished.length,
    wins: wins.length,
    losses: losses.length,
    streak: maxStreak,
    perfectSet,
    surfaces,
    encouragements: 0,
  };
}

export function getEarnedBadges(matches) {
  const stats = computeStats(matches);
  return BADGES.filter(b => b.check(stats));
}