const database = require('./db');
const app = require('./app');
const appWs = require('./app-ws');
const settingsRepository = require('./repositories/settingsRepository');
const automationsRepository = require('./repositories/automationsRepository');
const appEm = require('./app-em');
const beholder = require('./beholder');
const agenda = require('./agenda');
const logger = require('./utils/logger');

process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
        logger.error(`Unhandled Rejection: ${reason.message || reason}`, { body: reason.body, stack: reason.stack });
    } else {
        logger.error(`Unhandled Rejection: ${JSON.stringify(reason)}`);
    }
});

process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, err);
    process.exit(1);
});

(async () => {
    logger.info('Getting the default settings...');
    const settings = await settingsRepository.getDefaultSettings();
    if (!settings) throw new Error(`There are no settings in the database.`);

    const automations = await automationsRepository.getActiveAutomations();

    logger.info('Initializing the Beholder Brain...');
    beholder.init(automations);

    logger.info('Initializing the Beholder Agenda...');
    agenda.init(automations);

    logger.info('Starting the Server Apps...');
    const server = app.listen(process.env.PORT || 3001, () => {
        logger.info(`App is running on port ${process.env.PORT || 3001}`);
    });

    const wss = appWs(server);

    await appEm.init(settings, wss, beholder);
})();
