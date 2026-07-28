# Launch Scope

## Target Public Launch Date

**25 July 2026**

## Property Scope

- Brand Name: **Silver Oak Estate**
- Inventory: One complete 3 BHK property sold as a single booking unit. The property will NOT be subdivided at launch.
- Overnight stays: up to 10 guests.
- Indoor gatherings: up to 20 people.
- Standard daytime events: up to 40 people.
- Events above 40 people require prior written approval after an operational and safety review and are outside the standard self-service booking flow.

## Capacity-Implementation Status

The repository’s public hold and administrator manual-booking code enforces up to 40 total guests and up to 10 overnight guests. The 20-person indoor capacity remains a distinct operational-use limit rather than a separate booking-engine field. Hosted enforcement requires the forward migration to be deployed separately; this implementation PR does not mutate the hosted Supabase project or deploy production. Values above the standard booking limits are rejected by the source implementation, and events above 40 remain subject to prior written approval outside self-service booking.

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
