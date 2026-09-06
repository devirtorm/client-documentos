const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const Dexie = require('dexie').default;

// setup fake indexeddb
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

async function test() {
    const db = new Dexie('test-db');
    db.version(1).stores({
        'carrito-items': '[agenteId+clienteClave+articuloClave], agenteId, clienteClave'
    });
    
    await db.table('carrito-items').put({
        agenteId: 'agente1',
        clienteClave: 'cliente1',
        articuloClave: 'art1',
        cantidad: 1
    });

    await db.table('carrito-items').put({
        agenteId: 'agente1',
        clienteClave: 'cliente1',
        articuloClave: 'art2',
        cantidad: 1
    });

    const items = await db.table('carrito-items').where({ agenteId: 'agente1', clienteClave: 'cliente1' }).toArray();
    console.log("Queried:", items.length);
}

test().catch(console.error);
