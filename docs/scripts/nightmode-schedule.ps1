Import-Module $PSScriptRoot\nightmode.ps1
Set-BlueLightReductionSettings -StartHour 19 -StartMinutes 0 -EndHour 7 -EndMinutes 0 -Enabled $true -NightColorTemperature 3500