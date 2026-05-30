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
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (Notification.permission === 'denied') return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const msg = getMsg();
    const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (token) {
      await set(ref(db, `users/${uid}/fcmToken`), token);
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
    console.error('[FCM] init error:', err);
  }
}

export async function sendPushToUser(targetUid, title, body) {
  try {
    const snap = await get(ref(db, `users/${targetUid}/fcmToken`));
    if (!snap.exists()) return;

    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: snap.val(), title, body }),
    });
  } catch (err) {
    console.error('[FCM] send error:', err);
  }
}
