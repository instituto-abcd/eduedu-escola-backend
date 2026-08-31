const MINUTES_IN_DAY = 24 * 60;
const MINUTES_IN_WEEK = 7 * MINUTES_IN_DAY;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type ScheduleSlot = {
  // 0 = domingo ... 6 = sábado
  dayOfWeek: number;
  hour: number;
  minute: number;
};

export type ScheduleState = ScheduleSlot & {
  enabled: boolean;
  lastRunAt: Date | null;
};

// Posição de `date` dentro da semana, em minutos desde domingo 00:00, medida
// no fuso do agendamento — e não no fuso do processo. O container do backend
// roda em UTC, então sem essa conversão "domingo às 02:00" cairia às 23:00 de
// sábado no horário de Brasília.
function minutesIntoWeek(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const partValue = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const dayOfWeek = WEEKDAY_INDEX[partValue('weekday')] ?? 0;
  const hour = Number(partValue('hour')) % 24;
  const minute = Number(partValue('minute'));

  return dayOfWeek * MINUTES_IN_DAY + hour * 60 + minute;
}

/**
 * Última vez que o agendamento deveria ter rodado, olhando para trás a partir
 * de `now`. É sempre uma data no passado (ou o exato instante atual): se o
 * horário desta semana ainda não chegou, devolve o da semana anterior.
 *
 * É este retrocesso que faz o backup sobreviver a máquina desligada — em vez
 * de perguntar "estamos no horário agora?", o agendamento pergunta "já passei
 * do horário desta semana sem ter feito backup?", o que continua verdadeiro
 * dias depois, quando a máquina finalmente for ligada.
 */
export function lastScheduledSlot(
  now: Date,
  slot: ScheduleSlot,
  timeZone: string,
): Date {
  const slotMinutes =
    slot.dayOfWeek * MINUTES_IN_DAY + slot.hour * 60 + slot.minute;

  let elapsedMinutes = minutesIntoWeek(now, timeZone) - slotMinutes;
  if (elapsedMinutes < 0) elapsedMinutes += MINUTES_IN_WEEK;

  const startOfCurrentMinute =
    now.getTime() - (now.getSeconds() * 1000 + now.getMilliseconds());

  return new Date(startOfCurrentMinute - elapsedMinutes * 60_000);
}

/**
 * Próxima vez que o agendamento deve rodar, para exibição. É a janela
 * seguinte à última — quando o backup está em atraso, essa data continua
 * sendo a da próxima semana, porque o backup atrasado não espera por ela.
 */
export function nextScheduledSlot(
  now: Date,
  slot: ScheduleSlot,
  timeZone: string,
): Date {
  const last = lastScheduledSlot(now, slot, timeZone);

  return new Date(last.getTime() + MINUTES_IN_WEEK * 60_000);
}

/**
 * Se o backup automático está em atraso e deve rodar agora.
 *
 * Um `lastRunAt` no futuro é tratado como atraso de propósito: nessas
 * máquinas o relógio pode estar errado e ser corrigido depois, e nesse caso é
 * melhor fazer um backup a mais do que nunca mais fazer nenhum.
 */
export function isScheduleDue(
  now: Date,
  state: ScheduleState,
  timeZone: string,
): boolean {
  if (!state.enabled) return false;
  if (!state.lastRunAt) return true;
  if (state.lastRunAt.getTime() > now.getTime()) return true;

  return (
    state.lastRunAt.getTime() <
    lastScheduledSlot(now, state, timeZone).getTime()
  );
}
