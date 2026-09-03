/**
 * Embed layout — overrides the root layout for all /embed/* routes.
 * Must have transparent background and no body padding/margin so widgets
 * render cleanly inside iframes without any background bleed.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            background: transparent !important;
            width: fit-content;
            height: fit-content;
            overflow: hidden;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }
        `}</style>
      </head>
      <body style={{ background: "transparent", margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
