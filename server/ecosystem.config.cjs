module.exports = {
  apps: [
    {
      name: "project-x-server",
      script: "dist/server.js",
      cwd: __dirname,
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        // PORT: '3000',
        // HOST: '0.0.0.0'
      },
    },
    {
      name: "project-x-server-dev",
      script: "npm",
      args: "run dev",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
