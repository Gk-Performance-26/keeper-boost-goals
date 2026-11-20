# Architecture rules

- Calculate personal goal progress through `src/lib/goalProgress.ts`, using completed sessions strictly after the persisted `started_at` timestamp and within the goal period; lifetime profile totals must not complete newly activated goals.
- Save profile photos through the avatars Storage API under the authenticated user's folder, resizing before upload; enforce bio length in both the shared client helper and the database constraint to prevent bypasses.