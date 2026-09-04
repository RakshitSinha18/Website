/**
 * Per-session presentation decks for every course — the in-portal teaching
 * companion to the Learn tab's lessons.
 *
 * One lesson = one live session = one deck. Decks are DERIVED from the lesson
 * content in lib/course-lessons.ts, so the flagship courses (Power BI, Tableau,
 * SQL) get rich, fully-authored slides automatically and every other course
 * still gets a complete, presentable deck. Author once, teach twice.
 *
 * Each slide carries two extra layers beyond what's projected:
 *   - notes:    speaker notes — what the mentor says/does while this slide is up
 *   - thinking: the mental model behind the slide ("How I think about it")
 * Some slides also carry runnable sample code (SQL, DAX, M, Tableau, Git).
 *
 * Session 1 of every course additionally covers the field kit: the tools of
 * the trade, how each tool CONNECTS to data, and the sample dataset students
 * practise on. Sessions are mapped onto a learning JOURNEY — four phases from
 * first contact to shipping real work — rendered as a journey map.
 */

import { lessonsForCourse, courseById, type Lesson } from "@/lib/course-lessons"

export const JOURNEY_PHASES = ["Foundations", "Core skills", "Applied", "Ship it"] as const
export type JourneyPhase = (typeof JOURNEY_PHASES)[number]

/** One line of narrative per phase — shown on the journey map. */
export const PHASE_STORY: Record<JourneyPhase, string> = {
  Foundations: "Get oriented — the landscape, the vocabulary, the mental model.",
  "Core skills": "Build the muscle — the techniques you'll use every working day.",
  Applied: "Put it to work — real data, real questions, real analysis.",
  "Ship it": "Make it stick — polish, share, and prove you can do it end-to-end.",
}

export interface DeckResource {
  label: string
  href: string
}

export interface DeckSlide {
  kind: "title" | "content" | "code" | "exercise" | "recap"
  title: string
  bullets: string[]
  /** Runnable sample code shown in a mono block (SQL / DAX / M / Git…). */
  code?: string
  /** Speaker notes — the mentor's voice: what to say and do on this slide. */
  notes: string
  /** The mental model behind the slide — shown as "How I think about it". */
  thinking?: string
}

export interface SessionDeck {
  id: string // `${courseId}-s${session}` — stable, used as the progress key
  session: number // 1-based
  title: string
  objective: string
  phase: JourneyPhase
  minutes: number // rough live-session length
  slides: DeckSlide[]
  /** Sample data + downloads students need for this course's sessions. */
  materials: DeckResource[]
}

/** Which journey phase a session falls in, by its position in the course. */
export function phaseOf(index: number, total: number): JourneyPhase {
  const f = (index + 1) / total
  if (f <= 0.25) return "Foundations"
  if (f <= 0.6) return "Core skills"
  if (f <= 0.85) return "Applied"
  return "Ship it"
}

// ── Field kit: sample data, connectors and code per course ─────────

const CSV = { label: "Sample data: slice & dice CSV (600 rows)", href: "/data-slice-and-dice-template.csv" }
const CSV_GUIDE = { label: "Dataset guide (what's inside & how to use it)", href: "/data-slice-and-dice-guide.md" }
const XLSX = { label: "Advanced Excel KPI/matrix workbook (.xlsx)", href: "/advanced-excel-kpi-matrix-demo.xlsx" }

/** Downloadable practice materials per course. */
const COURSE_MATERIALS: Record<string, DeckResource[]> = {
  "data-analytics": [CSV, CSV_GUIDE],
  tableau: [CSV, CSV_GUIDE],
  "power-bi": [CSV, CSV_GUIDE],
  fabric: [CSV, CSV_GUIDE],
  sql: [CSV, CSV_GUIDE],
  excel: [XLSX, CSV, CSV_GUIDE],
  sas: [CSV, CSV_GUIDE],
  career: [],
  toolkit: [CSV, CSV_GUIDE, XLSX],
}

/** How each course's tool stack connects to data — taught in session 1. */
const CONNECTORS: Record<string, string[]> = {
  "data-analytics": [
    "Excel / CSV files — where most analysis starts (and often ends up)",
    "Databases via SQL — the source of truth in real companies",
    "BI tools (Power BI / Tableau) connect to both and stay refreshable",
    "Rule of thumb: connect to the source, don't copy-paste extracts",
  ],
  tableau: [
    "Connect pane → Text/Excel file for the sample CSV",
    "Databases (SQL Server, Postgres…): choose Live vs Extract deliberately",
    "Published data sources on Tableau Server/Cloud — one source, many workbooks",
    "Extracts (.hyper) make big data fast; schedule refreshes",
  ],
  "power-bi": [
    "Get Data → Text/CSV or Excel — the fastest start",
    "Get Data → SQL Server: Import vs DirectQuery, and when each wins",
    "Web/API sources land through Power Query (M) like everything else",
    "On-prem sources refresh in the Service through the data gateway",
  ],
  fabric: [
    "Dataflows Gen2 — the Power Query you know, landing into OneLake",
    "Data Factory pipelines for scheduled, orchestrated loads",
    "OneLake shortcuts — point at ADLS/S3 data without copying it",
    "Power BI reads via Direct Lake — no import copy, no refresh schedule",
  ],
  sql: [
    "SSMS / Azure Data Studio → server name + authentication + database",
    "Import Flat File wizard turns the sample CSV into a queryable table",
    "Every BI tool ultimately speaks SQL to a database — this is the layer under everything",
    "Connection string anatomy: server, database, credentials, options",
  ],
  excel: [
    "Data → Get & Transform (Power Query) — refreshable imports, not paste-ins",
    "From Text/CSV, from Workbook, from Folder (combine many files)",
    "Excel Tables are the clean hand-off: BI tools read them directly",
    "Same Power Query engine as Power BI — skills transfer 1:1",
  ],
  sas: [
    "LIBNAME points SAS at a folder or database — your data library",
    "PROC IMPORT brings in CSV/Excel (the sample dataset works out of the box)",
    "SAS datasets (.sas7bdat) are the working store between steps",
    "PROC SQL speaks the SQL you already know, inside SAS",
  ],
}

/** Authored sample code per lesson — shown as its own slide with notes. */
const CODE_SAMPLES: Record<string, { intro: string; code: string; notes: string }> = {
  "sql-select": {
    intro: "The query pattern behind ninety percent of analyst work — on the sample dataset:",
    code: `SELECT Region,
       SUM(Revenue) AS TotalRevenue,
       SUM(Profit)  AS TotalProfit
FROM   sales
WHERE  Quarter = 'Q1'
GROUP  BY Region
ORDER  BY TotalRevenue DESC;`,
    notes:
      "Type it live — never paste. Say the logical order out loud as you go: FROM finds the table, WHERE filters rows, GROUP BY rolls up, SELECT names the output, ORDER BY ranks it.",
  },
  "sql-joins": {
    intro: "A CTE turns nested spaghetti into readable steps:",
    code: `WITH rep_revenue AS (
  SELECT SalesRep, SUM(Revenue) AS Total
  FROM   sales
  GROUP  BY SalesRep
)
SELECT SalesRep, Total
FROM   rep_revenue
WHERE  Total > (SELECT AVG(Total) FROM rep_revenue);`,
    notes:
      "Build it in two passes: run the CTE alone first so everyone sees its output, THEN add the outer query. That order is the whole point of CTEs.",
  },
  "sql-windows": {
    intro: "Rank within groups while keeping every row:",
    code: `SELECT Category, Product, Revenue,
       ROW_NUMBER() OVER (
         PARTITION BY Category
         ORDER BY Revenue DESC
       ) AS rank_in_category
FROM   sales;`,
    notes:
      "Run it, then scroll the results and point at the rank restarting for each category — that visual moment is when PARTITION BY clicks.",
  },
  "sql-optimize": {
    intro: "The same filter, non-sargable vs sargable — one uses the index, one can't:",
    code: `-- Non-sargable: function on the column kills the index
WHERE YEAR(OrderDate) = 2024

-- Sargable: bare column, range predicate — index-friendly
WHERE OrderDate >= '2024-01-01'
  AND OrderDate <  '2025-01-01'`,
    notes: "Show both plans side by side if you can — scan vs seek. The rewrite is mechanical once they see why.",
  },
  "pbi-dax-foundations": {
    intro: "A first measure — explicit, reusable, filter-context aware:",
    code: `Total Revenue = SUM ( sales[Revenue] )

Profit Margin % =
DIVIDE ( SUM ( sales[Profit] ), SUM ( sales[Revenue] ) )`,
    notes:
      "Create both live, then drag Profit Margin % against Region, then against Product — same measure, different answers. That IS filter context; say the sentence explicitly.",
  },
  "pbi-calculate": {
    intro: "CALCULATE changes filter context — time intelligence is just CALCULATE plus a date table:",
    code: `Revenue LY =
CALCULATE (
    [Total Revenue],
    SAMEPERIODLASTYEAR ( 'Date'[Date] )
)

YoY Growth % =
DIVIDE ( [Total Revenue] - [Revenue LY], [Revenue LY] )`,
    notes:
      "Insist on the pattern: base measure first, CALCULATE variant second, ratio third. Students who skip the base measure end up debugging nests for hours.",
  },
  "pbi-power-query": {
    intro: "Every clean-up step is a line of M you can read back:",
    code: `let
  Source = Csv.Document(File.Contents("data-slice-and-dice-template.csv")),
  Promoted = Table.PromoteHeaders(Source),
  Typed = Table.TransformColumnTypes(Promoted,
    {{"Revenue", type number}, {"Date", type date}})
in
  Typed`,
    notes:
      "Do the steps through the UI first, then open Advanced Editor and read the generated M together — the point is that the UI writes code, and code means repeatable.",
  },
  "tab-calcs": {
    intro: "A calculated field vs a Level-of-Detail expression:",
    code: `// Row-level calculated field
Profit Ratio: [Profit] / [Revenue]

// LOD: revenue per region regardless of what's on the view
{ FIXED [Region] : SUM([Revenue]) }`,
    notes:
      "Put the LOD on a view already sliced by Product — the number stays fixed per region while everything else varies. Contrast is the teacher here.",
  },
  "fab-medallion": {
    intro: "Bronze to silver in a Fabric notebook — and the T-SQL you already know still works in the warehouse:",
    code: `# PySpark: clean bronze into a silver Delta table
df = spark.read.csv("Files/bronze/sales.csv", header=True)
(df.filter("Revenue IS NOT NULL")
   .dropDuplicates(["OrderID"])
   .write.format("delta").mode("overwrite")
   .saveAsTable("silver_sales"))

-- Warehouse endpoint: familiar T-SQL over the same lake
SELECT Region, SUM(Revenue) AS TotalRevenue
FROM   silver_sales
GROUP  BY Region;`,
    notes:
      "Two languages, one copy of the data — that's the slide's real message. Run the notebook cell, then immediately query the same table from the SQL endpoint so the 'one lake, many engines' idea lands as a demo, not a diagram.",
  },
  "tk-git": {
    intro: "The four commands that cover ninety percent of Git:",
    code: `git clone https://github.com/<you>/data-practice.git
git add .
git commit -m "first analysis files"
git push`,
    notes:
      "Run the full loop live including the GitHub refresh at the end — seeing their file appear online is the payoff that makes the habit stick.",
  },
}

/** Split prose into clean sentence bullets (avoids regex lookbehind for old Safari). */
function sentences(text: string): string[] {
  return text
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/[.?!]$/.test(s) ? s : `${s}.`))
}

function deckFromLesson(courseId: string, lesson: Lesson, index: number, all: Lesson[]): SessionDeck {
  const course = courseById(courseId)
  const total = all.length
  const session = index + 1
  const next = all[index + 1]
  const phase = phaseOf(index, total)
  const objective = lesson.keyIdea
  const materials = COURSE_MATERIALS[courseId] ?? [CSV, CSV_GUIDE]

  const slides: DeckSlide[] = []

  // 1 — Title: the hook + the agenda.
  slides.push({
    kind: "title",
    title: lesson.title,
    bullets: [
      `Session ${session} of ${total} · ${phase}`,
      "Why this matters",
      "How it works — step by step",
      "Hands-on: try it yourself",
      "Recap & self-check",
    ],
    notes: `Open with the goal, not the tool: by the end of tonight — ${objective} Ask what everyone already knows about "${lesson.title}" and calibrate the pace to the answers.`,
    thinking: objective,
  })

  // Session 1 only — the field kit: tools of the trade + how they connect to data.
  if (session === 1 && course && course.tools.length > 0) {
    slides.push({
      kind: "content",
      title: "Your toolkit",
      bullets: [
        ...course.tools.map((t) => t),
        ...(materials.length > 0 ? ["Practice data: the slice & dice sample dataset (download below)"] : []),
      ],
      notes:
        "Walk the stack once so nothing on screen is ever a mystery: name each tool, what it's for, and which sessions use it. Have everyone download the sample dataset NOW — every hands-on exercise uses it.",
      thinking: "Fluency starts with knowing what each tool is for — confusion about the stack becomes confusion about the subject.",
    })
    const connectors = CONNECTORS[courseId]
    if (connectors) {
      slides.push({
        kind: "content",
        title: "Connect to your data",
        bullets: connectors,
        notes:
          "Demo one real connection end-to-end, slowly — from 'open the tool' to 'rows on screen'. Connection problems are the number one reason beginners stall in week one; kill that risk tonight.",
        thinking: "Data access is step zero. An analyst who can connect to anything is never blocked.",
      })
    }
  }

  // Why this matters: the concept, one sentence per bullet.
  slides.push({
    kind: "content",
    title: "Why this matters",
    bullets: sentences(lesson.concept),
    notes: lesson.concept,
    thinking: objective,
  })

  // How it works: the steps, split across two slides when long.
  const stepChunks = lesson.steps.length > 5
    ? [lesson.steps.slice(0, Math.ceil(lesson.steps.length / 2)), lesson.steps.slice(Math.ceil(lesson.steps.length / 2))]
    : [lesson.steps]
  stepChunks.forEach((chunk, ci) => {
    slides.push({
      kind: "content",
      title: stepChunks.length > 1 ? `How it works (${ci + 1} of ${stepChunks.length})` : "How it works",
      bullets: chunk,
      notes:
        "Live-demo every step slowly and have students mirror it on their own machine before moving to the next — watching is not learning. Keep one thread visible the whole time: " +
        lesson.keyIdea,
    })
  })

  // Sample code — its own slide when this lesson has an authored snippet.
  const sample = CODE_SAMPLES[lesson.id]
  if (sample) {
    slides.push({
      kind: "code",
      title: "Sample code",
      bullets: [sample.intro],
      code: sample.code,
      notes: sample.notes,
      thinking: lesson.keyIdea,
    })
  }

  // Exercise — quiet hands-on time.
  slides.push({
    kind: "exercise",
    title: "Try it yourself",
    bullets: [lesson.exercise],
    notes:
      "Give 10–15 minutes of quiet hands-on time — resist the urge to rescue early. Circulate and watch HOW people attempt it; the goal is the attempt, not a perfect answer. Wrap by having one student walk the group through their approach.",
    thinking: lesson.check?.why,
  })

  // Recap — key idea, self-check as a group poll, bridge to the next session.
  const recapBullets = [lesson.keyIdea]
  if (lesson.check) recapBullets.push(`Quick check: ${lesson.check.question}`)
  recapBullets.push(next ? `Next session: ${next.title}` : "Course complete — book a 1-on-1 to go deeper.")
  slides.push({
    kind: "recap",
    title: "Recap",
    bullets: recapBullets,
    notes: lesson.check
      ? `Run the self-check as a hands-up poll before revealing the answer, then explain: ${lesson.check.why}`
      : "Close by restating the key idea in your own words, then preview what's next so tonight's work has a destination.",
    thinking: lesson.keyIdea,
  })

  return {
    id: `${courseId}-s${session}`,
    session,
    title: lesson.title,
    objective,
    phase,
    // Evening-class length: lesson depth drives it — longer lessons get the longer slot.
    minutes: lesson.minutes >= 14 ? 60 : 45,
    slides,
    materials,
  }
}

/** All session decks for a course, in teaching order. Never empty. */
export function decksForCourse(courseId: string): SessionDeck[] {
  const lessons = lessonsForCourse(courseId)
  return lessons.map((l, i) => deckFromLesson(courseId, l, i, lessons))
}
