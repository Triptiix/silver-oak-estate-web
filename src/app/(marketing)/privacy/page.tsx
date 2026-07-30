import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { Container } from "@/components/ui/container";
import { legalInformation } from "@/config/legal-information";
import { publicInformation } from "@/config/public-information";
import { LegalDocument, LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description:
    "How Silver Oak Estate collects, uses, retains and protects personal information for enquiries, bookings and stays at the private farmhouse estate in Sector 135, Noida.",
  path: "/privacy",
});

const SECTIONS = [
  ["introduction", "1. Introduction"],
  ["controller", "2. Who controls your personal data"],
  ["grievance", "3. Contact and grievance details"],
  ["information-collected", "4. Information we collect"],
  ["sources", "5. Where the information comes from"],
  ["purposes", "6. Why we process your information"],
  ["lawful-grounds", "7. Consent and other lawful grounds"],
  ["communications", "8. Booking and enquiry communications"],
  ["payments", "9. Payment and transaction information"],
  ["cctv", "10. CCTV"],
  ["photography", "11. Photography and marketing consent"],
  ["cookies", "12. Cookies and technical information"],
  ["service-providers", "13. Service providers and disclosures"],
  ["legal-disclosures", "14. Legal and safety disclosures"],
  ["retention", "15. Data retention"],
  ["security", "16. Data security"],
  ["rights", "17. Your rights and requests"],
  ["children", "18. Children and minimum booking age"],
  ["third-parties", "19. Third-party platforms and links"],
  ["changes", "20. Changes to this policy"],
  ["contact", "21. Contact information"],
  ["effective-date", "22. Effective date"],
] as const;

export default function PrivacyPage() {
  const { grievanceOfficer, dataFiduciary, retention, minimumBookingAge } =
    legalInformation;
  const { contact, location } = publicInformation;

  return (
    <Container className="py-16 max-w-3xl">
      <LegalDocument
        title="Privacy Policy"
        effectiveDate={legalInformation.effectiveDateLabel}
        lastUpdated={legalInformation.lastUpdatedLabel}
        sections={SECTIONS}
      >
        <LegalSection id="introduction" heading="1. Introduction">
          <p>
            Silver Oak Estate is a private farmhouse property at{" "}
            {location.fullAddress}, offered as one complete property for private
            stays and approved events. This Privacy Policy explains what personal
            information we collect when you enquire about, book or visit the
            property, why we process it, how long we keep it, and the choices and
            requests available to you under applicable law.
          </p>
          <p>
            Please read this policy together with our{" "}
            <Link href="/terms">Terms and Conditions</Link> and the{" "}
            <Link href="/policies">booking information summary</Link>.
          </p>
        </LegalSection>

        <LegalSection id="controller" heading="2. Who controls your personal data">
          <p>
            {dataFiduciary.name}, the property owner of Silver Oak Estate, decides
            how and why your personal information is processed and acts as the
            Data Fiduciary (also described as the data controller) for that
            information. Bookings are contracted with {dataFiduciary.name}{" "}
            personally; Silver Oak Estate is the name of the property and is not
            represented as a separate incorporated company.
          </p>
        </LegalSection>

        <LegalSection id="grievance" heading="3. Contact and grievance details">
          <p>
            For any privacy question, request or grievance, please contact our
            grievance contact:
          </p>
          <ul>
            <li>
              <strong>Name:</strong> {grievanceOfficer.name},{" "}
              {grievanceOfficer.title}
            </li>
            <li>
              <strong>Email:</strong>{" "}
              <a href={grievanceOfficer.mailtoHref}>{grievanceOfficer.email}</a>
            </li>
            <li>
              <strong>Phone:</strong>{" "}
              <a href={grievanceOfficer.telHref}>
                {grievanceOfficer.phoneDisplay}
              </a>
            </li>
            <li>
              <strong>Address:</strong> {location.fullAddress}
            </li>
          </ul>
          <p>{grievanceOfficer.responseCommitment}</p>
        </LegalSection>

        <LegalSection id="information-collected" heading="4. Information we collect">
          <p>
            We collect only what we need to answer your enquiry and to operate a
            booking. Depending on how you contact us, this may include:
          </p>
          <ul>
            <li>Your name</li>
            <li>Your phone number</li>
            <li>Your email address</li>
            <li>Requested dates and the nature of the stay or event</li>
            <li>Guest or attendee numbers</li>
            <li>The content of your messages and our correspondence</li>
            <li>A booking reference, where a booking is created</li>
            <li>
              Payment status, transaction reference and receipt information for
              amounts paid
            </li>
            <li>
              Website request and security logs, such as the pages requested and
              technical information needed to keep the site available and secure
            </li>
            <li>
              Availability interactions, such as the dates you view on the
              read-only availability calendar
            </li>
          </ul>
          <p>
            We do not collect Aadhaar numbers, passports or other government
            identity documents, complete payment-card numbers, biometric
            information, continuous precise location, or health information
            through this website. If a specific booking ever requires identity
            information for a lawful purpose, it will be requested separately and
            explained to you at that time.
          </p>
        </LegalSection>

        <LegalSection id="sources" heading="5. Where the information comes from">
          <p>
            Most information comes directly from you when you call, send a
            WhatsApp message, send an email or use the enquiry details on this
            website. Some technical information is generated automatically when
            your browser requests a page. Where you book through an approved
            third-party platform, we may receive your booking details from that
            platform.
          </p>
        </LegalSection>

        <LegalSection id="purposes" heading="6. Why we process your information">
          <ul>
            <li>To respond to your enquiry and confirm availability</li>
            <li>To prepare and confirm pricing in writing</li>
            <li>To create, confirm, reschedule or cancel a booking</li>
            <li>To arrange access, check-in and checkout</li>
            <li>
              To process the booking advance, the refundable security deposit,
              balance payments and any refund
            </li>
            <li>To keep records of payments, receipts and refunds</li>
            <li>
              To maintain safety and security of the property, guests and
              neighbours
            </li>
            <li>To handle complaints, incidents, damage assessment and disputes</li>
            <li>To meet accounting, tax and other legal obligations</li>
            <li>To prevent fraud and misuse of the property or this website</li>
          </ul>
        </LegalSection>

        <LegalSection id="lawful-grounds" heading="7. Consent and other lawful grounds">
          <p>
            We process personal information on the basis of your consent, given
            when you contact us or provide details for a booking, and on other
            lawful grounds available under applicable law, such as performing the
            booking agreement you have entered into, complying with legal
            obligations, and legitimate purposes including safety, security and
            fraud prevention. As applicable laws and regulations, including the
            Digital Personal Data Protection Act, 2023, come into force, we will
            align our practices with the requirements that apply to us.
          </p>
          <p>
            You may withdraw consent for processing that relies on consent. The
            withdrawal applies going forward and does not affect processing
            already carried out, and it may mean we can no longer progress an
            enquiry or booking.
          </p>
        </LegalSection>

        <LegalSection id="communications" heading="8. Booking and enquiry communications">
          <p>
            We use your phone number, WhatsApp number or email address to reply to
            your enquiry and to send operational messages such as availability
            confirmation, written pricing, payment instructions, booking
            confirmation, reminders, and information about access and checkout. We
            do not send promotional messages to you without your consent, and any
            marketing consent can be withdrawn at any time.
          </p>
        </LegalSection>

        <LegalSection id="payments" heading="9. Payment and transaction information">
          <p>
            Complete card numbers, CVV codes, net-banking credentials and similar
            payment credentials should not be submitted through this website and
            are not collected here. Payment instructions are shared privately and
            confirmed in writing. Where a bank or payment provider is used, that
            provider processes payment information under its own terms and privacy
            practices.
          </p>
          <p>We may retain the payment amount, transaction reference, payment status, receipt and refund status for accounting, dispute-handling and legal purposes.</p>
        </LegalSection>

        <LegalSection id="cctv" heading="10. CCTV">
          <p>
            CCTV cameras are installed only in outdoor areas and common areas of
            the property, for guest safety, property security and investigating
            incidents.
          </p>
          <p>
            <strong>
              No CCTV cameras are installed in bedrooms, bathrooms or private
              indoor spaces.
            </strong>
          </p>
          <p>
            Security footage is retained only for a limited period reasonably
            necessary for security, incident review and any legal obligation, and
            is then overwritten or deleted in the ordinary course.
          </p>
        </LegalSection>

        <LegalSection id="photography" heading="11. Photography and marketing consent">
          <p>
            We do not use photographs or videos of guests for promotional or
            marketing purposes without prior consent. Making a booking does not by
            itself give us permission to use your images for marketing.
          </p>
          <p>
            Any marketing consent must be specific and voluntary, and you may
            withdraw it for future use at any time by contacting our grievance
            contact. Withdrawal does not necessarily require us to recall material
            that was lawfully published before the withdrawal, but we will stop
            further use where that is reasonably practicable and legally required.
          </p>
          <p>
            Rules for professional or commercial photography and video shoots at
            the property are agreed separately in writing.
          </p>
        </LegalSection>

        <LegalSection id="cookies" heading="12. Cookies and technical information">
          <p>
            This website does not use advertising cookies and does not run
            third-party analytics or tracking. We use only essential technical
            storage needed for the site to function and to keep it secure, and
            secure session cookies for the private administrator area, which is
            not part of the public website.
          </p>
          <p>
            Because we do not set non-essential cookies, no cookie consent banner
            is presented. If that changes in future, this policy will be updated
            and any consent required by applicable law will be obtained.
          </p>
        </LegalSection>

        <LegalSection id="service-providers" heading="13. Service providers and disclosures">
          <p>
            We share personal information only where it is necessary, including
            with hosting and infrastructure providers that operate this website
            and its database, with banks or payment providers used to receive
            payments or issue refunds, with communication services used to reply
            to you, and with professional advisers such as accountants. These
            providers process information for the purposes described in this
            policy and under their own terms.
          </p>
          <p>We do not sell your personal information.</p>
        </LegalSection>

        <LegalSection id="legal-disclosures" heading="14. Legal and safety disclosures">
          <p>
            We may disclose information where we are required or permitted to do
            so under applicable law, to comply with a lawful request from a court,
            regulator or law-enforcement authority, to establish, exercise or
            defend legal claims, or where disclosure is reasonably necessary to
            protect the safety of people or property.
          </p>
        </LegalSection>

        <LegalSection id="retention" heading="15. Data retention">
          <ul>
            <li>
              <strong>Booked guests:</strong> we retain guest information for{" "}
              {retention.bookedGuestMonths} months after checkout, unless a longer
              period is required for legal, accounting, dispute, safety or
              fraud-prevention reasons.
            </li>
            <li>
              <strong>Enquiries that do not become bookings:</strong> we keep the
              information only as long as reasonably necessary to respond and
              manage follow-up, and ordinarily delete or anonymise it no later
              than {retention.enquiryMonths} months after the last meaningful
              interaction, unless the law or an active dispute requires longer
              retention.
            </li>
            <li>
              <strong>Payment and accounting records:</strong> retained for the
              period required by applicable tax and accounting rules.
            </li>
            <li>
              <strong>Security footage:</strong> retained only for the limited
              period described in section 10.
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="security" heading="16. Data security">
          <p>
            We apply reasonable technical and organisational safeguards to protect
            personal information, including restricting access to the private
            administrator area, using encrypted connections for this website, and
            limiting who can view booking records. However, no method of
            transmission or storage is completely secure, and we cannot guarantee
            absolute security. If a personal-data breach occurs, we will respond
            according to applicable law.
          </p>
        </LegalSection>

        <LegalSection id="rights" heading="17. Your rights and requests">
          <p>
            Subject to applicable law, you may ask us to provide access to the
            personal information we hold about you, correct information that is
            inaccurate, complete information that is incomplete, delete or erase
            information where it is no longer required, withdraw a consent you
            previously gave, or address a grievance about how your information has
            been handled.
          </p>
          <p>
            To make a request, contact{" "}
            <a href={grievanceOfficer.mailtoHref}>{grievanceOfficer.email}</a> or{" "}
            <a href={grievanceOfficer.telHref}>{grievanceOfficer.phoneDisplay}</a>.
            We may need to verify your identity before acting on a request.
          </p>
          <p>
            These rights remain subject to applicable law, identity verification,
            legal and accounting retention requirements, fraud prevention, ongoing
            disputes and safety records. Where we cannot fully act on a request, we
            will explain why to the extent the law allows.
          </p>
        </LegalSection>

        <LegalSection id="children" heading="18. Children and minimum booking age">
          <p>
            The person making a booking must be at least {minimumBookingAge} years
            old and able to enter into a binding agreement. This website is not
            directed at children, and we do not knowingly collect personal
            information from children through it. Guests under{" "}
            {minimumBookingAge} may stay at the property only when accompanied and
            supervised by a responsible adult who is responsible for them.
          </p>
        </LegalSection>

        <LegalSection id="third-parties" heading="19. Third-party platforms and links">
          <p>
            This website links to external services such as Google Maps and
            WhatsApp, and bookings may be made through approved third-party
            platforms. Those services operate under their own terms and privacy
            policies, and this policy does not cover their processing. Please
            review their policies before using them.
          </p>
        </LegalSection>

        <LegalSection id="changes" heading="20. Changes to this policy">
          <p>
            We may update this policy to reflect changes in our operations or in
            applicable law. The updated version is published on this page with a
            revised &ldquo;last updated&rdquo; date. Where a change materially
            affects how we handle your information, we will take reasonable steps
            to inform you.
          </p>
        </LegalSection>

        <LegalSection id="contact" heading="21. Contact information">
          <ul>
            <li>
              <strong>Privacy grievance contact:</strong>{" "}
              {grievanceOfficer.name} —{" "}
              <a href={grievanceOfficer.mailtoHref}>{grievanceOfficer.email}</a>,{" "}
              <a href={grievanceOfficer.telHref}>
                {grievanceOfficer.phoneDisplay}
              </a>
            </li>
            <li>
              <strong>General enquiries:</strong>{" "}
              <a href={contact.mailtoHref}>{contact.email}</a>,{" "}
              <a href={contact.primaryPhone.telHref}>
                {contact.primaryPhone.display}
              </a>
            </li>
            <li>
              <strong>Property address:</strong> {location.fullAddress}
            </li>
          </ul>
        </LegalSection>

        <LegalSection id="effective-date" heading="22. Effective date">
          <p>
            This Privacy Policy is effective from{" "}
            {legalInformation.effectiveDateLabel} and was last updated on{" "}
            {legalInformation.lastUpdatedLabel}.
          </p>
        </LegalSection>
      </LegalDocument>
    </Container>
  );
}
