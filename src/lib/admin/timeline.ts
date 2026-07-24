import type { AdminTimelineItem } from "./types";

type OrderedTimelineItem = AdminTimelineItem & {
  sourcePriority: number;
  typePriority: number;
  orderingId: string;
};

export function orderAdminTimeline(items: OrderedTimelineItem[]): AdminTimelineItem[] {
  return [...items]
    .sort((a, b) =>
      Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
      || a.sourcePriority - b.sourcePriority
      || a.typePriority - b.typePriority
      || a.orderingId.localeCompare(b.orderingId)
    )
    .map(({ kind, label, state, occurredAt }) => ({ kind, label, state, occurredAt }));
}
