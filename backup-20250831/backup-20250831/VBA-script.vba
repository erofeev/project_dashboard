' ======================================================================================
' Wone IT - CustomDev Practice (Erofeev A.)
'
' ÂÅÐÑÈß Ñ ÃÈÁÐÈÄÍÛÌ ÐÀÑ×ÅÒÎÌ ÑÅÁÅÑÒÎÈÌÎÑÒÈ:
' Ýòîò êîä ðàññ÷èòûâàåò ñòîèìîñòü òðóäîçàòðàò ïî äâóì ñöåíàðèÿì:
' 1. Åñëè óêàçàí "Gross per month" - íà îñíîâå ìåñÿ÷íîãî îêëàäà è íîðìû ÷àñîâ.
' 2. Åñëè "Gross per month" íå óêàçàí - íà îñíîâå ôèêñèðîâàííîé ñòàâêè èç êîëîíêè "Rate".
' ======================================================================================

Option Explicit
 
' --- Ãëîáàëüíûå êîíñòàíòû äëÿ âñåãî ìîäóëÿ ---
' Èñïîëüçóåì êîíñòàíòû, ÷òîáû ëåãêî ìåíÿòü çíà÷åíèÿ â îäíîì ìåñòå, åñëè ñòðóêòóðà äîêóìåíòà èçìåíèòñÿ.
Private Const ACTION_COLUMN As String = "K" ' Áóêâà êîëîíêè äëÿ äåéñòâèé (create, update, delete)
Private Const DATA_TABLE_NAME As String = "TimeEntriesTable" ' Èìÿ "óìíîé" òàáëèöû ñ äàííûìè

' ======================================================================================
' ÃËÀÂÍÛÉ ÌÀÊÐÎÑ ÇÀÏÓÑÊÀ
' 1. Çàãðóçèò äàííûå èç Redmine è ðàññ÷èòàåò ñåáåñòîèìîñòü.
' 2. Ïîñòðîèò âñå íåîáõîäèìûå îò÷åòû (Ñâîäíàÿ òàáëèöà, Ñâîäêà ïî ìåñÿöàì, Îò÷åò ïî ìàðæå).
' ======================================================================================
Sub RunFullProcess_And_CreateReports()
    ' Îòêëþ÷àåì îáíîâëåíèå ýêðàíà, ÷òîáû óñêîðèòü âûïîëíåíèå è èçáåæàòü ìåðöàíèÿ
    Application.ScreenUpdating = False
    
    ' Øàã 1: Âûçûâàåì îñíîâíîé ìàêðîñ äëÿ çàãðóçêè è îáðàáîòêè äàííûõ
    Call GetEasyRedmineTime_FilterInMemory
    
    ' Øàã 2: Ïðîâåðÿåì, áûëè ëè âîîáùå çàãðóæåíû äàííûå. Åñëè íåò, òî îò÷åòû ñòðîèòü áåññìûñëåííî.
    Dim dataSheet As Worksheet
    Set dataSheet = ThisWorkbook.Sheets("SpentTimeData")
    
    ' Ïðîâåðÿåì íîìåð ïîñëåäíåé çàïîëíåííîé ñòðîêè â êîëîíêå A. Åñëè îí ìåíüøå èëè ðàâåí 1 (òîëüêî çàãîëîâîê), òî äàííûõ íåò.
    If dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).row <= 1 Then
        MsgBox "Äàííûå íà ëèñòå 'SpentTimeData' íå íàéäåíû. Îò÷åòû íå ìîãóò áûòü ñãåíåðèðîâàíû.", vbInformation
        Application.ScreenUpdating = True ' Âêëþ÷àåì îáíîâëåíèå ýêðàíà ïåðåä âûõîäîì
        Exit Sub
    End If
    
    ' Øàã 3: Ïîñëåäîâàòåëüíî ñîçäàåì âñå îò÷åòû
    ' On Error GoTo... - ýòî îáðàáîò÷èê îøèáîê. Åñëè ïðè ñîçäàíèè îò÷åòîâ ÷òî-òî ïîéäåò íå òàê, âûïîëíåíèå ïåðåéäåò ê ìåòêå ReportErrorHandler.
    On Error GoTo ReportErrorHandler
    Call CleanAllDuplicatesInTimeEntriesTable
    Call CreatePivotReport
    Call CreateMonthlySummaryReport
    Call CreateProjectMarginReport
    Call ColorizeSheetsByName
    ' Âêëþ÷àåì îáíîâëåíèå ýêðàíà îáðàòíî
    Application.ScreenUpdating = True
    ' Àêòèâèðóåì ëèñò ñî ñâîäíîé òàáëèöåé, ÷òîáû ïîëüçîâàòåëü ñðàçó åãî óâèäåë
    ThisWorkbook.Sheets("PivotReport").Activate
    
    Exit Sub ' Óñïåøíîå çàâåðøåíèå
    
ReportErrorHandler: ' Ñþäà ïðîãðàììà ïåðåéäåò â ñëó÷àå îøèáêè
    Application.ScreenUpdating = True ' Îáÿçàòåëüíî âêëþ÷àåì ýêðàí
    MsgBox "Ïðîèçîøëà îøèáêà âî âðåìÿ ãåíåðàöèè îò÷åòîâ: " & vbCrLf & Err.Description, vbCritical
End Sub

' ======================================================================================
' ÎÑÍÎÂÍÎÉ ÌÀÊÐÎÑ: ÇÀÃÐÓÇÊÀ ÄÀÍÍÛÕ È ÃÈÁÐÈÄÍÛÉ ÐÀÑ×ÅÒ ÑÒÎÈÌÎÑÒÈ
' Ïîëó÷àåò äàííûå èç Redmine, ðàññ÷èòûâàåò ñåáåñòîèìîñòü ïî îêëàäó èëè ïî ðåéòó,
' è ôîðìèðóåò íà ëèñòå "SpentTimeData" óìíóþ òàáëèöó ñî ñðåçàìè.
' ======================================================================================
Sub GetEasyRedmineTime_FilterInMemory()
    ' --- Îïðåäåëÿåì øàãè äëÿ ôîðìû ïðîãðåññà, ÷òîáû ïîëüçîâàòåëü âèäåë, ÷òî ïðîèñõîäèò ---
    Dim steps(1 To 6) As String
    steps(1) = "Èíèöèàëèçàöèÿ è çàãðóçêà îêëàäîâ, ðåéòîâ è êàëåíäàðÿ"
    steps(2) = "Îïðåäåëåíèå ìåòîäà çàãðóçêè (áûñòðûé/ñòàíäàðòíûé)"
    steps(3) = "Çàãðóçêà äàííûõ èç Redmine"
    steps(4) = "Ðàñ÷åò ñåáåñòîèìîñòè ïî çàïèñÿì (ãèáðèäíûé ðåéò)"
    steps(5) = "Ôîðìèðîâàíèå òàáëèöû è ñðåçîâ íà ëèñòå"
    steps(6) = "Çàâåðøåíèå"
    
    ' Ïîêàçûâàåì ôîðìó ïðîãðåññà è èíèöèàëèçèðóåì åå íàøèìè øàãàìè
    ProgressChecklistForm.Show
    ProgressChecklistForm.Init steps
    
    Dim finalMsg As String
    
    ' === ØÀÃ 1: Èíèöèàëèçàöèÿ, çàãðóçêà îêëàäîâ, ðåéòîâ è ïðîèçâîäñòâåííîãî êàëåíäàðÿ ===
    ProgressChecklistForm.SetCurrentStep 1
    
    ' Ñîçäàåì "ñëîâàðè" (îáúåêòû Dictionary) - ýòî ñïåöèàëüíûå õðàíèëèùà äàííûõ òèïà "êëþ÷-çíà÷åíèå", êîòîðûå ðàáîòàþò î÷åíü áûñòðî.
    Dim ratesDict As Object, workingHoursDict As Object
    Set ratesDict = CreateObject("Scripting.Dictionary") ' Äëÿ õðàíåíèÿ ÎÁÎÈÕ òèïîâ ðåéòîâ (îêëàä è ïî÷àñîâîé)
    ratesDict.CompareMode = vbTextCompare ' Íå ðàçëè÷àòü "Èâàí" è "èâàí"
    Set workingHoursDict = CreateObject("Scripting.Dictionary") ' Äëÿ õðàíåíèÿ ðàáî÷èõ ÷àñîâ ïî ìåñÿöàì
    
    Dim ratesSheet As Worksheet, ratesTable As ListObject
    
    ' Ïûòàåìñÿ ïîëó÷èòü äîñòóï ê ëèñòó è òàáëèöå ñ ðåéòàìè
    On Error Resume Next ' Âðåìåííî îòêëþ÷àåì ñòàíäàðòíóþ îáðàáîòêó îøèáîê
    Set ratesSheet = ThisWorkbook.Sheets("Rates")
    Set ratesTable = ratesSheet.ListObjects("RatesTable")
    On Error GoTo ErrorHandler ' Âêëþ÷àåì îáðàáîòêó îøèáîê îáðàòíî
    
    ' --- ÈÇÌÅÍÅÍÎ: Çàãðóæàåì îêëàäû È ïî÷àñîâûå ðåéòû â ñëîâàðü ratesDict ---
    If ratesTable Is Nothing Then
        MsgBox "Íå íàéäåíà òàáëèöà 'RatesTable' íà ëèñòå 'Rates'." & vbCrLf & "Ðàñ÷åò ñåáåñòîèìîñòè íåâîçìîæåí.", vbExclamation
    Else
        ' --- ÈÇÌÅÍÅÍÎ: Íàõîäèì èíäåêñû îáåèõ êîëîíîê ---
        On Error Resume Next
        Dim grossColumnIndex As Long, rateColumnIndex As Long
        grossColumnIndex = ratesTable.ListColumns("Gross per month").Index
        rateColumnIndex = ratesTable.ListColumns("Rate").Index
        On Error GoTo ErrorHandler
        
        If grossColumnIndex = 0 Or rateColumnIndex = 0 Then
            MsgBox "Â òàáëèöå 'RatesTable' íå íàéäåí îäèí èç ñòîëáöîâ: 'Gross per month' èëè 'Rate'. Ðàñ÷åò íåâîçìîæåí.", vbCritical
            GoTo CleanExit
        End If
        
        ' Ïåðåáèðàåì êàæäóþ ñòðîêó â òàáëèöå îêëàäîâ
        Dim rateRow As ListRow
        For Each rateRow In ratesTable.ListRows
            Dim rateUser As String, rateDate As Date, userSalary As Double, userHourlyRate As Double
            rateUser = rateRow.Range(1).value ' Èìÿ ïîëüçîâàòåëÿ
            rateDate = CDate(rateRow.Range(2).value) ' Äàòà íà÷àëà äåéñòâèÿ
            
            ' Ñ÷èòûâàåì îêëàä. Åñëè ÿ÷åéêà ïóñòàÿ èëè íå ÷èñëî, áóäåò 0.
            If IsNumeric(rateRow.Range(grossColumnIndex).value) Then
                userSalary = CDbl(rateRow.Range(grossColumnIndex).value)
            Else
                userSalary = 0
            End If

            ' Ñ÷èòûâàåì ïî÷àñîâîé ðåéò. Åñëè ÿ÷åéêà ïóñòàÿ èëè íå ÷èñëî, áóäåò 0.
            If IsNumeric(rateRow.Range(rateColumnIndex).value) Then
                userHourlyRate = CDbl(rateRow.Range(rateColumnIndex).value)
            Else
                userHourlyRate = 0
            End If
            
            ' Ñîçäàåì âëîæåííóþ ñòðóêòóðó: ÈìÿÏîëüçîâàòåëÿ -> (Äàòà -> [Îêëàä, Ïî÷àñîâîéÐåéò])
            ' Õðàíèì îáà çíà÷åíèÿ â ìàññèâå.
            If Not ratesDict.Exists(rateUser) Then
                Set ratesDict(rateUser) = CreateObject("Scripting.Dictionary")
            End If
            ratesDict(rateUser)(rateDate) = Array(userSalary, userHourlyRate)
        Next rateRow
    End If
    
    ' --- Áëîê çàãðóçêè ïðîèçâîäñòâåííîãî êàëåíäàðÿ  ---
    Dim calendarHeader As Range, lastCol As Long
    ' Íàõîäèì ïîñëåäíþþ êîëîíêó ñ äàííûìè âî âòîðîé ñòðîêå (ãäå çàãîëîâêè ìåñÿöåâ)
    lastCol = ratesSheet.Cells(2, ratesSheet.Columns.Count).End(xlToLeft).Column
    ' Ïåðåáèðàåì êîëîíêè, íà÷èíàÿ ñ F (êîëîíêà 6)
    For lastCol = 6 To lastCol
        Dim monthHeader As String, hoursInMonth As Double
        ' Ôîðìàòèðóåì äàòó èç çàãîëîâêà â ôîðìàò "ÃÃÃÃ-ÌÌ", íàïðèìåð "2025-01". Ýòî áóäåò íàø êëþ÷ â ñëîâàðå.
        monthHeader = Format(ratesSheet.Cells(2, lastCol).value, "yyyy-mm")
        ' Áåðåì êîëè÷åñòâî ÷àñîâ èç ñòðîêè 3
        hoursInMonth = ratesSheet.Cells(3, lastCol).value
        ' Äîáàâëÿåì â ñëîâàðü, òîëüêî åñëè òàì äåéñòâèòåëüíî ÷èñëî áîëüøå íóëÿ
        If IsNumeric(hoursInMonth) And hoursInMonth > 0 Then
            workingHoursDict(monthHeader) = hoursInMonth
        End If
    Next lastCol
    
    ProgressChecklistForm.UpdateStep 1, "Îêëàäû, ðåéòû è êàëåíäàðü óñïåøíî çàãðóæåíû."
    
    ' Îáíîâëÿåì ñëóæåáíûå äàííûå (ïðîåêòû, ïîëüçîâàòåëè, àêòèâíîñòè) áåç ïîêàçà ñîîáùåíèÿ îá óñïåõå
    Call RefreshServiceData(False)
    
    ' Îáúÿâëÿåì âñå ïåðåìåííûå, êîòîðûå ïîíàäîáÿòñÿ äëÿ ðàáîòû ñ Redmine
    Dim configSheet As Worksheet, dataSheet As Worksheet, serviceSheet As Worksheet, http As Object
    Dim jsonResponse As Dictionary, timeEntry As Dictionary
    Dim baseUrl As String, apiKey As String, startDate As String, endDate As String, projectId As String
    Dim apiUrl As String
    Dim offset As Long, limit As Long, totalCount As Long
    Dim fetchedCount As Long, writtenCount As Long, iRowNum As Long
    Dim dataArray() As Variant ' Ìàññèâ äëÿ õðàíåíèÿ äàííûõ. Ðàáîòàòü ñ íèì ãîðàçäî áûñòðåå, ÷åì ñ ÿ÷åéêàìè ëèñòà.
    
    Dim userFilterDict As Object, serviceUsers As Object, discoveredUsers As Object
    Set userFilterDict = CreateObject("Scripting.Dictionary")
    userFilterDict.CompareMode = vbTextCompare
    Set discoveredUsers = CreateObject("Scripting.Dictionary")
    discoveredUsers.CompareMode = vbTextCompare
    
    ' Îòêëþ÷àåì îáíîâëåíèå ýêðàíà äëÿ ìàêñèìàëüíîé ïðîèçâîäèòåëüíîñòè
    Application.ScreenUpdating = False
    
    ' Ïîëó÷àåì äîñòóï ê ëèñòàì è íàñòðîéêàì
    Set configSheet = ThisWorkbook.Sheets("Config")
    Set dataSheet = ThisWorkbook.Sheets("SpentTimeData")
    Set serviceSheet = ThisWorkbook.Sheets("ServiceData")
    Set http = CreateObject("MSXML2.XMLHTTP.6.0") ' Îáúåêò äëÿ îòïðàâêè âåá-çàïðîñîâ
    
    baseUrl = configSheet.Range("B2").value
    apiKey = configSheet.Range("B3").value
    startDate = configSheet.Range("B4").value
    endDate = configSheet.Range("B5").value
    projectId = configSheet.Range("B6").value
    
    ' Åñëè íåò áàçîâûõ íàñòðîåê, âûõîäèì
    If baseUrl = "" Or apiKey = "" Then GoTo CleanExit
    
    ' Çàãðóæàåì ñïèñîê ïîëüçîâàòåëåé äëÿ ôèëüòðàöèè ñ ëèñòà Config
    iRowNum = 9
    Do While configSheet.Cells(iRowNum, 1).value <> ""
        Dim tempUserName As String
        tempUserName = Trim(configSheet.Cells(iRowNum, 1).value)
        If Not userFilterDict.Exists(tempUserName) Then userFilterDict.Add tempUserName, True
        iRowNum = iRowNum + 1
    Loop
    
    If userFilterDict.Count = 0 Then GoTo CleanExit ' Åñëè íåò ïîëüçîâàòåëåé äëÿ ôèëüòðàöèè, âûõîäèì
    
    ' === ØÀÃ 2: Îïðåäåëåíèå ìåòîäà çàãðóçêè  ===
    ProgressChecklistForm.SetCurrentStep 2
    Dim useFastMethod As Boolean
    useFastMethod = True ' Ïî óìîë÷àíèþ ïðåäïîëàãàåì, ÷òî ìîæåì èñïîëüçîâàòü áûñòðûé ìåòîä
    Set serviceUsers = LoadFromSheet(serviceSheet, "D") ' Çàãðóæàåì ñïèñîê ïîëüçîâàòåëåé èç ñëóæåáíîãî ëèñòà
    
    ' Ïðîâåðÿåì, åñòü ëè âñå íóæíûå íàì ïîëüçîâàòåëè â ñëóæåáíîì ñïèñêå. Åñëè êîãî-òî íåò, áûñòðûé ìåòîä íå ñðàáîòàåò.
    If serviceUsers.Count = 0 Then
        useFastMethod = False
    Else
        Dim userName As Variant
        For Each userName In userFilterDict.Keys
            If Not serviceUsers.Exists(userName) Then
                useFastMethod = False ' Íàøëè ïîëüçîâàòåëÿ, êîòîðîãî íåò â ñïèñêå, ïåðåêëþ÷àåìñÿ íà ìåäëåííûé ìåòîä
                Exit For
            End If
        Next userName
    End If
    Dim methodText As String
    methodText = IIf(useFastMethod, "Âûáðàí áûñòðûé ìåòîä (ôèëüòðàöèÿ íà ñåðâåðå)", "Âûáðàí ñòàíäàðòíûé ìåòîä (ôèëüòðàöèÿ â Excel)")
    ProgressChecklistForm.UpdateStep 2, methodText
    
    ' === ØÀÃ 3: Çàãðóçêà äàííûõ èç Redmine  ===
    ProgressChecklistForm.SetCurrentStep 3
    ProgressChecklistForm.ShowSubProgress ' Ïîêàçûâàåì äîïîëíèòåëüíûé ïðîãðåññ-áàð äëÿ çàãðóçêè
    
    dataSheet.Cells.Clear ' Ïîëíîñòüþ î÷èùàåì ëèñò äàííûõ
    ' Ñîçäàåì çàãîëîâêè
    With dataSheet.Range("A1:M1")
        .value = Array("Entry ID", "Project Name", "Issue ID", "User Name", "Activity", "Date", "Hours", "Paid hours", "Comments", "Created On", "Action", "Rate", "Cost")
        .Font.Bold = True
    End With
    
    offset = 0: limit = 100: totalCount = 1 ' Íà÷àëüíûå çíà÷åíèÿ äëÿ ïîñòðàíè÷íîé çàãðóçêè
    
    ' Â çàâèñèìîñòè îò âûáðàííîãî ìåòîäà, âûïîëíÿåì îäèí èç äâóõ áëîêîâ êîäà
    If useFastMethod Then
        ' ÁÛÑÒÐÛÉ ÏÓÒÜ
        Dim userIdsParam As String
        Dim userIDs As Object: Set userIDs = CreateObject("Scripting.Dictionary")
        For Each userName In userFilterDict.Keys
            userIDs.Add serviceUsers(userName), True
        Next userName
        userIdsParam = Join(userIDs.Keys, "|")
        
        Do
            apiUrl = baseUrl & "/easy_time_entries.json?easy_query_p=set_filter=0&limit=" & limit & "&offset=" & offset
            If startDate <> "" Then apiUrl = apiUrl & "&from=" & startDate
            If endDate <> "" Then apiUrl = apiUrl & "&to=" & endDate
            If projectId <> "" Then apiUrl = apiUrl & "&project_id=" & projectId
            apiUrl = apiUrl & "&user_id=" & userIdsParam
            
            http.Open "GET", apiUrl, False
            http.setRequestHeader "Content-Type", "application/json"
            http.setRequestHeader "X-Redmine-API-Key", apiKey
            http.send
            
            If http.status <> 200 Then GoTo RequestFailed
            
            Set jsonResponse = JsonConverter.ParseJson(http.responseText)
            If offset = 0 Then
                totalCount = jsonResponse("total_count")
                If totalCount = 0 Then Exit Do
                ReDim dataArray(1 To totalCount, 1 To 13)
            End If
            If Not jsonResponse.Exists("time_entries") Or jsonResponse("time_entries").Count = 0 Then Exit Do
            
            For Each timeEntry In jsonResponse("time_entries")
                writtenCount = writtenCount + 1
                dataArray(writtenCount, 1) = timeEntry("id")
                dataArray(writtenCount, 2) = IIf(Not IsEmpty(timeEntry("project")), timeEntry("project")("name"), "")
                dataArray(writtenCount, 3) = IIf(Not IsEmpty(timeEntry("issue")), timeEntry("issue")("id"), "")
                dataArray(writtenCount, 4) = IIf(Not IsEmpty(timeEntry("user")), timeEntry("user")("name"), "")
                dataArray(writtenCount, 5) = IIf(Not IsEmpty(timeEntry("activity")), timeEntry("activity")("name"), "")
                dataArray(writtenCount, 6) = CDate(timeEntry("spent_on"))
                dataArray(writtenCount, 7) = CDbl(timeEntry("hours"))
                dataArray(writtenCount, 8) = CDbl(timeEntry("paid_hours"))
                dataArray(writtenCount, 9) = timeEntry("comments")
                dataArray(writtenCount, 10) = CDate(Left(timeEntry("created_on"), 10))
            Next timeEntry
            offset = offset + limit
            ProgressChecklistForm.UpdateStatus "Çàãðóæåíî " & writtenCount & " èç " & totalCount & " çàïèñåé..."
            ProgressChecklistForm.UpdateSubProgress CDbl(writtenCount), CDbl(totalCount)
        Loop While writtenCount < totalCount
    Else
        ' ÑÒÀÍÄÀÐÒÍÛÉ (ÌÅÄËÅÍÍÛÉ) ÏÓÒÜ
        Do
            apiUrl = baseUrl & "/easy_time_entries.json?easy_query_p=set_filter=0&limit=" & limit & "&offset=" & offset
            If startDate <> "" Then apiUrl = apiUrl & "&from=" & startDate
            If endDate <> "" Then apiUrl = apiUrl & "&to=" & endDate
            If projectId <> "" Then apiUrl = apiUrl & "&project_id=" & projectId
            
            http.Open "GET", apiUrl, False
            http.setRequestHeader "X-Redmine-API-Key", apiKey
            http.send
            
            If http.status <> 200 Then GoTo RequestFailed
            Set jsonResponse = JsonConverter.ParseJson(http.responseText)
            If offset = 0 Then
                totalCount = jsonResponse("total_count")
                If totalCount = 0 Then Exit Do
                ReDim dataArray(1 To totalCount, 1 To 13)
            End If
            If Not jsonResponse.Exists("time_entries") Or jsonResponse("time_entries").Count = 0 Then Exit Do

            For Each timeEntry In jsonResponse("time_entries")
                fetchedCount = fetchedCount + 1
                Dim currentUserName As String, currentUserID As Long
                If Not IsEmpty(timeEntry("user")) Then
                    currentUserName = timeEntry("user")("name")
                    currentUserID = timeEntry("user")("id")
                    If Not discoveredUsers.Exists(currentUserName) Then discoveredUsers.Add currentUserName, currentUserID
                    
                    If userFilterDict.Exists(currentUserName) Then
                        writtenCount = writtenCount + 1
                        dataArray(writtenCount, 1) = timeEntry("id")
                        dataArray(writtenCount, 2) = IIf(Not IsEmpty(timeEntry("project")), timeEntry("project")("name"), "")
                        dataArray(writtenCount, 3) = IIf(Not IsEmpty(timeEntry("issue")), timeEntry("issue")("id"), "")
                        dataArray(writtenCount, 4) = currentUserName
                        dataArray(writtenCount, 5) = IIf(Not IsEmpty(timeEntry("activity")), timeEntry("activity")("name"), "")
                        dataArray(writtenCount, 6) = CDate(timeEntry("spent_on"))
                        dataArray(writtenCount, 7) = CDbl(timeEntry("hours"))
                        dataArray(writtenCount, 8) = CDbl(timeEntry("paid_hours"))
                        dataArray(writtenCount, 9) = timeEntry("comments")
                        dataArray(writtenCount, 10) = CDate(Left(timeEntry("created_on"), 10))
                    End If
                End If
            Next timeEntry
            offset = offset + limit
            ProgressChecklistForm.UpdateStatus "Ïðîñêàíèðîâàíî " & fetchedCount & " èç " & totalCount & " çàïèñåé..."
            ProgressChecklistForm.UpdateSubProgress CDbl(fetchedCount), CDbl(totalCount)
        Loop While fetchedCount < totalCount And fetchedCount < 20000
        
        If discoveredUsers.Count > 0 Then
            serviceSheet.Range("D:E").ClearContents
            serviceSheet.Range("D1:E1").value = Array("User Name", "User ID")
            serviceSheet.Range("D2").Resize(discoveredUsers.Count, 1).value = Application.Transpose(discoveredUsers.Keys)
            serviceSheet.Range("E2").Resize(discoveredUsers.Count, 1).value = Application.Transpose(discoveredUsers.Items)
        End If
    End If
    
    ProgressChecklistForm.HideSubProgress
    ProgressChecklistForm.UpdateStep 3, "Âñåãî íàéäåíî " & writtenCount & " ïîäõîäÿùèõ çàïèñåé."
    
    ' === ØÀÃ 4: Ðàñ÷åò ñåáåñòîèìîñòè ïî ÃÈÁÐÈÄÍÎÌÓ ÐÅÉÒÓ ===
    ProgressChecklistForm.SetCurrentStep 4
    If writtenCount > 0 Then
        Dim i As Long
        ' Íà÷èíàåì ïåðåáèðàòü êàæäóþ ñòðîêó â íàøåì ìàññèâå äàííûõ, ÷òîáû ðàññ÷èòàòü äëÿ íåå ñòîèìîñòü
        For i = 1 To writtenCount
            Dim entryUser As String: entryUser = dataArray(i, 4) ' Ïîëüçîâàòåëü èç çàïèñè
            Dim entryDate As Date: entryDate = dataArray(i, 6)   ' Äàòà ñïèñàíèÿ
            Dim entryHours As Double: entryHours = dataArray(i, 7) ' Êîëè÷åñòâî ñïèñàííûõ ÷àñîâ
            
            ' --- ÍÎÂÛÉ ÁËÎÊ ËÎÃÈÊÈ ÐÀÑ×ÅÒÀ ÑÒÎÈÌÎÑÒÈ ---
            Dim monthlySalary As Double
            Dim fixedHourlyRate As Double
            Dim hoursInMonth1 As Double
            Dim actualHourlyRate As Double
            Dim applicableRates As Variant
            
            ' 1. Ïîëó÷àåì ìàññèâ [Îêëàä, Ïî÷àñîâîéÐåéò] äëÿ ñîòðóäíèêà íà äàòó ñïèñàíèÿ
            applicableRates = GetApplicableRatesForUserAndDate(entryUser, entryDate, ratesDict)
            monthlySalary = applicableRates(0)
            fixedHourlyRate = applicableRates(1)
            
            ' 2. Ïðîâåðÿåì, óêàçàí ëè äëÿ ñîòðóäíèêà âàëèäíûé ìåñÿ÷íûé îêëàä
            If monthlySalary > 0 Then
                ' --- ËÎÃÈÊÀ 1: Ðàñ÷åò íà îñíîâå ÌÅÑß×ÍÎÃÎ ÎÊËÀÄÀ ---
                hoursInMonth1 = GetWorkingHoursForMonth(entryDate, workingHoursDict)
                ' Âàæíàÿ ïðîâåðêà, ÷òîáû èçáåæàòü îøèáêè äåëåíèÿ íà íîëü
                If hoursInMonth1 > 0 Then
                    actualHourlyRate = monthlySalary / hoursInMonth1
                Else
                    actualHourlyRate = 0 ' Åñëè ÷àñîâ â êàëåíäàðå íåò, ðåéò áóäåò ðàâåí 0
                End If
            Else
                ' --- ËÎÃÈÊÀ 2: Èñïîëüçóåì ÔÈÊÑÈÐÎÂÀÍÍÛÉ ÏÎ×ÀÑÎÂÎÉ ÐÅÉÒ èç òàáëèöû ---
                actualHourlyRate = fixedHourlyRate
            End If

            ' 4. Çàïèñûâàåì ðàññ÷èòàííûå çíà÷åíèÿ ïðÿìî â ìàññèâ.
            dataArray(i, 12) = actualHourlyRate ' Çàïèñûâàåì ôàêòè÷åñêèé ðåéò â 12-é ñòîëáåö
            dataArray(i, 13) = entryHours * actualHourlyRate ' Çàïèñûâàåì èòîãîâóþ ñòîèìîñòü â 13-é ñòîëáåö
            
            ' Îáíîâëÿåì ñòàòóñ â ôîðìå ïðîãðåññà êàæäûå 100 çàïèñåé, ÷òîáû íå òîðìîçèòü ïðîöåññ
            If i Mod 100 = 0 Then
                ProgressChecklistForm.UpdateStatus "Ðàññ÷èòûâàþ ñåáåñòîèìîñòü... (" & i & "/" & writtenCount & ")"
            End If
        Next i
    End If
    ProgressChecklistForm.UpdateStep 4, "Ðàñ÷åò ñåáåñòîèìîñòè çàâåðøåí."

    ' === ØÀÃ 5: Ôîðìèðîâàíèå òàáëèöû è ñðåçîâ íà ëèñòå  ===
    ProgressChecklistForm.SetCurrentStep 5
    If writtenCount > 0 Then
        ' Âûãðóæàåì âåñü ìàññèâ äàííûõ íà ëèñò çà îäíó îïåðàöèþ. Ýòî î÷åíü áûñòðî.
        dataSheet.Range("A2").Resize(writtenCount, 13).value = dataArray
        
        ProgressChecklistForm.UpdateStatus "Ñîçäàþ òàáëèöó è ôèëüòðû..."
        
        ' Óäàëÿåì ñòàðóþ òàáëèöó è ñòàðûå ñðåçû, ÷òîáû íå áûëî êîíôëèêòîâ
        On Error Resume Next
        dataSheet.ListObjects(DATA_TABLE_NAME).Delete
        Dim sh As Shape
        For Each sh In dataSheet.Shapes
            If sh.Type = msoSlicer Then sh.Delete
        Next sh
        On Error GoTo 0
        
        ' Ñîçäàåì âñïîìîãàòåëüíóþ êîëîíêó "Ìåñÿö äëÿ îò÷åòà", ÷òîáû ïî íåé ìîæíî áûëî ôèëüòðîâàòü
        Dim helperCol As Range
        Set helperCol = dataSheet.Range("N1")
        helperCol.value = "ReportMonth"
        With helperCol.offset(1, 0).Resize(writtenCount)
            .FormulaR1C1 = "=IFERROR(DATE(YEAR(RC[-8]),MONTH(RC[-8]),1),"""")"
            .value = .value ' Ïðåâðàùàåì ôîðìóëû â çíà÷åíèÿ
            .NumberFormat = "mmm yyyy" ' Çàäàåì êðàñèâûé ôîðìàò "ÿíâ 2025"
        End With
        
        ' Ïðåâðàùàåì íàø äèàïàçîí äàííûõ â "óìíóþ" òàáëèöó Excel
        Dim dataListObject As ListObject
        Dim tableRange As Range
        Set tableRange = dataSheet.Range("A1").Resize(writtenCount + 1, 14) ' Âêëþ÷àÿ âñïîìîãàòåëüíóþ êîëîíêó
        Set dataListObject = dataSheet.ListObjects.Add(xlSrcRange, tableRange, , xlYes)
        
        dataListObject.Name = DATA_TABLE_NAME
        dataListObject.TableStyle = "TableStyleMedium2"
        
        ' Âêëþ÷àåì ñòðîêó èòîãîâ â òàáëèöå
      '  With dataListObject
       '     .ShowTotals = True
       '     .ListColumns("Hours").TotalsCalculation = xlTotalsCalculationSum
       '     .ListColumns("Paid hours").TotalsCalculation = xlTotalsCalculationSum
       '     .ListColumns("Cost").TotalsCalculation = xlTotalsCalculationSum
       ' End With
       
       
        ' Àâòîìàòè÷åñêè ïîäáèðàåì øèðèíó êîëîíîê
        dataSheet.Columns.AutoFit
        
        ' Äîáàâëÿåì èíòåðàêòèâíûå ôèëüòðû-ñðåçû (slicers) ñïðàâà îò òàáëèöû
        Dim slicerLeft As Double, slicerTop As Double
        slicerLeft = 110 * 10 + 50
        slicerTop = dataSheet.Range("A1").Top
        
        Dim slicerCacheMonths As SlicerCache, monthSlicer As Slicer
        Set slicerCacheMonths = ThisWorkbook.SlicerCaches.Add2(dataListObject, "ReportMonth")
        Set monthSlicer = slicerCacheMonths.Slicers.Add(dataSheet, , "Filter by Month", "Ôèëüòð ïî ìåñÿöàì", slicerTop, slicerLeft, 180, 200)
        
        slicerTop = monthSlicer.Top + monthSlicer.Height + 10
        Dim slicerCacheUsers As SlicerCache, userSlicer As Slicer
        Set slicerCacheUsers = ThisWorkbook.SlicerCaches.Add2(dataListObject, "User Name")
        Set userSlicer = slicerCacheUsers.Slicers.Add(dataSheet, , "Filter by User", "Ôèëüòð ïî ïîëüçîâàòåëÿì", slicerTop, slicerLeft, 180, 200)
        
        slicerTop = userSlicer.Top + userSlicer.Height + 10
        Dim slicerCacheProjects As SlicerCache, projectSlicer As Slicer
        Set slicerCacheProjects = ThisWorkbook.SlicerCaches.Add2(dataListObject, "Project Name")
        Set projectSlicer = slicerCacheProjects.Slicers.Add(dataSheet, , "Filter by Project", "Ôèëüòð ïî ïðîåêòàì", slicerTop, slicerLeft, 180, 200)
    End If
    ProgressChecklistForm.UpdateStep 5, "Òàáëèöà è ôèëüòðû óñïåøíî ñîçäàíû."
    
    ' === ØÀÃ 6: Çàâåðøåíèå è ôîðìàòèðîâàíèå  ===
    ProgressChecklistForm.SetCurrentStep 6
    dataSheet.Columns("I").ColumnWidth = 25 ' Äåëàåì êîëîíêó ñ êîììåíòàðèÿìè ïîøèðå
    ' Ïðèìåíÿåì äåíåæíûé ôîðìàò ê êîëîíêàì ñ ðåéòîì è ñòîèìîñòüþ
    dataSheet.Columns("L:M").NumberFormat = "#,##0.00 ""ð."""
    
    serviceSheet.Columns.AutoFit
    
    ProgressChecklistForm.UpdateStep 6, "Ãîòîâî!"
    
    ' Ôîðìèðóåì ôèíàëüíîå ñîîáùåíèå äëÿ ïîëüçîâàòåëÿ
    finalMsg = "Èìïîðò äàííûõ çàâåðøåí. " & writtenCount & " çàïèñåé íàéäåíî è ñåáåñòîèìîñòü ðàññ÷èòàíà."
    If useFastMethod Then
        finalMsg = finalMsg & vbCrLf & "(Èñïîëüçîâàí ÁÛÑÒÐÛÉ ìåòîä ôèëüòðàöèè íà ñåðâåðå)"
    Else
        finalMsg = finalMsg & vbCrLf & "(Èñïîëüçîâàí ÑÒÀÍÄÀÐÒÍÛÉ ìåòîä ñ ëîêàëüíîé ôèëüòðàöèåé)"
    End If
    
    CleanAllDuplicatesInTimeEntriesTable
            
CleanExit: ' Ìåòêà äëÿ ÷èñòîãî âûõîäà èç ïðîöåäóðû
    Unload ProgressChecklistForm ' Âûãðóæàåì ôîðìó ïðîãðåññà
    Application.ScreenUpdating = True ' Âêëþ÷àåì îáíîâëåíèå ýêðàíà
    ' Îñâîáîæäàåì ïàìÿòü, î÷èùàÿ îáúåêòû
    Set http = Nothing
    Set configSheet = Nothing
    Set dataSheet = Nothing
    Set serviceSheet = Nothing
    Set ratesSheet = Nothing
    Set ratesTable = Nothing
    Set ratesDict = Nothing
    Set workingHoursDict = Nothing
    Exit Sub ' Âûõîä
RequestFailed: ' Ìåòêà äëÿ îáðàáîòêè îøèáêè API çàïðîñà
    MsgBox "Îøèáêà API çàïðîñà! Ñòàòóñ: " & http.status & vbCrLf & http.responseText, vbCritical
    GoTo CleanExit
ErrorHandler: ' Ìåòêà äëÿ îáðàáîòêè ïðî÷èõ îøèáîê
    MsgBox "Ïðîèçîøëà íåïðåäâèäåííàÿ îøèáêà: " & vbCrLf & Err.Description, vbCritical
    Resume CleanExit
End Sub

' ======================================================================================
' ÎÒ×ÅÒ 1: Ñîçäàåò ñâîäíóþ òàáëèöó (Pivot Table) ñ èíòåðàêòèâíûìè êíîïêàìè
' è äèàãðàììîé äëÿ àíàëèçà äàííûõ.
' ======================================================================================
Private Sub CreatePivotReport()
    Dim pivotSheet As Worksheet, dataSheet As Worksheet
    Dim pivotCache As pivotCache, pivotTable As pivotTable, pivotChart As Chart
    Dim sourceTable As ListObject
    Dim sheetName As String
    
    sheetName = "PivotReport"
    Set dataSheet = ThisWorkbook.Sheets("SpentTimeData")
    
    ' --- Øàã 1: Íàõîäèì èñõîäíóþ òàáëèöó ñ äàííûìè ---
    On Error Resume Next
    Set sourceTable = dataSheet.ListObjects(DATA_TABLE_NAME)
    On Error GoTo 0
    If sourceTable Is Nothing Then
        MsgBox "Òàáëèöà ñ äàííûìè '" & DATA_TABLE_NAME & "' íå íàéäåíà. Íåâîçìîæíî ñîçäàòü ñâîäíûé îò÷åò.", vbExclamation
        Exit Sub
    End If
    
    ' --- Øàã 2: Ïåðåñîçäàåì ëèñò äëÿ îò÷åòà (óäàëÿåì ñòàðûé, åñëè îí åñòü) ---
    Application.DisplayAlerts = False ' Îòêëþ÷àåì ïðåäóïðåæäåíèÿ Excel (íàïðèìåð, "óäàëèòü ëèñò?")
    On Error Resume Next
    ThisWorkbook.Sheets(sheetName).Delete
    On Error GoTo 0
    Application.DisplayAlerts = True ' Âêëþ÷àåì îáðàòíî
    
    Set pivotSheet = ThisWorkbook.Sheets.Add(After:=dataSheet)
    pivotSheet.Name = sheetName
    
    On Error GoTo CleanupAndExit
    
    ' --- Øàã 3: Ñîçäàåì êýø è ñàìó ñâîäíóþ òàáëèöó ---
    Set pivotCache = ThisWorkbook.PivotCaches.Create(SourceType:=xlDatabase, SourceData:=sourceTable.Range)
    Set pivotTable = pivotCache.CreatePivotTable(TableDestination:=pivotSheet.Range("A22"), TableName:="TimeReportPivot")
    
    With pivotTable
        ' Ýòè äâå ñòðîêè ïðåäîòâðàùàþò àâòîìàòè÷åñêîå èçìåíåíèå øèðèíû êîëîíîê ïðè îáíîâëåíèè
        .PreserveFormatting = True
        .HasAutoFormat = False

        ' Ïîëÿ ïî óìîë÷àíèþ â ñòðîêàõ: Ïîëüçîâàòåëü -> Ïðîåêò
        .PivotFields("User Name").Orientation = xlRowField
        .PivotFields("Project Name").Orientation = xlRowField
        
        ' Ïîëå äëÿ êîëîíîê: Ìåñÿö
        .PivotFields("ReportMonth").Orientation = xlColumnField
        .PivotFields("ReportMonth").NumberFormat = "mmm yyyy"
        
        ' Ïîëå äëÿ äàííûõ ïî óìîë÷àíèþ: Ñòîèìîñòü
        With .PivotFields("Cost")
            .Orientation = xlDataField
            .Function = xlSum
            .NumberFormat = "#,##0.00 ""ð."""
            .Name = "Èòîãîâàÿ ñòîèìîñòü"
        End With

        ' Ïðÿ÷åì ïóñòûå çíà÷åíèÿ èç ôèëüòðà ïî ìåñÿöàì, åñëè îíè åñòü
        Dim pi As PivotItem
        On Error Resume Next
        For Each pi In .PivotFields("ReportMonth").PivotItems
            If pi.Name = "(blank)" Or IsError(pi.value) Then pi.Visible = False
        Next pi
        On Error GoTo 0
    End With
    
    ' --- Øàã 4: Äîáàâëÿåì êíîïêè óïðàâëåíèÿ ñâåðõó ---
    Dim btn As Button
    ' Êíîïêà 1: Îáíîâèòü âñ¸
    Set btn = pivotSheet.Buttons.Add(10, 10, 180, 25)
    With btn
        .OnAction = "RunFullProcess_And_CreateReports"
        .Text = "Îáíîâèòü âñå îò÷åòû"
        .Name = "btnRefreshAll"
    End With
    
    ' Êíîïêà 2: Ïîìåíÿòü ïîðÿäîê ñòðîê
    Set btn = pivotSheet.Buttons.Add(btn.Left + btn.Width + 10, 10, 180, 25)
    With btn
        .OnAction = "TogglePivotRowOrder"
        .Text = "Ïîìåíÿòü: Ïîëüçîâàòåëü/Ïðîåêò"
        .Name = "btnToggleRows"
    End With
    
    ' Êíîïêà 3: Ïîìåíÿòü ïîëå äàííûõ
    Set btn = pivotSheet.Buttons.Add(btn.Left + btn.Width + 10, 10, 180, 25)
    With btn
        .OnAction = "TogglePivotDataField"
        .Text = "Ïîìåíÿòü: ×àñû/Ñåáåñòîèìîñòü"
        .Name = "btnToggleData"
    End With
    
    ' Êíîïêà 4: Ñâåðíóòü èëè ðàçâåðíóòü ïèâîò
    Set btn = pivotSheet.Buttons.Add(btn.Left, 300, 180, 25)
    With btn
        .OnAction = "ToggleCollapsePivot"
        .Text = "Ñâåðíóò/ðàçâåðíóòü ïèâîò"
        .Name = "btnToggleCollapseData"
    End With
    
    ' --- Øàã 5: Äîáàâëÿåì ñðåçû (ôèëüòðû) ïîä êíîïêàìè ---
    Dim slicerTop As Double
    slicerTop = 45 ' Ïîçèöèÿ ïîä êíîïêàìè
    
    Dim slicerCacheProjects As SlicerCache, projectSlicer As Slicer
    Set slicerCacheProjects = ThisWorkbook.SlicerCaches.Add2(pivotTable, "Project Name")
    Set projectSlicer = slicerCacheProjects.Slicers.Add(pivotSheet, , "Projects", "Ôèëüòð ïî ïðîåêòàì", slicerTop, 10, 180, 220)

    Dim slicerCacheUsers As SlicerCache, userSlicer As Slicer
    Set slicerCacheUsers = ThisWorkbook.SlicerCaches.Add2(pivotTable, "User Name")
    Set userSlicer = slicerCacheUsers.Slicers.Add(pivotSheet, , "Users", "Ôèëüòð ïî ïîëüçîâàòåëÿì", slicerTop, projectSlicer.Left + projectSlicer.Width + 10, 180, 220)
        
    Dim slicerCacheMonths As SlicerCache, monthSlicer As Slicer
    Set slicerCacheMonths = ThisWorkbook.SlicerCaches.Add2(pivotTable, "ReportMonth")
    Set monthSlicer = slicerCacheMonths.Slicers.Add(pivotSheet, , "Months", "Ôèëüòð ïî ìåñÿöàì", slicerTop, userSlicer.Left + userSlicer.Width + 10, 180, 220)
    monthSlicer.SlicerCache.SortItems = xlSlicerSortAscending ' Ñîðòèðóåì ìåñÿöû ïî âîçðàñòàíèþ
    
    ' --- Øàã 6: Ñîçäàåì äèàãðàììó ñïðàâà ---
    If pivotTable.TableRange1.Cells.Count > 1 Then ' Ïðîâåðÿåì, åñòü ëè âîîáùå äàííûå äëÿ äèàãðàììû
        Set pivotChart = pivotSheet.Shapes.AddChart2(227, xlColumnStacked).Chart
        pivotChart.SetSourceData Source:=pivotTable.TableRange1
        
        With pivotChart
            .HasTitle = True
            .ChartTitle.Text = "Äàííûå ïî ìåñÿöàì (èñïîëüçóéòå ôèëüòðû)"
            .ApplyLayout 5
            .Parent.Top = slicerTop
            .Parent.Left = monthSlicer.Left + monthSlicer.Width + 20
            .Parent.Width = 600
            .Parent.Height = 350
        End With
    End If
    
    ' Àâòîïîäáîð øèðèíû êîëîíîê â ñâîäíîé òàáëèöå
    pivotSheet.Columns("A:H").AutoFit

CleanupAndExit:
    If Err.Number <> 0 Then
        MsgBox "Ïðîèçîøëà îøèáêà ïðè ñîçäàíèè ñâîäíîãî îò÷åòà: " & Err.Description, vbCritical
    End If
End Sub

' ======================================================================================
' ÎÒ×ÅÒ 2: Ñîçäàåò ïëîñêóþ òàáëèöó "Ñâîäêà ïî ìåñÿöàì" äëÿ óäîáíîãî ïðîñìîòðà
' ÷àñîâ ïî êàæäîìó ñîòðóäíèêó.
' ======================================================================================
Private Sub CreateMonthlySummaryReport()
    Dim summarySheet As Worksheet, dataSheet As Worksheet, configSheet As Worksheet
    Dim lastRow As Long, i As Long, j As Long
    Dim reportDict As Object, monthDict As Object
    Dim sheetName As String
    
    sheetName = "MonthlySummary"
    Set dataSheet = ThisWorkbook.Sheets("SpentTimeData")
    Set configSheet = ThisWorkbook.Sheets("Config")
    
    ' --- Àãðåãèðóåì äàííûå ñ ïîìîùüþ ñëîâàðåé äëÿ âûñîêîé ñêîðîñòè ---
    Set reportDict = CreateObject("Scripting.Dictionary")
    reportDict.CompareMode = vbTextCompare
    
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, "A").End(xlUp).row
    For i = 2 To lastRow
        Dim userName As String, monthKey As String, hours As Double, paidHours As Double
        
        userName = dataSheet.Cells(i, "D").value ' Êîëîíêà "User Name"
        monthKey = Format(dataSheet.Cells(i, "F").value, "yyyy-mm") ' Êîëîíêà "Date"
        hours = dataSheet.Cells(i, "G").value ' Êîëîíêà "Hours"
        paidHours = dataSheet.Cells(i, "H").value ' Êîëîíêà "Paid hours"
        
        ' Ñîáèðàåì äàííûå â ñòðóêòóðó "Ïîëüçîâàòåëü -> Ìåñÿö -> [×àñû, Îïëà÷åííûå×àñû]"
        If Not reportDict.Exists(userName) Then
            Set monthDict = CreateObject("Scripting.Dictionary")
            reportDict.Add userName, monthDict
        End If
        
        If Not reportDict(userName).Exists(monthKey) Then
            reportDict(userName).Add monthKey, Array(0, 0)
        End If
        
        Dim totals As Variant
        totals = reportDict(userName)(monthKey)
        totals(0) = totals(0) + hours
        totals(1) = totals(1) + paidHours
        reportDict(userName)(monthKey) = totals
    Next i
    
    ' --- Ñòðîèì îò÷åò íà íîâîì ëèñòå ---
    On Error Resume Next
    Application.DisplayAlerts = False
    ThisWorkbook.Sheets(sheetName).Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    
    Set summarySheet = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets("PivotReport"))
    summarySheet.Name = sheetName
    
    ' Ïîëó÷àåì óíèêàëüíûé îòñîðòèðîâàííûé ñïèñîê âñåõ ìåñÿöåâ
    Dim allMonths As Object: Set allMonths = CreateObject("Scripting.Dictionary")
    Dim userKey As Variant, mKey As Variant
    For Each userKey In reportDict.Keys
        For Each mKey In reportDict(userKey).Keys
            allMonths(mKey) = True
        Next mKey
    Next userKey
    
    Dim sortedMonths As Variant
    sortedMonths = allMonths.Keys
    ' Ïðîñòàÿ ïóçûðüêîâàÿ ñîðòèðîâêà äëÿ êëþ÷åé-ìåñÿöåâ
    For i = LBound(sortedMonths) To UBound(sortedMonths) - 1
        For j = i + 1 To UBound(sortedMonths)
            If sortedMonths(i) > sortedMonths(j) Then
                Dim temp As Variant
                temp = sortedMonths(i)
                sortedMonths(i) = sortedMonths(j)
                sortedMonths(j) = temp
            End If
        Next j
    Next i
    
    ' --- Ïèøåì çàãîëîâêè îò÷åòà ---
    summarySheet.Range("A2").value = "Èìÿ ïîëüçîâàòåëÿ"
    Dim col As Long: col = 2
    For i = LBound(sortedMonths) To UBound(sortedMonths)
        With summarySheet.Cells(1, col)
            .value = Format(CDate(sortedMonths(i) & "-01"), "mmmm yyyy")
            .HorizontalAlignment = xlCenter
        End With
        summarySheet.Range(summarySheet.Cells(1, col), summarySheet.Cells(1, col + 1)).Merge
        summarySheet.Cells(2, col).value = "×àñû"
        summarySheet.Cells(2, col + 1).value = "Îïëà÷. ÷."
        col = col + 2
    Next i
    
    ' --- Ïèøåì ñïèñîê ïîëüçîâàòåëåé èç Config è çàïîëíÿåì äàííûìè ---
    Dim row As Long: row = 3
    Dim configUserRow As Long: configUserRow = 9
    Do While configSheet.Cells(configUserRow, 1).value <> ""
        summarySheet.Cells(row, 1).value = configSheet.Cells(configUserRow, 1).value
        configUserRow = configUserRow + 1
        row = row + 1
    Loop
    
    ' Çàïîëíÿåì îò÷åò äàííûìè èç ñëîâàðÿ
    For i = 3 To summarySheet.Cells(summarySheet.Rows.Count, "A").End(xlUp).row
        userName = summarySheet.Cells(i, 1).value
        If reportDict.Exists(userName) Then
            col = 2
            For j = LBound(sortedMonths) To UBound(sortedMonths)
                monthKey = sortedMonths(j)
                If reportDict(userName).Exists(monthKey) Then
                    summarySheet.Cells(i, col).value = reportDict(userName)(monthKey)(0)
                    summarySheet.Cells(i, col + 1).value = reportDict(userName)(monthKey)(1)
                End If
                col = col + 2
            Next j
        End If
    Next i
    
    ' --- Ôîðìàòèðîâàíèå ---
    With summarySheet.Range("A1").CurrentRegion
        .Borders.LineStyle = xlContinuous
        .Borders.Weight = xlThin
    End With
    With summarySheet.Range("A1:A2")
        .Borders.LineStyle = xlNone
    End With
    summarySheet.Range("A:A").Font.Bold = True
    summarySheet.Range("1:2").Font.Bold = True
    summarySheet.Columns.AutoFit
    summarySheet.Range("B3", summarySheet.Cells(row, col)).NumberFormat = "0.00"

End Sub

' ======================================================================================
' ÎÒ×ÅÒ 3: Ñîçäàåò âèçóàëüíûé îò÷åò ïî ìàðæèíàëüíîñòè ïðîåêòîâ â âèäå
' ãèñòîãðàììû ñ íàêîïëåíèåì (Ñåáåñòîèìîñòü + Ìàðæà).
' ÈÇÌÅÍÅÍÎ: Äîáàâëåí ñòîëáåö "% Ìàðæà" è ñîðòèðîâêà ïî íåìó.
' ======================================================================================
Sub CreateProjectMarginReport()
    Dim marginSheet As Worksheet, dataSheet As Worksheet, pricesSheet As Worksheet
    Dim pricesTable As ListObject
    Dim sheetName As String
    
    sheetName = "ProjectMarginReport"
    Set dataSheet = ThisWorkbook.Sheets("SpentTimeData")
    
    ' --- Øàã 1: Èùåì òàáëèöó ñ öåíàìè ïðîåêòîâ. Åñëè åå íåò, îò÷åò íå ñîçäàåòñÿ. ---
    On Error Resume Next
    Set pricesSheet = ThisWorkbook.Sheets("ProjectPrices")
    If pricesSheet Is Nothing Then Exit Sub ' Ìîë÷à âûõîäèì, åñëè íåò ëèñòà ñ öåíàìè
    
    Set pricesTable = pricesSheet.ListObjects("ProjectPricesTable")
    If pricesTable Is Nothing Then
        MsgBox "Íå íàéäåíà òàáëèöà 'ProjectPricesTable' íà ëèñòå 'ProjectPrices'." & vbCrLf & _
               "Îò÷åò ïî ìàðæèíàëüíîñòè íå ìîæåò áûòü ñîçäàí.", vbExclamation
        Exit Sub
    End If
    On Error GoTo 0
    
    ' --- Øàã 2: Çàãðóæàåì öåíû è àãðåãèðóåì ñåáåñòîèìîñòü â ñëîâàðè ---
    Dim pricesDict As Object, costsDict As Object
    Set pricesDict = CreateObject("Scripting.Dictionary")
    pricesDict.CompareMode = vbTextCompare
    Set costsDict = CreateObject("Scripting.Dictionary")
    costsDict.CompareMode = vbTextCompare
    
    ' Çàãðóæàåì öåíû èç òàáëèöû
    Dim priceRow As ListRow
    For Each priceRow In pricesTable.ListRows
        Dim projName As String: projName = priceRow.Range(1).value
        Dim projPrice As Double
        If IsNumeric(priceRow.Range(2).value) Then
            projPrice = CDbl(priceRow.Range(2).value)
            If projName <> "" And Not pricesDict.Exists(projName) Then
                pricesDict.Add projName, projPrice
            End If
        End If
    Next priceRow
    
    ' Àãðåãèðóåì ñåáåñòîèìîñòü ñ îñíîâíîãî ëèñòà äàííûõ
    Dim lastDataRow As Long, i As Long
    lastDataRow = dataSheet.Cells(dataSheet.Rows.Count, "B").End(xlUp).row
    For i = 2 To lastDataRow
        Dim projectName As String: projectName = dataSheet.Cells(i, "B").value
        Dim entryCost As Double
        If IsNumeric(dataSheet.Cells(i, "M").value) Then
            entryCost = dataSheet.Cells(i, "M").value ' Êîëîíêà "Cost"
            If projectName <> "" Then
                costsDict(projectName) = costsDict(projectName) + entryCost ' Ñóììèðóåì ñåáåñòîèìîñòü ïî êàæäîìó ïðîåêòó
            End If
        End If
    Next i
    
    If costsDict.Count = 0 Then Exit Sub ' Åñëè íåò äàííûõ î çàòðàòàõ, âûõîäèì
    
    ' --- Øàã 3: Ãîòîâèì ëèñò äëÿ îò÷åòà ---
    Application.DisplayAlerts = False
    On Error Resume Next
    ThisWorkbook.Sheets(sheetName).Delete
    On Error GoTo 0
    Application.DisplayAlerts = True
    
    Set marginSheet = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets("MonthlySummary"))
    marginSheet.Name = sheetName
    
    ' --- Øàã 4: Ñòðîèì ñâîäíóþ òàáëèöó äàííûõ íà íîâîì ëèñòå ---
    ' ÈÇÌÅÍÅÍÎ: Äîáàâëåí çàãîëîâîê äëÿ íîâîé êîëîíêè "% Ìàðæà"
    marginSheet.Range("A1:E1").value = Array("Ïðîåêò", "Ñåáåñòîèìîñòü", "Öåíà ïðîåêòà", "Ìàðæà", "% Ìàðæà")
    marginSheet.Range("A1:E1").Font.Bold = True
    
    Dim reportRow As Long: reportRow = 2
    Dim projectKey As Variant
    
    For Each projectKey In costsDict.Keys
        marginSheet.Cells(reportRow, 1).value = projectKey
        marginSheet.Cells(reportRow, 2).value = costsDict(projectKey)
        
        If pricesDict.Exists(projectKey) Then
            marginSheet.Cells(reportRow, 3).value = pricesDict(projectKey)
        Else
            marginSheet.Cells(reportRow, 3).value = 0 ' Åñëè öåíà íå íàéäåíà, ñòàâèì 0
        End If
        
        ' Ìàðæà = Öåíà - Ñåáåñòîèìîñòü
        marginSheet.Cells(reportRow, 4).FormulaR1C1 = "=RC[-1]-RC[-2]"
        
        ' ÈÇÌÅÍÅÍÎ: Äîáàâëåíà ôîðìóëà äëÿ ðàñ÷åòà ïðîöåíòà ìàðæè ñ çàùèòîé îò äåëåíèÿ íà íîëü
        marginSheet.Cells(reportRow, 5).FormulaR1C1 = "=IFERROR(RC[-1]/RC[-2],0)"
        
        reportRow = reportRow + 1
    Next projectKey
    
    If reportRow = 2 Then
        marginSheet.Range("A2").value = "Íåò äàííûõ äëÿ ïîñòðîåíèÿ îò÷åòà."
        Exit Sub
    End If
    
    ' --- Øàã 5: Ôîðìàòèðîâàíèå, ñîçäàíèå òàáëèöû, ñîðòèðîâêà, äèàãðàììà è ñðåç ---
    
    ' ÈÇÌÅÍÅÍÎ: Äèàïàçîí àâòîïîäáîðà øèðèíû ðàñøèðåí äî êîëîíêè E
    marginSheet.Columns("A:E").AutoFit
    marginSheet.Range("B:D").NumberFormat = "#,##0.00 ""ð."""
    
    Dim reportTable As ListObject
    Set reportTable = marginSheet.ListObjects.Add(xlSrcRange, marginSheet.Range("A1").CurrentRegion, , xlYes)
    reportTable.Name = "MarginReportTable"
    reportTable.TableStyle = "TableStyleMedium9"
    
    ' ÈÇÌÅÍÅÍÎ: Äîáàâëåíî ôîðìàòèðîâàíèå äëÿ íîâîé êîëîíêè "% Ìàðæà"
    reportTable.ListColumns("% Ìàðæà").DataBodyRange.NumberFormat = "0.00%"
    
    ' ÈÇÌÅÍÅÍÎ: Äîáàâëåíà ñîðòèðîâêà òàáëèöû ïî êîëîíêå "% Ìàðæà" ïî âîçðàñòàíèþ
    With reportTable.Sort
        .SortFields.Clear
        .SortFields.Add2 key:=reportTable.ListColumns("% Ìàðæà").Range, _
                         SortOn:=xlSortOnValues, Order:=xlAscending, DataOption:=xlSortNormal
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
    
    Dim marginChart As Chart, chartShape As Shape, sourceRangeForChart As Range
    
    ' Èñòî÷íèê äàííûõ äëÿ äèàãðàììû: ñòîëáöû "Ïðîåêò", "Ñåáåñòîèìîñòü" è "Ìàðæà" (íå èçìåíèëñÿ)
    Set sourceRangeForChart = Union(reportTable.ListColumns("Ïðîåêò").DataBodyRange, _
                                    reportTable.ListColumns("Ñåáåñòîèìîñòü").DataBodyRange, _
                                    reportTable.ListColumns("Ìàðæà").DataBodyRange)
    
    ' Òèï äèàãðàììû: Ãèñòîãðàììà ñ íàêîïëåíèåì
    Set chartShape = marginSheet.Shapes.AddChart2(227, xlColumnStacked)
    Set marginChart = chartShape.Chart
    
    With marginChart
        .SetSourceData Source:=sourceRangeForChart
        .HasTitle = True
        .ChartTitle.Text = "Ìàðæèíàëüíîñòü ïðîåêòîâ (Ñåáåñòîèìîñòü + Ìàðæà)"
        .HasLegend = True
        .Legend.Position = xlLegendPositionBottom
        
        ' Ïîçèöèîíèðîâàíèå è ðàçìåðû äèàãðàììû (ñäâèíóòû ïðàâåå)
        chartShape.Top = marginSheet.Range("G2").Top
        chartShape.Left = marginSheet.Range("G2").Left
        chartShape.Width = 700
        chartShape.Height = 400
        .ApplyLayout 5
        
        ' Íàñòðàèâàåì öâåòà è íàçâàíèÿ ðÿäîâ äëÿ íàãëÿäíîñòè
        If .FullSeriesCollection.Count >= 1 Then
            With .FullSeriesCollection(1)
                .Name = "Ñåáåñòîèìîñòü"
                .Format.Fill.ForeColor.RGB = RGB(255, 87, 87) ' Êðàñíûé äëÿ çàòðàò
            End With
        End If
        
        If .FullSeriesCollection.Count >= 2 Then
            With .FullSeriesCollection(2)
                .Name = "Ìàðæà (Ïðèáûëü)"
                .Format.Fill.ForeColor.RGB = RGB(146, 208, 80) ' Çåëåíûé äëÿ ïðèáûëè
            End With
        End If
        
        ' Äîáàâëÿåì ïîäïèñè äàííûõ
        .ApplyDataLabels
        If .FullSeriesCollection.Count >= 1 Then .FullSeriesCollection(1).DataLabels.Format.TextFrame2.TextRange.Font.Size = 8
        If .FullSeriesCollection.Count >= 2 Then .FullSeriesCollection(2).DataLabels.Format.TextFrame2.TextRange.Font.Size = 8
        .Axes(xlValue).TickLabels.NumberFormat = "#,##0 ""ð."""
    End With
    
    ' Ñîçäàåì ñðåç äëÿ ôèëüòðàöèè ïî ïðîåêòàì
    Dim slicerCacheProjects As SlicerCache, projectSlicer As Slicer
    Set slicerCacheProjects = ThisWorkbook.SlicerCaches.Add2(reportTable, "Ïðîåêò")
    Set projectSlicer = slicerCacheProjects.Slicers.Add(marginSheet, , "Ôèëüòð ïî ïðîåêòàì", "Ôèëüòð ïî ïðîåêòàì")
    
    With projectSlicer
        .Top = chartShape.Top
        .Left = chartShape.Left + chartShape.Width + 10
        .Width = 180
        .Height = chartShape.Height
    End With

End Sub
' ======================================================================================
' ÌÀÊÐÎÑ ÑÈÍÕÐÎÍÈÇÀÖÈÈ: Îòïðàâëÿåò èçìåíåíèÿ (ñîçäàíèå, îáíîâëåíèå, óäàëåíèå)
' îáðàòíî â Redmine. ÈÑÏÎËÜÇÎÂÀÒÜ Ñ ÎÑÒÎÐÎÆÍÎÑÒÜÞ!
' ======================================================================================
Sub SyncWithRedmine()
    ' --- Ïîêàçûâàåì ôîðìó ïðîãðåññà ---
    ProgressForm.Show
    ProgressForm.UpdateProgress 0, 100, "Èíèöèàëèçàöèÿ ñèíõðîíèçàöèè..."

    Dim http As Object, configSheet As Worksheet, dataSheet As Worksheet, serviceSheet As Worksheet
    Dim baseUrl As String, apiKey As String
    Dim projects As Object, users As Object, activities As Object
    Dim lastRow As Long, i As Long, totalActions As Long, actionsProcessed As Long
    Dim createCount As Long, updateCount As Long, deleteCount As Long, failCount As Long

    On Error GoTo SyncErrorHandler
    Application.ScreenUpdating = False
    
    Set http = CreateObject("MSXML2.XMLHTTP.6.0")
    Set configSheet = ThisWorkbook.Sheets("Config")
    Set dataSheet = ThisWorkbook.Sheets("SpentTimeData")
    Set serviceSheet = ThisWorkbook.Sheets("ServiceData")
    baseUrl = configSheet.Range("B2").value
    apiKey = configSheet.Range("B3").value
    
    ' Çàãðóæàåì ñëóæåáíûå ñïðàâî÷íèêè
    Set projects = LoadFromSheet(serviceSheet, "A")
    Set users = LoadFromSheet(serviceSheet, "D")
    Set activities = LoadFromSheet(serviceSheet, "G")
    
    If projects.Count = 0 Or users.Count = 0 Or activities.Count = 0 Then
        MsgBox "Ñëóæåáíûå äàííûå îòñóòñòâóþò. Ïîæàëóéñòà, ñíà÷àëà çàïóñòèòå îñíîâíîé ïðîöåññ çàãðóçêè äàííûõ.", vbExclamation
        GoTo SyncCleanExit
    End If
    
    ' --- Âàæíîå ïðåäóïðåæäåíèå äëÿ ïîëüçîâàòåëÿ ---
    If MsgBox("Ýòî äåéñòâèå ñèíõðîíèçèðóåò âñå èçìåíåíèÿ (ñîçäàíèå, îáíîâëåíèå, óäàëåíèå) ñ Redmine." & vbCrLf & _
             "ÄÅÉÑÒÂÈÅ ÍÅÎÁÐÀÒÈÌÎ. Âû óâåðåíû, ÷òî õîòèòå ïðîäîëæèòü?", _
             vbYesNo + vbQuestion, "Ïîäòâåðæäåíèå ñèíõðîíèçàöèè") <> vbYes Then
        MsgBox "Ñèíõðîíèçàöèÿ îòìåíåíà ïîëüçîâàòåëåì.", vbInformation
        GoTo SyncCleanExit
    End If
    
    ' Ñ÷èòàåì îáùåå êîëè÷åñòâî äåéñòâèé
    lastRow = dataSheet.Cells(dataSheet.Rows.Count, ACTION_COLUMN).End(xlUp).row
    For i = 2 To lastRow
        If Trim(dataSheet.Cells(i, ACTION_COLUMN).value) <> "" Then
            totalActions = totalActions + 1
        End If
    Next i
    
    If totalActions = 0 Then
        MsgBox "Íå íàéäåíî äåéñòâèé (create, update, delete) äëÿ ñèíõðîíèçàöèè.", vbInformation
        GoTo SyncCleanExit
    End If
    
    ' --- Îñíîâíîé öèêë îáðàáîòêè äåéñòâèé ---
    For i = 2 To lastRow
        Dim action As String, entryId As String, rowStatus As String, timeEntryData As Object, apiUrl As String
        action = LCase(Trim(dataSheet.Cells(i, ACTION_COLUMN).value))
        
        If action = "" Then GoTo NextIteration ' Ïðîïóñêàåì ñòðîêè áåç äåéñòâèé
        
        actionsProcessed = actionsProcessed + 1
        entryId = Trim(dataSheet.Cells(i, "A").value)
        Dim syncStatusText As String
        syncStatusText = "Îáðàáîòêà äåéñòâèÿ " & actionsProcessed & " èç " & totalActions & " (Ñòðîêà " & i & ")"
        ProgressForm.UpdateProgress actionsProcessed, totalActions, "Ñèíõðîíèçàöèÿ ñ Redmine", syncStatusText
        
        Dim cellValue As Variant
        Dim jsonString As String
        
        Select Case action
            Case "create"
                ' Ïðîâåðêè ïåðåä ñîçäàíèåì
                If Not projects.Exists(dataSheet.Cells(i, "B").value) Then rowStatus = "Îøèáêà: Ïðîåêò íå íàéäåí": GoTo SetStatus
                If Not users.Exists(dataSheet.Cells(i, "D").value) Then rowStatus = "Îøèáêà: Ïîëüçîâàòåëü íå íàéäåí": GoTo SetStatus
                If Not activities.Exists(dataSheet.Cells(i, "E").value) Then rowStatus = "Îøèáêà: Àêòèâíîñòü íå íàéäåíà": GoTo SetStatus
                cellValue = dataSheet.Cells(i, "G").value
                If Not IsNumeric(cellValue) Then rowStatus = "Îøèáêà: ×àñû îáÿçàòåëüíû.": GoTo SetStatus
                
                ' Ñîáèðàåì äàííûå äëÿ JSON
                Set timeEntryData = CreateObject("Scripting.Dictionary")
                timeEntryData.Add "project_id", projects(dataSheet.Cells(i, "B").value)
                If dataSheet.Cells(i, "C").value <> "" Then timeEntryData.Add "issue_id", dataSheet.Cells(i, "C").value
                timeEntryData.Add "user_id", users(dataSheet.Cells(i, "D").value)
                timeEntryData.Add "activity_id", activities(dataSheet.Cells(i, "E").value)
                timeEntryData.Add "spent_on", Format(dataSheet.Cells(i, "F").value, "yyyy-mm-dd")
                timeEntryData.Add "hours", dataSheet.Cells(i, "G").value
                If IsNumeric(dataSheet.Cells(i, "H").value) Then timeEntryData.Add "paid_hours", dataSheet.Cells(i, "H").value
                timeEntryData.Add "comments", CStr(dataSheet.Cells(i, "I").value)
                
                jsonString = BuildTimeEntryJson(timeEntryData)
                
                ' Îòïðàâëÿåì POST çàïðîñ íà ñîçäàíèå
                http.Open "POST", baseUrl & "/time_entries.json", False
                http.setRequestHeader "Content-Type", "application/json"
                http.setRequestHeader "X-Redmine-API-Key", apiKey
                http.send jsonString

                If http.status = 201 Then ' 201 Created - óñïåõ
                    Dim newEntry As Dictionary: Set newEntry = JsonConverter.ParseJson(http.responseText)("time_entry")
                    dataSheet.Cells(i, "A").value = newEntry("id") ' Çàïèñûâàåì ID íîâîé çàïèñè
                    rowStatus = "Ñîçäàíî": createCount = createCount + 1
                Else
                    rowStatus = "Îøèáêà: " & http.status & " " & Left(http.responseText, 100)
                End If
                
            Case "update"
                If entryId = "" Then rowStatus = "Îøèáêà: Íåò ID çàïèñè": GoTo SetStatus
                
                ' Ñîáèðàåì äàííûå äëÿ JSON (òîëüêî òî, ÷òî ìîæíî ìåíÿòü)
                Set timeEntryData = CreateObject("Scripting.Dictionary")
                If IsNumeric(dataSheet.Cells(i, "G").value) Then timeEntryData.Add "hours", dataSheet.Cells(i, "G").value
                If IsNumeric(dataSheet.Cells(i, "H").value) Then timeEntryData.Add "paid_hours", dataSheet.Cells(i, "H").value
                timeEntryData.Add "comments", CStr(dataSheet.Cells(i, "I").value)
                
                jsonString = BuildTimeEntryJson(timeEntryData)
                
                ' Îòïðàâëÿåì PUT çàïðîñ íà îáíîâëåíèå
                apiUrl = baseUrl & "/time_entries/" & entryId & ".json"
                http.Open "PUT", apiUrl, False
                http.setRequestHeader "Content-Type", "application/json"
                http.setRequestHeader "X-Redmine-API-Key", apiKey
                http.send jsonString

                If http.status = 200 Or http.status = 204 Or http.status = 201 Then ' Óñïåøíûé îòâåò
                    rowStatus = "Îáíîâëåíî": updateCount = updateCount + 1
                Else
                    rowStatus = "Îøèáêà: " & http.status & " " & Left(http.responseText, 100)
                End If
                
            Case "delete"
                If entryId = "" Then rowStatus = "Îøèáêà: Íåò ID äëÿ óäàëåíèÿ": GoTo SetStatus
                apiUrl = baseUrl & "/time_entries/" & entryId & ".json"
                ' Îòïðàâëÿåì DELETE çàïðîñ
                http.Open "DELETE", apiUrl, False
                http.setRequestHeader "Content-Type", "application/json": http.setRequestHeader "X-Redmine-API-Key", apiKey
                http.send
                If http.status = 204 Or http.status = 200 Then ' 204 No Content - óñïåõ
                    rowStatus = "Óäàëåíî": deleteCount = deleteCount + 1
                    dataSheet.Rows(i).Interior.Color = RGB(220, 220, 220) ' Çàêðàøèâàåì ñòðîêó ñåðûì
                Else
                    rowStatus = "Îøèáêà: " & http.status
                End If
        End Select
SetStatus:
        ' Óñòàíàâëèâàåì ñòàòóñ è öâåò ÿ÷åéêè
        dataSheet.Cells(i, ACTION_COLUMN).Interior.colorIndex = xlNone
        If InStr(rowStatus, "Îøèáêà") > 0 Then
            failCount = failCount + 1
            dataSheet.Cells(i, ACTION_COLUMN).Interior.Color = RGB(255, 200, 200) ' Êðàñíûé
        ElseIf rowStatus <> "" Then
            dataSheet.Cells(i, ACTION_COLUMN).Interior.Color = RGB(200, 255, 200) ' Çåëåíûé
        End If
        dataSheet.Cells(i, ACTION_COLUMN).value = rowStatus
NextIteration:
    Next i
    
    ' Èòîãîâîå ñîîáùåíèå
    MsgBox "Ñèíõðîíèçàöèÿ çàâåðøåíà!" & vbCrLf & vbCrLf & "Ñîçäàíî: " & createCount & vbCrLf & _
           "Îáíîâëåíî: " & updateCount & vbCrLf & "Óäàëåíî: " & deleteCount & vbCrLf & "Îøèáîê: " & failCount, vbInformation, "Ðåçóëüòàòû ñèíõðîíèçàöèè"

SyncCleanExit:
    Unload ProgressForm
    Application.ScreenUpdating = True
    Set http = Nothing
    Set configSheet = Nothing
    Set dataSheet = Nothing
    Set serviceSheet = Nothing
    Set projects = Nothing
    Set users = Nothing
    Set activities = Nothing
    Exit Sub
SyncErrorHandler:
    MsgBox "Ïðîèçîøëà êðèòè÷åñêàÿ îøèáêà âî âðåìÿ ñèíõðîíèçàöèè: " & vbCrLf & Err.Description, vbCritical
    Resume SyncCleanExit
End Sub

' ======================================================================================
' ÌÀÊÐÎÑ-ÏÅÐÅÊËÞ×ÀÒÅËÜ 1: Ìåíÿåò ïîðÿäîê ïîëåé "Ïîëüçîâàòåëü" è "Ïðîåêò"
' â ñòðîêàõ ñâîäíîé òàáëèöû.
' ======================================================================================
Sub TogglePivotRowOrder()
    Dim pt As pivotTable
    
    On Error Resume Next
    Set pt = ThisWorkbook.Sheets("PivotReport").PivotTables("TimeReportPivot")
    On Error GoTo 0
    
    If pt Is Nothing Then
        MsgBox "Ñâîäíàÿ òàáëèöà 'TimeReportPivot' íå íàéäåíà.", vbExclamation
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    ' Ïðîâåðÿåì òåêóùóþ ïîçèöèþ ïîëÿ "User Name"
    If pt.PivotFields("User Name").Position = 1 Then
        ' Åñëè îíî ïåðâîå, äåëàåì åãî âòîðûì
        pt.PivotFields("User Name").Position = 2
    Else
        ' Èíà÷å äåëàåì åãî ïåðâûì
        pt.PivotFields("User Name").Position = 1
    End If
    
    Application.ScreenUpdating = True
End Sub

' ======================================================================================
' ÌÀÊÐÎÑ-ÏÅÐÅÊËÞ×ÀÒÅËÜ 2: Ïåðåêëþ÷àåò ïîëå äàííûõ â ñâîäíîé òàáëèöå
' ìåæäó "×àñû" è "Ñåáåñòîèìîñòü".
' ======================================================================================
Sub TogglePivotDataField()
    Dim pt As pivotTable
    Dim pf As PivotField
    Dim isHoursVisible As Boolean
    
    On Error Resume Next
    Set pt = ThisWorkbook.Sheets("PivotReport").PivotTables("TimeReportPivot")
    On Error GoTo 0
    
    If pt Is Nothing Then
        MsgBox "Ñâîäíàÿ òàáëèöà 'TimeReportPivot' íå íàéäåíà.", vbExclamation
        Exit Sub
    End If
    
    Application.ScreenUpdating = False
    
    ' Ïðîâåðÿåì, îòîáðàæàþòñÿ ëè ñåé÷àñ "×àñû"
    isHoursVisible = False
    For Each pf In pt.DataFields
        If pf.SourceName = "Hours" Then
            isHoursVisible = True
            Exit For
        End If
    Next pf
    
    ' Ñíà÷àëà ïðÿ÷åì âñå òåêóùèå ïîëÿ äàííûõ
    For Each pf In pt.DataFields
        pf.Orientation = xlHidden
    Next pf
    
    ' À ïîòîì äîáàâëÿåì íóæíîå
    If isHoursVisible Then
        ' Åñëè áûëè âèäíû ÷àñû, ïîêàçûâàåì ñòîèìîñòü
        With pt.AddDataField(pt.PivotFields("Cost"), "Èòîãîâàÿ ñòîèìîñòü", xlSum)
            .NumberFormat = "#,##0.00 ""ð."""
        End With
    Else
        ' Èíà÷å ïîêàçûâàåì ÷àñû
        With pt.AddDataField(pt.PivotFields("Hours"), "Âñåãî ÷àñîâ", xlSum)
            .NumberFormat = "0.00"
        End With
    End If
    
    Application.ScreenUpdating = True
End Sub

' ========================================================================
' ÂÑÏÎÌÎÃÀÒÅËÜÍÀß ÔÓÍÊÖÈß 1: Îáíîâëÿåò ñëóæåáíûå ñïðàâî÷íèêè
' (Ïðîåêòû, Àêòèâíîñòè, Ïîëüçîâàòåëè) ñ ñåðâåðà Redmine.
' ========================================================================
Private Sub RefreshServiceData(Optional ByVal showSuccessMessage As Boolean = True)
    Dim http As Object, configSheet As Worksheet, serviceSheet As Worksheet
    Dim baseUrl As String, apiKey As String
    Dim userFetchError As Boolean
    
    On Error GoTo ServiceErrorHandler
    
    Set http = CreateObject("MSXML2.XMLHTTP.6.0")
    Set configSheet = ThisWorkbook.Sheets("Config")
    Set serviceSheet = ThisWorkbook.Sheets("ServiceData")
    
    baseUrl = configSheet.Range("B2").value
    apiKey = configSheet.Range("B3").value
    
    If baseUrl = "" Or apiKey = "" Then Exit Sub
    
    ' --- Óìíàÿ î÷èñòêà: ÷èñòèì âñå, êðîìå ñïèñêà ïîëüçîâàòåëåé, íà ñëó÷àé, åñëè íåò ïðàâ íà åãî ïîëó÷åíèå ---
    serviceSheet.Range("A:C, G:I").ClearContents
    
    ProgressForm.UpdateProgress 10, 100, "Îáíîâëåíèå ñëóæåáíûõ äàííûõ", "Çàãðóçêà ïðîåêòîâ..."
    serviceSheet.Range("A1:B1").value = Array("Project Name", "Project ID")
    FetchAndPopulate http, baseUrl & "/projects.json?limit=100", apiKey, serviceSheet.Range("A2"), "projects", "name", "id"
    
    ProgressForm.UpdateProgress 20, 100, "Îáíîâëåíèå ñëóæåáíûõ äàííûõ", "Çàãðóçêà àêòèâíîñòåé..."
    serviceSheet.Range("G1:H1").value = Array("Activity Name", "Activity ID")
    FetchAndPopulate http, baseUrl & "/enumerations/time_entry_activities.json", apiKey, serviceSheet.Range("G2"), "time_entry_activities", "name", "id"

    ' --- Ïûòàåìñÿ ïîëó÷èòü ãëîáàëüíûé ñïèñîê ïîëüçîâàòåëåé ---
    ProgressForm.UpdateProgress 30, 100, "Îáíîâëåíèå ñëóæåáíûõ äàííûõ", "Ïðîâåðêà äîñòóïà ê ñïèñêó ïîëüçîâàòåëåé..."
    http.Open "GET", baseUrl & "/users.json?limit=100&status=1", False
    http.setRequestHeader "X-Redmine-API-Key", apiKey
    http.send
    
    ' Òîëüêî åñëè ïîëó÷èëè îòâåò "200 OK", ïåðåçàïèñûâàåì ñòàðûé ñïèñîê
    If http.status = 200 Then
        ' ÓÑÏÅÕ! Ìîæíî áåçîïàñíî î÷èñòèòü ñòàðûå äàííûå è çàïèñàòü íîâûå.
        ProgressForm.UpdateProgress 35, 100, "Îáíîâëåíèå ñëóæåáíûõ äàííûõ", "Ñïèñîê ïîëüçîâàòåëåé íàéäåí! Îáíîâëÿþ..."
        serviceSheet.Range("D:E").ClearContents
        serviceSheet.Range("D1:E1").value = Array("User Name", "User ID")
        
        Dim json As Dictionary
        Set json = JsonConverter.ParseJson(http.responseText)
        If json.Exists("users") Then
            Dim item As Dictionary, rowOffset As Long
            rowOffset = 0
            For Each item In json("users")
                serviceSheet.Range("D2").offset(rowOffset, 0).value = item("firstname") & " " & item("lastname")
                serviceSheet.Range("D2").offset(rowOffset, 1).value = item("id")
                rowOffset = rowOffset + 1
            Next item
        End If
        
        userFetchError = False
    Else
        ' ÎØÈÁÊÀ ÄÎÑÒÓÏÀ. Íè÷åãî íå äåëàåì, îñòàâëÿåì ñòàðûé ñïèñîê ïîëüçîâàòåëåé êàê åñòü.
        userFetchError = True
    End If

    serviceSheet.Columns.AutoFit
    If showSuccessMessage Then
        Dim msg As String
        msg = "Ñëóæåáíûå äàííûå äëÿ Ïðîåêòîâ è Àêòèâíîñòåé áûëè îáíîâëåíû."
        If userFetchError Then
            msg = msg & vbCrLf & vbCrLf & "ÂÍÈÌÀÍÈÅ: Íå óäàëîñü ïîëó÷èòü ãëîáàëüíûé ñïèñîê ïîëüçîâàòåëåé (âåðîÿòíî, íåò ïðàâ äîñòóïà). Èñïîëüçóåòñÿ ñïèñîê èç ïðåäûäóùåãî çàïóñêà."
        Else
            msg = msg & vbCrLf & vbCrLf & "Ãëîáàëüíûé ñïèñîê ïîëüçîâàòåëåé óñïåøíî îáíîâëåí."
        End If
        MsgBox msg, vbInformation
    End If

ServiceCleanExit:
    Set http = Nothing
    Set configSheet = Nothing
    Set serviceSheet = Nothing
    Exit Sub
ServiceErrorHandler:
    MsgBox "Íå óäàëîñü îáíîâèòü ñëóæåáíûå äàííûå. Ïðîâåðüòå ïîäêëþ÷åíèå è íàñòðîéêè API. Îøèáêà: " & Err.Description, vbExclamation
    Resume ServiceCleanExit
End Sub

' ========================================================================
' ÂÑÏÎÌÎÃÀÒÅËÜÍÀß ÔÓÍÊÖÈß 2: Óíèâåðñàëüíûé çàãðóç÷èê ñïðàâî÷íèêîâ.
' ========================================================================
Private Sub FetchAndPopulate(httpObj As Object, url As String, key As String, startCell As Range, rootKey As String, nameKey As String, idKey As String, Optional nameKey2 As String = "")
    Dim json As Dictionary, item As Dictionary, rowOffset As Long
    httpObj.Open "GET", url, False
    httpObj.setRequestHeader "X-Redmine-API-Key", key
    httpObj.send
    If httpObj.status <> 200 Then Exit Sub
    
    Set json = JsonConverter.ParseJson(httpObj.responseText)
    If Not json.Exists(rootKey) Then Exit Sub
    
    rowOffset = 0
    For Each item In json(rootKey)
        Dim fullName As String
        If nameKey2 <> "" Then
            fullName = item(nameKey) & " " & item(nameKey2)
        Else
            fullName = item(nameKey)
        End If
        startCell.offset(rowOffset, 0).value = fullName
        startCell.offset(rowOffset, 1).value = item(idKey)
        rowOffset = rowOffset + 1
    Next item
End Sub

' ========================================================================
' ÂÑÏÎÌÎÃÀÒÅËÜÍÀß ÔÓÍÊÖÈß 3: Çàãðóæàåò ñïðàâî÷íèê ñ ëèñòà â áûñòðûé "ñëîâàðü".
' ========================================================================
Private Function LoadFromSheet(ws As Worksheet, nameCol As String) As Object
    Dim dict As Object, lastRow As Long, i As Long
    Set dict = CreateObject("Scripting.Dictionary")
    dict.CompareMode = vbTextCompare ' Èìåíà íå ÷óâñòâèòåëüíû ê ðåãèñòðó
    lastRow = ws.Cells(ws.Rows.Count, nameCol).End(xlUp).row
    If lastRow < 2 Then Set LoadFromSheet = dict: Exit Function ' Åñëè ëèñò ïóñò
    
    For i = 2 To lastRow
        Dim key As String, val As String
        key = Trim(ws.Cells(i, nameCol).value)
        val = Trim(ws.Cells(i, ws.Columns(nameCol).Column + 1).value) ' ID íàõîäèòñÿ â ñîñåäíåé êîëîíêå ñïðàâà
        If key <> "" And Not dict.Exists(key) Then dict.Add key, val
    Next i
    Set LoadFromSheet = dict
End Function

' ========================================================================
' ÂÑÏÎÌÎÃÀÒÅËÜÍÀß ÔÓÍÊÖÈß 4: Ñîáèðàåò ñòðîêó JSON äëÿ îòïðàâêè â Redmine.
' ========================================================================
Private Function BuildTimeEntryJson(timeEntryData As Object) As String
    Dim jsonParts() As String
    ReDim jsonParts(timeEntryData.Count - 1)
    
    Dim i As Long
    i = 0
    Dim key As Variant
    
    For Each key In timeEntryData.Keys
        Dim value As Variant
        Dim formattedValue As String
        
        value = timeEntryData(key)
        
        If IsNumeric(value) Then
            ' Äëÿ ÷èñåë ïðîñòî ïðåîáðàçóåì èõ â ñòðîêó, çàìåíÿÿ çàïÿòóþ íà òî÷êó (ñòàíäàðò JSON)
            formattedValue = Replace(CStr(value), ",", ".")
        Else
            ' Äëÿ òåêñòà ýêðàíèðóåì êàâû÷êè è îáðàòíûå ñëýøè è îáîðà÷èâàåì ðåçóëüòàò â êàâû÷êè
            Dim temp As String
            temp = Replace(CStr(value), "\", "\\")
            temp = Replace(temp, """", "\""")
            formattedValue = """" & temp & """"
        End If
        
        jsonParts(i) = """" & key & """:" & formattedValue
        i = i + 1
    Next key
    
    BuildTimeEntryJson = "{""time_entry"":{" & Join(jsonParts, ",") & "}}"
End Function

' ========================================================================
' ÈÇÌÅÍÅÍÍÀß ÂÑÏÎÌÎÃÀÒÅËÜÍÀß ÔÓÍÊÖÈß 5: Íàõîäèò àêòóàëüíûé ÎÊËÀÄ è ÐÅÉÒ
' äëÿ óêàçàííîãî ïîëüçîâàòåëÿ íà óêàçàííóþ äàòó. Òåïåðü âîçâðàùàåò ìàññèâ [îêëàä, ðåéò].
' ========================================================================
Private Function GetApplicableRatesForUserAndDate(userName As String, entryDate As Date, ratesDictionary As Object) As Variant
    ' Ïî óìîë÷àíèþ âîçâðàùàåì ìàññèâ èç äâóõ íóëåé [0, 0]
    GetApplicableRatesForUserAndDate = Array(0, 0)
    
    ' Åñëè òàêîãî ïîëüçîâàòåëÿ íåò â íàøåì ñëîâàðå ðåéòîâ, âûõîäèì
    If Not ratesDictionary.Exists(userName) Then Exit Function
    
    Dim userRates As Object
    Set userRates = ratesDictionary(userName) ' Ïîëó÷àåì "âíóòðåííèé" ñëîâàðü ñ äàòàìè è ðåéòàìè äëÿ ýòîãî ïîëüçîâàòåëÿ
    
    Dim bestDate As Date
    Dim applicableRates As Variant
    Dim rateStartDate As Variant
    
    bestDate = DateValue("1900-01-01") ' Íà÷àëüíàÿ äàòà äëÿ ñðàâíåíèÿ, çàâåäîìî ðàíüøå ëþáîé ðåàëüíîé äàòû
    
    ' Èùåì ÏÎÑËÅÄÍÞÞ äàòó íà÷àëà äåéñòâèÿ ðåéòà, êîòîðàÿ ÌÅÍÜØÅ èëè ÐÀÂÍÀ äàòå ñïèñàíèÿ.
    ' Ýòî è áóäóò àêòóàëüíûå çíà÷åíèÿ íà ìîìåíò ñïèñàíèÿ.
    For Each rateStartDate In userRates.Keys
        If CDate(rateStartDate) <= entryDate Then ' Åñëè äàòà èç òàáëèöû ðàíüøå èëè ðàâíà äàòå ñïèñàíèÿ
            If CDate(rateStartDate) > bestDate Then ' È åñëè ýòà äàòà "ëó÷øå" (ïîçäíåå) òîé, ÷òî ìû óæå íàøëè
                bestDate = CDate(rateStartDate) ' Çàïîìèíàåì ýòó äàòó êàê ëó÷øóþ
                applicableRates = userRates(rateStartDate) ' È çàïîìèíàåì ñîîòâåòñòâóþùèé åé ìàññèâ [îêëàä, ðåéò]
            End If
        End If
    Next rateStartDate
    
    ' Åñëè ìû íàøëè ïîäõîäÿùèé ìàññèâ ñ ðåéòàìè, âîçâðàùàåì åãî
    If Not IsEmpty(applicableRates) Then
        GetApplicableRatesForUserAndDate = applicableRates
    End If
End Function


' ========================================================================
' ÂÑÏÎÌÎÃÀÒÅËÜÍÀß ÔÓÍÊÖÈß 6: Íàõîäèò êîëè÷åñòâî ðàáî÷èõ ÷àñîâ
' â óêàçàííîì ìåñÿöå èç ïðîèçâîäñòâåííîãî êàëåíäàðÿ.
' ========================================================================
Private Function GetWorkingHoursForMonth(entryDate As Date, hoursDictionary As Object) As Double
    Dim monthKey As String
    ' Ôîðìàòèðóåì äàòó ñïèñàíèÿ â êëþ÷ "ÃÃÃÃ-ÌÌ", ÷òîáû íàéòè åãî â ñëîâàðå
    monthKey = Format(entryDate, "yyyy-mm")
    
    ' Åñëè òàêîé êëþ÷ â ñëîâàðå åñòü, âîçâðàùàåì êîëè÷åñòâî ÷àñîâ
    If hoursDictionary.Exists(monthKey) Then
        GetWorkingHoursForMonth = hoursDictionary(monthKey)
    Else
        ' Åñëè ìåñÿö íå íàéäåí â êàëåíäàðå, âîçâðàùàåì çíà÷åíèå ïî óìîë÷àíèþ (íàïðèìåð, 160),
        ' ÷òîáû èçáåæàòü äåëåíèÿ íà íîëü è ïîëó÷èòü ïðèìåðíûé ðàñ÷åò.
        GetWorkingHoursForMonth = 164
    End If
End Function
Sub CleanAllDuplicatesInTimeEntriesTable()
    Dim tbl As ListObject
    Dim ws As Worksheet
    Dim columnsArray() As Long ' Ìàññèâ äëÿ õðàíåíèÿ íîìåðîâ âñåõ ñòîëáöîâ
    Dim i As Long
    Dim Rng As Range
    
    ' Óêàæèòå ëèñò, íà êîòîðîì íàõîäèòñÿ âàøà òàáëèöà
    Set ws = Worksheets("SpentTimeData")
    
    ' Ïîïûòêà íàéòè òàáëèöó íà ëèñòå
    On Error Resume Next
    Set tbl = ws.ListObjects("TimeEntriesTable")
    On Error GoTo 0
    
    ' Ïðîâåðÿåì, íàøëàñü ëè òàáëèöà
    If tbl Is Nothing Then
        MsgBox "Òàáëèöà ñ èìåíåì 'TimeEntriesTable' íå íàéäåíà íà àêòèâíîì ëèñòå.", vbExclamation
        Exit Sub
    End If
    
    ' Ñîçäàåì ìàññèâ ñ íîìåðàìè âñåõ ñòîëáöîâ òàáëèöû
    ReDim columnsArray(1 To tbl.ListColumns.Count)
    For i = 1 To tbl.ListColumns.Count
        columnsArray(i) = i
    Next i
    Set Rng = tbl.DataBodyRange
    ' Óäàëÿåì äóáëèêàòû íà îñíîâå ÂÑÅÕ ñòîëáöîâ
    Rng.RemoveDuplicates Columns:=Array(1, 2, 3, 4, 5, 6, 7, 8, 9), Header:=xlNo
  
End Sub
Sub ColorizeSheetsByName()
    Dim ws As Worksheet
    Dim sheetName As String
    Dim colorIndex As Long
    Dim firstSheet As Worksheet
      
    Set firstSheet = ActiveWorkbook.Sheets(1)
    
    ' Ïåðåáèðàåì âñå ëèñòû â àêòèâíîé êíèãå
    For Each ws In ThisWorkbook.Worksheets
        ' Ïîëó÷àåì èìÿ ëèñòà
        sheetName = ws.Name

        ' Ïðîâåðÿåì, ñîîòâåòñòâóåò ëè èìÿ ëèñòà îïðåäåëåííîìó çíà÷åíèþ
        Select Case sheetName
            Case "PivotReport" '
                colorIndex = 3 ' Çàìåíèòü íà íóæíûé èíäåêñ öâåòà (3 - çåëåíûé)
                ws.Move Before:=firstSheet
            Case "MonthlySummary" '
                colorIndex = 3 '
                ws.Move Before:=firstSheet
            Case "ProjectMarginReport"
                colorIndex = 3 '
                ws.Move Before:=firstSheet
            Case Else
                colorIndex = ws.Tab.colorIndex
        End Select

        ' Óñòàíàâëèâàåì öâåò ÿðëû÷êà ëèñòà
        ws.Tab.colorIndex = colorIndex
    Next ws
End Sub
Sub ToggleCollapsePivot()
    Dim pt As pivotTable
    Dim pf As PivotField
    Dim pivotSheet As Worksheet
    Dim stateCell As Range
    Dim currentState As String
    Dim performExpand As Boolean

    ' --- ÍÀÑÒÐÎÉÊÀ ---
    ' Óêàæèòå ÿ÷åéêó, ãäå áóäåò õðàíèòüñÿ ñîñòîÿíèå ("Collapsed" èëè "Expanded")
    ' Ëó÷øå âûáðàòü ÿ÷åéêó äàëåêî â ñòîðîíå, ÷òîáû îíà íå ìåøàëà.
    Const STATE_CELL_ADDRESS As String = "AZ1"
    
    ' --- ÏÎÈÑÊ ÎÁÚÅÊÒÎÂ ---
    On Error Resume Next
    Set pt = ActiveSheet.PivotTables("TimeReportPivot")
    On Error GoTo 0
    
    If pt Is Nothing Then
        MsgBox "Ñâîäíàÿ òàáëèöà 'TimeReportPivot' íå íàéäåíà íà àêòèâíîì ëèñòå.", vbExclamation
        Exit Sub
    End If
    
    ' Ïîëó÷àåì ëèñò, íà êîòîðîì íàõîäèòñÿ òàáëèöà, è ÿ÷åéêó ñîñòîÿíèÿ
    Set pivotSheet = pt.Parent
    Set stateCell = pivotSheet.Range(STATE_CELL_ADDRESS)
    
    ' --- ËÎÃÈÊÀ ÏÅÐÅÊËÞ×ÅÍÈß íà îñíîâå ñîõðàíåííîãî ñîñòîÿíèÿ ---
    currentState = stateCell.value
    
    ' Åñëè â ÿ÷åéêå íàïèñàíî "Collapsed", çíà÷èò, íóæíî ðàçâåðíóòü.
    ' Â ëþáîì äðóãîì ñëó÷àå (ïóñòî èëè "Expanded"), áóäåì ñâîðà÷èâàòü.
    If currentState = "Collapsed" Then
        performExpand = True ' Äåéñòâèå: ÐÀÇÂÅÐÍÓÒÜ
    Else
        performExpand = False ' Äåéñòâèå: ÑÂÅÐÍÓÒÜ
    End If

    ' --- ÂÛÏÎËÍÅÍÈÅ ÄÅÉÑÒÂÈß ---
    ' Âêëþ÷àåì ðåæèì "ïðîäîëæèòü ïðè îøèáêå", ÷òîáû ïðîïóñòèòü íåïîäõîäÿùèå ïîëÿ
    On Error Resume Next
    
    For Each pf In pt.PivotFields
        pf.ShowDetail = performExpand
    Next pf
    
    ' Âîçâðàùàåì îáû÷íóþ îáðàáîòêó îøèáîê
    On Error GoTo 0
    
    ' --- ÑÎÕÐÀÍßÅÌ ÍÎÂÎÅ ÑÎÑÒÎßÍÈÅ È ÑÎÎÁÙÀÅÌ ÏÎËÜÇÎÂÀÒÅËÞ ---
    If performExpand Then
        stateCell.value = "Expanded"
      
    Else
        stateCell.value = "Collapsed"

    End If
    
    ' Ïî æåëàíèþ ìîæíî ñêðûòü ñòîëáåö, ãäå õðàíèòñÿ ñîñòîÿíèå
    ' stateCell.EntireColumn.Hidden = True
End Sub
