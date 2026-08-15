import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Rakshit Sinha collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy/" },
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="15 August 2026">
      <p>
        This Privacy Policy explains how Rakshit Sinha (“we”) collects, uses and protects your
        personal data when you use sinharakshit.com, in line with India’s Digital Personal Data
        Protection Act, 2023 (DPDP Act) and applicable data-protection principles.
      </p>

      <LegalSection n={1} title="Data we collect">
        <p>
          Account details (name, email); booking details (chosen class, date, notes); and payment
          metadata from our payment partners (transaction status and reference — we do{" "}
          <strong>not</strong> store your full card or bank details). We may collect basic usage
          data to keep the service secure.
        </p>
      </LegalSection>

      <LegalSection n={2} title="How we use it">
        <p>
          To create and manage your account, schedule and confirm sessions, process payments,
          share course materials, send service communications, and meet legal obligations.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Legal basis & consent">
        <p>
          We process your data with your consent (given when you sign up and accept our Terms) and
          as necessary to provide the services you request. You may withdraw consent at any time,
          subject to legal retention requirements.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Processors we use">
        <p>
          We rely on trusted third parties: <strong>Supabase</strong> (authentication, database,
          storage), <strong>Razorpay</strong> and <strong>Stripe</strong> (payments), and{" "}
          <strong>Resend</strong> (email). Each processes data under its own privacy terms.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Storage & security">
        <p>
          Data is stored on managed cloud infrastructure with access controls and row-level
          security. We retain data only as long as needed for the purposes above or as required by
          law.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Your rights">
        <p>
          You may request access to, correction of, or deletion of your personal data, and may
          nominate someone to exercise your rights. To make a request, email us (see below). You
          can request account deletion from the portal’s Settings.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Cookies">
        <p>
          We use essential cookies/local storage for authentication and to remember accessibility
          and display preferences. We do not use third-party advertising trackers.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Contact / Grievance">
        <p>
          For any privacy request or complaint, contact{" "}
          <a href="mailto:rsinha1369@gmail.com">rsinha1369@gmail.com</a>. We aim to respond within a
          reasonable time.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
