const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// POST { token, title, body } → envoie notification FCM V1
exports.notify = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const { token, title, body } = req.body;
  if (!token || !title || !body) {
    res.status(400).json({ error: "token, title et body sont requis." });
    return;
  }

  try {
    const messageId = await admin.messaging().send({
      token,
      notification: { title, body },
      webpush: { notification: { icon: "/logo.png" } },
    });
    res.json({ success: true, messageId });
  } catch (err) {
    console.error("[FCM]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET ?q=nom&limit=15 → recherche joueurs TWB (AFTNet)
exports.searchPlayers = onRequest(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const q = (req.query.q || "").trim();
  const limit = Math.min(parseInt(req.query.limit) || 15, 50);

  if (q.length < 2) {
    res.status(400).json({ success: false, error: "Paramètre q requis (min 2 caractères)." });
    return;
  }

  try {
    const url = `https://resultats.aftnet.be/api/Players?name=${encodeURIComponent(q)}&take=${limit}`;
    const r = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "TennisLive/1.0" },
    });

    if (!r.ok) throw new Error(`AFT API ${r.status}`);
    const raw = await r.json();

    const players = (Array.isArray(raw) ? raw : raw.Players ?? []).map(p => ({
      aft_id: p.Id ?? p.UniqueIndex,
      name: `${p.FirstName ?? ""} ${p.LastName ?? ""}`.trim(),
      ranking: p.Ranking ?? "NC",
      club: p.Club ?? p.ClubName ?? "",
      birth_date: p.BirthDate ?? null,
      victories: p.Won ?? p.Victories ?? 0,
      defeats: p.Lost ?? p.Defeats ?? 0,
      points: p.Points ?? 0,
    }));

    res.json({ success: true, players });
  } catch (err) {
    console.error("[searchPlayers]", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
