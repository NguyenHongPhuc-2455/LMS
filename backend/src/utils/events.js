const EventEmitter = require('events');

class AppEventEmitter extends EventEmitter {}

const events = new AppEventEmitter();

// Hỗ trợ tracking debug nếu cần
const originalEmit = events.emit;
events.emit = function (event, ...args) {
    console.log(`[Event Emitted] ${event}`);
    return originalEmit.apply(this, [event, ...args]);
};

module.exports = events;
