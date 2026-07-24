"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "./availability-calendar";
import { SelectedDateSummary } from "./selected-date-summary";

export function AvailabilityFlow() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedPrice, setSelectedPrice] = useState<number | undefined>();
  const [selectedAdvance, setSelectedAdvance] = useState<number | undefined>();
  const [checkInTime, setCheckInTime] = useState<string | undefined>();
  const [checkOutTime, setCheckOutTime] = useState<string | undefined>();

  return (
    <div>
      <AvailabilityCalendar
        selectedDate={selectedDate}
        onSelectDate={(date, price, advance, inTime, outTime) => {
          setSelectedDate(date);
          setSelectedPrice(price);
          setSelectedAdvance(advance);
          setCheckInTime(inTime);
          setCheckOutTime(outTime);
        }}
      />
      {selectedDate && selectedPrice !== undefined && selectedAdvance !== undefined && checkInTime && checkOutTime && (
        <SelectedDateSummary
          dateStr={selectedDate}
          priceAmountPaise={selectedPrice}
          advanceAmountPaise={selectedAdvance}
          checkInTime={checkInTime}
          checkOutTime={checkOutTime}
        />
      )}
    </div>
  );
}
