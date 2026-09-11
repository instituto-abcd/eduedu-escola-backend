/**
 * Valores usados apenas na primeira vez que a instalação sobe, para criar a
 * linha de `BackupSchedule`. A partir daí quem manda é o banco, editável na
 * tela de Configurações — mudar o dia aqui não altera instalações existentes.
 */
export const DEFAULT_BACKUP_SCHEDULE = {
  enabled: true,
  // 0 = domingo ... 6 = sábado. Domingo de madrugada é o palpite mais seguro
  // enquanto o dia definitivo não for decidido: é quando a escola tem menos
  // chance de estar usando a máquina.
  dayOfWeek: 0,
  hour: 2,
  minute: 0,
  retentionCount: 4,
};

/**
 * Frequência com que o agendamento verifica se está em atraso. Não é a
 * frequência do backup: é de quanto em quanto tempo o sistema pergunta "a
 * janela desta semana já passou sem backup?". Dez minutos deixa o backup
 * começar rápido depois de a máquina ser ligada, sem custo relevante — a
 * verificação é uma consulta a uma linha do banco.
 */
export const SCHEDULE_CHECK_CRON = '*/10 * * * *';

/**
 * Fuso em que o dia e a hora do agendamento são interpretados. Fixo por
 * ambiente (variável de ambiente), porque é característica da instalação e
 * não algo que a escola precise configurar.
 */
export const SCHEDULE_TIME_ZONE =
  process.env.BACKUP_TIME_ZONE || 'America/Sao_Paulo';

/**
 * Carência depois que o processo sobe. Nessas máquinas o backend costuma
 * subir junto com o computador, e é aí que os containers de banco ainda estão
 * inicializando e que alguém está tentando entrar no sistema — não é hora de
 * ocupar a máquina com um pg_dump. O backup em atraso espera a próxima
 * verificação.
 */
export const STARTUP_GRACE_MS = 5 * 60 * 1000;

/**
 * Tempo máximo que um backup em andamento segura o lock. Passado isso o lock
 * é considerado órfão: significa que o processo morreu no meio (máquina
 * desligada na tomada, por exemplo) sem conseguir limpar o `runningSince`.
 */
export const RUN_LOCK_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/**
 * Espera entre tentativas depois de uma falha. Sem isso um erro permanente
 * (Docker indisponível, disco cheio) faria o sistema tentar de novo a cada
 * verificação, enchendo o log e disputando recursos com a aplicação.
 */
export const RETRY_DELAY_MS = 30 * 60 * 1000;
