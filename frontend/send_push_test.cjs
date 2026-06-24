const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

let keys;
try {
  keys = JSON.parse(fs.readFileSync(path.join(__dirname, 'vapid_keys.json'), 'utf8'));
} catch (e) {
  console.log('\n❌ ERROR: VAPID keys not found. Please run "node generate_vapid.cjs" first to create keys.\n');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:support@navicareer.com',
  keys.publicKey,
  keys.privateKey
);

// ==========================================
// PASTE THE SUBSCRIPTION OBJECT FROM YOUR PHONE/BROWSER HERE:
// ==========================================
const testSubscription = {
  "endpoint": "https://fcm.googleapis.com/fcm/send/fos0NrMMC2g:APA91bFmn6kr0bw8z-91vEn3kWrcy3PgoHXIbZ3VWA1wPJRlJgrwMelLuHpZ7PEHR0IbmNlqfjKOClG2Zy6k056iKHNaP0TvG6-Q-ZQoq6b8VoBBDL7B3JNSsFI2Wl5xgtnokknl2lzb",
  "expirationTime": null,
  "keys": {
    "p256dh": "BCkXckZCafwa9bTNAy6jcrl72OXG-X2MLaMRjs_xxgVkcP1Sym9qVQDaXD47dv8lAArwRtPujwBDBjNbPJx0yg4",
    "auth": "XnxUUBMFEWLlodEh3P4SJw"
  }
};

if (testSubscription.endpoint === 'PASTE_ENDPOINT_URL_HERE') {
  console.log('\n👉 INSTRUCTION: Open this script and paste your browser\'s PushSubscription object in the "testSubscription" variable, then run this script again.\n');
  process.exit(0);
}

const payload = JSON.stringify({
  title: '🚀 Hello from NaviCareer!',
  body: 'This is a live test push notification sent from your backend script!',
  url: '/dashboard'
});

console.log('Sending push notification...');

webpush.sendNotification(testSubscription, payload)
  .then(() => {
    console.log('\n🎉 SUCCESS: Push notification sent successfully! Check your device.');
  })
  .catch(err => {
    console.error('\n❌ ERROR sending push notification:', err);
  });
