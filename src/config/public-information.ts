const wholeRupeeFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formats an integer paise amount as whole Indian rupees for public display.
 */
export function formatInrFromPaise(amountPaise: number): string {
  if (
    !Number.isInteger(amountPaise) ||
    amountPaise < 0 ||
    amountPaise % 100 !== 0
  ) {
    throw new RangeError(
      "Currency amounts must be non-negative integer paise values representing whole rupees."
    );
  }

  return `₹${wholeRupeeFormatter.format(amountPaise / 100)}`;
}

export const publicInformation = {
  contact: {
    email: "contact@silveroakestate.online",
    mailtoHref: "mailto:contact@silveroakestate.online",

    primaryPhone: {
      display: "+91 86794 70955",
      e164: "+918679470955",
      telHref: "tel:+918679470955",
      whatsappHref: "https://wa.me/918679470955",
    },

    secondaryPhone: {
      display: "+91 99102 03212",
      e164: "+919910203212",
      telHref: "tel:+919910203212",
      whatsappHref: "https://wa.me/919910203212",
    },
  },

  location: {
    fullAddress:
      "Farm house 22, Phase 16, Green Beauty Farms, Sector 135, Noida, Uttar Pradesh 201310",
    mapsUrl: "https://maps.app.goo.gl/zaB8oYQeiaUWChYM7",
  },

  parking: {
    inside: {
      count: 3,
      valueLabel: "3 Vehicles",
      description:
        "Parking space for 3 vehicles is available inside the property.",
    },
    outside: {
      countLabel: "10+",
      valueLabel: "10+ Vehicles",
      description:
        "Parking space for 10+ vehicles is available outside the property.",
    },
    summary:
      "Parking space is available for 3 vehicles inside the property and 10+ vehicles outside the property.",
  },

  booking: {
    durationHours: 23,
    durationLabel: "standard 23-hour slot",

    checkIn: {
      timeLabel: "11:00 AM",
    },

    checkOut: {
      timeLabel: "10:00 AM the following day",
    },

    slotStatement:
      "Check-in is at 11:00 AM and checkout is at 10:00 AM the following day.",

    weekday: {
      label: "Weekday",
      ratePaise: 1_500_000,
    },

    weekend: {
      label: "Weekend",
      ratePaise: 2_000_000,
    },

    advancePaise: 500_000,

    balanceText:
      "Remaining balance payable at check-in before property access.",

    confirmationNotice:
      "Final pricing and applicable charges will be confirmed in writing before payment and booking confirmation.",
  },

  capacity: {
    overnightMax: 10,
    overnightLabel: "Up to 10 guests",

    indoorMax: 20,
    indoorLabel: "Up to 20 people",

    standardDayEventMax: 40,
    standardDayEventLabel: "Up to 40 people",

    largerEventStatement:
      "Events above 40 people require prior written approval after an operational and safety review.",
  },

  tax: {
    gstRegistered: false,
    currentStatement:
      "GST is not currently charged. Applicable GST may be added only after registration and will be disclosed before payment and booking confirmation.",
  },

  optionalArrangements: {
    statement:
      "Optional arrangements such as catering, DJ arrangements, photography shoots and event-related amenities are available only on request, subject to availability, written confirmation and a case-by-case assessment.",
  },
} as const;
