export interface Course {
  id: string
  title: string
  tagline: string
  level: string
  duration: string
  accent: [string, string] // gradient stops
  summary: string
  // Deep-dive content
  forWhom: string
  outcomes: string[]
  syllabus: string[]
  tools: string[]
  // Starting price per session, in INR. EDIT THESE to your real rates.
  // Shown on the site as "From ₹X / session". Set to null to hide the price
  // for a course and show "Pricing on request" instead.
  priceFrom: number | null
}

// Currency formatter for the "From ₹X / session" labels.
export function formatPrice(inr: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inr)
}

export const COURSES: Course[] = [
  {
    id: "data-analytics",
    title: "Data Analytics",
    tagline: "Turn raw data into decisions",
    level: "Beginner → Advanced",
    duration: "6–8 evening sessions",
    accent: ["#38bdf8", "#2563eb"],
    summary:
      "The complete analytics journey — from asking the right question to shipping an insight a business can act on. You'll work on real datasets end to end.",
    forWhom:
      "Career switchers, fresh graduates, and analysts who can pull numbers but want to turn them into stories that drive decisions.",
    outcomes: [
      "Frame business questions as analyzable problems",
      "Clean, shape and validate messy real-world data",
      "Choose the right metrics & KPIs, avoid vanity numbers",
      "Present a clear, decision-ready data story",
      "Ship a portfolio-grade capstone analysis",
    ],
    syllabus: [
      "The analytics workflow & mindset",
      "Excel + SQL for fast exploration",
      "Data cleaning & preparation",
      "Building your first Tableau dashboard",
      "KPIs, metrics & storytelling",
      "Capstone: end-to-end analysis",
    ],
    tools: ["Excel", "SQL", "Tableau", "Storytelling"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "tableau",
    title: "Tableau & Dashboards",
    tagline: "Dashboards people actually use",
    level: "Beginner → Advanced",
    duration: "5–7 evening sessions",
    accent: ["#fb923c", "#d97706"],
    summary:
      "Design, build and publish interactive Tableau dashboards on Desktop & Server — the same craft behind the dashboards I ship at enterprise scale.",
    forWhom:
      "Analysts and BI aspirants who want to build dashboards that are fast, secure, and genuinely useful — not just pretty.",
    outcomes: [
      "Model data sources & relationships correctly",
      "Master calculated fields and LOD expressions",
      "Implement row-level / user-level security",
      "Publish, schedule and automate subscriptions",
      "Design for clarity and performance",
    ],
    syllabus: [
      "Tableau fundamentals & data model",
      "Calculations & LOD expressions",
      "Interactivity: filters, parameters, actions",
      "Security & governance",
      "Publishing to Tableau Server",
      "Dashboard design & performance",
    ],
    tools: ["Tableau Desktop", "Tableau Server", "SQL"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "power-bi",
    title: "Power BI",
    tagline: "From data model to a story that sells",
    level: "Beginner → Advanced",
    duration: "5–7 evening sessions",
    accent: ["#f59e0b", "#eab308"],
    summary:
      "Build governed, fast Power BI reports end to end — shape data in Power Query, model it with a clean star schema, write DAX that actually performs, and publish to the Service with row-level security. The same craft behind the enterprise reporting I ship day to day.",
    forWhom:
      "Analysts and BI aspirants who want to move past drag-and-drop charts and build Power BI reports that are modelled correctly, perform well, and can be trusted in front of leadership.",
    outcomes: [
      "Shape and combine messy sources in Power Query (M)",
      "Model a clean star schema — facts, dimensions & relationships",
      "Write correct, performant DAX (measures over calculated columns)",
      "Master filter context, CALCULATE & time-intelligence",
      "Publish to the Power BI Service with row-level security & refresh",
    ],
    syllabus: [
      "Power BI ecosystem: Desktop, Service & gateways",
      "Power Query (M): extract, clean & combine data",
      "Data modelling & star schema design",
      "DAX foundations: measures, filter & row context",
      "CALCULATE, time-intelligence & advanced DAX",
      "Report design, RLS, publishing & scheduled refresh",
    ],
    tools: ["Power BI Desktop", "Power Query (M)", "DAX", "Power BI Service"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "fabric",
    title: "Microsoft Fabric",
    tagline: "The platform Power BI now lives in",
    level: "Analyst → AI-era",
    duration: "5–6 evening sessions",
    accent: ["#2dd4bf", "#0ea5e9"],
    summary:
      "Get ahead of the platform shift. Fabric unifies the data estate Power BI sits on — OneLake, lakehouses and warehouses, pipelines, Direct Lake semantic models and Copilot. Taught from the analyst's seat, building directly on the Power BI and SQL craft you already have.",
    forWhom:
      "Power BI users and analysts whose organisations are moving to Fabric — or who want the platform skills that BI interviews increasingly probe in 2026.",
    outcomes: [
      "Navigate Fabric confidently: workspaces, capacities & OneLake",
      "Choose lakehouse vs warehouse for a given workload — and defend it",
      "Land and shape data with pipelines & Dataflows Gen2",
      "Structure data with the medallion (bronze / silver / gold) pattern",
      "Serve fast Power BI reports from Direct Lake semantic models",
      "Use Copilot & AI skills productively — and verify their output",
    ],
    syllabus: [
      "Fabric fundamentals: OneLake, workspaces & capacities",
      "Lakehouse vs warehouse — choosing your store",
      "Getting data in: pipelines & Dataflows Gen2",
      "Medallion architecture: bronze, silver, gold",
      "Direct Lake & semantic models for Power BI",
      "Copilot & AI skills: working with the agentic layer",
    ],
    tools: ["Microsoft Fabric", "OneLake", "Dataflows Gen2", "Power BI", "Copilot"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "sql",
    title: "SQL & T-SQL",
    tagline: "Speak fluent data",
    level: "Foundations → Pro",
    duration: "5–6 evening sessions",
    accent: ["#818cf8", "#7c3aed"],
    summary:
      "Query, join and model data confidently across SQL Server and Oracle. Go from basic SELECTs to window functions and tuned, production-grade queries.",
    forWhom:
      "Anyone who needs to get their own data out of a database — analysts, developers, and BI professionals.",
    outcomes: [
      "Write clean joins, subqueries and CTEs",
      "Use window functions for advanced analysis",
      "Build stored procedures and views",
      "Read query plans and optimize performance",
    ],
    syllabus: [
      "SELECT, WHERE, GROUP BY, ORDER BY",
      "Joins, subqueries & CTEs",
      "Window functions",
      "Stored procedures & views",
      "Indexing & query optimization",
    ],
    tools: ["SQL Server", "T-SQL", "Oracle"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "excel",
    title: "Advanced Excel",
    tagline: "The analyst's power tool",
    level: "Analyst track",
    duration: "4–5 evening sessions",
    accent: ["#34d399", "#0d9488"],
    summary:
      "Formulas, pivots and automated reporting workflows for fast, reliable analysis — the Excel foundation every data professional leans on.",
    forWhom:
      "Professionals who live in spreadsheets and want to work faster, cleaner, and error-free.",
    outcomes: [
      "Master lookups, arrays and dynamic formulas",
      "Build PivotTables & PivotCharts fluently",
      "Automate data prep with Power Query",
      "Create reusable reporting dashboards",
    ],
    syllabus: [
      "Formulas, lookups & arrays",
      "PivotTables & PivotCharts",
      "Power Query for automation",
      "Dashboards & conditional formatting",
    ],
    tools: ["Excel", "Power Query"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "sas",
    title: "Base SAS 9.4",
    tagline: "Certified SAS foundations",
    level: "Certified path",
    duration: "5–6 evening sessions",
    accent: ["#f472b6", "#dc2626"],
    summary:
      "Data steps, procedures and reporting with Base SAS — taught by a certified Base SAS programmer, aimed at the certification and real analysis work.",
    forWhom:
      "Analysts in pharma, finance and research who need SAS, or anyone targeting the Base SAS certification.",
    outcomes: [
      "Write efficient DATA steps",
      "Use core PROCs for analysis & reporting",
      "Build macros for reusable code",
      "Prepare for the Base SAS certification",
    ],
    syllabus: [
      "SAS environment & DATA step",
      "Reading & manipulating data",
      "PROC SQL & key procedures",
      "Macros & automation",
      "Reporting & certification prep",
    ],
    tools: ["Base SAS 9.4", "PROC SQL"],
    priceFrom: null, // Hidden until real rates are decided — shows "Pricing on request"
  },
  {
    id: "career",
    title: "BI Career Coaching",
    tagline: "Break into business intelligence",
    level: "1-on-1 mentoring",
    duration: "Ongoing · flexible",
    accent: ["#e879f9", "#9333ea"],
    summary:
      "A personalized roadmap for landing a BI/analytics role — portfolio, interviews, resume, and the day-to-day habits that make a professional.",
    forWhom:
      "Aspiring data professionals who want honest guidance and a clear plan from someone doing the job today.",
    outcomes: [
      "A portfolio that gets interviews",
      "Confident mock-interview performance",
      "A resume tuned for BI roles",
      "A weekly learning roadmap you can follow",
    ],
    syllabus: [
      "Portfolio review & project selection",
      "Resume & LinkedIn optimization",
      "Mock interviews & feedback",
      "Personalized learning roadmap",
    ],
    tools: ["Portfolio", "Interview prep", "Roadmap"],
    priceFrom: null, // Personalized — shows "Pricing on request"
  },
]
