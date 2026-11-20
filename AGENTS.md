# Architecture rules

- Calculate personal goal progress through `src/lib/goalProgress.ts`, using completed sessions strictly after the persisted `started_at` timestamp and within the goal period; lifetime profile totals must not complete newly activated goals.