// ecosystem.config.js — Configuração do PM2 para produção
// PM2 é o gerenciador de processos padrão para Node.js em produção.
//
// Comandos principais:
//   pm2 start ecosystem.config.js     → inicia o ZapAI
//   pm2 status                         → mostra status de todos os processos
//   pm2 logs zapai-backend             → mostra logs em tempo real
//   pm2 restart zapai-backend          → reinicia o bot
//   pm2 stop zapai-backend             → para o bot
//   pm2 save                           → salva os processos para auto-start
//   pm2 startup                        → configura auto-start no boot do servidor

module.exports = {
  apps: [
    {
      // ── Backend (WhatsApp Bot + API Express) ─────────────────
      name: "zapai-backend",
      script: "src/index.js",
      cwd: "./",

      // Reinicia automaticamente se o processo travar ou usar RAM demais
      watch: false,
      max_restarts: 15,
      restart_delay: 5000,           // aguarda 5s antes de reiniciar
      max_memory_restart: "600M",    // reinicia se usar mais de 600MB de RAM

      // Variáveis de ambiente — produção usa o .env
      env: {
        NODE_ENV: "production",
      },

      // Logs — por padrão ficam em ~/.pm2/logs/
      // Para ver: pm2 logs zapai-backend
      out_file: "./logs/zapai-out.log",
      error_file: "./logs/zapai-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Graceful shutdown — aguarda o bot fechar o WhatsApp corretamente
      kill_timeout: 10000,
      listen_timeout: 30000,
    },
  ],
};
