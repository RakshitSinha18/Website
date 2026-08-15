import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms & Conditions for Rakshit Sinha's evening BI classes and mentoring.",
  alternates: { canonical: "/terms/" },
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="15 August 2026">
      <p>
        These Terms govern your use of sinharakshit.com (the “Site”) and the evening classes and
        1-on-1 mentoring offered by Rakshit Sinha (“we”, “us”). By creating an account, booking a
        session, or making a payment, you agree to these Terms.
      </p>

      <LegalSection n={1} title="Services">
        <p>
          We provide paid educational sessions in business intelligence and data analytics
          (Tableau, SQL, Advanced Excel, Base SAS and related topics), delivered online outside
          standard office hours. Sessions are for personal learning and are non-transferable.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Accounts">
        <p>
          You must provide accurate information and keep your login credentials secure. You are
          responsible for activity under your account. We may suspend accounts that violate these
          Terms or that we reasonably believe are fraudulent.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Bookings & payments">
        <p>
          Sessions are requested through the student portal and confirmed after payment is received
          via our payment partners (e.g. Razorpay for INR and Stripe for international cards).
          Prices are shown before checkout. A booking is confirmed only once payment is verified.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Rescheduling & cancellations">
        <p>
          Requests to reschedule should be made at least 24 hours before the session. Cancellations
          and refunds are governed by our <a href="/refund/">Refund Policy</a>.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Course materials">
        <p>
          Slides, notes and other materials shared with you remain our intellectual property and
          are licensed to you for personal, non-commercial learning only. You may not redistribute,
          resell or publish them without written permission.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Acceptable use">
        <p>
          You agree not to misuse the Site, attempt to gain unauthorised access, or disrupt other
          users. Recording sessions requires prior consent.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Disclaimers & liability">
        <p>
          Sessions are provided on an “as is” basis for educational purposes. We do not guarantee
          specific career or financial outcomes. To the extent permitted by law, our liability is
          limited to the amount you paid for the relevant session.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Changes & governing law">
        <p>
          We may update these Terms; material changes will be posted here. These Terms are governed
          by the laws of India, with courts at Mumbai, Maharashtra having jurisdiction.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Contact">
        <p>
          Questions? Email <a href="mailto:rsinha1369@gmail.com">rsinha1369@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
