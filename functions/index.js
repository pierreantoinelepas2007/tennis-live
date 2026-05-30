const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

exports.notify = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    res.status(400).json({ error: "token, title et body sont requis." });
    return;
  }

  try {
    const messageId = await admin.messaging().send({
      token,
      notification: { title, body },
      webpush: {
        notification: { icon: "/logo.png" },
      },
    });
    res.json({ success: true, messageId });
  } catch (err) {
    console.error("[FCM]", err.message);
    res.status(500).json({ error: err.message });
  }
});
