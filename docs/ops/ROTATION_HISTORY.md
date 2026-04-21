# Secret rotation history

Append a row every time you rotate a long-lived secret. Operators in
the future will use this log to debug auth failures, correlate incident
timelines, and verify rotation cadence against any compliance
requirement.

Rotation procedure: [`secrets-rotation.md`](./secrets-rotation.md).

| Date       | Secret                       | Operator       | Ticket / PR | Notes                                                       |
|------------|------------------------------|----------------|-------------|-------------------------------------------------------------|
| 2026-04-21 | _(example, no real rotation)_ | adam@lastrev.com | #209        | Initial runbook landed; first real rotation TBD.             |
