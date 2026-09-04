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
  fabric: [
    {
      id: "fab-fundamentals",
      title: "Fabric fundamentals: OneLake, workspaces & capacities",
      minutes: 15,
      concept:
        "Fabric is Microsoft's answer to the scattered data estate: one SaaS platform where ingestion, storage, engineering and Power BI share a single copy of the data. OneLake is the 'OneDrive for data' underneath everything; workspaces organise the work; capacities are the compute you pay for. If you know Power BI workspaces, you're already halfway oriented.",
      keyIdea: "One platform, one copy of the data. OneLake stores it, workspaces organise it, capacities power it.",
      steps: [
        "Tour the Fabric portal: workloads (Data Factory, Data Engineering, Data Warehouse, Power BI) are lenses on the same platform.",
        "See OneLake in the explorer — every workspace's data lives in one logical lake, stored as Delta tables.",
        "Map the Power BI concepts you know (workspace, dataset, capacity) onto their Fabric equivalents.",
        "Understand shortcuts: point at data in ADLS or S3 without copying it.",
      ],
      exercise:
        "In a Fabric trial workspace, create a lakehouse, upload the slice & dice CSV, and find the same file through the OneLake explorer. One copy, many views.",
      resources: [R.dataset],
      check: {
        question: "What is OneLake, in one sentence?",
        options: [
          "A rebranded SQL Server database",
          "The single logical data lake every Fabric workspace stores into",
          "A Power BI visual",
          "Microsoft's name for Excel in the cloud",
        ],
        answer: 1,
        why: "OneLake is the shared storage layer — every lakehouse, warehouse and semantic model reads and writes the same lake, so data isn't copied between tools.",
      },
    },
    {
      id: "fab-stores",
      title: "Lakehouse vs warehouse — choosing your store",
      minutes: 15,
      concept:
        "Fabric gives you two front doors to the same OneLake storage: the lakehouse (files + Delta tables, Spark-first, SQL endpoint read-only) and the warehouse (full T-SQL read-write, the familiar database experience). Both hold Delta tables underneath — the choice is about the engine and skills you want in front, not the storage.",
      keyIdea: "Same Delta tables underneath. Choose by skills and workload: Spark-heavy engineering → lakehouse; T-SQL-first analytics → warehouse.",
      steps: [
        "Create both a lakehouse and a warehouse; load the same sample data into each.",
        "Query the lakehouse through its SQL analytics endpoint — note it's read-only SQL.",
        "Do full T-SQL DML in the warehouse (INSERT, UPDATE, stored procedures).",
        "Write the decision rule for your team: who maintains it, and in what language?",
      ],
      exercise:
        "A retail client has SQL-strong analysts and no Spark experience, ingesting nightly CSVs for Power BI. Lakehouse or warehouse? Write three sentences defending your pick.",
      resources: [R.dataset],
    },
    {
      id: "fab-ingest",
      title: "Getting data in: pipelines & Dataflows Gen2",
      minutes: 18,
      concept:
        "Data Factory in Fabric gives you two tools: pipelines for orchestration (copy data, schedule, chain steps, handle failures) and Dataflows Gen2 for transformation — which is exactly the Power Query you already know, landing results into OneLake. Analysts usually start with a dataflow; engineers wrap them in pipelines.",
      keyIdea: "Dataflows Gen2 IS Power Query — your M skills transfer 1:1. Pipelines schedule and orchestrate around them.",
      steps: [
        "Build a Dataflow Gen2: connect to the sample CSV, clean it with familiar Power Query steps, set the destination to your lakehouse.",
        "Build a pipeline with a Copy activity and a schedule.",
        "Chain them: pipeline runs the dataflow, then a notebook or refresh step.",
        "Check the monitoring hub to see runs, durations and failures.",
      ],
      exercise:
        "Create a Dataflow Gen2 that loads the slice & dice CSV, removes rows with null Revenue, types the Date column, and lands it in your lakehouse as a table.",
      resources: [R.dataset, R.datasetGuide],
    },
    {
      id: "fab-medallion",
      title: "Medallion architecture: bronze, silver, gold",
      minutes: 18,
      concept:
        "The medallion pattern is how mature teams keep a lake trustworthy: bronze holds raw data exactly as it arrived, silver holds cleaned and conformed tables, gold holds business-ready models (star schemas, aggregates). Each layer answers a different question — 'what did the source say?', 'what is true?', 'what do we report?'.",
      keyIdea: "Bronze = as received, silver = cleaned & conformed, gold = business-ready star schemas. Never report from bronze.",
      steps: [
        "Land the raw CSV untouched into a bronze folder/table.",
        "Build silver: fix types, standardise names, remove duplicates — the 'one version of clean'.",
        "Build gold: dimensional tables shaped for Power BI (fact + dimensions).",
        "Trace one column end to end so the lineage is real to you.",
      ],
      exercise:
        "Sketch the medallion flow for the slice & dice dataset: what belongs in bronze, what cleaning makes silver, and which fact/dimension tables form gold?",
      resources: [R.dataset, R.tidyArticle],
      check: {
        question: "Why keep a bronze layer at all, instead of cleaning data on the way in?",
        options: [
          "Bronze is faster to query",
          "It preserves the untouched source, so you can audit and rebuild silver/gold when logic changes",
          "Power BI can only read bronze",
          "It saves storage costs",
        ],
        answer: 1,
        why: "Bronze is your evidence and your undo button — when cleaning rules change or a number is questioned, you can replay from exactly what the source sent.",
      },
    },
    {
      id: "fab-directlake",
      title: "Direct Lake & semantic models for Power BI",
      minutes: 18,
      concept:
        "Direct Lake is the Fabric payoff for BI: Power BI reads Delta tables straight from OneLake — near-Import speed without copies or scheduled refresh. The semantic model becomes the centre of gravity: measures, relationships and RLS defined once, used by every report — and, increasingly, by AI agents that sit on top of it.",
      keyIdea: "Direct Lake = Import-class speed, no copies, no refresh dance. The semantic model is now the product — humans and AI both consume it.",
      steps: [
        "Create a semantic model over your gold lakehouse tables.",
        "Define relationships and a few core measures (the DAX you know applies unchanged).",
        "Build a report and note there's no scheduled refresh to configure — the lake IS the source.",
        "Add row-level security the same way as classic Power BI.",
      ],
      exercise:
        "Build a Direct Lake semantic model over your gold tables with Total Revenue and Profit Margin % measures, then a one-page report. Confirm updates in the lakehouse appear without a refresh.",
      resources: [R.measuresArticle],
    },
    {
      id: "fab-copilot",
      title: "Copilot & AI skills: working with the agentic layer",
      minutes: 15,
      concept:
        "Copilot in Fabric drafts dataflows, writes DAX, and answers natural-language questions against your data — and AI skills let you build Q&A agents grounded in OneLake. The catch every professional must internalise: AI inherits your semantic model's logic. On a clean model it looks brilliant; on a messy one it is confidently wrong. Your job shifts from typing the query to directing and verifying it.",
      keyIdea: "AI drafts, you direct and verify. The quality ceiling of every Copilot answer is the quality of your model.",
      steps: [
        "Use Copilot to draft a measure, then read the DAX it wrote — is it right? How do you know?",
        "Ask an AI skill a question and inspect the query it generated.",
        "Break it on purpose: ask something ambiguous and watch how model naming drives the interpretation.",
        "Write your team's verification habit: no AI-generated number ships unchecked.",
      ],
      exercise:
        "Ask Copilot for 'revenue growth by region' against your model. Read the generated query, then verify the number independently with your own DAX or SQL. Note anything that differed and why.",
      resources: [R.measuresArticle],
      check: {
        question: "Why does a clean star schema matter MORE, not less, once Copilot and AI agents are in play?",
        options: [
          "AI only supports star schemas",
          "It doesn't — AI removes the need for modelling",
          "AI systems inherit the model's logic and naming: a clean model makes them accurate, a messy one makes them confidently wrong",
          "Star schemas use less storage",
        ],
        answer: 2,
        why: "Agents query the semantic model as their source of truth. Good structure and naming become the interface AI depends on — modelling is now for machines as well as humans.",
      },
    },
  ],
  toolkit: [
    {
      id: "tk-vscode",
      title: "Set up VS Code for data work",
      minutes: 15,
      concept:
        "VS Code is the free workbench that ties everything together — you'll edit SQL, CSVs, Markdown notes and scripts in one place instead of five apps. Ten minutes of setup pays back every single day.",
      keyIdea: "One editor for everything: install VS Code, add three extensions, and keep your work in folders it can open.",
      steps: [
        "Download and install VS Code from code.visualstudio.com.",
        "Install extensions: 'SQL Server (mssql)', 'Rainbow CSV', and 'Markdown All in One'.",
        "Open a folder (File → Open Folder) — VS Code works on folders, not loose files.",
        "Open the slice & dice CSV and see Rainbow CSV colour the columns.",
      ],
      exercise:
        "Create a folder called data-practice, open it in VS Code, save the slice & dice CSV inside it, and open the file — columns should be colour-coded.",
      resources: [
        { label: "Download VS Code", href: "https://code.visualstudio.com", external: true },
        R.dataset,
      ],
    },
    {
      id: "tk-git",
      title: "Git & GitHub from zero",
      minutes: 20,
      concept:
        "Version control is the analyst's safety net: every change saved, every version recoverable, and a public GitHub profile doubles as your portfolio. You need four commands to start — clone, add, commit, push.",
      keyIdea: "Commit early, commit often. GitHub is both your backup and your public proof of work.",
      steps: [
        "Create a free github.com account and install Git (git-scm.com) or GitHub Desktop.",
        "Create a repository called data-practice on GitHub.",
        "Clone it locally, add your practice files, commit with a clear message.",
        "Push — then refresh GitHub and see your work online.",
      ],
      exercise:
        "Put your data-practice folder on GitHub: one repo, one commit titled 'first analysis files', pushed and visible in your profile.",
      resources: [
        { label: "Download Git", href: "https://git-scm.com", external: true },
        { label: "GitHub Desktop (no command line)", href: "https://desktop.github.com", external: true },
      ],
      check: {
        question: "What does 'commit' do in Git?",
        options: [
          "Uploads files to GitHub",
          "Records a snapshot of your changes locally with a message",
          "Deletes old versions",
          "Creates a new repository",
        ],
        answer: 1,
        why: "A commit is a local snapshot with a message. Pushing is what uploads your commits to GitHub.",
      },
    },
    {
      id: "tk-excel",
      title: "A clean Excel workspace",
      minutes: 15,
      concept:
        "Most Excel pain comes from loose ranges and mystery formulas. Two habits fix it: format data as Tables (so formulas auto-fill and ranges grow), and keep inputs, calculations and outputs on separate sheets.",
      keyIdea: "Tables, not ranges. Separate sheets for input, calculation and output.",
      steps: [
        "Open the slice & dice CSV in Excel and press Ctrl+T to make it a Table.",
        "Name the table (Table Design → Table Name) — formulas become readable.",
        "Add a calculation sheet that references the table, never raw cell ranges.",
        "Pin your five most-used buttons to the Quick Access Toolbar.",
      ],
      exercise:
        "Convert the sample data to a named Table called SalesData, then write one SUMIFS on a separate sheet that references it by name.",
      resources: [R.excelWorkbook, R.dataset],
    },
    {
      id: "tk-sqltools",
      title: "SQL tools: SSMS & Azure Data Studio",
      minutes: 18,
      concept:
        "To practise SQL you need a place to run it. SQL Server Developer edition is free and full-featured; SSMS (Windows) or Azure Data Studio (Mac/Windows) is the cockpit you query it from.",
      keyIdea: "Free stack: SQL Server Developer + SSMS or Azure Data Studio. Import a CSV and you have a practice database.",
      steps: [
        "Install SQL Server Developer edition (free) or use an existing server.",
        "Install SSMS (Windows) or Azure Data Studio (cross-platform).",
        "Connect: server name, authentication, database.",
        "Import the slice & dice CSV via the Import Flat File wizard — now query it.",
      ],
      exercise:
        "Import the sample CSV as a table called sales and run: SELECT Region, SUM(Revenue) FROM sales GROUP BY Region.",
      resources: [
        { label: "Azure Data Studio", href: "https://learn.microsoft.com/azure-data-studio/download-azure-data-studio", external: true },
        R.dataset,
      ],
    },
    {
      id: "tk-bitools",
      title: "Install Power BI Desktop & Tableau Public",
      minutes: 12,
      concept:
        "Both flagship BI tools have free versions good enough to learn on: Power BI Desktop is fully free to build with, and Tableau Public is the free way to practise Tableau. Install both — comparing them teaches you more than either alone.",
      keyIdea: "Power BI Desktop: free, full build environment. Tableau Public: free practice with a public portfolio built in.",
      steps: [
        "Install Power BI Desktop (Microsoft Store or powerbi.microsoft.com).",
        "Create a free Tableau Public account and install the app.",
        "Load the slice & dice CSV into each.",
        "Build the same one-bar-chart in both and notice how each tool thinks.",
      ],
      exercise:
        "Load the sample dataset into Power BI Desktop AND Tableau Public, and build 'Revenue by Region' in both. Note one thing each tool made easier.",
      resources: [
        { label: "Power BI Desktop", href: "https://powerbi.microsoft.com/desktop/", external: true },
        { label: "Tableau Public", href: "https://public.tableau.com", external: true },
        R.dataset,
      ],
    },
    {
      id: "tk-utilities",
      title: "Everyday utilities & habits",
      minutes: 12,
      concept:
        "The small stuff compounds: a consistent folder structure, ISO dates in file names, a clipboard manager, and knowing ten keyboard shortcuts will save you an hour a week — every week of your career.",
      keyIdea: "Name files so they sort themselves: YYYY-MM-DD_project_thing. Learn shortcuts for the moves you make hourly.",
      steps: [
        "Set up a projects folder: one sub-folder per project, data/ and output/ inside.",
        "Adopt the date-first naming convention for every file you save.",
        "Enable your OS clipboard history (Win+V on Windows, a clipboard manager on Mac).",
        "Learn the big five: Ctrl+C/V, Ctrl+Z, Ctrl+F, Alt+Tab, Ctrl+S — then add one per week.",
      ],
      exercise:
        "Restructure one messy folder using the convention, and write down the three shortcuts you'll force yourself to use this week.",
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

/**
 * "Tools & Utilities" — a free workspace-setup track every student gets in the
 * portal (VS Code, Git & GitHub, Excel workspace, SQL tools, BI installs,
 * everyday habits). Lives here, NOT in COURSES, so it never appears among the
 * paid offerings on the public homepage.
 */
export const TOOLKIT_COURSE: Course = {
  id: "toolkit",
  title: "Tools & Utilities",
  tagline: "Set up a professional data workspace — VS Code, Git & GitHub, Excel, SQL tools and the habits that compound.",
  level: "Everyone",
  duration: "Self-paced",
  accent: ["#a78bfa", "#22d3ee"],
  summary:
    "Every course goes faster when your workspace is ready. This free track walks through installing and configuring the tools every analyst uses — and the small utilities and habits that quietly save an hour a week.",
  forWhom: "Every student, before or alongside any course. No prerequisites.",
  outcomes: [
    "A working editor, Git + GitHub, Excel, SQL and BI tool setup",
    "A GitHub profile that doubles as a portfolio",
    "File, folder and shortcut habits that compound",
  ],
  syllabus: [
    "VS Code setup",
    "Git & GitHub",
    "Excel workspace",
    "SQL tools",
    "Power BI & Tableau installs",
    "Everyday utilities",
  ],
  tools: ["VS Code", "Git & GitHub", "Excel", "SSMS / Azure Data Studio", "Power BI", "Tableau Public"],
  priceFrom: null,
}

/** Every course learnable in the portal: the public offerings + the free toolkit track. */
export const ALL_LEARN_COURSES: Course[] = [...COURSES, TOOLKIT_COURSE]

/** Course lookup that also resolves the portal-only toolkit track. */
export function courseById(courseId: string): Course | undefined {
  return ALL_LEARN_COURSES.find((c) => c.id === courseId)
}
