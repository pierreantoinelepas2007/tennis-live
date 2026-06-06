import { getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { ref, set, get } from 'firebase/database';
import { db } from '../firebase';

const VAPID_KEY = 'BNMpkR1UXI3dNOi5Sb6YOTZaIK98_228cWAEMQO66keMyqnazYVzf2M41jp-ofS2qBeJ0TgOsSUlin8vuDrbOS8';

let messaging = null;
let foregroundListenerSet = false;

function getMsg() {
  if (!messaging) messaging = getMessaging(getApp());
  return messaging;
}

export async function initNotifications(uid) {
  alert('étape 1 : début initNotifications');
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    alert('étape 1 STOP : Notification ou serviceWorker non supporté');
    return;
  }
  alert('étape 2 : permission = ' + Notification.permission);
  if (Notification.permission === 'denied') {
    alert('étape 2 STOP : permission refusée');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('étape 3 STOP : permission non accordée (' + permission + ')');
      return;
    }
    alert('étape 3 : permission accordée');

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    alert('étape 4 : service worker enregistré');

    const msg = getMsg();
    const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    alert('étape 5 : token = ' + (token || '(vide)'));
    console.log('[FCM] token obtenu :', token || '(vide)');

    if (token) {
      await set(ref(db, `users/${uid}/fcmToken`), token);
      console.log('[FCM] token sauvegardé dans Firestore pour uid :', uid);
    } else {
      console.warn('[FCM] aucun token — vérifier VAPID_KEY ou les permissions');
    }

    if (!foregroundListenerSet) {
      onMessage(msg, ({ notification }) => {
        if (!notification) return;
        new Notification(notification.title, {
          body: notification.body,
          icon: '/logo.png',
        });
      });
      foregroundListenerSet = true;
    }
  } catch (err) {
    alert('ERREUR : ' + err.message);
    console.error('[FCM] init error:', err);
  }
}

const NOTIFY_URL = 'https://railway-init-production-f1ae.up.railway.app/api/notify';

export async function sendPushToUser(targetUid, title, body) {
  try {
    const snap = await get(ref(db, `users/${targetUid}/fcmToken`));
    if (!snap.exists()) {
      console.warn('[FCM] sendPushToUser — aucun token pour uid :', targetUid);
      return;
    }
    const token = snap.val();
    console.log('[FCM] sendPushToUser — token cible :', token);

    const res = await fetch(NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body }),
    });
    const data = await res.json().catch(() => null);
    console.log('[FCM] réponse Railway :', res.status, data);
  } catch (err) {
    console.error('[FCM] send error:', err);
  }
}
