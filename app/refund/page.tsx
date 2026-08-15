import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/legal-page"

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund and cancellation terms for Rakshit Sinha's evening BI classes.",
  alternates: { canonical: "/refund/" },
}

export default function RefundPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="15 August 2026">
      <p>
        We want you to be confident booking a session. This policy explains when refunds and
        cancellations apply. It is designed to be fair to students while accounting for the fact
        that sessions are 1-on-1 and time is reserved specifically for you.
      </p>

      <LegalSection n={1} title="Before a session is confirmed">
        <p>
          If your payment has been made but the session has not yet been confirmed or scheduled,
          you may request a full refund by emailing us.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Rescheduling">
        <p>
          You may reschedule a confirmed session free of charge with at least{" "}
          <strong>24 hours’ notice</strong>. Rescheduling with less than 24 hours’ notice may be
          treated as a cancellation.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Cancellations by you">
        <ul className="ml-4 list-disc space-y-1">
          <li>More than 24 hours before the session: full refund.</li>
          <li>Less than 24 hours before, or no-show: refund may not be available, as the slot was reserved.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Cancellations by us">
        <p>
          If we cancel or cannot deliver a confirmed session, you will receive a full refund or a
          free reschedule, at your choice.
        </p>
      </LegalSection>

      <LegalSection n={5} title="How refunds are issued">
        <p>
          Approved refunds are processed to your original payment method through our payment
          partner (Razorpay or Stripe). Refunds typically take{" "}
          <strong>5–10 business days</strong> to appear, depending on your bank or card issuer.
        </p>
      </LegalSection>

      <LegalSection n={6} title="How to request a refund">
        <p>
          Email <a href="mailto:rsinha1369@gmail.com">rsinha1369@gmail.com</a> with your account
          email and the session details. We aim to respond within 2–3 business days.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
