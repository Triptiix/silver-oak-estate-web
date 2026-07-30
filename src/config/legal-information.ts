import { publicInformation } from "./public-information";

/**
 * Central source of truth for the owner-approved legal and booking terms
 * published on 30 July 2026.
 *
 * These are the operational business decisions approved by the property owner
 * for publication. They are not counsel-approved and are not a substitute for
 * professional legal advice; a legal-professional review remains recommended
 * before high-volume paid bookings or public online booking.
 *
 * Monetary values are stored as integer paise and formatted through
 * `formatInrFromPaise` so that no critical amount is duplicated as an
 * uncontrolled string across pages.
 */
export const legalInformation = {
  /** ISO date the approved terms take effect. */
  effectiveDate: "2026-07-30",
  /** ISO date the approved terms were last updated. */
  lastUpdated: "2026-07-30",
  /** Human-readable form used in page copy. */
  effectiveDateLabel: "30 July 2026",
  lastUpdatedLabel: "30 July 2026",

  /**
   * The booking agreement is between the guest and the property owner
   * personally. No separate incorporated entity or registered business is
   * represented.
   */
  contractingParty: {
    name: "Varun Yadav",
    role: "Property owner",
    description:
      "The booking agreement is between the booking guest and Varun Yadav, the property owner of Silver Oak Estate.",
  },

  /** Payments are received in the bank account designated by the owner. */
  paymentBeneficiary: {
    name: "Varun Yadav",
    note: "Payment instructions are shared privately and confirmed in writing. Account details are never published on this website.",
  },

  /** Invoices and receipts are issued by the owner. */
  invoiceIssuer: {
    name: "Varun Yadav",
  },

  /** Data Fiduciary / controller for personal data. */
  dataFiduciary: {
    name: "Varun Yadav",
  },

  /** Privacy grievance contact. */
  grievanceOfficer: {
    name: "Arpit Chouhan",
    title: "Operational Manager",
    email: "arpitchauhan1978@gmail.com",
    mailtoHref: "mailto:arpitchauhan1978@gmail.com",
    phoneDisplay: "+91 86794 70955",
    telHref: "tel:+918679470955",
    /**
     * An operational service commitment, not a claimed statutory deadline.
     */
    responseCommitment:
      "We acknowledge privacy grievances as promptly as practicable and aim to provide a substantive response within 30 calendar days. Complex requests, or requests subject to legal restrictions or identity verification, may reasonably require additional time; we will inform you if that is the case.",
    responseDays: 30,
  },

  /** Minimum age of the person making the booking. */
  minimumBookingAge: 18,

  /** Booking advance, adjusted against the total booking price. */
  bookingAdvancePaise: 500_000,

  /**
   * A separate refundable security deposit. This is NOT part of the booking
   * price and NOT the same as the booking advance.
   */
  securityDepositPaise: 500_000,

  /** Ordinary window for returning the security deposit after checkout. */
  depositReturnWindowLabel: "24–48 hours",

  /**
   * Cancellation bands using exact calendar boundaries. The 7-day and 14-day
   * boundaries themselves fall in the 50% band.
   */
  cancellation: {
    /** Lower boundary day of the 50% band (inclusive). */
    partialRefundFromDays: 7,
    /** Upper boundary day of the 50% band (inclusive). */
    partialRefundToDays: 14,
    bands: [
      {
        window: "More than 14 days before check-in",
        refund: "100% refund of refundable booking amounts",
        refundPercent: 100,
      },
      {
        window: "From 7 to 14 days before check-in (inclusive of both days)",
        refund: "50% refund of refundable booking amounts",
        refundPercent: 50,
      },
      {
        window: "Less than 7 days before check-in",
        refund: "No refund",
        refundPercent: 0,
      },
    ],
    /** Business days within which an approved refund is initiated. */
    refundInitiationBusinessDays: 7,
  },

  /** Rescheduling allowance. */
  reschedule: {
    complimentaryCount: 1,
    minimumNoticeDays: 7,
  },

  /** Retention periods for personal data. */
  retention: {
    bookedGuestMonths: 12,
    enquiryMonths: 12,
  },

  /** Governing law and forum. */
  governingLaw: "India",
  jurisdiction: "Gautam Buddha Nagar, Uttar Pradesh",

  /** Approved property address, mirrored from publicInformation. */
  approvedAddress: publicInformation.location.fullAddress,
} as const;

export type LegalInformation = typeof legalInformation;
