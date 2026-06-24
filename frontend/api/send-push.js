import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// These are set as Vercel Environment Variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, url } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and Body are required.' });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: 'VAPID keys are not configured in Vercel environment variables.' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase URL or Service Role Key not configured in Vercel environment variables.' });
  }

  webpush.setVapidDetails(
    'mailto:support@navicareer.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );

  // Use service role key to bypass RLS and read ALL subscriptions
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
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
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Removing expired subscription: ${row.id}`);
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('id', row.id);
        } else {
          console.error(`Error sending push to user ${row.user_id}:`, err.message);
        }
      }
    });

    await Promise.all(sendPromises);

    res.status(200).json({
      sentCount,
      message: `Successfully sent notification to ${sentCount} devices.`
    });
  } catch (err) {
    console.error('Push dispatch failed:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error.' });
  }
}
