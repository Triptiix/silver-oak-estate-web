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
      rate: "₹15,000",
    },
    weekend: {
      label: "Weekend",
      rate: "₹20,000",
    },
    advance: "₹5,000",
    balanceText: "Remaining balance payable at check-in.",
    confirmationNotice:
      "Final pricing and applicable charges will be confirmed in writing before payment and booking confirmation.",
  },

  optionalArrangements: {
    statement:
      "Optional arrangements such as catering, DJ arrangements, photography shoots and event-related amenities are available only on request, subject to availability, written confirmation and a case-by-case assessment.",
  },
} as const;
