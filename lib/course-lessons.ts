/**
 * Detailed teaching content for the in-portal "Learn" experience.
 *
 * Each course maps to a set of LESSONS. A lesson is a real micro-teaching unit:
 *   - concept:   what this is and why it matters (plain, mentor's voice)
 *   - keyIdea:   the one thing to remember
 *   - steps:     a short "how it works" walk-through
 *   - exercise:  a concrete "try it yourself" task (hands-on)
 *   - resources: links to the free resources already on the site
 *
 * Flagship courses (power-bi, tableau, sql) have fully-authored lessons. Any
 * course without authored lessons falls back to lessons generated from its
 * syllabus (see lessonsForCourse), so every course is always learnable.
 */

import { COURSES, type Course } from "@/lib/courses"

export interface LessonResource {
  label: string
  href: string
  /** external = opens new tab; internal = same-tab route/anchor. */
  external?: boolean
}

export interface SelfCheck {
  question: string
  options: string[]
  answer: number // index of the correct option
  why: string // explanation shown after answering
}

export interface Lesson {
  id: string // stable slug, used as the localStorage progress key
  title: string
  minutes: number // rough time to work through
  concept: string
  keyIdea: string
  steps: string[]
  exercise: string
  resources?: LessonResource[]
  check?: SelfCheck // optional active-recall self-check
}

// Shared resources that live on the site already.
const R = {
  dataset: { label: "Slice & dice dataset (CSV)", href: "/data-slice-and-dice-template.csv", external: true },
  datasetGuide: { label: "How to use the dataset", href: "/data-slice-and-dice-guide.md", external: true },
  excelWorkbook: { label: "Advanced Excel KPI/matrix workbook (.xlsx)", href: "/advanced-excel-kpi-matrix-demo.xlsx", external: true },
  tidyArticle: { label: "Read: Tidy data first", href: "/articles/view/?slug=tidy-data-before-dashboards", external: false },
  measuresArticle: { label: "Read: Measures, not calculated columns", href: "/articles/view/?slug=measures-not-calculated-columns", external: false },
  dashboardArticle: { label: "Read: One question per dashboard", href: "/articles/view/?slug=one-question-per-dashboard", external: false },
  comparison: { label: "Compare: Power BI vs Tableau vs Excel", href: "/#courses", external: false },
} satisfies Record<string, LessonResource>

const AUTHORED: Record<string, Lesson[]> = {
  "power-bi": [
    {
      id: "pbi-ecosystem",
      title: "The Power BI ecosystem",
      minutes: 12,
      concept:
        "Power BI isn't one app — it's Desktop (where you build), the Service (where you publish and share), and gateways (which refresh on-prem data). Knowing which piece does what saves you from a dozen 'why won't it refresh?' headaches later.",
      keyIdea: "Build in Desktop, share in the Service, refresh through a gateway. Everything else is detail.",
      steps: [
        "Install Power BI Desktop (free) — this is your build environment.",
        "Understand the Service (app.powerbi.com): workspaces, datasets, reports, apps.",
        "See where a gateway fits: it lets the Service refresh data that lives behind your firewall.",
        "Map the flow: Desktop → publish → Service → schedule refresh → share.",
      ],
      exercise:
        "Sketch the path a single sales number takes from a CSV on your laptop to a dashboard your manager opens on their phone. Name every Power BI component it passes through.",
      resources: [R.comparison],
      check: {
        question: "Which component refreshes data that lives behind a company firewall?",
        options: ["Power BI Desktop", "The gateway", "A calculated column", "The mobile app"],
        answer: 1,
        why: "The on-premises data gateway is the bridge that lets the Service securely refresh data sources inside your network.",
      },
    },
    {
      id: "pbi-power-query",
      title: "Power Query (M): clean & combine",
      minutes: 20,
      concept:
        "Power Query is where messy reality gets tidied before it ever reaches your model. Every transform you click is recorded as a repeatable step — so next month's file cleans itself. This is the single biggest time-saver most people skip.",
      keyIdea: "Shape data in Power Query, not in the report. Steps are recorded and re-run on every refresh.",
      steps: [
        "Load the sample dataset via Get Data → Text/CSV.",
        "Set data types explicitly (dates as dates, numbers as numbers).",
        "Remove junk: unpivot wide columns, split columns, trim/clean text.",
        "Notice the Applied Steps pane — that's your reusable recipe.",
      ],
      exercise:
        "Load the slice & dice CSV. Make sure Date is a real date and Revenue is a decimal. Add a custom column 'Profit Check' = Revenue - Cost and confirm it matches the Profit column.",
      resources: [R.dataset, R.datasetGuide, R.tidyArticle],
      check: {
        question: "Why prefer cleaning data in Power Query over doing it in the report?",
        options: [
          "It looks more professional",
          "Steps are recorded and re-run automatically on every refresh",
          "Reports can't do calculations",
          "It uses less disk space",
        ],
        answer: 1,
        why: "Power Query records each transform as a step, so next month's file is cleaned the same way with zero extra work.",
      },
    },
    {
      id: "pbi-modelling",
      title: "Data modelling & the star schema",
      minutes: 22,
      concept:
        "A star schema — one central fact table (the events: sales, orders) surrounded by dimension tables (the descriptors: date, product, region) — is how professional models stay fast and correct. Flat, one-big-table models fall apart the moment questions get interesting.",
      keyIdea: "Facts in the middle, dimensions around the outside, one-to-many relationships pointing inward.",
      steps: [
        "Identify your fact table: the thing you measure (each sale).",
        "Pull descriptors into dimensions: Date, Product, Region, Segment.",
        "Create relationships (dimension 1 → many fact) on the key columns.",
        "Hide key columns from report view; keep the canvas clean.",
      ],
      exercise:
        "From the sample data, design (on paper is fine) a star schema: which columns become the fact table, and which become dimensions? Draw the relationship arrows.",
      resources: [R.dataset, R.comparison],
      check: {
        question: "In a star schema, which table sits in the centre?",
        options: ["A dimension table", "The fact table", "The date table", "A calculated table"],
        answer: 1,
        why: "The fact table (the measurable events, e.g. each sale) is central; dimensions describing those events surround it.",
      },
    },
    {
      id: "pbi-dax-foundations",
      title: "DAX foundations: measures & context",
      minutes: 25,
      concept:
        "DAX confuses people because the same formula gives different answers depending on where you put it — that's 'filter context'. Once you internalise that a measure recalculates inside whatever the visual is filtering, DAX stops being magic and starts being logical.",
      keyIdea: "A measure is evaluated in context. Prefer measures over calculated columns — they respect the filters of the visual.",
      steps: [
        "Write base measures: Total Revenue = SUM(Sales[Revenue]).",
        "Build on them: Total Profit, then Margin = DIVIDE([Total Profit],[Total Revenue]).",
        "Drop the same measure into a card, a table by Region, and a total — watch it recompute.",
        "Understand why a calculated-column ratio averaged up gives the wrong total.",
      ],
      exercise:
        "Create three measures — Total Revenue, Total Profit, Profit Margin %. Put Margin in a table broken down by Region and confirm the grand total is correct (not just an average of rows).",
      resources: [R.measuresArticle, R.excelWorkbook],
      check: {
        question: "You need a Profit Margin % that stays correct at every total. Use a…",
        options: ["Calculated column", "Measure", "Either works the same", "Calculated table"],
        answer: 1,
        why: "A measure re-evaluates in the filter context of each cell, so the grand total is a true ratio — not an average of row ratios.",
      },
    },
    {
      id: "pbi-calculate",
      title: "CALCULATE & time-intelligence",
      minutes: 24,
      concept:
        "CALCULATE is the most powerful function in DAX because it changes filter context. Time-intelligence (YTD, prior year, growth %) is just CALCULATE plus a date table. Master this and you can answer almost any 'compared to what?' question.",
      keyIdea: "CALCULATE(measure, filters…) rewrites the context. A proper Date dimension unlocks all time-intelligence.",
      steps: [
        "Mark a Date table as a date table in the model.",
        "Revenue LY = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Date[Date])).",
        "Growth % = DIVIDE([Total Revenue]-[Revenue LY],[Revenue LY]).",
        "Test with a slicer — the comparison should move as you filter.",
      ],
      exercise:
        "Add a Revenue vs Prior Quarter measure and a Growth % measure. Display them in a matrix by Quarter and read off which quarter grew fastest.",
      resources: [R.excelWorkbook],
      check: {
        question: "What does CALCULATE primarily do?",
        options: [
          "Formats numbers as currency",
          "Changes the filter context of a calculation",
          "Creates a new table",
          "Sorts a visual",
        ],
        answer: 1,
        why: "CALCULATE evaluates a measure under a modified filter context — the foundation of time-intelligence and most advanced DAX.",
      },
    },
    {
      id: "pbi-publish",
      title: "Report design, RLS & publishing",
      minutes: 20,
      concept:
        "A model nobody can read is wasted work. Good report design leads with the answer, uses restraint, and — when data is sensitive — enforces row-level security so each viewer sees only their slice. Then you publish and schedule refresh so it stays current on its own.",
      keyIdea: "Design for the decision, secure with RLS, publish and schedule refresh so it maintains itself.",
      steps: [
        "Lay out: headline KPI top-left, supporting detail below.",
        "Define an RLS role (e.g. filter Region = USERPRINCIPALNAME lookup).",
        "Publish to a Service workspace.",
        "Set a scheduled refresh and share via an app.",
      ],
      exercise:
        "Design a one-screen report for a regional head: what are the 2–3 numbers they need, and what would you deliberately leave OUT? Write it as one sentence: 'This helps [role] decide [decision].'",
      resources: [R.dashboardArticle],
    },
  ],

  tableau: [
    {
      id: "tab-fundamentals",
      title: "Tableau fundamentals & the data model",
      minutes: 15,
      concept:
        "Tableau thinks in terms of dimensions (categories you slice by) and measures (numbers you aggregate). Getting the data connected with the right relationships is 80% of a smooth build — the rest is dragging and dropping.",
      keyIdea: "Dimensions slice, measures aggregate. Set up relationships once; benefit forever.",
      steps: [
        "Connect to the sample CSV.",
        "Notice how Tableau auto-classifies fields as dimensions vs measures.",
        "Build your first view: Quarter on Columns, SUM(Revenue) on Rows.",
        "Add Region to Colour and read the story.",
      ],
      exercise:
        "Recreate a revenue-by-quarter bar chart coloured by Segment. Which segment carries the business? Write one sentence of insight.",
      resources: [R.dataset, R.tidyArticle],
    },
    {
      id: "tab-calcs",
      title: "Calculations & LOD expressions",
      minutes: 22,
      concept:
        "Level-of-Detail (LOD) expressions let you compute at a different grain than the view — the classic example being '% of total' or 'customer's first order date'. They're what separate a Tableau tinkerer from a Tableau professional.",
      keyIdea: "LOD expressions ({FIXED}, {INCLUDE}, {EXCLUDE}) compute at a grain you choose, independent of the visual.",
      steps: [
        "Write a basic calc: Profit Ratio = SUM(Profit)/SUM(Revenue).",
        "Write a FIXED LOD: {FIXED [Region] : SUM([Revenue])}.",
        "Use it to compute each region's share of total.",
        "Compare FIXED vs INCLUDE vs EXCLUDE on the same view.",
      ],
      exercise:
        "Build a '% of total revenue by Region' using a FIXED LOD. Confirm the percentages sum to 100%.",
      resources: [R.dataset, R.comparison],
      check: {
        question: "What makes a FIXED LOD expression special?",
        options: [
          "It always shows currency",
          "It computes at a grain you specify, ignoring the view's level of detail",
          "It only works in tooltips",
          "It sorts the data",
        ],
        answer: 1,
        why: "{FIXED [dim] : agg} pins the calculation to a chosen grain regardless of what's on the visual — perfect for 'share of total'.",
      },
    },
    {
      id: "tab-interactivity",
      title: "Interactivity: filters, parameters, actions",
      minutes: 20,
      concept:
        "Interactivity is what turns a chart into a tool. Parameters let users change the question; dashboard actions let one chart filter another. Used well, it feels effortless; overused, it's a maze.",
      keyIdea: "Every interactive element should answer a real question a user has — not just exist because it can.",
      steps: [
        "Add a Region quick filter.",
        "Create a parameter to switch the measure (Revenue ↔ Profit).",
        "Wire a dashboard action so clicking a region filters a detail chart.",
        "Test the flow as if you were the end user.",
      ],
      exercise:
        "Build a two-chart dashboard where clicking a bar in the overview filters the detail table. Have someone else try it without instructions — did they 'get' it?",
      resources: [R.dashboardArticle],
    },
    {
      id: "tab-design",
      title: "Dashboard design & performance",
      minutes: 18,
      concept:
        "A fast, clear dashboard respects the viewer's attention and their patience. Design for the five-second glance first, the deep-dive second — and keep it performant by reducing marks and using extracts.",
      keyIdea: "Lead with the answer. Fewer, sharper visuals beat a wall of charts every time.",
      steps: [
        "Put the headline metric top-left.",
        "Remove chart junk: gridlines, redundant labels, loud colour.",
        "Use an extract and hide unused fields for speed.",
        "Add a clear title that states the takeaway.",
      ],
      exercise:
        "Take any dashboard you've built and remove three things. Is it worse — or clearer? Usually it's clearer.",
      resources: [R.dashboardArticle, R.comparison],
    },
  ],

  sql: [
    {
      id: "sql-select",
      title: "SELECT, WHERE, GROUP BY",
      minutes: 15,
      concept:
        "SQL is how you ask a database questions. SELECT chooses columns, WHERE filters rows, GROUP BY rolls them up. Ninety percent of analyst queries are variations on these three.",
      keyIdea: "SELECT columns, FROM table, WHERE conditions, GROUP BY the thing you're summarising.",
      steps: [
        "SELECT Region, SUM(Revenue) FROM sales GROUP BY Region.",
        "Add WHERE Quarter = 'Q1' to filter before aggregating.",
        "ORDER BY SUM(Revenue) DESC to rank.",
        "Understand the logical order: FROM → WHERE → GROUP BY → SELECT → ORDER BY.",
      ],
      exercise:
        "Write a query that returns total Revenue and Profit per Segment, for the West region only, sorted by Profit descending.",
      resources: [R.dataset],
    },
    {
      id: "sql-joins",
      title: "Joins, subqueries & CTEs",
      minutes: 22,
      concept:
        "Real data lives in many tables; joins bring them together on a key. CTEs (WITH …) let you name a step and build readable, layered queries instead of nested spaghetti.",
      keyIdea: "INNER JOIN keeps matches; LEFT JOIN keeps everything on the left. CTEs make complex queries readable.",
      steps: [
        "JOIN sales to a product dimension on ProductID.",
        "See the difference between INNER and LEFT JOIN when keys don't match.",
        "Refactor a nested subquery into a WITH … CTE.",
        "Chain two CTEs to build a result step by step.",
      ],
      exercise:
        "Using a CTE, first compute revenue per SalesRep, then in the outer query return only reps above the average. (Hint: two steps, one WITH.)",
      resources: [R.dataset],
    },
    {
      id: "sql-windows",
      title: "Window functions",
      minutes: 24,
      concept:
        "Window functions compute across a set of rows related to the current one — running totals, rankings, moving averages — without collapsing the rows like GROUP BY does. This is the leap from 'can query' to 'analyst'.",
      keyIdea: "OVER (PARTITION BY … ORDER BY …) computes per-row context while keeping every row.",
      steps: [
        "ROW_NUMBER() OVER (PARTITION BY Region ORDER BY Revenue DESC) to rank within region.",
        "SUM(Revenue) OVER (ORDER BY Date) for a running total.",
        "LAG(Revenue) to compare a row to the previous period.",
        "Notice rows are preserved — unlike GROUP BY.",
      ],
      exercise:
        "Write a query that ranks products within each Category by Revenue, and returns only the top 2 per category.",
      resources: [R.dataset],
      check: {
        question: "How does a window function differ from GROUP BY?",
        options: [
          "It's faster",
          "It keeps every row instead of collapsing them",
          "It only works on dates",
          "It can't be filtered",
        ],
        answer: 1,
        why: "Window functions compute across related rows via OVER(...) while preserving each row — GROUP BY collapses rows into one per group.",
      },
    },
    {
      id: "sql-optimize",
      title: "Reading query plans & optimizing",
      minutes: 20,
      concept:
        "A correct query that takes 40 seconds is a problem in production. Reading the execution plan tells you where time goes — usually a missing index or an accidental full scan — so you fix the cause, not guess.",
      keyIdea: "Measure before you optimise. The plan shows the real cost; indexes and sargable filters fix most of it.",
      steps: [
        "View the execution/explain plan for a slow query.",
        "Spot the expensive operator (scan vs seek).",
        "Add or use an index on the filtered/joined column.",
        "Rewrite non-sargable predicates (avoid functions on filtered columns).",
      ],
      exercise:
        "Take a query filtering on a date range. Explain (in words) why wrapping the date column in a function would stop an index from being used.",
      resources: [R.dataset],
    },
  ],
}

/** Turn a course's syllabus into lessons when no authored set exists. */
function lessonsFromSyllabus(course: Course): Lesson[] {
  return course.syllabus.map((topic, i) => ({
    id: `${course.id}-l${i + 1}`,
    title: topic,
    minutes: 15,
    concept: `${topic} — a core building block of ${course.title}. We work through it hands-on, on real data, so it sticks.`,
    keyIdea: course.outcomes[i] ?? course.outcomes[0] ?? "Practice on real data until it's second nature.",
    steps: [
      "Watch/work the concept with a small example.",
      "Apply it to the free sample dataset.",
      "Explain it back in one sentence — if you can teach it, you know it.",
    ],
    exercise: `Apply "${topic}" to the slice & dice dataset and note one insight you found.`,
    resources: [R.dataset, R.datasetGuide],
  }))
}

/** Public: get the lesson set for a course id (authored or generated). */
export function lessonsForCourse(courseId: string): Lesson[] {
  if (AUTHORED[courseId]) return AUTHORED[courseId]
  const course = COURSES.find((c) => c.id === courseId)
  return course ? lessonsFromSyllabus(course) : []
}

/** Courses that have hand-authored, in-depth lessons (badged in the UI). */
export const AUTHORED_COURSE_IDS = new Set(Object.keys(AUTHORED))
