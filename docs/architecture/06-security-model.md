# Security Model

## Threat Prevention
- **Rate Limiting:** Strict limits by IP and phone/email fingerprints on booking hold creation.
- **Bot and Spam Prevention:** Captcha/Turnstile required for booking intents.
- **Inventory Denial/Hold Abuse:** Blocks repeated holds from same IP/session without payment.
- **Booking Reference Enumeration:** Sequential guessing is computationally impractical due to UUIDs and cryptographically secure tokens.
- **Input/Output:** Strict Zod schema validation and automatic React output encoding (XSS prevention).
- **CSRF & CSP:** CSRF tokens required for authenticated admin mutations. Strict Content Security Policy (CSP) headers applied.
- **Secret Management:** Server-only env vars. Never exposed to browser.
- **Log Redaction:** PII scrubbed from application logs.
- **PII Protection & Data Deletion:** Data stored securely; compliant with data retention scopes. Public confirmation pages use opaque tokens and redact all PII.
- **Brute-Force Protection:** Auth managed by Supabase (includes brute-force protection and session expiry).
- **Audit Integrity:** Append-only audit logs for all mutations.

## Access Matrix

| Entity | Public Browser | Authenticated Admin | Server Application | Payment Provider | Future PMS |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Availability** | Read (Obscured) | Read/Write | Read/Write | N/A | Read/Write (Least Privilege)* |
| **Bookings/PII** | Denied (Opaque Token Summary Only) | Read/Write | Read/Write | Denied | Denied |
| **Payments** | Denied | Read (Status only) | Read/Write | Write (Webhook) | Denied |
| **Hold Creation** | Write (Server API) | Write (Server API)| Read/Write | N/A | Write (Least Privilege)* |
| **Settings** | Denied | Read/Write | Read | N/A | Denied |

*\* Note: Future PMS access must be restricted to least-privilege `inventory_reservations` and `external_reservations` fields via separately scoped integration credentials. Unrestricted customer or payment access is strictly denied. All PMS mutations will be audited in `sync_events`.*

## Implementation Clarification

### Site Settings Privacy

The complete site_settings table is not public-readable. Public configuration is exposed only through controlled server output containing explicitly approved values.
