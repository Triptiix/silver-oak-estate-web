"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "./availability-calendar";
import { SelectedDateSummary } from "./selected-date-summary";

export function AvailabilityFlow() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();

  return (
    <div>
      <AvailabilityCalendar
        selectedDate={selectedDate}
        onSelectDate={(date, priceAmountPaise) => {
          setSelectedDate(date);
          setSelectedPrice(priceAmountPaise);
        }}
      />
      {selectedDate && selectedPrice !== undefined && (
        <SelectedDateSummary
          dateStr={selectedDate}
          priceAmountPaise={selectedPrice}
        />
      )}
    </div>
  );
}
