'use strict';

/**
 * FASE 7 — Automações de Monitoramento
 *
 * Cria 2 automações de alerta desabilitadas (isActive: false).
 *
 * ⚠️  Pré-requisito: configurar SendGrid nas Settings do Beholder
 *    (campo sendGridKey + email) antes de ativar estas automações.
 *
 * Automação 1 — Saldo USDT Baixo
 *   Dispara ALERT_EMAIL quando USDT:WALLET < 20
 *   Útil para saber quando recarregar a conta antes que o bot
 *   não consiga mais executar ordens (mínimo notional ~$10)
 *
 * Automação 2 — Ordem BTCUSDT Executada
 *   Dispara ALERT_EMAIL quando BTCUSDT:LAST_ORDER é atualizado
 *   O beholder popula LAST_ORDER somente quando uma ordem é FILLED,
 *   garantindo notificação a cada trade executado com sucesso.
 *
 * Para ativar: Dashboard → Automations → toggle isActive
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {

    // Idempotência
    const existing = await queryInterface.rawSelect(
      'automations',
      { where: { name: 'Alerta Saldo Baixo USDT' } },
      ['id']
    );
    if (existing) return;

    // ===================================================================
    // AUTOMAÇÕES
    // ===================================================================
    await queryInterface.bulkInsert('automations', [
      {
        name: 'Alerta Saldo Baixo USDT',
        symbol: 'USDT',
        indexes: 'USDT:WALLET',
        conditions: "MEMORY['USDT:WALLET'] < 20",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Alerta Ordem Executada BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:LAST_ORDER',
        conditions: "MEMORY['BTCUSDT:LAST_ORDER'] !== undefined",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Busca IDs
    const alertSaldoId = await queryInterface.rawSelect(
      'automations',
      { where: { name: 'Alerta Saldo Baixo USDT' } },
      ['id']
    );
    const alertOrdemId = await queryInterface.rawSelect(
      'automations',
      { where: { name: 'Alerta Ordem Executada BTCUSDT' } },
      ['id']
    );

    // ===================================================================
    // ACTIONS — tipo ALERT_EMAIL para ambas
    // ===================================================================
    await queryInterface.bulkInsert('actions', [
      {
        automationId: alertSaldoId,
        type: 'ALERT_EMAIL',
        orderTemplateId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        automationId: alertOrdemId,
        type: 'ALERT_EMAIL',
        orderTemplateId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('actions', {
      automationId: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM automations WHERE name IN (
            'Alerta Saldo Baixo USDT',
            'Alerta Ordem Executada BTCUSDT'
          ))`
        )
      }
    });
    await queryInterface.bulkDelete('automations', {
      name: {
        [Sequelize.Op.in]: [
          'Alerta Saldo Baixo USDT',
          'Alerta Ordem Executada BTCUSDT'
        ]
      }
    });
  }
};
