// Flashcard decks for the portal's Practice tab — quick active-recall drills
// that pair with the Learn lessons and with interview prep. Self-contained
// (no admin/DB); progress lives in localStorage (see components/practice-deck.tsx).

export interface PracticeCard {
  id: string
  front: string // the prompt / question
  back: string // the answer, in plain teaching language
}

export interface PracticeDeck {
  id: string
  title: string
  blurb: string
  accent: [string, string]
  cards: PracticeCard[]
}

export const PRACTICE_DECKS: PracticeDeck[] = [
  {
    id: "sql",
    title: "SQL essentials",
    blurb: "Joins, aggregation and the traps interviewers love.",
    accent: ["#38bdf8", "#fbbf24"],
    cards: [
      {
        id: "sql-1",
        front: "INNER JOIN vs LEFT JOIN — what's the difference in the rows you get back?",
        back: "INNER JOIN keeps only rows that match in BOTH tables. LEFT JOIN keeps every row from the left table and fills the right side with NULLs where there's no match. If your row count drops unexpectedly, check whether an INNER JOIN silently filtered rows.",
      },
      {
        id: "sql-2",
        front: "When do you use HAVING instead of WHERE?",
        back: "WHERE filters rows BEFORE grouping; HAVING filters groups AFTER aggregation. \"Customers with more than 5 orders\" needs HAVING COUNT(*) > 5 — the count doesn't exist until after GROUP BY.",
      },
      {
        id: "sql-3",
        front: "Why does WHERE status = NULL return nothing, and what should you write?",
        back: "NULL isn't equal to anything — not even NULL — so = NULL is never true. Use IS NULL / IS NOT NULL. Same trap in NOT IN: a NULL inside the list makes the whole predicate return no rows.",
      },
      {
        id: "sql-4",
        front: "What does a window function do that GROUP BY can't?",
        back: "A window function (SUM() OVER (...), ROW_NUMBER(), etc.) computes an aggregate WITHOUT collapsing rows — every row keeps its detail plus the aggregate alongside. GROUP BY collapses to one row per group. Use windows for running totals, ranks and \"% of group\" columns.",
      },
      {
        id: "sql-5",
        front: "How do you get the top 3 products by revenue in each category?",
        back: "Rank inside each category with a window: ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC) AS rn, then filter rn <= 3 in an outer query or CTE. PARTITION BY restarts the numbering per category.",
      },
      {
        id: "sql-6",
        front: "What's the execution order of a SELECT query (logically)?",
        back: "FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT. That's why you can't use a SELECT alias in WHERE, but you can in ORDER BY.",
      },
      {
        id: "sql-7",
        front: "UNION vs UNION ALL — which one is faster and why?",
        back: "UNION ALL is faster: it just stacks the results. UNION also removes duplicates, which forces a sort/hash of the whole result. Default to UNION ALL unless you specifically need de-duplication.",
      },
      {
        id: "sql-8",
        front: "A query joining orders to order_items suddenly doubles revenue totals. What happened?",
        back: "Row fan-out: each order matched several item rows, so order-level values got repeated then summed. Aggregate the many-side first (in a CTE/subquery) to one row per order, then join.",
      },
      {
        id: "sql-9",
        front: "What is a CTE and when do you reach for one?",
        back: "A Common Table Expression (WITH name AS (...)) is a named, temporary result you can reference like a table. Use it to break a query into readable steps, to reuse an intermediate result, or for recursion. It usually doesn't change performance — it changes clarity.",
      },
      {
        id: "sql-10",
        front: "COUNT(*) vs COUNT(column) — when do they differ?",
        back: "COUNT(*) counts rows. COUNT(column) counts rows where that column is NOT NULL. On a column with NULLs they differ — handy for \"how many customers have an email\" style checks.",
      },
    ],
  },
  {
    id: "dax-powerbi",
    title: "Power BI & DAX",
    blurb: "Filter context, CALCULATE and modelling — the heart of Power BI.",
    accent: ["#f59e0b", "#38bdf8"],
    cards: [
      {
        id: "dax-1",
        front: "Measure vs calculated column — where is each computed, and which should you default to?",
        back: "A calculated column is computed row by row at refresh and stored in the model (costs memory, static). A measure is computed at query time inside the visual's filter context (dynamic, cheap to store). Default to measures; use columns only when you need the value on a row — e.g. to slice or group by it.",
      },
      {
        id: "dax-2",
        front: "What is filter context?",
        back: "The set of filters active when a measure evaluates — from slicers, the rows/columns of the visual, and other visuals' cross-filtering. The same measure returns different numbers in different cells because each cell has its own filter context.",
      },
      {
        id: "dax-3",
        front: "What does CALCULATE actually do?",
        back: "CALCULATE evaluates an expression in a MODIFIED filter context: it can add filters, replace existing ones, or remove them (ALL). It's the only common function that changes filter context — which is why almost every non-trivial measure uses it.",
      },
      {
        id: "dax-4",
        front: "How do you compute \"% of total\" that ignores the visual's category filter?",
        back: "DIVIDE([Sales], CALCULATE([Sales], ALL(Product[Category]))). ALL removes the category filter in the denominator, so each row shows its share of the grand total.",
      },
      {
        id: "dax-5",
        front: "Why is a star schema preferred over one wide flat table in Power BI?",
        back: "Facts (transactions) and dimensions (who/what/when) separate cleanly: smaller model, faster compression, one date table shared by all facts, and DAX that behaves predictably. Flat tables break time intelligence and make many-to-many messes more likely.",
      },
      {
        id: "dax-6",
        front: "What does a date/calendar table give you that the transaction date column can't?",
        back: "A contiguous, marked date table enables time intelligence (TOTALYTD, SAMEPERIODLASTYEAR, DATEADD), guarantees no missing dates, and lets every fact table share one consistent calendar (fiscal years, week starts, holidays).",
      },
      {
        id: "dax-7",
        front: "SUM vs SUMX — when do you need the X version?",
        back: "SUM adds up one existing column. SUMX iterates a table and evaluates an expression per row — needed when the thing you're summing doesn't exist as a column, e.g. SUMX(Sales, Sales[Qty] * Sales[Price]).",
      },
      {
        id: "dax-8",
        front: "Your total row doesn't equal the sum of the rows above it. Why can that happen in DAX?",
        back: "The total cell has its OWN filter context (no row filter), so the measure re-evaluates over everything — it does not add up the visible cells. Ratios, MAX/MIN logic and SUMX over filtered tables commonly \"break\" totals. If you need additive totals, use SUMX over VALUES of the grouping column.",
      },
      {
        id: "dax-9",
        front: "What is row context, and which functions create it?",
        back: "Row context = \"the current row\" while an expression iterates a table. Calculated columns have it automatically; iterators (SUMX, FILTER, AVERAGEX…) create it. It does NOT filter measures by itself — that's what CALCULATE's context transition is for.",
      },
      {
        id: "dax-10",
        front: "Import vs DirectQuery — the practical trade-off?",
        back: "Import copies data into the in-memory model: fastest visuals, full DAX, but data is as fresh as the last refresh. DirectQuery leaves data at the source: always current and handles huge tables, but every interaction fires source queries and some DAX/modelling features are limited. Default to Import unless freshness or size forces DirectQuery.",
      },
    ],
  },
  {
    id: "excel",
    title: "Advanced Excel",
    blurb: "Lookups, SUMIFS and the habits that make workbooks trustworthy.",
    accent: ["#34d399", "#38bdf8"],
    cards: [
      {
        id: "xl-1",
        front: "XLOOKUP vs VLOOKUP — three concrete advantages of XLOOKUP.",
        back: "1) Looks left as well as right — no column-counting. 2) Defaults to exact match (VLOOKUP defaults to approximate — a classic silent bug). 3) Has a built-in if-not-found argument and doesn't break when columns are inserted.",
      },
      {
        id: "xl-2",
        front: "What do the $ signs do in $A$2, A$2 and $A2?",
        back: "They lock the row and/or column when the formula is copied. $A$2 = both locked; A$2 = row locked, column shifts; $A2 = column locked, row shifts. Getting this right is what makes one formula fill an entire matrix correctly.",
      },
      {
        id: "xl-3",
        front: "SUMIF vs SUMIFS — why default to SUMIFS?",
        back: "SUMIFS takes multiple criteria and puts the sum range FIRST, so formulas read consistently and extend naturally when a second condition arrives. SUMIF's argument order is different, which breeds errors when you upgrade a formula later.",
      },
      {
        id: "xl-4",
        front: "Why convert a range to an Excel Table (Ctrl+T) before building on it?",
        back: "Tables auto-expand: formulas, PivotTables and charts pick up new rows without editing ranges. You also get structured references (Table[Revenue]) that read like sentences, and consistent formatting. Most broken dashboards trace back to a fixed range someone outgrew.",
      },
      {
        id: "xl-5",
        front: "What does a PivotTable do, in one sentence, and when is it the wrong tool?",
        back: "It groups and aggregates tidy row-level data by any fields you drag in — instantly. Wrong tool when you need a fixed report layout others will build formulas on, or when the source data isn't tidy (merged cells, subtotals mixed in).",
      },
      {
        id: "xl-6",
        front: "What is \"tidy\" data — the shape Excel analysis wants?",
        back: "One row per observation, one column per variable, one value per cell — no merged cells, no subtotal rows inside the data, headers in exactly one row. Every downstream tool (SUMIFS, Pivots, Power Query, BI tools) assumes this shape.",
      },
      {
        id: "xl-7",
        front: "IFERROR: useful or dangerous?",
        back: "Both. It's right for expected gaps (lookup misses → \"Not found\"). It's dangerous as a blanket wrapper because it hides REAL errors — a typo'd range returns your fallback and you never notice. Wrap the narrowest expression possible, and prefer XLOOKUP's if_not_found argument.",
      },
      {
        id: "xl-8",
        front: "What is Power Query for, and what habit does it replace?",
        back: "Repeatable data clean-up: import, filter, split, unpivot, merge — recorded as refreshable steps. It replaces manual copy-paste-fix rituals, so next month's file is one Refresh instead of an afternoon of edits.",
      },
      {
        id: "xl-9",
        front: "COUNTA vs COUNT vs COUNTBLANK — what does each count?",
        back: "COUNT counts numeric cells only. COUNTA counts non-empty cells of any type. COUNTBLANK counts empty cells. Using COUNT on a text column returning 0 is a common \"my formula is broken\" moment.",
      },
      {
        id: "xl-10",
        front: "How do you make a KPI cell turn red/amber/green automatically?",
        back: "Conditional formatting driven by a rule or a helper cell that compares actual vs target (e.g. actual/target thresholds). Keep thresholds in visible cells — not buried inside the rule — so reviewers can see and change them.",
      },
    ],
  },
  {
    id: "dashboard-design",
    title: "Dashboard design",
    blurb: "The judgment layer — what separates a chart dump from a decision tool.",
    accent: ["#a78bfa", "#fbbf24"],
    cards: [
      {
        id: "dd-1",
        front: "What's the first question to ask before building any dashboard?",
        back: "\"What decision will this help someone make?\" One dashboard, one core question. If you can't name the decision and the person making it, you're decorating data, not designing a tool.",
      },
      {
        id: "dd-2",
        front: "Bar chart vs line chart — the simple rule?",
        back: "Line for change over time (the eye reads slope). Bars for comparing categories (the eye compares lengths). Time on bars hides trend; categories on lines invent trends that don't exist.",
      },
      {
        id: "dd-3",
        front: "Why are pie charts usually a poor choice, and when are they acceptable?",
        back: "Humans judge angles poorly — adjacent slices of similar size are unreadable. Acceptable only for 2–3 parts of a whole where one clearly dominates. Otherwise a sorted bar chart shows the same data better.",
      },
      {
        id: "dd-4",
        front: "What are preattentive attributes and why do they matter?",
        back: "Visual properties the brain registers before conscious attention: color, size, position, intensity. Use exactly one to highlight what matters (e.g. one red bar among grey). Use several at once and nothing stands out.",
      },
      {
        id: "dd-5",
        front: "How should color be used on a dashboard?",
        back: "As meaning, not decoration: one accent for \"look here\", consistent semantic colors (e.g. red = below target — and never also a brand color), grey for context. If every chart is a different rainbow, color stops carrying information.",
      },
      {
        id: "dd-6",
        front: "Where do the most important numbers go, and why?",
        back: "Top-left, sized largest. Readers scan in an F/Z pattern starting top-left — put the KPI that answers the dashboard's core question there, with target and trend beside it, details below.",
      },
      {
        id: "dd-7",
        front: "A stakeholder asks to add \"just one more chart\" (again). What's the design principle at stake?",
        back: "Every element competes for attention — each addition taxes everything already there. Ask what question the new chart answers; if it's a different question, it likely belongs on a different view/drill-through, not squeezed onto this one.",
      },
      {
        id: "dd-8",
        front: "Why should axes generally start at zero for bar charts but not necessarily for lines?",
        back: "Bars encode value as LENGTH — truncating the axis literally lies about proportion. Lines encode change as SLOPE, so a zoomed axis can be legitimate to show variation, as long as it's labeled honestly.",
      },
      {
        id: "dd-9",
        front: "What belongs in a dashboard's \"context layer\" besides the numbers?",
        back: "What the metric means (definition), the comparison that gives it meaning (target, last period, benchmark), data freshness, and known caveats. A number without comparison is trivia, not insight.",
      },
      {
        id: "dd-10",
        front: "How do you know a dashboard succeeded?",
        back: "Not by looks — by use: people open it before meetings, decisions cite it, and the ad-hoc \"can you pull this number\" requests drop. If nobody acts differently because of it, it failed regardless of polish.",
      },
    ],
  },
  {
    id: "interview",
    title: "Interview prep — BI roles",
    blurb: "What hiring managers actually probe in 2026: architecture, performance and judgement — not just syntax.",
    accent: ["#fb7185", "#38bdf8"],
    cards: [
      {
        id: "iv-1",
        front: "Power BI Pro vs Premium — the one-line difference?",
        back: "Pro is the per-user licence for creating and sharing with other Pro users. Premium buys capacity: bigger datasets, more frequent refreshes, and sharing with viewers who don't each need a paid licence. Small team → Pro; large audience or heavy models → Premium.",
      },
      {
        id: "iv-2",
        front: "What does the on-premises data gateway actually do?",
        back: "It's the secure bridge that lets the Power BI Service refresh data living inside a company network (SQL Server, files on a share, Oracle). Reports build fine without it — scheduled refresh is what breaks if it's missing. Classic 'why won't it refresh' answer.",
      },
      {
        id: "iv-3",
        front: "Where do you clean data — Power Query or DAX?",
        back: "Power Query (M), before it hits the model: fix types, remove junk rows, unpivot, merge. DAX is for business logic at query time: measures, ratios, time-intelligence. Rule of thumb — shape once upstream in M; calculate downstream in DAX. Cleaning in DAX is a smell.",
      },
      {
        id: "iv-4",
        front: "You're asked to design a SQL view to feed a Power BI report. What makes it BI-friendly?",
        back: "Flattened to a clear grain, business rules already applied (no magic codes), only needed columns, indexed on join/filter keys, and shaped like a star — facts with dimension keys. The interviewer is checking you think about what happens BEFORE data reaches the tool.",
      },
      {
        id: "iv-5",
        front: "A Power BI report is slow. Walk through your diagnosis.",
        back: "Measure first: Performance Analyzer to find which visuals are slow and whether time goes to the query or the visual. Then in order — trim columns/rows loaded, push filters to the source, check relationships and cardinality, simplify DAX (avoid iterating huge tables), consider aggregations. Never start by 'redesigning' blind.",
      },
      {
        id: "iv-6",
        front: "What makes a WHERE clause non-sargable, and why does it matter?",
        back: "Wrapping the filtered column in a function — WHERE YEAR(OrderDate) = 2024 — stops the index being used, forcing a scan. Rewrite as a bare-column range: OrderDate >= '2024-01-01' AND OrderDate < '2025-01-01'. Same rows, index-friendly, often orders of magnitude faster.",
      },
      {
        id: "iv-7",
        front: "What is Row-Level Security (RLS) and when do you need it?",
        back: "Filters applied per user identity inside the model — a regional manager opens the same report but only sees their region's rows. Needed whenever one report serves audiences who mustn't see each other's data. Define roles with DAX filters, map users in the Service.",
      },
      {
        id: "iv-8",
        front: "Correlation vs causation — why do interviewers keep asking?",
        back: "Because acting on correlation as if it were causation is the most expensive analyst mistake. Ice cream sales correlate with drownings (both follow summer). A good answer names a confounder and proposes how you'd test causality: experiment, A/B test, or at least a natural comparison group.",
      },
      {
        id: "iv-9",
        front: "How do you validate that your dashboard's numbers are right?",
        back: "Reconcile against a trusted source (finance report, source system total) at the same grain and filters; spot-check a handful of rows end to end; test edge cases (nulls, returns, timezone boundaries); and have the business owner sign off a baseline. 'It matched what I expected' is not validation.",
      },
      {
        id: "iv-10",
        front: "\"Walk me through a project\" — how do you structure the answer?",
        back: "Challenge → approach → outcome, with a number at the end. One sentence of business context, the messy part you solved (data quality, stakeholders, scale), the choices you made and why, then the measurable result. Ninety seconds. Rambling chronology is the most common fail.",
      },
      {
        id: "iv-11",
        front: "How do you present a finding to a non-technical stakeholder?",
        back: "Answer first: 'Revenue dipped 8% because of churn in one segment — here's the fix I'd test.' Then one supporting visual, then the caveat that matters. Keep the methodology in your back pocket for questions. Leading with the SQL is leading with the least interesting part.",
      },
      {
        id: "iv-12",
        front: "\"Will AI replace analysts?\" — what's a strong interview answer in 2026?",
        back: "AI automates the repetitive draft work (first-cut queries, chart scaffolding), which raises the value of what it can't do: modelling data cleanly (AI agents inherit your semantic model's logic), verifying generated queries, asking the right business question, and landing the insight with stakeholders. Position yourself as the analyst who uses AI daily and checks its work.",
      },
    ],
  },
]
