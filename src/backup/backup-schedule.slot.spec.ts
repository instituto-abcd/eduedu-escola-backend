import { isScheduleDue, lastScheduledSlot } from './backup-schedule.slot';

const TIME_ZONE = 'America/Sao_Paulo';

// Domingo às 02:00, o padrão do agendamento.
const SUNDAY_2AM = { dayOfWeek: 0, hour: 2, minute: 0 };

// 26/07/2026 é um domingo; São Paulo está em UTC-3.
const SUNDAY_01H_SP = new Date('2026-07-26T04:00:00Z');
const SUNDAY_03H_SP = new Date('2026-07-26T06:00:00Z');
const WEDNESDAY_09H_SP = new Date('2026-07-29T12:00:00Z');

describe('lastScheduledSlot', () => {
  it('usa o horário do fuso configurado, e não o do processo (container em UTC)', () => {
    // 03:00 em São Paulo, domingo: a janela desta semana já passou.
    expect(lastScheduledSlot(SUNDAY_03H_SP, SUNDAY_2AM, TIME_ZONE)).toEqual(
      new Date('2026-07-26T05:00:00Z'),
    );
  });

  it('devolve a janela da semana anterior quando o horário desta ainda não chegou', () => {
    // 01:00 em São Paulo, domingo: falta uma hora para as 02:00.
    expect(lastScheduledSlot(SUNDAY_01H_SP, SUNDAY_2AM, TIME_ZONE)).toEqual(
      new Date('2026-07-19T05:00:00Z'),
    );
  });

  it('devolve sempre uma data no passado, para qualquer dia da semana', () => {
    for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
      const slot = lastScheduledSlot(
        WEDNESDAY_09H_SP,
        { dayOfWeek, hour: 2, minute: 0 },
        TIME_ZONE,
      );

      expect(slot.getTime()).toBeLessThanOrEqual(WEDNESDAY_09H_SP.getTime());
      expect(WEDNESDAY_09H_SP.getTime() - slot.getTime()).toBeLessThan(
        7 * 24 * 60 * 60 * 1000,
      );
    }
  });
});

describe('isScheduleDue', () => {
  const due = (now: Date, lastRunAt: Date | null, enabled = true) =>
    isScheduleDue(now, { ...SUNDAY_2AM, enabled, lastRunAt }, TIME_ZONE);

  it('faz backup na primeira execução da instalação', () => {
    expect(due(WEDNESDAY_09H_SP, null)).toBe(true);
  });

  it('não faz nada quando o backup automático está desativado', () => {
    expect(due(WEDNESDAY_09H_SP, null, false)).toBe(false);
  });

  it('faz o backup atrasado quando a máquina passou o domingo desligada', () => {
    // Último backup no domingo anterior; a janela de 26/07 passou sem ninguém
    // ligar o computador, e ele só é ligado na quarta.
    expect(due(WEDNESDAY_09H_SP, new Date('2026-07-19T05:00:00Z'))).toBe(true);
  });

  it('não repete o backup a cada reinício depois de rodar atrasado', () => {
    const ranOnWednesday = new Date('2026-07-29T12:30:00Z');

    expect(due(new Date('2026-07-29T13:00:00Z'), ranOnWednesday)).toBe(false);
    expect(due(new Date('2026-07-30T08:00:00Z'), ranOnWednesday)).toBe(false);
    expect(due(new Date('2026-08-01T20:00:00Z'), ranOnWednesday)).toBe(false);
  });

  it('volta a fazer backup na janela da semana seguinte', () => {
    const ranOnWednesday = new Date('2026-07-29T12:30:00Z');

    // Domingo 02/08 às 03:00 em São Paulo: nova janela, já passada.
    expect(due(new Date('2026-08-02T06:00:00Z'), ranOnWednesday)).toBe(true);
  });

  it('não antecipa o backup antes do horário do dia agendado', () => {
    // Domingo 01:00 em São Paulo, com backup feito no domingo anterior.
    expect(due(SUNDAY_01H_SP, new Date('2026-07-19T05:00:00Z'))).toBe(false);
  });

  it('faz backup quando a data do último backup está no futuro (relógio errado)', () => {
    expect(due(WEDNESDAY_09H_SP, new Date('2027-01-01T00:00:00Z'))).toBe(true);
  });
});
