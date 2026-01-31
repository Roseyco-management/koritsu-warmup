// Test webhook with proper Svix signature
const crypto = require('crypto');

// Read the webhook secret from env
require('dotenv').config({ path: '.env.local' });

const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || 'whsec_test_secret_for_local_testing';

// Generate Svix-compatible signature
function generateSvixSignature(payload, secret, timestamp) {
  const signedContent = `${timestamp}.${payload}`;

  // Remove the 'whsec_' prefix if present
  const secretBytes = secret.startsWith('whsec_') ? secret.slice(6) : secret;

  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  return signature;
}

async function testWebhookWithSignature() {
  try {
    console.log('Testing webhook with Svix signature...\n');
    console.log('Using webhook secret:', WEBHOOK_SECRET.substring(0, 15) + '...\n');

    // First, let's make sure we have warmup emails in the database
    console.log('Step 1: Checking/creating warmup emails in database...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      return;
    }

    // Create warmup emails if they don't exist
    const emailsToCheck = [
      { email: 'warmup@usekoritsu.com', domain: 'usekoritsu.com' },
      { email: 'warmup@bluepillar.co', domain: 'bluepillar.co' },
    ];

    for (const emailData of emailsToCheck) {
      const response = await fetch(`${supabaseUrl}/rest/v1/warmup_emails?email=eq.${emailData.email}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      const existing = await response.json();

      if (existing.length === 0) {
        console.log(`  Creating warmup email: ${emailData.email}`);
        await fetch(`${supabaseUrl}/rest/v1/warmup_emails`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            email: emailData.email,
            domain: emailData.domain,
            alias: emailData.email.split('@')[0],
            is_active: true,
          }),
        });
      } else {
        console.log(`  ✓ Email exists: ${emailData.email}`);
      }
    }

    console.log('\nStep 2: Sending webhook with proper Svix signature...\n');

    // Create webhook payload
    const payload = {
      type: 'email.received',
      created_at: new Date().toISOString(),
      data: {
        from: 'warmup@usekoritsu.com',
        to: 'warmup@bluepillar.co',
        subject: 'Webhook Test Email',
        text: 'This is a test email sent through the webhook with proper Svix signatures.',
        html: '<p>This is a test email sent through the webhook with proper Svix signatures.</p>',
        headers: {
          'message-id': `<webhook-test-${Date.now()}@usekoritsu.com>`,
        },
      },
    };

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000);
    const msgId = crypto.randomBytes(16).toString('hex');

    const signature = generateSvixSignature(body, WEBHOOK_SECRET, timestamp);

    console.log('Webhook Details:');
    console.log('  From:', payload.data.from);
    console.log('  To:', payload.data.to);
    console.log('  Subject:', payload.data.subject);
    console.log('  Message ID:', payload.data.headers['message-id']);
    console.log('\nSvix Headers:');
    console.log('  svix-id:', msgId);
    console.log('  svix-timestamp:', timestamp);
    console.log('  svix-signature: v1,' + signature.substring(0, 20) + '...');

    // Send request
    const response = await fetch('http://localhost:3000/api/webhooks/resend/warmup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'svix-id': msgId,
        'svix-timestamp': timestamp.toString(),
        'svix-signature': `v1,${signature}`,
      },
      body: body,
    });

    const result = await response.json();

    console.log('\n📥 Response Status:', response.status);
    console.log('📥 Response:', JSON.stringify(result, null, 2));

    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ Webhook processed successfully!');
      if (result.threadId) {
        console.log('📧 Thread ID:', result.threadId);
      }
    } else if (response.status === 400 && result.error === 'Webhook verification failed') {
      console.log('\n⚠️  Webhook signature verification failed.');
      console.log('This might be because the RESEND_WEBHOOK_SECRET in .env.local is a placeholder.');
      console.log('\nTo fix this:');
      console.log('1. Go to https://resend.com/webhooks');
      console.log('2. Create a webhook (or view existing one)');
      console.log('3. Copy the signing secret (starts with whsec_)');
      console.log('4. Update RESEND_WEBHOOK_SECRET in .env.local');
    } else {
      console.log('\n❌ Unexpected response');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

testWebhookWithSignature();
