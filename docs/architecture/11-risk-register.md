# Risk Register

| Description | Severity | Probability | Owner | Mitigation | Fallback | Blocker? | Decision Deadline |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Payment KYC delay** | High | Medium | Arpit / Priyanshu | Apply early. Monitor portal daily. | UPI / Link manual payment fallback with 30m hold. | No | 20 July |
| **Merchant entity issues** | Medium | Medium | Arpit | Decide if Indian business entity, proprietor, or individual account is used. | Re-file under alternative name. | Yes | 18 July |
| **Domain/DNS delay** | High | Low | Priyanshu | Secure domain immediately. | Staging domain. | Yes | 22 July |
| **Missing media assets** | High | High | Arpit | Schedule shoot ASAP. | Delay launch. *NEVER use stock or placeholder imagery.* | Yes | 23 July |
| **Unapproved copy/policies** | High | Low | Arpit | Approval sign-off on copy sheet. | Delay launch. | Yes | 24 July |
| **Unfinalized cancellation policy** | Critical | High | Arpit | Client must draft and approve exact terms. | *Blocker. Live paid bookings cannot commence without an approved policy.* | Yes | 23 July |
| **Unverified event claims** | High | Medium | Arpit | Verify local laws regarding DJ/parties. | Remove claims from public site. | Yes | 23 July |
| **Double booking** | Critical | Low | Dev Team | PostgreSQL Exclusion Constraints on `inventory_reservations`. | Manual refund and apology. | Yes | N/A |
| **Bot hold abuse** | Medium | Low | Dev Team | Turnstile + IP limits. | Manual DB cleanup. | No | N/A |
| **Cron failure** | Low | Low | Dev Team | The hold-creation transaction first changes stale active temporary holds to expired. Availability queries treat past expires_at values as non-bookable holds only until transactional cleanup occurs. Scheduled cleanup provides secondary housekeeping. Monitoring detects cleanup failures. | Admin manual release. | No | N/A |
| **Stale availability** | Medium | Medium | Dev Team | Force `no-store` on API. | Refresh client on error. | Yes | N/A |
| **Duplicate webhook** | Low | Low | Dev Team | `provider_event_id` idempotency. | Audit logs. | Yes | N/A |
| **DB inconsistency** | Critical | Low | Dev Team | Use atomic transactions for shared finalization. | Admin reconciliation. | Yes | N/A |
| **Admin mistake** | High | Medium | Dev Team | Restrict destructive actions. Audit logs. | DB point-in-time recovery. | No | N/A |
| **OTA approval delay** | Low | High | Arpit | Start process post-launch. | Direct bookings only. | No | N/A |
| **Manual OTA reconciliation failure** | High | Medium | Arpit | Daily operations checklist, assigned single owner, second-person verification. | Corrective entries and apologies. | No | N/A |
| **Secret leakage** | Critical | Low | Dev Team | Store only in Vercel. Review PRs. | Rotate keys immediately. | Yes | N/A |
| **Scope expansion** | High | High | Priyanshu | Strict adherence to MVP plan. | Push to Phase 2. | No | N/A |
| **Poor mobile performance** | Medium | Medium | Dev Team | Next.js Image optimization. | Lighthouse audit fixes. | Yes | N/A |
