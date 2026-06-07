importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyC7eNguFJhBniVjqVlU1DGSUkjWBCBIP88",
  authDomain: "safeher-a0b8d.firebaseapp.com",
  projectId: "safeher-a0b8d",
  storageBucket: "safeher-a0b8d.firebasestorage.app",
  messagingSenderId: "1032455116409",
  appId: "1:1032455116409:web:c6caffee8a7025a148e6a8"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Background message:', payload)
  const { title, body, icon } = payload.notification || {}
  self.registration.showNotification(title || 'SafeHer Alert', {
    body: body || 'You have a new safety alert',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: payload.data,
    actions: [
      { action: 'view', title: 'View Alert' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'view') {
    clients.openWindow('/dashboard/home')
  }
})
