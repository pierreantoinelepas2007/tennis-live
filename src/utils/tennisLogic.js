export const POINT_LABELS = ['0', '15', '30', '40'];

export function getPointLabel(pts, i, otherPts) {
  if (pts >= 3 && otherPts >= 3) {
    if (pts === otherPts) return 'Égalité';
    return pts > otherPts ? 'Avantage' : '40';
  }
  return POINT_LABELS[pts] ?? '40';
}

export function createMatch({ playerA, playerB, surface, format = 3 }) {
  return {
    playerA, playerB, surface, format,
    sets: [], games: { a: 0, b: 0 }, points: { a: 0, b: 0 },
    serving: 'a', status: 'live', winner: null,
    totalPoints: 0, history: [],
    startedAt: Date.now(), updatedAt: Date.now(),
  };
}

export function addPoint(match, player) {
  const safeHistory = Array.isArray(match.history) ? match.history : [];
  const snapshot = JSON.parse(JSON.stringify(match));
  snapshot.history = [];
  const newMatch = JSON.parse(JSON.stringify(match));
  newMatch.history = [...safeHistory, snapshot];
  newMatch.totalPoints = (newMatch.totalPoints || 0) + 1;
  newMatch.updatedAt = Date.now();
  const other = player === 'a' ? 'b' : 'a';
  const pts = newMatch.points;
  let gameWon = false;
  if (pts.a >= 3 && pts.b >= 3) {
    if (pts[player] > pts[other]) gameWon = true;
    else pts[player]++;
  } else if (pts[player] === 3) {
    gameWon = true;
  } else {
    pts[player]++;
  }
  if (gameWon) {
    pts.a = 0; pts.b = 0;
    newMatch.games[player]++;
    newMatch.serving = newMatch.serving === 'a' ? 'b' : 'a';
    const g = newMatch.games;
    const setWon = (g.a >= 6 || g.b >= 6) && Math.abs(g.a - g.b) >= 2;
    const tieBreakWon = (g.a === 7 || g.b === 7);
    if (setWon || tieBreakWon) {
      newMatch.sets = [...(newMatch.sets || []), { a: g.a, b: g.b }];
      newMatch.games = { a: 0, b: 0 };
      const setsNeeded = Math.ceil(newMatch.format / 2);
      const setsA = newMatch.sets.filter(s => s.a > s.b).length;
      const setsB = newMatch.sets.filter(s => s.b > s.a).length;
      if (setsA >= setsNeeded || setsB >= setsNeeded) {
        newMatch.status = 'finished';
        newMatch.winner = setsA >= setsNeeded ? 'a' : 'b';
      }
    }
  }
  return newMatch;
}

export function undoPoint(match) {
  const safeHistory = Array.isArray(match.history) ? match.history : [];
  if (safeHistory.length === 0) return match;
  const history = [...safeHistory];
  const previous = history.pop();
  previous.history = history;
  return previous;
}

export function getScore(match) {
  const { points, games, sets, serving, playerA, playerB } = match;
  return {
    labelA: getPointLabel(points.a, 'a', points.b),
    labelB: getPointLabel(points.b, 'b', points.a),
    games, sets: sets || [], serving, playerA, playerB,
  };
}

export function getSetsWon(match) {
  if (!match || !match.sets) return { a: 0, b: 0 };
  return {
    a: match.sets.filter(s => s.a > s.b).length,
    b: match.sets.filter(s => s.b > s.a).length,
  };
}

export function formatScore(match) {
  if (!match.sets || match.sets.length === 0) return '';
  return match.sets.map(s => `${s.a}-${s.b}`).join(', ');
}