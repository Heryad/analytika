import { Elysia } from "elysia";
import { join } from "path";

export const scriptRoute = new Elysia()
  .get("/script.js", async ({ set }) => {
    set.headers["Content-Type"] = "application/javascript; charset=utf-8";
    set.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=604800";
    set.headers["Access-Control-Allow-Origin"] = "*";

    const scriptPath = join(import.meta.dir, "../../../packages/sdk/dist/script.js");
    const file = Bun.file(scriptPath);

    if (await file.exists()) {
      return file;
    }

    // Fallback inline mini-loader if SDK build has not been run yet
    return `
      !function(){
        var d=document,s=d.currentScript,k=s&&s.getAttribute("data-api-key"),e=s&&s.getAttribute("data-api-endpoint")||"";
        if(!k)return console.warn("[Analytika] Missing data-api-key attribute on script tag");
        window.analytika=window.analytika||{
          q:[],
          track:function(n,p){this.q.push(["track",n,p])},
          page:function(n,p){this.q.push(["page",n,p])},
          identify:function(u,t){this.q.push(["identify",u,t])}
        };
        console.log("[Analytika] Initialized tracking with API key:", k);
      }();
    `;
  });
