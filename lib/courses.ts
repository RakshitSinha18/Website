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
  },
]
