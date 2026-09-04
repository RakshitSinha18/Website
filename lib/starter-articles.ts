/**
 * Built-in starter articles.
 *
 * These render on the Articles pages even before anything is published to
 * Supabase, so the section is never empty and shows real, worked BI concepts.
 * Once Rakshit publishes his own articles from the admin panel, those appear
 * alongside these (Supabase articles are listed first).
 *
 * To retire a starter article, remove it from this array.
 */
export interface StarterArticle {
  slug: string
  title: string
  excerpt: string
  created_at: string // ISO date
  body: string
}

export const STARTER_ARTICLES: StarterArticle[] = [
  {
    slug: "tidy-data-before-dashboards",
    title: "Tidy data first: the habit behind every good dashboard",
    excerpt:
      "Most dashboard pain isn't a Power BI or Tableau problem — it's a data-shape problem. Here's the one structure that makes everything downstream easy.",
    created_at: "2026-08-10",
    body: `Before I build a single visual, I get the data into a shape I can trust. Nine times out of ten, a "Tableau is slow" or "my Power BI numbers are wrong" problem is really a messy-source problem in disguise.

The shape I aim for is what statisticians call tidy data: every row is one observation, every column is one variable, and nothing is pre-aggregated. No merged cells, no subtotal rows hiding inside the data, no "Q1 / Q2 / Q3" spread across columns when they should be one Quarter column.

Why it matters: your tool wants to do the aggregation. The moment you bake totals into the source, you fight the tool for the rest of the project. Filters double-count, grand totals go wrong, and every new question means reshaping the file again.

A quick test: can you answer a brand-new question ("profit by channel, this quarter, South region only") without touching the source file — just by dragging fields? If yes, your data is tidy. If you have to go back and restructure, it isn't yet.

Practical rules I follow:
- One table, one grain. Decide what a single row represents (one order? one day? one customer?) and never mix grains.
- Keys over labels. Keep IDs so you can join; keep labels for humans.
- Dates as real dates, not text. A proper date column unlocks time-intelligence everywhere.
- Push calculations downstream. Let Excel measures, DAX or LOD expressions do the math, so the logic lives in one place you can audit.

Get the shape right and the "hard" part of BI — the modelling, the DAX, the design — becomes the fun part. Get it wrong and no amount of dashboard polish will save you.`,
  },
  {
    slug: "measures-not-calculated-columns",
    title: "Measures, not calculated columns: the DAX mistake I see most",
    excerpt:
      "New Power BI users reach for calculated columns because they feel like Excel. Here's why measures are almost always the right call — and how to tell them apart.",
    created_at: "2026-08-04",
    body: `When people move from Excel to Power BI, the instinct is to add a column for everything — a Profit column, a Margin column, a Running Total column. It feels natural because that's how a spreadsheet works. But in a proper data model, most of those should be measures, not calculated columns.

The difference in one line: a calculated column is computed row-by-row and stored in the model; a measure is computed on the fly, in the filter context of whatever visual you drop it into.

Why measures win most of the time:
- They respect context. A [Profit Margin %] measure recalculates correctly whether you're looking at one product, one region, or the grand total. A calculated-column ratio, averaged up, quietly gives you the wrong number.
- They don't bloat the model. Calculated columns are stored and consume memory; measures cost nothing until used.
- They're reusable. Write [Total Revenue] once and build ten other measures on top of it.

When a calculated column is the right tool:
- You need to group or slice by the value (e.g. a "Price Band" of Low/Mid/High).
- The value must exist physically to relate tables or sort.
- It depends only on the current row and never needs to re-aggregate.

A rule of thumb: if the answer changes depending on what's filtered, it's a measure. If it's a fixed property of the row, it's a column.

Start every model by writing your base measures — [Total Revenue], [Total Cost], [Total Profit] — then compose everything else from them. Your model stays small, your numbers stay honest, and debugging becomes trivial because the logic lives in one place.`,
  },
  {
    slug: "one-question-per-dashboard",
    title: "One question per dashboard: designing for decisions",
    excerpt:
      "A dashboard that answers everything answers nothing. The most useful ones I've shipped start from a single decision — here's how to find it.",
    created_at: "2026-07-28",
    body: `The dashboards that get used share one trait: they were built to answer a specific question for a specific person. The ones that gather dust tried to be everything to everyone.

Before I open Tableau or Power BI, I write one sentence: "This dashboard helps [role] decide [decision] by showing [the few things that matter]." If I can't fill that in, the dashboard isn't ready to be designed yet — the conversation with the business isn't finished.

That sentence does a lot of work:
- It sets the audience. A dashboard for a regional head looks nothing like one for an analyst. Different grain, different vocabulary, different level of detail.
- It sets the metrics. You keep the two or three numbers that drive the decision and cut the rest. Every extra chart is a tax on attention.
- It sets the layout. The headline number goes top-left, where the eye lands first. Context and breakdowns follow. Filters support the story rather than becoming the story.

Some habits that follow from this:
- Lead with the answer, not the data. Show the KPI and whether it's good or bad before the detailed breakdown.
- Kill vanity metrics. If a number won't change a decision, it doesn't earn space.
- Design for the glance and the drill. Most people look for five seconds; a few want to dig. Serve both, in that order.
- Say what "good" looks like. A number without a target or trend is trivia. Add the comparison that makes it meaningful.

Clarity beats decoration every time. A plain dashboard that drives a confident decision has done more than a beautiful one nobody trusts.`,
  },
  {
    slug: "ai-era-analyst",
    title: "The AI-era analyst: what stays valuable when Copilot writes the query",
    excerpt:
      "AI can now draft your SQL and build your first chart. That doesn't make analysts obsolete — it changes which of your skills compound. Here's my honest read.",
    created_at: "2026-09-03",
    body: `Copilot can draft a DAX measure. Fabric's AI skills will answer questions straight off a dataset — and show you the query they used. Industry studies put 30–40% of the repetitive slice of analyst work inside what AI can already automate. So is learning SQL still worth it?

Yes — and I'd argue harder than before. Here's the shift I actually see: AI compresses the typing, not the thinking. The analysts getting more valuable right now are the ones whose judgement was always the real product.

What loses value: memorising syntax, click-path expertise in any one tool, being the person who "pulls the numbers". AI does the first draft of all of that now.

What gains value:

- The data model. AI agents sit on top of your semantic model — they inherit its logic, good or bad. A clean star schema with well-named measures makes Copilot look brilliant. A messy model makes it confidently wrong. Modelling has quietly become an interface for machines, not just humans.
- Verification. When AI writes the query, someone has to know whether it's right. Reading SQL fluently matters more when you didn't write it yourself.
- The question. Tools answer questions; they don't ask them. Knowing which comparison matters, what "good" looks like, and what a stakeholder will actually do with the answer — that's the job now.
- The explanation. An insight that doesn't change a decision is trivia. Communicating what the numbers mean, to people who don't speak data, is the last mile AI hasn't touched.

Practical advice if you're building a career in 2026: learn SQL until you can verify a query you didn't write. Learn dimensional modelling until star schemas are second nature. Then use AI daily — let it draft, while you direct and check. "Fundamentals plus AI fluency" beats either one alone.

The role isn't disappearing. It's being promoted — from producing numbers to owning what they mean. Make sure your skills are the ones that got promoted with it.`,
  },
]
