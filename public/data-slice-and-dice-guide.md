# Slice & Dice — starter data template

A clean, **tidy** dataset (one row per order) you can drop straight into Excel,
Power BI, Tableau or SQL and start analysing. This is the shape I always aim for
before building anything: dimensions you group *by*, measures you aggregate.

## What's inside (`data-slice-and-dice-template.csv`)

**Dimensions** (the "slice by") — `Date, Year, Quarter, Month, Region, Segment,
Channel, Category, Product, SalesRep`

**Measures** (the "dice / aggregate") — `Units, UnitPrice, Revenue, Cost, Profit`

600 rows of sample B2B sales across 2024.

## Try these in 5 minutes

**Excel (PivotTable)**
- Rows: `Region` → Values: `Sum of Revenue`, `Sum of Profit`
- Add `Segment` to Columns, drag `Quarter` into a Slicer.
- Add a calc: Profit % = `Profit / Revenue`.

**Power BI**
- Load the CSV, create measures: `Total Revenue = SUM(Revenue)`,
  `Profit Margin % = DIVIDE([Total Profit],[Total Revenue])`.
- Matrix visual: `Category` rows × `Quarter` columns × Margin values.

**Tableau**
- Columns: `Quarter`, Rows: `SUM(Revenue)`, Colour: `Segment`.
- Add `Region` to a filter shelf; make it a dashboard action.

**SQL**
```sql
SELECT Region, Segment,
       SUM(Revenue)              AS revenue,
       SUM(Profit)               AS profit,
       SUM(Profit)/SUM(Revenue)  AS margin
FROM   sales
GROUP  BY Region, Segment
ORDER  BY revenue DESC;
```

## The one rule that makes data easy to slice

Keep it **tidy**: every row is one observation, every column is one variable, no
merged cells, no totals baked into the data. Do the aggregation in your tool, not
in the source. Get that right and every question becomes a two-minute pivot.

— Rakshit
