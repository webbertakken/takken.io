module.exports = {
  apps: [
    {
      name: 'takken-dev',
      script: 'node_modules/@docusaurus/core/bin/docusaurus.mjs',
      args: 'start',
      env: {
        NODE_ENV: 'development',
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      watch: false,
    },
  ],
}
