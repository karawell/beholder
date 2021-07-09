const MEMORY = {}

let BRAIN = {}

let LOCK_MEMORY = false;

let LOCK_BRAIN = false;

const LOGS = process.env.BEHOLDER_LOGS === 'true';

function init(automations) {
    //carregar o BRAIN
}

function updateMemory(symbol, index, interval, value) {

    if (LOCK_MEMORY) return;

    const indexKey = interval ? `${index}_${interval}` : index;
    const memoryKey = `${symbol}:${indexKey}`;
    MEMORY[memoryKey] = value;

    if (LOGS) console.log(`Beholder memory updated: ${memoryKey} => ${JSON.stringify(value)}`);

    //lógica de processamento do estímulo
}

function deleteMemory(symbol, index, interval) {


    try {
        const indexKey = interval ? `${index}_${interval}` : index;
        const memoryKey = `${symbol}:${indexKey}`;

        LOCK_MEMORY = true;
        console.log(MEMORY[memoryKey]);
        delete MEMORY[memoryKey];
        console.log(MEMORY[memoryKey]);
    }
    finally {
        LOCK_MEMORY = false;
    }

    if (LOGS) console.log(`Beholder memory delete: ${memoryKey}`);
}

function getMemory() {
    return { ...MEMORY };
}

function getBrain() {
    return { ...BRAIN };
}

module.exports = {
    updateMemory,
    deleteMemory,
    getMemory,
    getBrain,
    init
}