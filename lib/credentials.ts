// Certifications & credentials shown in the About section.
// EDIT: add your real certifications here — the section stays completely
// hidden while this list is empty, so nothing unverified ever shows.
// Example:
//   { name: "Tableau Desktop Specialist", issuer: "Tableau", year: "2022",
//     url: "https://www.credly.com/badges/..." },

export interface Certification {
  name: string
  issuer: string
  year?: string
  url?: string // verification link (Credly, issuer page…) — optional
}

export const CERTIFICATIONS: Certification[] = [
  // EDIT: add entries — e.g.
  // { name: "Microsoft Certified: Power BI Data Analyst Associate", issuer: "Microsoft", year: "2023" },
]
