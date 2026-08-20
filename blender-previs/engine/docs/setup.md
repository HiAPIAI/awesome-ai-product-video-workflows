# Setup

## Requirements

- Node.js 20 or newer.
- Blender 4.5 or newer. Blender 5.2.0 LTS is verified.
- FFmpeg with `libx264`. FFmpeg 8.1.2 is verified.
- Git for contributing.
- `HIAPI_API_KEY` only for an explicitly confirmed paid generation.

## Windows

```powershell
$wingetCommand = Get-Command winget.exe -ErrorAction SilentlyContinue
$winget = if ($wingetCommand) { $wingetCommand.Source } else { Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps\winget.exe" }
if (-not (Test-Path -LiteralPath $winget)) { throw "winget.exe was not found" }
& $winget install --exact --id BlenderFoundation.Blender --source winget --accept-package-agreements --accept-source-agreements
& $winget install --exact --id Gyan.FFmpeg --source winget --accept-package-agreements --accept-source-agreements
```

Restart the shell after installation. `$env:LOCALAPPDATA` is PowerShell syntax; `%LOCALAPPDATA%` works only in `cmd.exe`.

When Blender or FFmpeg is installed in a custom location:

```powershell
$env:BLENDER_BIN = "C:\path\to\blender.exe"
$env:FFMPEG_BIN = "C:\path\to\ffmpeg.exe"
$env:FFPROBE_BIN = "C:\path\to\ffprobe.exe"
npm run doctor -- --strict
```

Configure a HiAPI key for only the current PowerShell process without placing it in history:

```powershell
$hiapiSecret = Read-Host "HiAPI API Key" -AsSecureString
$env:HIAPI_API_KEY = [System.Net.NetworkCredential]::new("", $hiapiSecret).Password
npm run doctor -- --strict --paid
```

## macOS and Linux

Install Blender and FFmpeg through the platform's trusted package channel. Ensure `blender`, `ffmpeg`, and `ffprobe` resolve on PATH, or set `BLENDER_BIN`, `FFMPEG_BIN`, and `FFPROBE_BIN` to absolute executable paths.

```bash
printf 'HiAPI API Key: ' >&2
read -r -s HIAPI_API_KEY
printf '\n' >&2
export HIAPI_API_KEY
npm run doctor -- --strict --paid
```

## Verification sequence

```bash
npm ci
npm run doctor -- --strict
npm test
npm run compile -- examples/warehouse-pursuit/shot.json --out-dir outputs/warehouse-pursuit
npm run render -- examples/warehouse-pursuit/shot.json --out-dir outputs/warehouse-pursuit
```

Expected render artifacts are `previs.blend`, `motion-trace.json`, 144 PNG frames, a six-second `previs.mp4`, `render-report.json`, `review-report.json`, `review-checklist.md`, `seedance-handoff.md`, `handoff-manifest.json`, and first/middle/last stills plus a contact sheet under `review/`. The motion trace records Blender's evaluated camera and proxy transforms for every frame and is produced by both full renders and `--scene-only`. The compiler claims an empty output directory for one shot and locks it during writes; choose a new empty path if an existing directory has no ownership marker or belongs to another shot. Rendering happens in an ignored staging directory and replaces the published artifact set only after all checks pass; the next run automatically repairs an interrupted promotion. The first run may be slower while Blender initializes preferences. Add `--blocking-svg` for `review/blocking-top.svg`; use `--scene-only` when only the `.blend` scene and trace are needed. `--dry-run` prints the planned tools and arguments without creating the output directory.

## No paid smoke test by default

`npm test` and `npm run render` do not call HiAPI. Manual upload through `seedance-handoff.md` is the default. `npm run generate` is optional and remains non-paying until an exact preflight token is supplied. The repository intentionally has no automatic paid integration test. Use `npm run doctor -- --strict --paid` only when you intentionally want API readiness to be a failing gate.

The default API origin is `https://api.hiapi.ai`. A custom `HIAPI_BASE_URL` must be an HTTPS origin without a path, query, fragment, or embedded credentials. Confirmed requests to non-HiAPI hosts additionally require `--allow-custom-base-url` after the complete endpoint shown by the dry run has been reviewed. Plain HTTP localhost is accepted only for hermetic local API tests.
