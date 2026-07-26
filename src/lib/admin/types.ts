export type AdminListQuery = {
  page: number;
  pageSize: number;
  bookingReference?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  notificationStatus?: string;
  recoveryState?: string;
  checkInFrom?: string;
  checkInTo?: string;
  sort: "newest" | "oldest";
};

export type AdminBookingListItem = {
  bookingReference: string;
  checkInAt: string;
  checkOutAt: string;
  customerNameMasked: string;
  customerEmailMasked: string | null;
  customerPhoneMasked: string;
  bookingStatus: string;
  holdExpiresAt: string | null;
  reservationStatus: string | null;
  reservationType: string | null;
  advanceAmountPaise: number;
  paymentProvider: string | null;
  paymentStatus: string | null;
  recoveryState: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminPaymentItem = {
  bookingReference: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: string;
  verificationSource: string | null;
  recoveryReason: string | null;
  failureCode: string | null;
  orderCreatedAt: string | null;
  checkoutStartedAt: string | null;
  authorizedAt: string | null;
  capturedAt: string | null;
  verifiedAt: string | null;
  recoveryRequiredAt: string | null;
  createdAt: string;
  updatedAt: string;
  providerEventId: string | null;
};

export type AdminNotificationItem = {
  bookingReference: string | null;
  channel: string;
  templateKey: string;
  recipientMasked: string | null;
  status: string;
  deliveryLabel: "queued" | "delivered" | "failed";
  deliveryNote: string;
  attemptCount: number;
  createdAt: string;
  sentAt: string | null;
};

export type AdminTimelineItem = {
  kind: "booking" | "reservation" | "payment" | "audit" | "notification";
  label: string;
  state: string | null;
  occurredAt: string;
};

export type AdminBookingDetail = {
  booking: AdminBookingListItem & {
    customerEmailMasked: string | null;
    customerPhoneMasked: string;
    totalAmountPaise: number;
    balanceAmountPaise: number;
    guestCount: number;
    overnightGuestCount: number | null;
  };
  holdEligible: boolean;
  authoritativeReservationExists: boolean;
  inventoryConverted: boolean;
  moneyCaptured: boolean;
  moneyVerified: boolean;
  interventionRequired: boolean;
  payments: AdminPaymentItem[];
  notifications: AdminNotificationItem[];
  timeline: AdminTimelineItem[];
};

export type AdminPageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminActiveInventoryBlock = {
  reservationId: string;
  reservationType: "owner_block" | "maintenance_block";
  status: "active";
  startAt: string;
  endAt: string;
  createdAt: string;
};
