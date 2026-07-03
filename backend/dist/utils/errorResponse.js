"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverErrorMessage = serverErrorMessage;
/** Generic 500 message for clients in production; full detail still goes to console.error at the call site. */
function serverErrorMessage(err) {
    return process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Internal server error';
}
