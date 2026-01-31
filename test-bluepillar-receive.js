// Test sending email TO bluepillar domain (to test receiving)
const { Resend } = require('resend');

const resend = new Resend('re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf');

async function sendTestEmail() {
  try {
    console.log('Sending test email TO bluepillar domain...');

    const { data, error } = await resend.emails.send({
      from: 'warmup@usekoritsu.com',
      to: 'warmup@bluepillar.co',
      subject: 'Test Email TO Blue Pillar - Testing Receiving',
      text: 'This is a test email sent TO the bluepillar.co domain to verify that it can receive emails properly through Resend webhooks.',
      headers: {
        'Message-ID': `<test-receive-${Date.now()}@usekoritsu.com>`,
      },
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully TO bluepillar.co!');
    console.log('📧 Message ID:', data.id);
    console.log('📬 From: warmup@usekoritsu.com');
    console.log('📭 To: warmup@bluepillar.co');
    console.log('\n⏳ If webhooks are configured, this should trigger the /api/webhooks/resend/warmup endpoint');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

sendTestEmail();
