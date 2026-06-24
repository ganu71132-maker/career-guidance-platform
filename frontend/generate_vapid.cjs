const fs = require('fs');
const path = require('path');

try {
  const webpush = require('web-push');
  const vapidKeys = webpush.generateVAPIDKeys();

  console.log('\n==================================================');
  console.log('🎉 SUCCESS: VAPID Keys Generated Successfully!');
  console.log('==================================================\n');
  console.log('👉 PUBLIC KEY (Put this in your Frontend usePWA hook):');
  console.log(vapidKeys.publicKey);
  console.log('\n👉 PRIVATE KEY (Keep this secure in your Server env):');
  console.log(vapidKeys.privateKey);
  console.log('\n==================================================\n');

  const keysPath = path.join(__dirname, 'vapid_keys.json');
  fs.writeFileSync(keysPath, JSON.stringify(vapidKeys, null, 2));
  console.log(`Saved keys to: ${keysPath}`);

} catch (err) {
  if (err.code === 'MODULE_NOT_FOUND') {
    console.log('\n❌ ERROR: "web-push" library is not installed.');
    console.log('Please run: npm install web-push\n');
  } else {
    console.error(err);
  }
}
