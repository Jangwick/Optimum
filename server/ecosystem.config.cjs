module.exports = {
  apps: [
    {
      name: 'optimum-server',
      script: './dist/src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_file: '.env',
      log_file: './logs/server.log',
      out_file: './logs/server.out.log',
      error_file: './logs/server.err.log',
      time: true,
      max_memory_restart: '512M',
    },
  ],
};
