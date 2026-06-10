<#
  UIA coverage spike for Meera's overlay grounding.

  Dumps on-screen UI Automation elements (Name, ControlType, screen-coordinate
  BoundingRectangle) for top-level windows, so we can judge whether the OS
  accessibility tree is a reliable element source for Set-of-Marks grounding.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts/spikes/uia-dump.ps1
    powershell ... -File scripts/spikes/uia-dump.ps1 -ProcessName chrome -Max 150
    powershell ... -File scripts/spikes/uia-dump.ps1 -ProcessName notepad -OutFile out.json

  This is a throwaway spike, not production code.
#>
param(
  [string]$ProcessName = "",
  [int]$Max = 120,
  [int]$MaxDepth = 14,
  [int]$BudgetMs = 8000,
  [string]$OutFile = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

$auto = [System.Windows.Automation.AutomationElement]
$walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
$root = $auto::RootElement
$sw = [System.Diagnostics.Stopwatch]::StartNew()

function Get-Rect($el) {
  try {
    $r = $el.Current.BoundingRectangle
    if ($r.Width -le 0 -or $r.Height -le 0) { return $null }
    if ([double]::IsInfinity($r.X) -or [double]::IsInfinity($r.Y)) { return $null }
    return [pscustomobject]@{
      x = [int]$r.X; y = [int]$r.Y; w = [int]$r.Width; h = [int]$r.Height
    }
  } catch { return $null }
}

# Pick which top-level windows to inspect.
$topWindows = @()
$child = $walker.GetFirstChild($root)
while ($child -ne $null) {
  try {
    $name = $child.Current.Name
    $procId = $child.Current.ProcessId
    $proc = ""
    try { $proc = (Get-Process -Id $procId -ErrorAction Stop).ProcessName } catch {}
    $rect = Get-Rect $child
    if ($rect -ne $null) {
      $topWindows += [pscustomobject]@{ el = $child; name = $name; proc = $proc; rect = $rect }
    }
  } catch {}
  $child = $walker.GetNextSibling($child)
}

if ($ProcessName -ne "") {
  $targets = $topWindows | Where-Object { $_.proc -like "*$ProcessName*" }
} else {
  # Largest visible windows first (most likely the real apps, not tiny tooltips).
  $targets = $topWindows | Sort-Object { -1 * ($_.rect.w * $_.rect.h) } | Select-Object -First 3
}

$results = @()
foreach ($t in $targets) {
  $elements = @()
  $queue = New-Object System.Collections.Queue
  $queue.Enqueue(@{ el = $t.el; depth = 0 })
  while ($queue.Count -gt 0 -and $elements.Count -lt $Max -and $sw.ElapsedMilliseconds -lt $BudgetMs) {
    $node = $queue.Dequeue()
    $el = $node.el
    $depth = $node.depth
    try {
      $c = $el.Current
      $rect = Get-Rect $el
      $offscreen = $false
      try { $offscreen = $c.IsOffscreen } catch {}
      if ($rect -ne $null -and -not $offscreen) {
        $ct = ""
        try { $ct = $c.ControlType.ProgrammaticName -replace "ControlType\.", "" } catch {}
        $elements += [pscustomobject]@{
          name = $c.Name
          control = $ct
          autoId = $c.AutomationId
          enabled = $c.IsEnabled
          keyboardFocusable = $c.IsKeyboardFocusable
          rect = $rect
          depth = $depth
        }
      }
    } catch {}
    if ($depth -lt $MaxDepth) {
      try {
        $sub = $walker.GetFirstChild($el)
        while ($sub -ne $null -and $elements.Count -lt $Max) {
          $queue.Enqueue(@{ el = $sub; depth = $depth + 1 })
          $sub = $walker.GetNextSibling($sub)
        }
      } catch {}
    }
  }
  $named = ($elements | Where-Object { $_.name -ne "" -and $_.name -ne $null }).Count
  $interactive = ($elements | Where-Object { $_.control -in @("Button","MenuItem","Edit","Hyperlink","CheckBox","ComboBox","TabItem","ListItem","RadioButton") }).Count
  $results += [pscustomobject]@{
    window = $t.name
    process = $t.proc
    windowRect = $t.rect
    totalElements = $elements.Count
    namedElements = $named
    interactiveElements = $interactive
    elements = $elements
  }
}

$summary = [pscustomobject]@{
  elapsedMs = $sw.ElapsedMilliseconds
  windowsInspected = $results.Count
  windows = $results
}

$json = $summary | ConvertTo-Json -Depth 8
if ($OutFile -ne "") { $json | Out-File -FilePath $OutFile -Encoding utf8 }

# Print a compact human summary, plus a sample of elements from the first window.
Write-Output "elapsedMs=$($sw.ElapsedMilliseconds)  windowsInspected=$($results.Count)"
foreach ($r in $results) {
  Write-Output ("[{0}] {1}  total={2} named={3} interactive={4}" -f $r.process, $r.window, $r.totalElements, $r.namedElements, $r.interactiveElements)
}
if ($results.Count -gt 0) {
  Write-Output "--- sample interactive elements (first window) ---"
  $results[0].elements |
    Where-Object { $_.name -ne "" -and $_.control -in @("Button","MenuItem","Edit","Hyperlink","CheckBox","ComboBox","TabItem") } |
    Select-Object -First 18 |
    ForEach-Object { Write-Output ("  [{0,-10}] {1,-32} @ {2},{3} {4}x{5}" -f $_.control, ($_.name.Substring(0, [Math]::Min(32, $_.name.Length))), $_.rect.x, $_.rect.y, $_.rect.w, $_.rect.h) }
}
