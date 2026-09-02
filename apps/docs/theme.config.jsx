export default {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src="/logo.svg" alt="Analytika Logo" width="28" height="28" />
      <span style={{ fontWeight: '800', fontSize: '1.25rem' }}>
        Analytika <span style={{ color: '#888', fontWeight: '400' }}>Docs</span>
      </span>
    </div>
  ),
  feedback: { content: null },
  editLink: { component: null },
  toc: { backToTop: null },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Analytika Docs'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Analytika Documentation" />
      <meta property="og:description" content="High-performance, cookieless web analytics with live social mention radar and Remote Model Context Protocol (MCP) for AI assistants." />
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </>
  ),
  footer: {
    component: (
      <div style={{ padding: '0', textAlign: 'center', fontSize: '0.875rem', marginTop: '0' }}>

      </div>
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
