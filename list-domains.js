// List all domains in Resend account
const { Resend } = require('resend');

const resend = new Resend('re_VqMqLX2o_HTHcbdfNvXgUeoVZ5wpFZCBf');

async function listDomains() {
  try {
    console.log('Fetching domains from Resend...\n');

    const { data, error } = await resend.domains.list();

    if (error) {
      console.error('❌ Error fetching domains:', error);
      return;
    }

    console.log('✅ Domains in your Resend account:\n');
    data.data.forEach((domain, index) => {
      console.log(`${index + 1}. ${domain.name}`);
      console.log(`   ID: ${domain.id}`);
      console.log(`   Status: ${domain.status}`);
      console.log(`   Region: ${domain.region}`);
      console.log(`   Created: ${domain.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

listDomains();
