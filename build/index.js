"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
(async () => {
    const client = (0, redis_1.createClient)();
    // client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    await client.set('key', 'value');
    const value = await client.get('key');
})();
// (async () => {
//   const client = createClient({
//     scripts: {
//       add: defineScript({
//         NUMBER_OF_KEYS: 1,
//         SCRIPT:
//           'local val = redis.pcall("GET", KEYS[1]);' +
//           'return val + ARGV[1];',
//         transformArguments(key: string, toAdd: number): Array<string> {
//           return [key, toAdd.toString()];
//         },
//         transformReply(reply: number): number {
//           return reply;
//         }
//       })
//     }
//   });
//   await client.connect();
//   await client.set('key', '1');
//   await client.add('key', 2); // 3
// })();
