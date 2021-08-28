const database = require('./db');
const app = require('./app');
const appWs = require('./app-ws');
const settingsRepository = require('./repositories/settingsRepository');
const automationsRepository = require('./repositories/automationsRepository');
const appEm = require('./app-em');
const beholder = require('./beholder');
const agenda = require('./agenda');

(async () => {
    console.log('Getting the default settings...');
    const settings = await settingsRepository.getDefaultSettings();
    if (!settings) return new Error(`There is not settings.`);
    
    const automations = await automationsRepository.getActiveAutomations();

    console.log('Initializing the Beholder Brain...');
    beholder.init(automations);

    console.log('Initializing the Beholder Agenda...');
    agenda.init(automations);

    console.log('Starting the Server Apps...');
    const server = app.listen(process.env.PORT || 3001, () => {
        console.log('App is running at ' + process.env.PORT);
    })

    const wss = appWs(server);

    await appEm.init(settings, wss, beholder);

})();
