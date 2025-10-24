module.exports = {
  apps: [
    {
      name: 'zerafile-api',
      cwd: '/var/www/zerafile/apps/api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: '/var/log/pm2/zerafile-api-error.log',
      out_file: '/var/log/pm2/zerafile-api-out.log',
      log_file: '/var/log/pm2/zerafile-api.log',
      time: true,
      // Zero-downtime settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 1000
    },
    {
      name: 'zerafile-web',
      cwd: '/var/www/zerafile/apps/web',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/zerafile-web-error.log',
      out_file: '/var/log/pm2/zerafile-web-out.log',
      log_file: '/var/log/pm2/zerafile-web.log',
      time: true,
      // Zero-downtime settings
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 1000
    }
  ]
};
