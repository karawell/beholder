'use strict';

/**
 * FASE 5 — Estratégias de Trading
 *
 * Cria 3 estratégias desabilitadas (isActive: false) para BTCUSDT.
 * ⚠️  Ative SOMENTE na Binance Testnet primeiro!
 *
 * Estratégia 1 — RSI Oversold/Overbought (1h)
 *   COMPRA: RSI_14 < 30  (sobrevendido)
 *   VENDA:  RSI_14 > 70  (sobrecomprado)
 *
 * Estratégia 2 — EMA Crossover (4h)
 *   COMPRA: EMA_9 cruza acima de EMA_21  (golden cross)
 *   VENDA:  EMA_9 cruza abaixo de EMA_21 (death cross)
 *
 * Estratégia 3 — Bollinger Bands (1h)
 *   COMPRA: fechamento toca a banda inferior (lower)
 *   VENDA:  fechamento toca a banda superior (upper)
 *
 * Memória gerada (memoryKey = SYMBOL:INDEX_INTERVAL):
 *   BTCUSDT:RSI_14_1h       => { current, previous }
 *   BTCUSDT:EMA_9_4h        => { current, previous }
 *   BTCUSDT:EMA_21_4h       => { current, previous }
 *   BTCUSDT:BB_20_2_1h      => { current: { upper, middle, lower }, previous }
 *   BTCUSDT:LAST_CANDLE_1h  => { open, close, high, low }
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {

    // Idempotência: não re-executa se já existir
    const existingAuto = await queryInterface.rawSelect(
      'automations',
      { where: { name: 'RSI Compra BTCUSDT' } },
      ['id']
    );
    if (existingAuto) return;

    // ===================================================================
    // MONITORES
    // ===================================================================
    await queryInterface.bulkInsert('monitors', [
      {
        type: 'CANDLES',
        broadcastLabel: null,
        symbol: 'BTCUSDT',
        interval: '1h',
        isActive: false,
        isSystemMon: false,
        indexes: 'RSI_14,BB_20_2',
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        type: 'CANDLES',
        broadcastLabel: null,
        symbol: 'BTCUSDT',
        interval: '4h',
        isActive: false,
        isSystemMon: false,
        indexes: 'EMA_9,EMA_21',
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // ===================================================================
    // ORDER TEMPLATES
    // ===================================================================
    await queryInterface.bulkInsert('orderTemplates', [
      // --- Estratégia 1: RSI ---
      {
        name: 'RSI Compra BTCUSDT',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'BUY',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'MIN_NOTIONAL',
        quantityMultiplier: 1.5,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'RSI Venda BTCUSDT',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'SELL',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'LAST_ORDER_QTY',
        quantityMultiplier: 1,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // --- Estratégia 2: EMA Crossover ---
      {
        name: 'EMA Compra BTCUSDT',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'BUY',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'MIN_NOTIONAL',
        quantityMultiplier: 1.5,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'EMA Venda BTCUSDT',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'SELL',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'LAST_ORDER_QTY',
        quantityMultiplier: 1,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // --- Estratégia 3: Bollinger Bands ---
      {
        name: 'BB Compra BTCUSDT',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'BUY',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'MIN_NOTIONAL',
        quantityMultiplier: 1.5,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'BB Venda BTCUSDT',
        symbol: 'BTCUSDT',
        type: 'MARKET',
        side: 'SELL',
        limitPrice: null,
        limitPriceMultiplier: 1,
        stopPrice: null,
        stopPriceMultiplier: 1,
        quantity: 'LAST_ORDER_QTY',
        quantityMultiplier: 1,
        icebergQty: null,
        icebergQtyMultiplier: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Busca IDs dos templates recém-criados
    const rsiCompraTemplId = await queryInterface.rawSelect('orderTemplates', { where: { name: 'RSI Compra BTCUSDT' } }, ['id']);
    const rsiVendaTemplId  = await queryInterface.rawSelect('orderTemplates', { where: { name: 'RSI Venda BTCUSDT'  } }, ['id']);
    const emaCompraTemplId = await queryInterface.rawSelect('orderTemplates', { where: { name: 'EMA Compra BTCUSDT' } }, ['id']);
    const emaVendaTemplId  = await queryInterface.rawSelect('orderTemplates', { where: { name: 'EMA Venda BTCUSDT'  } }, ['id']);
    const bbCompraTemplId  = await queryInterface.rawSelect('orderTemplates', { where: { name: 'BB Compra BTCUSDT'  } }, ['id']);
    const bbVendaTemplId   = await queryInterface.rawSelect('orderTemplates', { where: { name: 'BB Venda BTCUSDT'   } }, ['id']);

    // ===================================================================
    // AUTOMAÇÕES
    // ===================================================================
    await queryInterface.bulkInsert('automations', [
      // --- Estratégia 1: RSI ---
      {
        name: 'RSI Compra BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:RSI_14_1h',
        conditions: "MEMORY['BTCUSDT:RSI_14_1h'].current < 30",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'RSI Venda BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:RSI_14_1h',
        conditions: "MEMORY['BTCUSDT:RSI_14_1h'].current > 70",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // --- Estratégia 2: EMA Crossover ---
      // O beholder inverte a condição automaticamente para detectar o cruzamento:
      // ex: current > && previous <= (golden cross)
      {
        name: 'EMA Golden Cross BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:EMA_9_4h,BTCUSDT:EMA_21_4h',
        conditions: "MEMORY['BTCUSDT:EMA_9_4h'].current > MEMORY['BTCUSDT:EMA_21_4h'].current",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'EMA Death Cross BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:EMA_9_4h,BTCUSDT:EMA_21_4h',
        conditions: "MEMORY['BTCUSDT:EMA_9_4h'].current < MEMORY['BTCUSDT:EMA_21_4h'].current",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // --- Estratégia 3: Bollinger Bands ---
      {
        name: 'BB Compra BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:LAST_CANDLE_1h,BTCUSDT:BB_20_2_1h',
        conditions: "MEMORY['BTCUSDT:LAST_CANDLE_1h'].close <= MEMORY['BTCUSDT:BB_20_2_1h'].current.lower",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'BB Venda BTCUSDT',
        symbol: 'BTCUSDT',
        indexes: 'BTCUSDT:LAST_CANDLE_1h,BTCUSDT:BB_20_2_1h',
        conditions: "MEMORY['BTCUSDT:LAST_CANDLE_1h'].close >= MEMORY['BTCUSDT:BB_20_2_1h'].current.upper",
        isActive: false,
        logs: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Busca IDs das automações recém-criadas
    const rsiCompraAutoId     = await queryInterface.rawSelect('automations', { where: { name: 'RSI Compra BTCUSDT'      } }, ['id']);
    const rsiVendaAutoId      = await queryInterface.rawSelect('automations', { where: { name: 'RSI Venda BTCUSDT'       } }, ['id']);
    const emaGoldenAutoId     = await queryInterface.rawSelect('automations', { where: { name: 'EMA Golden Cross BTCUSDT'} }, ['id']);
    const emaDeathAutoId      = await queryInterface.rawSelect('automations', { where: { name: 'EMA Death Cross BTCUSDT' } }, ['id']);
    const bbCompraAutoId      = await queryInterface.rawSelect('automations', { where: { name: 'BB Compra BTCUSDT'       } }, ['id']);
    const bbVendaAutoId       = await queryInterface.rawSelect('automations', { where: { name: 'BB Venda BTCUSDT'        } }, ['id']);

    // ===================================================================
    // ACTIONS (uma por automação, tipo ORDER)
    // ===================================================================
    await queryInterface.bulkInsert('actions', [
      { automationId: rsiCompraAutoId,  type: 'ORDER', orderTemplateId: rsiCompraTemplId,  createdAt: new Date(), updatedAt: new Date() },
      { automationId: rsiVendaAutoId,   type: 'ORDER', orderTemplateId: rsiVendaTemplId,   createdAt: new Date(), updatedAt: new Date() },
      { automationId: emaGoldenAutoId,  type: 'ORDER', orderTemplateId: emaCompraTemplId,  createdAt: new Date(), updatedAt: new Date() },
      { automationId: emaDeathAutoId,   type: 'ORDER', orderTemplateId: emaVendaTemplId,   createdAt: new Date(), updatedAt: new Date() },
      { automationId: bbCompraAutoId,   type: 'ORDER', orderTemplateId: bbCompraTemplId,   createdAt: new Date(), updatedAt: new Date() },
      { automationId: bbVendaAutoId,    type: 'ORDER', orderTemplateId: bbVendaTemplId,    createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('actions', {
      automationId: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          `(SELECT id FROM automations WHERE name IN (
            'RSI Compra BTCUSDT','RSI Venda BTCUSDT',
            'EMA Golden Cross BTCUSDT','EMA Death Cross BTCUSDT',
            'BB Compra BTCUSDT','BB Venda BTCUSDT'
          ))`
        )
      }
    });
    await queryInterface.bulkDelete('automations', {
      name: {
        [Sequelize.Op.in]: [
          'RSI Compra BTCUSDT', 'RSI Venda BTCUSDT',
          'EMA Golden Cross BTCUSDT', 'EMA Death Cross BTCUSDT',
          'BB Compra BTCUSDT', 'BB Venda BTCUSDT'
        ]
      }
    });
    await queryInterface.bulkDelete('orderTemplates', {
      name: {
        [Sequelize.Op.in]: [
          'RSI Compra BTCUSDT', 'RSI Venda BTCUSDT',
          'EMA Compra BTCUSDT', 'EMA Venda BTCUSDT',
          'BB Compra BTCUSDT', 'BB Venda BTCUSDT'
        ]
      }
    });
    await queryInterface.bulkDelete('monitors', {
      symbol: 'BTCUSDT',
      interval: { [Sequelize.Op.in]: ['1h', '4h'] },
      isSystemMon: false
    });
  }
};
