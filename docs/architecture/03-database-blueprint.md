# Database Blueprint

All dates and instants must use PostgreSQL `timestamptz` (stored in UTC). Money is stored as integer `paise` (or PostgreSQL `bigint`), never float.

**Launch Base Prices:**
- Monday-Friday: 1,500,000 paise
- Saturday-Sunday: 2,000,000 paise
- Advance: 500,000 paise

## Launch-Critical Tables

### 1. `properties`
- **Purpose:** Configuration and details of the property.
- `id` (uuid, pk, default uuid_generate_v4())
- `name` (text, not null)
- `timezone` (text, not null, default 'Asia/Kolkata')
- `check_in_time` (time, not null)
- `check_out_time` (time, not null)
- `cleaning_buffer_minutes` (int, not null)
- `max_event_guests` (int, not null)
- `max_overnight_guests` (int, not null)
- `is_active` (boolean, not null, default true)
- `created_at`, `updated_at` (timestamptz, not null, default now())
- **Access:** Public read, Admin write. RLS applies.

### 2. `inventory_reservations`
- **Purpose:** Authoritative blocking table. Prevents double bookings.
- `id` (uuid, pk)
- `property_id` (uuid, fk properties, not null)
- `booking_id` (uuid, fk bookings, nullable)
- `external_reservation_id` (uuid, nullable) - *Note: Deferred FK. This is a nullable external reference for launch. The foreign key dependency will be added in the future external-reservations migration.*
- `reservation_type` (enum: `temporary_hold`, `confirmed_booking`, `manual_booking`, `ota_booking`, `owner_block`, `maintenance_block`, not null)
- `status` (enum: `active`, `released`, `expired`, `cancelled`, not null)
- `start_at` (timestamptz, not null)
- `end_at` (timestamptz, not null)
- `expires_at` (timestamptz, nullable)
- `source` (text, not null)
- `created_at`, `updated_at` (timestamptz, not null, default now())
- **Constraint:** `EXCLUDE USING gist (property_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&) WHERE (status = 'active')`
- **Access:** Admin read/write, Server-only write via API. Public read obscured via API functions.

### 3. `bookings`
- **Purpose:** Customer record of the booking intent.
- `id` (uuid, pk)
- `booking_reference` (text, unique, not null) - *Human-readable customer reference.*
- `public_confirmation_token` (text, unique, not null) - *Cryptographically random opaque token for the public confirmation URL.*
- `property_id` (uuid, fk properties, not null)
- `customer_id` (uuid, fk customers, nullable)
- `customer_name_snapshot` (text, not null)
- `customer_email_snapshot` (text, nullable)
- `customer_phone_snapshot` (text, not null)
- `source` (text, not null)
- `booking_type` (text, not null)
- `check_in_at` (timestamptz, not null)
- `check_out_at` (timestamptz, not null)
- `guest_count` (int, not null)
- `overnight_guest_count` (int, nullable)
- `total_amount_paise` (bigint, not null)
- `advance_amount_paise` (bigint, not null)
- `balance_amount_paise` (bigint, not null)
- `booking_status` (enum, see State Machines, not null)
- `special_requests` (text, nullable)
- `created_at`, `updated_at` (timestamptz, not null, default now())
- `cancelled_at` (timestamptz, nullable)
- **Indexes:** `idx_bookings_confirmation_token`, `idx_bookings_property_dates`
- **Access:** Admin read/write. Server-only operations for creation/updates.

### 4. `payments`
- **Purpose:** Ledger for payment attempts and status.
- `id` (uuid, pk)
- `booking_id` (uuid, fk bookings, not null)
- `provider` (text, not null)
- `provider_order_id` (text, nullable)
- `provider_payment_id` (text, nullable)
- `provider_event_id` (text, nullable)
- `idempotency_key` (text, unique, not null)
- `amount_paise` (bigint, not null)
- `currency` (text, not null, default 'INR')
- `status` (enum, see State Machines, not null)
- `signature_verified` (boolean, not null, default false)
- `failure_code` (text, nullable)
- `failure_reason` (text, nullable)
- `created_at`, `updated_at` (timestamptz, not null, default now())
- **Indexes:** `idx_payments_booking_id`, `idx_payments_idempotency`
- **Access:** Admin read. Server-only read/write.

### 5. `customers`
- **Purpose:** CRM details for historical guests.
- `id` (uuid, pk)
- `name` (text, not null)
- `email` (text, nullable)
- `phone` (text, unique, not null)
- `whatsapp` (text, nullable)
- `created_at`, `updated_at` (timestamptz, not null, default now())
- **Access:** Admin read/write.

### 6. `pricing_rules`
- **Purpose:** Configurable rates (weekday, weekend, special-dates).
- `id` (uuid, pk)
- `property_id` (uuid, fk properties, not null)
- `rule_type` (enum: `weekday`, `weekend`, `special_date`, not null)
- `specific_date` (date, nullable)
- `effective_from` (date, nullable)
- `effective_until` (date, nullable)
- `price_amount_paise` (bigint, not null)
- `advance_amount_paise` (bigint, not null)
- `priority` (integer, not null, default 0) - *Higher priority overrides lower.*
- `is_active` (boolean, not null, default true)
- `created_at`, `updated_at` (timestamptz, not null, default now())
- **Checks:** 
  - Monetary values must be non-negative.
  - `effective_until` cannot precede `effective_from`.
  - `special_date` rules require `specific_date`.
  - `weekday` and `weekend` rules must not require `specific_date`.
- **Resolution:** Highest-priority applicable rule wins. If priorities tie, a specific-date rule wins over a general rule.
- **Access:** Server-side read for logic, Admin read/write.

### 7. `webhook_events`
- **Purpose:** Append-only log of received webhooks for auditing and idempotency.
- `id` (uuid, pk)
- `provider` (text, not null)
- `provider_event_id` (text, not null)
- `payload` (jsonb, not null)
- `processed_at` (timestamptz, nullable)
- `status` (enum: `pending`, `processed`, `failed`, not null)
- **Constraint:** Composite uniqueness rule on `(provider, provider_event_id)`
- **Note:** Webhook payloads may contain sensitive data and must be stored only when necessary, with redaction or a payload hash preferred for long-term logs.
- **Access:** Server-only write/read. Admin read.

### 8. `booking_events`
- **Purpose:** Append-only audit trail of booking state changes.
- `id` (uuid, pk)
- `booking_id` (uuid, fk bookings, not null)
- `event_type` (text, not null)
- `old_status` (text, nullable)
- `new_status` (text, nullable)
- `actor_type` (text, not null) - *System, Admin, Public.*
- `created_at` (timestamptz, not null, default now())
- **Access:** Server-only write. Admin read.

### 9. `notification_events`
- **Purpose:** Log of automated messages sent (Email, WhatsApp).
- `id` (uuid, pk)
- `booking_id` (uuid, fk bookings, not null)
- `notification_type` (text, not null)
- `recipient` (text, not null)
- `status` (enum: `sent`, `failed`, `pending`, not null)
- `created_at` (timestamptz, not null, default now())
- **Access:** Server-only write. Admin read.

### 10. `admins`
- **Purpose:** Maps Supabase Auth users to application roles.
- `id` (uuid, pk)
- `auth_user_id` (uuid, unique, not null) - *FK to auth.users (Supabase)*
- `role` (text, not null, default 'admin')
- `name` (text, not null)
- `email` (text, not null)
- `created_at` (timestamptz, not null, default now())
- **Access:** Auth trigger write, Server/Admin read.

### 11. `site_settings`
- **Purpose:** Key-value store for global configurations (e.g., `manual_payment_hold_minutes`).
- `id` (uuid, pk)
- `setting_key` (text, unique, not null)
- `setting_value` (text, not null)
- `updated_at` (timestamptz, not null, default now())
- **Access:** Server read, Authenticated authorized-admin read/write. No direct anonymous or public-table read. Approved public settings may later be returned through a controlled server endpoint.

## Deferred (Planned for Post-Launch)

### `integration_accounts`
- `id`, `provider_name`, `api_key_encrypted`, `status`

### `external_reservations`
- `id`, `integration_id`, `external_id`, `start_at`, `end_at`, `status`, `source_timezone`, `last_sync_time`, `conflict_status`

### `sync_events`
- `id`, `integration_id`, `event_type`, `payload`, `status`, `created_at`
