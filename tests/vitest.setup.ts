import * as vue from 'vue';

process.on('unhandledRejection', (err) => { throw err; });
process.on('uncaughtException', (err) => { throw err; });

(globalThis as any).Vue = vue;
(globalThis as any).VueCompilerDOM = require('@vue/compiler-dom');
(globalThis as any).VueServerRenderer = require('@vue/server-renderer');
(globalThis as any).window = globalThis;