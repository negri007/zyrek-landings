# Fala um texto com uma voz do próprio Windows (OneCore) e salva o WAV e o início de cada palavra.
# Chamado por gerar_voz_windows.mjs; não precisa de internet nem de nada instalado além do Windows 10/11.
#   -Texto: arquivo UTF-8 com a frase   -Wav: saída de áudio   -Marcas: saída JSON [{ text, t }]
param(
  [Parameter(Mandatory)] [string] $Texto,
  [Parameter(Mandatory)] [string] $Wav,
  [Parameter(Mandatory)] [string] $Marcas,
  [string] $Voz = 'Maria',
  [double] $Taxa = 1.0
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]

# as chamadas do WinRT são assíncronas: AsTask + Wait para usar daqui do PowerShell
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Esperar($op, [Type] $tipo) { $t = $asTask.MakeGenericMethod($tipo).Invoke($null, @($op)); $t.Wait() | Out-Null; $t.Result }

$s = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$v = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like "*$Voz*" -and $_.Language -eq 'pt-BR' } | Select-Object -First 1
if (-not $v) { throw "Voz '$Voz' em pt-BR não encontrada. Instale o pacote de fala em português nas Configurações do Windows." }
$s.Voice = $v
$s.Options.IncludeWordBoundaryMetadata = $true
$s.Options.SpeakingRate = $Taxa

$frase = [IO.File]::ReadAllText($Texto, [Text.Encoding]::UTF8)
$st = Esperar ($s.SynthesizeTextToStreamAsync($frase)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])

$lista = New-Object System.Collections.ArrayList
foreach ($faixa in $st.TimedMetadataTracks) {
  foreach ($c in $faixa.Cues) { [void] $lista.Add([ordered] @{ text = $c.Text; t = [math]::Round($c.StartTime.TotalSeconds, 3) }) }
}
$json = if ($lista.Count) { ConvertTo-Json -InputObject @($lista) -Compress } else { '[]' }
[IO.File]::WriteAllText($Marcas, $json, (New-Object Text.UTF8Encoding $false))

$rd = New-Object Windows.Storage.Streams.DataReader($st.GetInputStreamAt(0))
$n = Esperar ($rd.LoadAsync([uint32] $st.Size)) ([uint32])
$buf = New-Object byte[] $n
$rd.ReadBytes($buf)
[IO.File]::WriteAllBytes($Wav, $buf)
Write-Output $v.DisplayName
