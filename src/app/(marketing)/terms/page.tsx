import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { legalInformation, refundWording } from "@/config/legal-information";
import {
  formatInrFromPaise,
  publicInformation,
} from "@/config/public-information";
import { LegalDocument, LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms and Conditions",
  description:
    "Booking terms for Silver Oak Estate: whole-property reservations, written confirmation, advance and refundable security deposit, cancellation, rescheduling, house rules and liability.",
  path: "/terms",
});

const SECTIONS = [
  ["about", "1. About Silver Oak Estate"],
  ["contracting-party", "2. Contracting party"],
  ["eligibility", "3. Eligibility and minimum age"],
  ["acceptance", "4. Acceptance of terms"],
  ["whole-property", "5. Whole-property booking model"],
  ["enquiries", "6. Availability enquiries"],
  ["written-confirmation", "7. Written confirmation"],
  ["rates", "8. Rates and quotations"],
  ["advance", "9. Booking advance"],
  ["deposit", "10. Separate refundable security deposit"],
  ["balance", "11. Balance payment"],
  ["taxes", "12. Taxes and GST"],
  ["cancellation", "13. Cancellation and refunds"],
  ["refund-processing", "14. Refund processing"],
  ["rescheduling", "15. Rescheduling"],
  ["no-show", "16. No-shows"],
  ["check-in-out", "17. Check-in and checkout"],
  ["capacity", "18. Capacity limits"],
  ["large-events", "19. Events above 40 people"],
  ["guest-responsibility", "20. Guest and attendee responsibility"],
  ["property-care", "21. Property care"],
  ["damage", "22. Damage, missing items and cleaning"],
  ["vendors", "23. Vendors and optional arrangements"],
  ["house-rules", "24. Alcohol, music and fireworks"],
  ["pool", "25. Pool and safety"],
  ["illegal-conduct", "26. Illegal or dangerous behaviour"],
  ["cctv", "27. CCTV"],
  ["photography", "28. Photography and marketing consent"],
  ["privacy", "29. Privacy"],
  ["platforms", "30. Third-party booking platforms"],
  ["force-majeure", "31. Force majeure"],
  ["termination", "32. Refusal, suspension or termination"],
  ["liability", "33. Liability and non-excludable rights"],
  ["complaints", "34. Complaints and grievances"],
  ["governing-law", "35. Governing law and jurisdiction"],
  ["severability", "36. Severability"],
  ["changes", "37. Changes to these terms"],
  ["contact", "38. Contact details"],
  ["effective-date", "39. Effective date"],
] as const;

export default function TermsPage() {
  const {
    contractingParty,
    invoiceIssuer,
    minimumBookingAge,
    bookingAdvancePaise,
    securityDepositPaise,
    depositReturnWindowLabel,
    cancellation,
    reschedule,
    governingLaw,
    jurisdiction,
  } = legalInformation;
  const { booking, capacity, contact, location, tax, optionalArrangements } =
    publicInformation;

  const partialBand = cancellation.bands.find((b) => b.refundPercent > 0 && b.refundPercent < 100)!;
  const advance = formatInrFromPaise(bookingAdvancePaise);
  const deposit = formatInrFromPaise(securityDepositPaise);
  const weekdayRate = formatInrFromPaise(booking.weekday.ratePaise);
  const weekendRate = formatInrFromPaise(booking.weekend.ratePaise);

  return (
    <Container className="py-16 max-w-3xl">
      <LegalDocument
        title="Terms and Conditions"
        effectiveDate={legalInformation.effectiveDateLabel}
        lastUpdated={legalInformation.lastUpdatedLabel}
        sections={SECTIONS}
      >
        <LegalSection id="about" heading="1. About Silver Oak Estate">
          <p>
            Silver Oak Estate is a private farmhouse property at{" "}
            {location.fullAddress}, offered for private stays and approved
            events. These Terms and Conditions apply to enquiries, bookings and
            stays at the property. Please also read our{" "}
            <Link href="/privacy">Privacy Policy</Link> and the{" "}
            <Link href="/policies">booking information summary</Link>.
          </p>
        </LegalSection>

        <LegalSection id="contracting-party" heading="2. Contracting party">
          <p>
            The booking agreement is between the booking guest and{" "}
            <strong>{contractingParty.name}</strong>, the property owner of
            Silver Oak Estate. Silver Oak Estate is the name of the property and
            is not a separate incorporated company.
          </p>
          <p>
            Booking payments are received in the bank account designated by{" "}
            {contractingParty.name}. Payment instructions are shared privately and
            confirmed in writing, and are never published on this website.
            Invoices and payment receipts are issued by {invoiceIssuer.name}.
          </p>
        </LegalSection>

        <LegalSection id="eligibility" heading="3. Eligibility and minimum age">
          <p>
            The person making a booking must be at least{" "}
            <strong>{minimumBookingAge} years old</strong> and must have the legal
            capacity to enter into this agreement. That person is the booking
            guest and is responsible for payments, for the guests, attendees and
            vendors they bring, for compliance with the property rules and
            applicable law, and for any damage or disturbance caused.
          </p>
          <p>
            Guests under {minimumBookingAge} may stay at the property only when
            accompanied and supervised by a responsible adult.
          </p>
        </LegalSection>

        <LegalSection id="acceptance" heading="4. Acceptance of terms">
          <p>
            By making an enquiry, confirming a booking or using the property, you
            accept these terms. Where a booking is confirmed in writing, these
            terms apply together with the written confirmation. If anything in the
            written confirmation differs from these terms, the written
            confirmation applies to that booking.
          </p>
        </LegalSection>

        <LegalSection id="whole-property" heading="5. Whole-property booking model">
          <p>
            Silver Oak Estate is reserved as{" "}
            <strong>one complete private property</strong>. Individual bedrooms
            are not sold or reserved separately, and the property is not shared
            with another group during a confirmed booking.
          </p>
        </LegalSection>

        <LegalSection id="enquiries" heading="6. Availability enquiries">
          <p>
            Availability is handled as an assisted enquiry. You may contact us by
            phone, WhatsApp or email, and you may view a read-only availability
            calendar on this website. <strong>An enquiry does not reserve the
            property</strong>, and selecting a date on the calendar does not
            create a reservation or hold.
          </p>
        </LegalSection>

        <LegalSection id="written-confirmation" heading="7. Written confirmation">
          <p>A booking is confirmed only when all of the following have happened:</p>
          <ol>
            <li>Availability for your dates has been approved;</li>
            <li>
              Final pricing and any applicable charges have been confirmed in
              writing;
            </li>
            <li>The required payment has been received; and</li>
            <li>Silver Oak Estate has issued a written booking confirmation.</li>
          </ol>
          <p>
            An enquiry, a calendar selection, a verbal discussion or a payment
            made without written confirmation does not on its own guarantee a
            booking. <strong>Payment alone does not automatically confirm a
            booking.</strong>
          </p>
        </LegalSection>

        <LegalSection id="rates" heading="8. Rates and quotations">
          <p>
            Published base rates for the {booking.durationLabel} are{" "}
            {weekdayRate} on a {booking.weekday.label.toLowerCase()} and{" "}
            {weekendRate} on a {booking.weekend.label.toLowerCase()}. The final
            price for your booking depends on the approved date, guest count,
            event requirements, any optional services, any additional charges
            agreed in writing, and applicable taxes if any.
          </p>
          <p>{booking.confirmationNotice}</p>
        </LegalSection>

        <LegalSection id="advance" heading="9. Booking advance">
          <p>
            A booking advance of <strong>{advance}</strong> is payable to hold an
            approved date. The advance is{" "}
            <strong>adjusted against the total booking price</strong>.
          </p>
          <p>
            The booking advance is <strong>not</strong> the refundable security
            deposit described in section 10. They are two separate amounts with
            different purposes.
          </p>
        </LegalSection>

        <LegalSection id="deposit" heading="10. Separate refundable security deposit">
          <p>
            A <strong>separate refundable security deposit of {deposit}</strong>{" "}
            may be required before access to the property. This deposit is{" "}
            <strong>not part of the booking price</strong> and{" "}
            <strong>not part of the booking advance</strong>. It is held only as
            security and is refundable.
          </p>
          <p>
            After checkout and inspection, the deposit is ordinarily refunded
            within <strong>{depositReturnWindowLabel}</strong>. Deductions may be
            made only for documented amounts relating to actual property damage,
            missing items, cleaning that materially exceeds normal post-stay
            turnover, overtime, or agreed charges that remain unpaid. We will give
            you a reasonable written explanation of any deduction, and the unused
            balance is returned to you.
          </p>
        </LegalSection>

        <LegalSection id="balance" heading="11. Balance payment">
          <p>
            {booking.balanceText} Different payment timing may apply only where it
            is expressly agreed in writing.
          </p>
        </LegalSection>

        <LegalSection id="taxes" heading="12. Taxes and GST">
          <p>
            {tax.currentStatement} Silver Oak Estate is not currently represented
            as being registered for GST. Applicable GST or another legally
            required tax may be added only after registration or where it
            otherwise becomes legally applicable, and any such amount will be
            disclosed to you in writing before payment and booking confirmation.
          </p>
        </LegalSection>

        <LegalSection id="cancellation" heading="13. Cancellation and refunds">
          <p>
            Cancellation refunds of refundable booking amounts are calculated from
            the check-in date as follows:
          </p>
          <table>
            <caption className="sr-only">
              Cancellation refund schedule by notice period
            </caption>
            <thead>
              <tr>
                <th scope="col">When you cancel</th>
                <th scope="col">Refund</th>
              </tr>
            </thead>
            <tbody>
              {cancellation.bands.map((band) => (
                <tr key={band.window}>
                  <th scope="row">{band.window}</th>
                  <td>{refundWording(band.refundPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Cancellation exactly {cancellation.partialRefundFromDays} days before
            check-in, or exactly {cancellation.partialRefundToDays} days before
            check-in, falls within the {partialBand.refundPercent}% band.
          </p>
          <p>
            The refundable security deposit is treated separately. Where the
            deposit has already been paid, the guest has not accessed the property
            and no damage or recoverable expense has occurred, the{" "}
            <strong>security deposit is returned in full</strong> and the
            cancellation percentages above are not applied to it.
          </p>
          <p>
            An amount is treated as non-refundable only where the schedule above
            makes it non-refundable, where a third-party vendor cost was
            separately disclosed and accepted by you in writing, or where
            applicable law permits it.
          </p>
        </LegalSection>

        <LegalSection id="refund-processing" heading="14. Refund processing">
          <p>
            Approved cancellation refunds are initiated within{" "}
            <strong>
              {cancellation.refundInitiationBusinessDays} business days
            </strong>{" "}
            after the cancellation is approved. Wherever reasonably possible, a
            refund is returned to the original payment method. Bank, UPI or
            payment-provider processing time applies after initiation, and we
            cannot control or promise the date on which your bank finally credits
            the funds.
          </p>
        </LegalSection>

        <LegalSection id="rescheduling" heading="15. Rescheduling">
          <p>
            You may request{" "}
            <strong>
              {reschedule.complimentaryCount} complimentary reschedule
            </strong>{" "}
            provided the request reaches us at least{" "}
            <strong>{reschedule.minimumNoticeDays} days before check-in</strong>{" "}
            and the replacement date is available. A reschedule is complete only
            once we confirm it in writing.
          </p>
          <p>
            If the replacement date carries a different price or different
            applicable charges, the difference will be set out in the written
            rescheduling confirmation and must be accepted before the reschedule
            is finalised.
          </p>
          <p>
            A second reschedule request may be treated as a cancellation of the
            existing booking and a new booking, subject to the cancellation
            schedule and to written confirmation.
          </p>
        </LegalSection>

        <LegalSection id="no-show" heading="16. No-shows">
          <p>
            A no-show means failing to arrive or to communicate with us within the
            agreed check-in arrangements, without an approved cancellation or
            reschedule. No refund is payable for a no-show.
          </p>
          <p>
            This does not apply where Silver Oak Estate has cancelled the booking
            or is unable to provide the property.
          </p>
        </LegalSection>

        <LegalSection id="check-in-out" heading="17. Check-in and checkout">
          <p>
            Check-in is at {booking.checkIn.timeLabel} and checkout is at{" "}
            {booking.checkOut.timeLabel}, giving the{" "}
            {booking.durationLabel}. Early check-in or late checkout is possible
            only where agreed in writing and may carry an additional charge.
          </p>
        </LegalSection>

        <LegalSection id="capacity" heading="18. Capacity limits">
          <ul>
            <li>
              <strong>Overnight stays:</strong>{" "}
              {capacity.overnightLabel.toLowerCase()}
            </li>
            <li>
              <strong>Indoor gatherings:</strong>{" "}
              {capacity.indoorLabel.toLowerCase()}
            </li>
            <li>
              <strong>Standard daytime events:</strong>{" "}
              {capacity.standardDayEventLabel.toLowerCase()}
            </li>
          </ul>
          <p>
            Capacity limits are set for safety and comfort and must not be
            exceeded without prior written approval.
          </p>
        </LegalSection>

        <LegalSection id="large-events" heading="19. Events above 40 people">
          <p>{capacity.largerEventStatement}</p>
        </LegalSection>

        <LegalSection id="guest-responsibility" heading="20. Guest and attendee responsibility">
          <p>
            The booking guest is responsible for the conduct of everyone they
            bring to the property, including guests, attendees and vendors, and
            for their compliance with applicable law, the property rules, safety
            instructions and the approved capacity. The booking guest is
            responsible for damage and for disturbance caused during the booking.
          </p>
        </LegalSection>

        <LegalSection id="property-care" heading="21. Property care">
          <p>
            Please treat the property, its furnishings, equipment and grounds with
            reasonable care, follow the access and safety instructions provided,
            and leave the property in a reasonable condition at checkout.
          </p>
        </LegalSection>

        <LegalSection id="damage" heading="22. Damage, missing items and cleaning">
          <p>
            You are responsible for the actual, reasonable cost of repairing
            damage caused by you or your invitees, and for the cost of replacing
            missing items. Additional cleaning charges apply only where cleaning
            materially exceeds normal post-stay turnover.
          </p>
          <p>
            The property is inspected after checkout. Damage, missing items or
            excess cleaning will be documented in writing or with photographs, and
            any deduction will be itemised or reasonably explained. Where the
            documented actual loss exceeds the security deposit, the balance
            remains payable; where it is less, the unused deposit balance is
            returned to you. We do not apply arbitrary or punitive charges.
          </p>
        </LegalSection>

        <LegalSection id="vendors" heading="23. Vendors and optional arrangements">
          <p>{optionalArrangements.statement}</p>
          <p>
            Vendors arranged by you remain your responsibility unless property
            management has directly engaged that vendor under a separate written
            arrangement. You must ensure your vendors follow the access
            instructions, follow safety and noise rules, avoid damaging the
            property, leave the site in an acceptable condition and hold any
            permissions legally required for their work.
          </p>
        </LegalSection>

        <LegalSection id="house-rules" heading="24. Alcohol, music and fireworks">
          <p>
            <strong>Alcohol.</strong> Alcohol is permitted only for guests of
            legal drinking age. You remain responsible for lawful consumption and
            for the conduct of everyone at the property. Nothing here represents
            that alcohol is licensed for sale or service at the property.
          </p>
          <p>
            <strong>Music and noise.</strong> Music and noise must comply with
            local regulations and with any quiet-hour or operational limits
            communicated to you in writing or displayed on site.
          </p>
          <p>
            <strong>Fireworks and special effects.</strong> Fireworks and special
            effects are prohibited without prior written approval. Written
            approval does not override any legal permission requirement or safety
            restriction that applies.
          </p>
        </LegalSection>

        <LegalSection id="pool" heading="25. Pool and safety">
          <p>
            The pool must be used responsibly. Children must be continuously
            supervised by a responsible adult. Running, dangerous conduct and pool
            use while intoxicated may be restricted. Pool use carries inherent
            risks, and guests should take reasonable care for their own safety and
            the safety of others.
          </p>
        </LegalSection>

        <LegalSection id="illegal-conduct" heading="26. Illegal or dangerous behaviour">
          <p>
            Illegal substances, illegal activities, violence, dangerous conduct,
            conduct creating a material safety risk and deliberate property damage
            are strictly prohibited.
          </p>
        </LegalSection>

        <LegalSection id="cctv" heading="27. CCTV">
          <p>
            CCTV cameras are installed only in outdoor and common areas, for guest
            safety, property security and incident investigation.{" "}
            <strong>
              No CCTV cameras are installed in bedrooms, bathrooms or private
              indoor spaces.
            </strong>{" "}
            Footage is retained only for a limited period reasonably necessary for
            security, incident review and legal obligations. See our{" "}
            <Link href="/privacy">Privacy Policy</Link> for details.
          </p>
        </LegalSection>

        <LegalSection id="photography" heading="28. Photography and marketing consent">
          <p>
            We do not use guest photographs or videos for promotional or marketing
            purposes without prior consent, and making a booking does not by
            itself grant that consent. Consent is specific and voluntary and may
            be withdrawn for future use. Professional or commercial shoots at the
            property are agreed separately in writing.
          </p>
        </LegalSection>

        <LegalSection id="privacy" heading="29. Privacy">
          <p>
            Personal information is handled as described in our{" "}
            <Link href="/privacy">Privacy Policy</Link>, which explains what we
            collect, why, how long we keep it, and how to make a request or raise
            a grievance.
          </p>
        </LegalSection>

        <LegalSection id="platforms" heading="30. Third-party booking platforms">
          <p>
            Where a booking is made through an approved third-party platform, that
            platform&rsquo;s transaction terms may also apply to the booking,
            including its cancellation and refund rules where they are legally or
            contractually required. Our property, safety, capacity and conduct
            rules continue to apply to everyone at the property.
          </p>
        </LegalSection>

        <LegalSection id="force-majeure" heading="31. Force majeure">
          <p>
            If performance of a booking becomes impossible or unsafe because of
            events beyond reasonable control — including natural events, severe
            weather, fire, utility failure, epidemic or pandemic restrictions,
            government or regulatory orders, or civil disturbance — we will notify
            you as soon as reasonably practicable and work with you on a
            resolution, which may include rescheduling, a credit or another lawful
            outcome appropriate to the circumstances. Your rights under applicable
            consumer-protection law are preserved.
          </p>
        </LegalSection>

        <LegalSection id="termination" heading="32. Refusal, suspension or termination">
          <p>
            We may refuse entry, or require guests to leave, where there is a
            serious breach of these terms, a material safety risk, illegal
            conduct, a serious property-rule violation or a material breach of the
            approved capacity. Any such action is taken subject to applicable law
            and, wherever practicable, after a reasonable warning.
          </p>
        </LegalSection>

        <LegalSection id="liability" heading="33. Liability and non-excludable rights">
          <p>
            Guests are responsible for their own conduct and for risks inherent in
            using a private property, including the pool, outdoor areas and
            equipment.
          </p>
          <p>
            Nothing in these terms excludes or limits any liability that cannot
            lawfully be excluded or limited, including liability arising from
            fraud, wilful misconduct, gross negligence, death or personal injury
            caused by negligence, or any other non-excludable legal duty. Your
            rights under applicable consumer-protection law are not affected.
          </p>
        </LegalSection>

        <LegalSection id="complaints" heading="34. Complaints and grievances">
          <p>
            Please raise any complaint with us as early as possible so that we can
            address it. Privacy grievances may be sent to{" "}
            {legalInformation.grievanceOfficer.name} at{" "}
            <a href={legalInformation.grievanceOfficer.mailtoHref}>
              {legalInformation.grievanceOfficer.email}
            </a>{" "}
            or{" "}
            <a href={legalInformation.grievanceOfficer.telHref}>
              {legalInformation.grievanceOfficer.phoneDisplay}
            </a>
            . Other booking complaints may be sent to{" "}
            <a href={contact.mailtoHref}>{contact.email}</a>.
          </p>
        </LegalSection>

        <LegalSection id="governing-law" heading="35. Governing law and jurisdiction">
          <p>
            These terms are governed by the laws of {governingLaw} and are subject
            to applicable consumer-protection law and to non-waivable statutory
            rights. The courts of competent jurisdiction at {jurisdiction} will
            have jurisdiction over disputes.
          </p>
          <p>
            Nothing in this section prevents a consumer from approaching a
            legally competent consumer commission or another statutory authority
            where the law gives that right.
          </p>
        </LegalSection>

        <LegalSection id="severability" heading="36. Severability">
          <p>
            If any provision of these terms is found to be invalid or
            unenforceable, that provision applies only to the extent permitted and
            the remaining provisions continue in full force.
          </p>
        </LegalSection>

        <LegalSection id="changes" heading="37. Changes to these terms">
          <p>
            We may update these terms. The version published on this page at the
            time your booking is confirmed in writing applies to that booking.
          </p>
        </LegalSection>

        <LegalSection id="contact" heading="38. Contact details">
          <ul>
            <li>
              <strong>Property:</strong> Silver Oak Estate, {location.fullAddress}
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href={contact.mailtoHref}>{contact.email}</a>
            </li>
            <li>
              <strong>Phone:</strong>{" "}
              <a href={contact.primaryPhone.telHref}>
                {contact.primaryPhone.display}
              </a>{" "}
              /{" "}
              <a href={contact.secondaryPhone.telHref}>
                {contact.secondaryPhone.display}
              </a>
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="effective-date" heading="39. Effective date">
          <p>
            These Terms and Conditions are effective from{" "}
            {legalInformation.effectiveDateLabel} and were last updated on{" "}
            {legalInformation.lastUpdatedLabel}.
          </p>
        </LegalSection>
      </LegalDocument>
    </Container>
  );
}
