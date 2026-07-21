import Link from "next/link";
import { Button } from "../ui/button";

export function MobileBookingCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--background)] p-4 sm:hidden pb-safe">
      <Link href="/book" className="block w-full">
        <Button className="w-full">Check Availability & Book</Button>
      </Link>
    </div>
  );
}
