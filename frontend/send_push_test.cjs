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
  endpoint: "https://fcm.googleapis.com/fcm/send/dpFvS7n7q1g:APA91bGwW1Q555ITyK-Nb0hB4IGDGe7lQkZPgclYO92cTeXq2CrBtGFtOtCskE-pGNPv-hoA45jQyLiJIUVn-wwAz3niAcETiqk6m7drCBZm2ycq-kbFbUwlaG_qh4L5qOrquDZRYvvI",
  keys: {
    p256dh: "BK9KH4Dy6IJyvlj1gk7Nn_MLhYZxiwBBMBgjNwDJtglOYjyTYyI8BTMA8_ZPX69-7zJ3p298tO1qZZ5W_DDOAYk",
    auth: "xwflB8sM78KqXiceIsXxDg"
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
