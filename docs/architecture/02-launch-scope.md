# Launch Scope

## Target Public Launch Date
**25 July 2026**

## Property Scope
- Brand Name: **Silver Oak Estate**
- Inventory: One complete 3 BHK property sold as a single booking unit. The property will NOT be subdivided at launch.
- Verified overnight capacity: up to 10 guests.
- Verified indoor gathering capacity: up to 20 people.
- Verified standard daytime event capacity: up to 40 people.
- Events above 40 people require prior written approval after an operational and safety review and are outside the standard self-service booking flow.

## Capacity-Implementation Status
The public operational contract above is authoritative. The current booking-engine implementation still contains legacy hard limits of 30 total guests and 8 overnight guests in the database seed, RPC validation and application schemas. GitHub issue #15 tracks the required forward migration and coordinated application/test update. The website must not claim that the standard booking engine supports 40 total / 10 overnight until that implementation issue is complete.

## Base Pricing (Launch Scope)
- **Monday to Friday:** INR 15,000
- **Saturday and Sunday:** INR 20,000
- **Advance Payment:** INR 5,000 online
- **Public-Holiday Pricing:** Not active for launch. The database will support special-date overrides later, but they will not be implemented for Day 1.

## Time & Booking Window
- **Check-in:** 11:00 AM (Asia/Kolkata)
- **Checkout:** 10:00 AM (Asia/Kolkata) next day
- **Standard Booking Duration:** 23 hours
- **Cleaning Buffer:** 10:00 AM to 11:00 AM

## Included Features (Launch MVP)
- Luxury property presentation
- Direct booking system with live availability
- Online advance payment (INR 5,000)
- Temporary booking holds (inventory reservation type `temporary_hold` with expiry)
- Admin dashboard for manual booking entry, handling `payment_pending`, and CRM
- Fallback payment flow for pending KYC (UPI/Link + Admin manual verification via site settings configurable manual hold duration)

## Excluded from Launch
- Automated OTA synchronization (iCal exports only as transitional)
- Public user registration
- Split inventory (1BHK/2BHK configurations)
- Post-launch integrations (PMS, Add-on cataloging on frontend)
