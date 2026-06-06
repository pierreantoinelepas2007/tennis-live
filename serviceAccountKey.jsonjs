
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCYhL2C0r3XruBINbZvySebqjg7VtmUWG8",
  authDomain: "tennis-live-2b8fc.firebaseapp.com",
  projectId: "tennis-live-2b8fc",
  storageBucket: "tennis-live-2b8fc.firebasestorage.app",
  messagingSenderId: "641195382973",
  appId: "1:641195382973:web:fe36e318b38a8de2b83fd4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
  });
});