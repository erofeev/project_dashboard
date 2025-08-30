/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 */

// Полифилл для Node.js events в браузере
import { EventEmitter } from 'events';

// Добавляем в глобальную область видимости
(globalThis as any).EventEmitter = EventEmitter;
(globalThis as any).events = { EventEmitter };

// Полифилл для process (если потребуется)
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = {
    env: {},
    nextTick: (fn: () => void) => setTimeout(fn, 0),
    version: '',
    platform: 'browser'
  };
}

// Полифилл для Buffer (если потребуется)
if (typeof (globalThis as any).Buffer === 'undefined') {
  (globalThis as any).Buffer = {
    isBuffer: () => false,
    from: (data: any) => data,
    alloc: (size: number) => new Uint8Array(size)
  };
}

console.log('PouchDB polyfills загружены');
