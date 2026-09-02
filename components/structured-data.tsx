import { COURSES } from "@/lib/courses"
import { FAQS } from "@/lib/faqs"

/**
 * JSON-LD structured data for search engines: Person (knowledge-panel signals),
 * FAQPage (FAQ rich results) and the course catalogue as an ItemList of Course
 * entries. Rendered once from the root layout. Everything here mirrors visible
 * page content — keep it that way, or Google treats it as spam markup.
 */

const SITE_URL = "https://sinharakshit.com"

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Rakshit Sinha",
  url: SITE_URL,
  image: `${SITE_URL}/brand/og-image.png`,
  jobTitle: "Senior Business Intelligence Consultant",
  worksFor: { "@type": "Organization", name: "IBM" },
  address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressCountry: "IN" },
  sameAs: ["https://www.linkedin.com/in/rakshitsinha555/", "https://github.com/RakshitSinha18"],
  knowsAbout: ["Business Intelligence", "Tableau", "Power BI", "SQL", "Advanced Excel", "Base SAS", "Data Analytics"],
}

const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}

const courseList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: COURSES.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Course",
      name: c.title,
      description: c.summary,
      url: `${SITE_URL}/#courses`,
      provider: { "@type": "Person", name: "Rakshit Sinha", url: SITE_URL },
    },
  })),
}

// "<" is escaped so user-visible copy can never terminate the script tag.
function Schema({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}

export function StructuredData() {
  return (
    <>
      <Schema data={person} />
      <Schema data={faqPage} />
      <Schema data={courseList} />
    </>
  )
}
