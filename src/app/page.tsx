export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Koritsu Email Warmup System</h1>
      <p>Automated email warmup for 5 Koritsu domains using Resend API</p>

      <h2>Status</h2>
      <p>System is running. Check <code>/api/warmup/stats</code> for statistics.</p>

      <h2>Domains</h2>
      <ul>
        <li>usekoritsu.com</li>
        <li>trykoritsu.org</li>
        <li>koritsuai.com</li>
        <li>koritsu.org</li>
        <li>trykoritsu.com</li>
      </ul>
    </div>
  );
}
