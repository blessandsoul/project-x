module.exports = {
  apps: [
    {
      // Production configuration with cluster mode
      name: "project-x-server",
      script: "dist/server.js",
      cwd: __dirname,

      // Cluster mode settings
      instances: "max", // Use all available CPU cores (or set to specific number like 4)
      exec_mode: "cluster",

      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0", // Listen on all interfaces for production
      },

      // Graceful shutdown
      kill_timeout: 5000, // Wait 5s for graceful shutdown before SIGKILL
      // wait_ready requires process.send('ready') in app; disable to avoid hang
      wait_ready: false,
      listen_timeout: 10000, // Time to wait for app to listen

      // Auto-restart settings (ALWAYS KEEP RUNNING)
      autorestart: true, // Always restart on crash
      max_memory_restart: "500M", // Restart if memory exceeds 500MB
      restart_delay: 1000, // Wait 1s between restarts
      exp_backoff_restart_delay: 100, // Exponential backoff on repeated crashes (100ms -> 15s max)
      // PM2 v5+ expects max_restarts >= 0. Use 0 for "unlimited".
      max_restarts: 0,
      min_uptime: 5000, // Consider app crashed if it exits within 5s

      // Logging
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true, // Merge logs from all cluster instances

      // Watch settings (disabled in production)
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],

      // Source maps for better error traces
      source_map_support: true,
    },
    {
      // Development configuration (single instance, fork mode)
      name: "project-x-server-dev",
      script: "npm",
      args: "run dev",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
      },
      watch: false, // tsx already handles watching
      autorestart: false, // Manual restart in dev
    },
  ],
};
