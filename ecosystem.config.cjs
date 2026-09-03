module.exports = {
  apps: [
    {
      name: "analytika-api",
      script: "bun",
      args: "run apps/api/src/index.ts",
      cwd: "./",
      interpreter: "none",
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "analytika-web",
      script: "bun",
      args: "run --cwd apps/web start -p 3000",
      cwd: "./",
      interpreter: "none",
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "analytika-docs",
      script: "bun",
      args: "run --cwd apps/docs start -p 3002",
      cwd: "./",
      interpreter: "none",
      restart_delay: 3000,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};
