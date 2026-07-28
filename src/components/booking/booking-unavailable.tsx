import { publicInformation } from "@/config/public-information";

export function BookingUnavailable() {
  const { contact } = publicInformation;

  return (
    <section
      aria-labelledby="online-booking-unavailable-title"
      className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center shadow-sm sm:p-8"
    >
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-800">
        Assisted booking available
      </p>
      <h2
        id="online-booking-unavailable-title"
        className="text-2xl font-semibold tracking-tight text-slate-950"
      >
        Online reservations are being prepared
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-slate-700">
        For current availability, pricing confirmation or a booking request, please contact the Silver Oak Estate team directly. No online payment is being collected through this page right now.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={contact.primaryPhone.telHref}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 py-3 font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          Call {contact.primaryPhone.display}
        </a>
        <a
          href={contact.primaryPhone.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-950 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          WhatsApp the team
        </a>
        <a
          href={contact.mailtoHref}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 font-medium text-slate-950 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          Email an enquiry
        </a>
      </div>

      <p className="mt-5 text-sm text-slate-600">
        Alternate contact: {contact.secondaryPhone.display}
      </p>
    </section>
  );
}
