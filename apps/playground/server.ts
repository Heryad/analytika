const PORT = 5173;

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname.startsWith("/pricing") || url.pathname.startsWith("/features") || url.pathname.startsWith("/checkout") || url.pathname.startsWith("/docs")) {
      return new Response(Bun.file("./index.html"));
    }
    return new Response(Bun.file("." + url.pathname));
  },
});

console.log(`🌐 Analytika Playground test app running at http://localhost:${PORT}`);
