const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const webpush = require('web-push');
const studyNotesRouter = require('./studyNotesRoutes');


const app = express();
app.use(cors());
app.use(express.json());

// 1. Load VAPID keys from frontend folder
let vapidKeys = null;
try {
  const keysPath = path.join(__dirname, '../frontend/vapid_keys.json');
  if (fs.existsSync(keysPath)) {
    vapidKeys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
  }
} catch (e) {
  console.error('VAPID keys file not found. Make sure you run node generate_vapid.cjs in frontend folder first!', e.message);
}

if (vapidKeys) {
  webpush.setVapidDetails(
    'mailto:support@navicareer.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('VAPID keys loaded successfully.');
} else {
  console.warn('⚠️ WARNING: Web Push details are not configured because VAPID keys were not found.');
}

// 2. Load Supabase Config from frontend/.env.local
let supabaseUrl = '';
let supabaseAnonKey = '';
try {
  const envPath = path.join(__dirname, '../frontend/.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
        if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
      }
    });
  }
} catch (e) {
  console.error('Failed to parse frontend/.env.local', e.message);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ WARNING: Supabase URL and Key are missing. Make sure frontend/.env.local is configured.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// 3. API Route to send notifications to all subscribed devices
app.post('/api/send-push', async (req, res) => {
  const { title, body, url } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and Body are required.' });
  }

  if (!vapidKeys) {
    return res.status(500).json({ error: 'Web Push details are not configured. Run node generate_vapid.cjs in the frontend first.' });
  }

  try {
    // Fetch all push subscriptions from the Supabase table
    const { data: subscriptions, error } = await supabase
      .from('user_push_subscriptions')
      .select('*');

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ sentCount: 0, message: 'No registered devices found.' });
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/dashboard'
    });

    let sentCount = 0;
    const sendPromises = subscriptions.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sentCount++;
      } catch (err) {
        // If the browser push service returns 404 (Not Found) or 410 (Gone), the subscription has expired or unsubscribed
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription: ${row.id} for user: ${row.user_id}`);
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('id', row.id);
        } else {
          console.error(`Error sending push notification to user ${row.user_id}:`, err.message);
        }
      }
    });

    // Wait for all push events to resolve
    await Promise.all(sendPromises);

    res.status(200).json({
      sentCount,
      message: `Successfully sent notification to ${sentCount} devices.`
    });
  } catch (err) {
    console.error('Push notifications dispatch failed:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error.' });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Push Notification Server is running on port ${PORT}`);
});
