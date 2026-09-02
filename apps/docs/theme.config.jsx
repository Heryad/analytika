export default {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src="/logo.svg" alt="Analytika Logo" width="28" height="28" />
      <span style={{ fontWeight: '800', fontSize: '1.25rem', color: 'inherit' }}>
        Analytika <span style={{ color: '#888', fontWeight: '400' }}>Docs</span>
      </span>
    </div>
  ),
  logoLink: 'https://analytika.me',
  project: { link: null },
  chat: { link: null },
  feedback: { content: null },
  editLink: { component: null },
  toc: { backToTop: null },
  useNextSeoProps() {
    return {
      titleTemplate: '%s  Analytika Docs',
      canonical: 'https://docs.analytika.me'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Analytika Documentation" />
      <meta property="og:description" content="High-performance, cookieless web analytics with live social mention radar and Remote Model Context Protocol (MCP) for AI assistants." />
      <meta property="og:url" content="https://docs.analytika.me" />
      <meta property="og:site_name" content="Analytika Docs" />
      <link rel="canonical" href="https://docs.analytika.me" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </>
  ),
  footer: {
    component: (
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.8rem',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.svg" alt="Analytika" width="18" height="18" />
          <span>© {new Date().getFullYear()} Analytika. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="https://analytika.me" style={{ color: '#666', textDecoration: 'none' }}>Home</a>
          <a href="https://analytika.me/auth/login" style={{ color: '#666', textDecoration: 'none' }}>Dashboard</a>
          <a href="https://docs.analytika.me" style={{ color: '#666', textDecoration: 'none' }}>Docs</a>
        </div>
      </footer>
    )
  },
  primaryHue: 355,
  primarySaturation: 80,
  navigation: true,
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true
  }
}
