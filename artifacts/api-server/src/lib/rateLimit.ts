/**
 * Small in-memory login-attempt throttle, shared by the admin and customer
 * portal login endpoints (both are single-shared-secret logins with no
 * per-user accounts, so brute-force risk is otherwise unbounded).
 *
 * Note: this state is per-process. On a multi-instance deployment (e.g.
 * Replit Autoscale) each instance enforces the limit independently, so the
 * effective ceiling is `max * instance count`, not a hard `max`. That's an
 * acceptable tradeoff for a low-traffic internal/customer tool, but if this
 * ever needs a hard guarantee, back it with the Postgres `session` store (or
 * Redis) instead of an in-process Map.
 */
export function createLoginThrottle(max: number, windowMs: number) {
  const attempts = new Map<string, { count: number; windowStart: number }>();

  return {
    isRateLimited(key: string): boolean {
      const now = Date.now();
      const entry = attempts.get(key);
      if (!entry || now - entry.windowStart > windowMs) {
        attempts.set(key, { count: 0, windowStart: now });
        return false;
      }
      return entry.count >= max;
    },
    recordFailedAttempt(key: string): void {
      const entry = attempts.get(key);
      if (!entry) {
        attempts.set(key, { count: 1, windowStart: Date.now() });
        return;
      }
      entry.count += 1;
    },
    reset(key: string): void {
      attempts.delete(key);
    },
  };
}
