Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ==========================================
# REGION: CONFIGURATION & THEMES
# ==========================================
[System.Windows.Forms.Application]::EnableVisualStyles()

$Themes = @{
    "Dark" = @{
        BgMain = [System.Drawing.Color]::FromArgb(30, 30, 30)
        BgPanel = [System.Drawing.Color]::FromArgb(45, 45, 45)
        BgLog = [System.Drawing.Color]::FromArgb(20, 20, 20)
        TextMain = [System.Drawing.Color]::WhiteSmoke
        TextLog = [System.Drawing.Color]::LightGray
        Card = [System.Drawing.Color]::FromArgb(40, 40, 40)
        InputBg = [System.Drawing.Color]::FromArgb(60, 60, 60)
        InputFg = [System.Drawing.Color]::White
    }
    "Light" = @{
        BgMain = [System.Drawing.Color]::FromArgb(240, 240, 240)
        BgPanel = [System.Drawing.Color]::White
        BgLog = [System.Drawing.Color]::FromArgb(250, 250, 250)
        TextMain = [System.Drawing.Color]::FromArgb(30, 30, 30)
        TextLog = [System.Drawing.Color]::FromArgb(20, 20, 20)
        Card = [System.Drawing.Color]::WhiteSmoke
        InputBg = [System.Drawing.Color]::White
        InputFg = [System.Drawing.Color]::Black
    }
    "Cyberpunk" = @{
        BgMain = [System.Drawing.Color]::FromArgb(10, 10, 20)
        BgPanel = [System.Drawing.Color]::FromArgb(20, 20, 40)
        BgLog = [System.Drawing.Color]::Black
        TextMain = [System.Drawing.Color]::Cyan
        TextLog = [System.Drawing.Color]::Lime
        Card = [System.Drawing.Color]::FromArgb(30, 30, 50)
        InputBg = [System.Drawing.Color]::FromArgb(10, 10, 30)
        InputFg = [System.Drawing.Color]::Magenta
    }
}

$Config = @{
    Title = "Ikigai Ultimate Launcher v5.0"
    ServerPort = "1000"
    ClientPort = "2000"
    ServerDir = Join-Path $PSScriptRoot "server"
    ClientDir = Join-Path $PSScriptRoot "client"
    LogDir = Join-Path $PSScriptRoot ".logs"
    ServerLog = Join-Path $PSScriptRoot ".logs\server.log"
    ClientLog = Join-Path $PSScriptRoot ".logs\client.log"
    Theme = "Dark"
}

# Load Config
$ConfigFile = Join-Path $PSScriptRoot "launcher-config.json"
if (Test-Path $ConfigFile) {
    try {
        $SavedConfig = Get-Content $ConfigFile | ConvertFrom-Json
        foreach ($p in $SavedConfig.PSObject.Properties) { if ($Config.ContainsKey($p.Name)) { $Config[$p.Name] = $p.Value } }
    } catch {}
}
if (-not (Test-Path $Config.LogDir)) { New-Item -ItemType Directory -Path $Config.LogDir | Out-Null }

# ==========================================
# REGION: UI HELPERS
# ==========================================
function Create-FlatButton {
    param($text, $x, $y, $w, $h, $bgColor, $foreColor)

    # Normalize colors: allow passing either Color objects or simple color names (strings)
    if ($bgColor -is [string]) { $bgColor = [System.Drawing.Color]::FromName($bgColor) }
    if ($foreColor -is [string]) { $foreColor = [System.Drawing.Color]::FromName($foreColor) }

    $btn = New-Object System.Windows.Forms.Button
    $btn.Text = $text
    $btn.Location = New-Object System.Drawing.Point($x, $y)
    $btn.Size = New-Object System.Drawing.Size($w, $h)
    $btn.BackColor = $bgColor
    $btn.ForeColor = $foreColor
    $btn.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
    $btn.FlatAppearance.BorderSize = 0
    # Force Emoji Font for Icons
    try { $btn.Font = New-Object System.Drawing.Font("Segoe UI Emoji", 9, [System.Drawing.FontStyle]::Bold) }
    catch { $btn.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold) }
    $btn.Cursor = [System.Windows.Forms.Cursors]::Hand
    # Removed MouseEnter/MouseLeave to avoid Light() and context errors
    return $btn
}

function Create-ModernGroup {
    param($title, $x, $y, $w, $h, $color)

    # Normalize color parameter
    if ($color -is [string]) { $color = [System.Drawing.Color]::FromName($color) }
    $grp = New-Object System.Windows.Forms.Panel
    $grp.Location = New-Object System.Drawing.Point($x, $y)
    $grp.Size = New-Object System.Drawing.Size($w, $h)
    $grp.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 40)
    
    $line = New-Object System.Windows.Forms.Panel
    $line.Dock = [System.Windows.Forms.DockStyle]::Top; $line.Height = 3; $line.BackColor = $color
    $grp.Controls.Add($line)
    
    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Text = $title.ToUpper()
    $lbl.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold)
    $lbl.ForeColor = [System.Drawing.Color]::Gray
    $lbl.Location = New-Object System.Drawing.Point(10, 10)
    $lbl.AutoSize = $true
    $grp.Controls.Add($lbl)
    
    return $grp
}

# ==========================================
# REGION: UI CONSTRUCTION
# ==========================================
$form = New-Object System.Windows.Forms.Form
$form.Text = $Config.Title
$form.Size = New-Object System.Drawing.Size(1200, 850)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(30,30,30)
$form.ForeColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$form.Opacity = 0
# Icon Setup
$iconPath = Join-Path $PSScriptRoot "icon.ico"
if (Test-Path $iconPath) { $form.Icon = New-Object System.Drawing.Icon($iconPath) }
else { $form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($PSHOME + "\powershell.exe") }

# --- Header ---
$pnlHeader = New-Object System.Windows.Forms.Panel; $pnlHeader.Dock = "Top"; $pnlHeader.Height = 60; $pnlHeader.Padding = New-Object System.Windows.Forms.Padding(20,0,20,0)
$form.Controls.Add($pnlHeader)

$lblLogo = New-Object System.Windows.Forms.Label; $lblLogo.Text = "⚡ IKIGAI ULTIMATE"; $lblLogo.Font = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Bold); $lblLogo.Location = New-Object System.Drawing.Point(20, 15); $lblLogo.AutoSize = $true; $pnlHeader.Controls.Add($lblLogo)
$lblGit = New-Object System.Windows.Forms.Label; $lblGit.Text = "🐙 Git: ..."; $lblGit.Location = New-Object System.Drawing.Point(250, 22); $lblGit.AutoSize = $true; $lblGit.ForeColor = "Gray"; $pnlHeader.Controls.Add($lblGit)

$cbTheme = New-Object System.Windows.Forms.ComboBox
$cbTheme.Items.AddRange(@("Dark", "Light", "Cyberpunk"))
$cbTheme.Location = New-Object System.Drawing.Point(1050, 20); $cbTheme.Width = 100; $cbTheme.DropDownStyle = "DropDownList"
$pnlHeader.Controls.Add($cbTheme)

# --- Controls ---
$pnlControls = New-Object System.Windows.Forms.Panel; $pnlControls.Dock = "Top"; $pnlControls.Height = 200; $pnlControls.Padding = New-Object System.Windows.Forms.Padding(20)
$form.Controls.Add($pnlControls)

# SERVER CARD
$cardServer = Create-ModernGroup "Server Node" 20 10 360 170 "MediumSlateBlue"
$pnlControls.Controls.Add($cardServer)
$txtServerPath = New-Object System.Windows.Forms.TextBox; $txtServerPath.Text = $Config.ServerDir; $txtServerPath.Location = New-Object System.Drawing.Point(15, 40); $txtServerPath.Width = 280; $cardServer.Controls.Add($txtServerPath)
$btnBrowseS = Create-FlatButton "..." 305 40 40 23 "DimGray" "White"; $cardServer.Controls.Add($btnBrowseS)
$txtServerPort = New-Object System.Windows.Forms.TextBox; $txtServerPort.Text = $Config.ServerPort; $txtServerPort.Location = New-Object System.Drawing.Point(15, 80); $txtServerPort.Width = 60; $cardServer.Controls.Add($txtServerPort)

$btnPrisma = Create-FlatButton "🗄️ DB" 100 78 100 28 "DimGray" "White"; $cardServer.Controls.Add($btnPrisma)
$lblPerfServer = New-Object System.Windows.Forms.Label; $lblPerfServer.Text = "RAM: 0 MB"; $lblPerfServer.Font = New-Object System.Drawing.Font("Consolas", 9); $lblPerfServer.ForeColor = "Gray"; $lblPerfServer.Location = New-Object System.Drawing.Point(220, 83); $lblPerfServer.AutoSize = $true; $cardServer.Controls.Add($lblPerfServer)
$lblServerStatus = New-Object System.Windows.Forms.Label; $lblServerStatus.Text = "OFFLINE"; $lblServerStatus.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold); $lblServerStatus.Location = New-Object System.Drawing.Point(15, 130); $lblServerStatus.AutoSize = $true; $cardServer.Controls.Add($lblServerStatus)

# CLIENT CARD
$cardClient = Create-ModernGroup "Client Vite" 400 10 360 170 "DodgerBlue"
$pnlControls.Controls.Add($cardClient)
$txtClientPath = New-Object System.Windows.Forms.TextBox; $txtClientPath.Text = $Config.ClientDir; $txtClientPath.Location = New-Object System.Drawing.Point(15, 40); $txtClientPath.Width = 280; $cardClient.Controls.Add($txtClientPath)
$btnBrowseC = Create-FlatButton "..." 305 40 40 23 "DimGray" "White"; $cardClient.Controls.Add($btnBrowseC)
$txtClientPort = New-Object System.Windows.Forms.TextBox; $txtClientPort.Text = $Config.ClientPort; $txtClientPort.Location = New-Object System.Drawing.Point(15, 80); $txtClientPort.Width = 60; $cardClient.Controls.Add($txtClientPort)

$lblClientStatus = New-Object System.Windows.Forms.Label; $lblClientStatus.Text = "OFFLINE"; $lblClientStatus.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold); $lblClientStatus.Location = New-Object System.Drawing.Point(15, 130); $lblClientStatus.AutoSize = $true; $cardClient.Controls.Add($lblClientStatus)

# ACTIONS CARD
$cardActions = Create-ModernGroup "Controls" 780 10 380 170 "SeaGreen"
$pnlControls.Controls.Add($cardActions)
$btnStart = Create-FlatButton "▶ START" 20 40 100 50 "SeaGreen" "White"; $cardActions.Controls.Add($btnStart)
$btnStop = Create-FlatButton "⏹ STOP" 130 40 80 50 "DimGray" "White"; $btnStop.Enabled = $false; $cardActions.Controls.Add($btnStop)
$btnKill = Create-FlatButton "💀" 220 40 50 50 "IndianRed" "White"; $cardActions.Controls.Add($btnKill)

$cbScripts = New-Object System.Windows.Forms.ComboBox; $cbScripts.Location = New-Object System.Drawing.Point(280, 40); $cbScripts.Width = 80; $cbScripts.Height = 30; $cbScripts.Text = "Scripts..."; $cardActions.Controls.Add($cbScripts)
$btnRunScript = Create-FlatButton "Run" 280 65 80 25 "DimGray" "White"; $cardActions.Controls.Add($btnRunScript)

# Кнопка для запуска code-graph-rag-mcp . из корня проекта
$btnCodeGraph = Create-FlatButton "RAG" 280 110 80 35 "DimGray" "White"; $cardActions.Controls.Add($btnCodeGraph)

$btnInstall = Create-FlatButton "⬇ Install" 20 110 80 35 "Orange" "White"; $cardActions.Controls.Add($btnInstall)
$btnClear = Create-FlatButton "🧹 Log" 110 110 70 35 "DimGray" "White"; $cardActions.Controls.Add($btnClear)
$btnEnv = Create-FlatButton "🔑 Env" 190 110 70 35 "DimGray" "White"; $cardActions.Controls.Add($btnEnv)

# --- Logs ---
$split = New-Object System.Windows.Forms.SplitContainer; $split.Dock = "Fill"; $split.Orientation = "Vertical"; $split.SplitterWidth = 5; $form.Controls.Add($split); $split.BringToFront()
function Create-LogBox { 
    $r = New-Object System.Windows.Forms.RichTextBox; $r.Dock = "Fill"; $r.ReadOnly = $true; $r.BorderStyle = "None"; $r.ScrollBars = "None"; 
    try { $r.Font = New-Object System.Drawing.Font("Fira Code", 10) } catch { $r.Font = New-Object System.Drawing.Font("Consolas", 10) }
    return $r 
}
$txtServerLog = Create-LogBox; $split.Panel1.Controls.Add($txtServerLog)
$txtClientLog = Create-LogBox; $split.Panel2.Controls.Add($txtClientLog)

# --- Tray ---
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = $form.Icon; $tray.Text = "Ikigai Launcher"
$trayMenu = New-Object System.Windows.Forms.ContextMenu
$trayMenu.MenuItems.Add("Show").Add_Click({ $form.Show(); $form.WindowState = "Normal"; $tray.Visible = $false })
$trayMenu.MenuItems.Add("Exit").Add_Click({ Stop-All; $tray.Visible = $false; $form.Close() })
$tray.ContextMenu = $trayMenu
$form.Add_Resize({ if ($form.WindowState -eq "Minimized") { $form.Hide(); $tray.Visible = $true } })
$tray.Add_DoubleClick({ $form.Show(); $form.WindowState = "Normal"; $tray.Visible = $false })

# ==========================================
# REGION: LOGIC
# ==========================================
$State = @{ ServerProcess=$null; ClientProcess=$null; TunnelProcess=$null; ServerOffset=0; ClientOffset=0 }

function Apply-Theme {
    param($tName)
    $t = $Themes[$tName]
    $form.BackColor = $t.BgMain; $form.ForeColor = $t.TextMain
    $pnlHeader.BackColor = $t.BgPanel; $pnlControls.BackColor = $t.BgPanel
    $cardServer.BackColor = $t.Card; $cardClient.BackColor = $t.Card; $cardActions.BackColor = $t.Card
    $txtServerLog.BackColor = $t.BgLog; $txtServerLog.ForeColor = $t.TextLog
    $txtClientLog.BackColor = $t.BgLog; $txtClientLog.ForeColor = $t.TextLog
    
    # COLORED BUTTONS FIX
    # Force strong background colors again because switching themes might have reset them to default Control color
    $btnStart.BackColor = [System.Drawing.Color]::SeaGreen
    $btnStop.BackColor = [System.Drawing.Color]::FromArgb(60,60,60) # Keep dark grey
    $btnKill.BackColor = [System.Drawing.Color]::IndianRed
    $btnInstall.BackColor = [System.Drawing.Color]::Orange
    $btnPrisma.BackColor = [System.Drawing.Color]::FromArgb(50,50,70)
    $btnCodeGraph.BackColor = [System.Drawing.Color]::FromArgb(70,70,90)
    
    # For Light Theme specifically, these "DarkBlueGrey" buttons (Prisma/Tunnel) need to be readable
    if ($tName -eq "Light") {
        $btnPrisma.BackColor = [System.Drawing.Color]::SlateGray
        $btnRunScript.BackColor = [System.Drawing.Color]::LightGray
        $btnRunScript.ForeColor = [System.Drawing.Color]::Black # Run script button needs black text on light grey
        $btnClear.BackColor = [System.Drawing.Color]::LightGray; $btnClear.ForeColor = [System.Drawing.Color]::Black
        $btnEnv.BackColor = [System.Drawing.Color]::LightGray; $btnEnv.ForeColor = [System.Drawing.Color]::Black
    } else {
        $btnRunScript.BackColor = [System.Drawing.Color]::DimGray; $btnRunScript.ForeColor = [System.Drawing.Color]::White
        $btnClear.BackColor = [System.Drawing.Color]::DimGray; $btnClear.ForeColor = [System.Drawing.Color]::White
        $btnEnv.BackColor = [System.Drawing.Color]::DimGray; $btnEnv.ForeColor = [System.Drawing.Color]::White
    }
    
    # Ensure MAIN action buttons always have White text because their background is saturated
    foreach ($b in @($btnStart, $btnStop, $btnKill, $btnInstall, $btnPrisma, $btnCodeGraph)) {
        $b.ForeColor = [System.Drawing.Color]::White
    }
    
    # Special case for "Browse" buttons
    if ($tName -eq "Light") {
        $btnBrowseS.BackColor = [System.Drawing.Color]::LightGray
        $btnBrowseC.BackColor = [System.Drawing.Color]::LightGray
        $btnBrowseS.ForeColor = [System.Drawing.Color]::Black
        $btnBrowseC.ForeColor = [System.Drawing.Color]::Black
    } else {
        $btnBrowseS.BackColor = [System.Drawing.Color]::DimGray
        $btnBrowseC.BackColor = [System.Drawing.Color]::DimGray
        $btnBrowseS.ForeColor = [System.Drawing.Color]::White
        $btnBrowseC.ForeColor = [System.Drawing.Color]::White
    }
}

$Script:AppendLog = { param($textBox, $message, $isError=$false)
    if ($textBox.InvokeRequired) { $textBox.Invoke($Script:AppendLog, @($textBox, $message, $isError)) }
    else {
        $cleanMsg = $message -replace "\x1B\[[0-9;]*[a-zA-Z]", ""
        if ($isError -or $cleanMsg -match "Error") { $textBox.SelectionColor = [System.Drawing.Color]::IndianRed }
        elseif ($cleanMsg -match "Success") { $textBox.SelectionColor = [System.Drawing.Color]::SeaGreen }
        else { $textBox.SelectionColor = $Themes[$cbTheme.SelectedItem].TextLog }
        $textBox.AppendText($cleanMsg + "`r`n"); $textBox.ScrollToCaret()
    }
}

function Get-NpmPath { $npm = Get-Command "npm.cmd" -EA SilentlyContinue | Select -Exp Source; if (!$npm) { return "npm" }; return $npm }

function Get-GitStatus {
    try { $b = git rev-parse --abbrev-ref HEAD 2>$null; $s = git status --porcelain 2>$null | Measure | Select -Exp Count; if($b){$lblGit.Text="🐙 $b ($s changes)"} } catch { $lblGit.Text="🐙 Git: Not Found" }
}
function Get-Scripts {
    $cbScripts.Items.Clear()
    try { $p = Get-Content (Join-Path $txtServerPath.Text "package.json") -Raw | ConvertFrom-Json; if($p.scripts){foreach($s in $p.scripts.PSObject.Properties){$cbScripts.Items.Add($s.Name)}} } catch {}
}
function Get-Perf {
    try { $m = (Get-Process node -EA SilentlyContinue | Measure -Property WorkingSet64 -Sum).Sum / 1MB; $lblPerfServer.Text="RAM: {0:N0} MB" -f $m } catch { $lblPerfServer.Text="RAM: 0 MB" }
}

function Start-Process-Safe {
    param($name, $cmd, $argsStr, $workDir, $envMap, $logBox, $logFile)
    if ($script:logTimer) { $script:logTimer.Stop() }; Start-Sleep -m 100
    try { "" | Out-File -FilePath $logFile -Encoding UTF8 -ErrorAction SilentlyContinue } catch {}
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo; $pinfo.FileName = "cmd.exe"; 
    $pinfo.Arguments = "/c `"`"$cmd`" $argsStr > `"$logFile`" 2>&1`""; 
    $pinfo.WorkingDirectory = $workDir; $pinfo.UseShellExecute = $false; $pinfo.CreateNoWindow = $true
    foreach ($k in $envMap.Keys) { $pinfo.EnvironmentVariables[$k] = $envMap[$k] }
    $proc = New-Object System.Diagnostics.Process; $proc.StartInfo = $pinfo
    $Script:AppendLog.Invoke($logBox, "[$name] Starting..."); $proc.Start() | Out-Null
    if ($script:logTimer) { $script:logTimer.Start() }; return $proc
}

function Stop-All {
    if ($State.ServerProcess) { Stop-Process -Id $State.ServerProcess.Id -EA SilentlyContinue }
    if ($State.ClientProcess) { Stop-Process -Id $State.ClientProcess.Id -EA SilentlyContinue }
    if ($State.TunnelProcess) { Stop-Process -Id $State.TunnelProcess.Id -EA SilentlyContinue }
    $State.ServerProcess=$null; $State.ClientProcess=$null
    $btnStart.Enabled=$true; $btnStop.Enabled=$false
    $lblServerStatus.Text="OFFLINE"; $lblClientStatus.Text="OFFLINE"; $lblServerStatus.ForeColor="Gray"; $lblClientStatus.ForeColor="Gray"
}

function Save-Config {
    @{
        ServerPort = $txtServerPort.Text
        ClientPort = $txtClientPort.Text
        Theme      = $cbTheme.SelectedItem
        ServerDir  = $txtServerPath.Text
        ClientDir  = $txtClientPath.Text
    } | ConvertTo-Json | Out-File $ConfigFile
}

# Event Wiring
$btnStart.Add_Click({
    $btnStart.Enabled = $false; $btnStop.Enabled = $true
    $npm = Get-NpmPath
    # SERVER: используем PORT из текстбокса, остальное читает сам сервер
    $sEnv = @{ "PORT" = $txtServerPort.Text; "NO_COLOR" = "1" }
    $State.ServerProcess = Start-Process-Safe "Server" $npm "run dev" $txtServerPath.Text $sEnv $txtServerLog $Config.ServerLog
    $lblServerStatus.Text = "RUNNING"; $lblServerStatus.ForeColor = "SeaGreen"

    # CLIENT (Vite): обязательно прокидываем --port, чтобы не брал дефолт 5173
    $argsStr = "run dev -- --port $($txtClientPort.Text)"
    $cEnv = @{ "SERVER_PORT" = $txtServerPort.Text; "NO_COLOR" = "1" }
    $State.ClientProcess = Start-Process-Safe "Client" $npm $argsStr $txtClientPath.Text $cEnv $txtClientLog $Config.ClientLog
    $lblClientStatus.Text = "RUNNING"; $lblClientStatus.ForeColor = "SeaGreen"
})
$btnStop.Add_Click({ Stop-All }); $btnKill.Add_Click({ Stop-All; cmd /c "taskkill /F /IM node.exe /T" })
$btnClear.Add_Click({ $txtServerLog.Clear(); $txtClientLog.Clear() })
$cbTheme.Add_SelectedIndexChanged({ Apply-Theme $cbTheme.SelectedItem })
$form.Add_FormClosing({ Save-Config; Stop-All; $tray.Visible = $false })

$btnInstall.Add_Click({
    $btnInstall.Enabled = $false; $npm = Get-NpmPath
    $Script:AppendLog.Invoke($txtServerLog, ">>> INSTALLING DEPS (server)..."); $Script:AppendLog.Invoke($txtClientLog, ">>> INSTALLING DEPS (client)...")
    try {
        Start-Process-Safe "InstallS" $npm "install --no-audit --loglevel error" $txtServerPath.Text @{} $txtServerLog $Config.ServerLog | Out-Null
        Start-Process-Safe "InstallC" $npm "install --no-audit --loglevel error" $txtClientPath.Text @{} $txtClientLog $Config.ClientLog | Out-Null
    } catch {
        $Script:AppendLog.Invoke($txtServerLog, "npm install failed: $($_.Exception.Message)" , $true)
        $Script:AppendLog.Invoke($txtClientLog, "npm install failed: $($_.Exception.Message)" , $true)
    }
    $timer = New-Object System.Windows.Forms.Timer; $timer.Interval = 5000; $timer.Add_Tick({ $btnInstall.Enabled = $true; $this.Stop() }); $timer.Start()
})
$btnRunScript.Add_Click({ $s = $cbScripts.Text; if ($s -and $s -ne "Scripts...") { Start-Process-Safe "Script" (Get-NpmPath) "run $s" $txtServerPath.Text @{} $txtServerLog $Config.ServerLog } })
$btnPrisma.Add_Click({ Start-Process "cmd.exe" "/c npx prisma studio" -WorkingDirectory $txtServerPath.Text })
$btnEnv.Add_Click({ Invoke-Item (Join-Path $txtServerPath.Text ".env") })

# Запуск code-graph-rag-mcp . из корня репозитория (где лежит Launcher.ps1)
$btnCodeGraph.Add_Click({
    $root = $PSScriptRoot
    $Script:AppendLog.Invoke($txtServerLog, ">>> code-graph-rag-mcp . (root: $root)...")
    # Важно: строго "code-graph-rag-mcp ." как одна команда
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "cmd.exe"
    $pinfo.Arguments = "/c code-graph-rag-mcp ."
    $pinfo.WorkingDirectory = $root
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $pinfo
    $null = $proc.Start()
    $Script:AppendLog.Invoke($txtServerLog, "[RAG] process started (PID: $($proc.Id))")
})

# Browse buttons: выбор папок сервера и клиента
$btnBrowseS.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = "Выберите папку сервера (server)"
    if (Test-Path $txtServerPath.Text) { $dlg.SelectedPath = $txtServerPath.Text }
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $txtServerPath.Text = $dlg.SelectedPath
        Get-Scripts
    }
})

$btnBrowseC.Add_Click({
    $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
    $dlg.Description = "Выберите папку клиента (client)"
    if (Test-Path $txtClientPath.Text) { $dlg.SelectedPath = $txtClientPath.Text }
    if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $txtClientPath.Text = $dlg.SelectedPath
    }
})

# Log Loop
$script:logTimer = New-Object System.Windows.Forms.Timer; $script:logTimer.Interval = 500
$script:logTimer.Add_Tick({
    Get-Perf
    foreach ($pair in @(@{P=$Config.ServerLog;T=$txtServerLog;O="ServerOffset"}, @{P=$Config.ClientLog;T=$txtClientLog;O="ClientOffset"})) {
        if (Test-Path $pair.P) { try {
            $s=[System.IO.File]::Open($pair.P,"Open","Read","ReadWrite"); $off=$pair.O
            if ($s.Length -gt $State.$off) { $s.Seek($State.$off,"Begin"); $r=New-Object System.IO.StreamReader($s); $txt=$r.ReadToEnd(); $State.$off=$s.Position; $r.Close(); $s.Close(); if ($txt){$Script:AppendLog.Invoke($pair.T,$txt.TrimEnd())} }
            else { if ($s.Length -lt $State.$off){$State.$off=0}; $s.Close() }
        } catch {} }
    }
})
$script:logTimer.Start()

$animTimer = New-Object System.Windows.Forms.Timer; $animTimer.Interval = 10
$animTimer.Add_Tick({ if ($form.Opacity -lt 1) { $form.Opacity += 0.05 } else { $animTimer.Stop() } })
$form.Add_Load({ $cbTheme.SelectedItem = if ($Config.Theme) { $Config.Theme } else { "Dark" }; Apply-Theme $cbTheme.SelectedItem; Get-GitStatus; Get-Scripts; $split.SplitterDistance = $split.Width / 2; $animTimer.Start() })

$form.ShowDialog() | Out-Null
