Attribute VB_Name = "BuildPivot"
'==============================================================================
' BuildPivot.bas  —  companion macro for advanced-excel-kpi-matrix-demo.xlsx
'
' Builds a genuine native PivotTable off the "SalesData" table (on the Data
' sheet) plus a Region slicer, in one run. This is the reliable way to get a
' true PivotTable that opens without any "repair" prompt.
'
' How to use:
'   1. Open advanced-excel-kpi-matrix-demo.xlsx
'   2. Alt+F11  ->  File ▸ Import File…  ->  choose this BuildPivot.bas
'   3. Press F5  (or Developer ▸ Macros ▸ BuildPivot ▸ Run)
'
' Layout produced:
'   Rows    = Category
'   Columns = Quarter
'   Values  = Sum of Revenue
'   Filter  = Region  (+ a click-to-filter slicer)
'==============================================================================
Option Explicit

Public Sub BuildPivot()
    Dim wb As Workbook
    Dim wsData As Worksheet
    Dim wsPivot As Worksheet
    Dim pc As PivotCache
    Dim pt As PivotTable
    Dim tbl As ListObject
    Dim sc As SlicerCache

    Set wb = ThisWorkbook

    ' --- locate the source table ------------------------------------------------
    On Error Resume Next
    Set wsData = wb.Worksheets("Data")
    On Error GoTo 0
    If wsData Is Nothing Then
        MsgBox "Couldn't find the 'Data' sheet.", vbExclamation
        Exit Sub
    End If

    On Error Resume Next
    Set tbl = wsData.ListObjects("SalesData")
    On Error GoTo 0
    If tbl Is Nothing Then
        MsgBox "Couldn't find the 'SalesData' table on the Data sheet.", vbExclamation
        Exit Sub
    End If

    ' --- fresh output sheet -----------------------------------------------------
    Application.DisplayAlerts = False
    On Error Resume Next
    wb.Worksheets("Pivot (auto)").Delete
    On Error GoTo 0
    Application.DisplayAlerts = True

    Set wsPivot = wb.Worksheets.Add(After:=wb.Worksheets(wb.Worksheets.Count))
    wsPivot.Name = "Pivot (auto)"

    ' --- build the pivot cache + table off the table -----------------------------
    Set pc = wb.PivotCaches.Create( _
        SourceType:=xlDatabase, _
        SourceData:=tbl.Range)

    Set pt = pc.CreatePivotTable( _
        TableDestination:=wsPivot.Range("B3"), _
        TableName:="RevenuePivot")

    With pt
        .PivotFields("Category").Orientation = xlRowField
        .PivotFields("Quarter").Orientation = xlColumnField
        .PivotFields("Region").Orientation = xlPageField
        With .PivotFields("Revenue")
            .Orientation = xlDataField
            .Function = xlSum
            .NumberFormat = "#,##0"
            .Caption = "Sum of Revenue"
        End With
        .RowAxisLayout xlTabularRow
        .TableStyle2 = "PivotStyleMedium9"
    End With

    ' --- add a Region slicer ----------------------------------------------------
    On Error Resume Next
    Set sc = wb.SlicerCaches.Add2(pt, "Region")
    If Not sc Is Nothing Then
        sc.Slicers.Add wsPivot, , "Region", "Region", 30, 320, 140, 180
    End If
    On Error GoTo 0

    wsPivot.Columns("A:H").ColumnWidth = 14
    wsPivot.Activate
    MsgBox "PivotTable + Region slicer built on the 'Pivot (auto)' sheet.", vbInformation
End Sub
