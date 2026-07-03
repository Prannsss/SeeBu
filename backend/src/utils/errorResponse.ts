/** Generic 500 message for clients in production; full detail still goes to console.error at the call site. */
export function serverErrorMessage(err: any): string {
  return process.env.NODE_ENV === 'production' ? 'Internal server error' : err?.message || 'Internal server error';
}
