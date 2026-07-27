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
    durationLabel: "24 hours",

    weekday: {
      label: "Weekday",
      ratePaise: 1_500_000,
    },

    weekend: {
      label: "Weekend",
      ratePaise: 2_000_000,
    },

    advancePaise: 500_000,

    balanceText: "Remaining balance payable at check-in.",

    confirmationNotice:
      "Final pricing and applicable charges will be confirmed in writing before payment and booking confirmation.",
  },

  optionalArrangements: {
    statement:
      "Optional arrangements such as catering, DJ arrangements, photography shoots and event-related amenities are available only on request, subject to availability, written confirmation and a case-by-case assessment.",
  },
} as const;
