# Calendar and OTA Strategy

*Note: The architecture no longer uses a `booking_holds` table. All blocking occurs via `inventory_reservations`.*

## Stage 1: Launch (Direct + Manual)
- Direct website bookings via database (`inventory_reservations`).
- Manual OTA entry by admins.
- iCal feeds are provided for basic integration. 
- **Constraint:** iCal imports will be normalized to UTC before conflict checking.

## Stage 2 & 3: Selected Paid PMS Integration
- Future integrations will utilize the deferred tables (`integration_accounts`, `external_reservations`, `sync_events`).
- `external_reservations` will map PMS records to `inventory_reservations` entries of `reservation_type = ota_booking`.
