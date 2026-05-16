# Steam Store / Release Checklist

## Account / App Setup

- [ ] Steamworks partner onboarding complete.
- [ ] Steam Direct fee paid.
- [ ] 30-day release wait period started.
- [ ] App ID issued.
- [ ] Windows Depot ID issued.
- [ ] Steamworks SDK downloaded outside the repo.
- [ ] Upload-only Steamworks user prepared.

## Build

- [ ] `npm run test:steam-readiness`
- [ ] `npm run build:steam:win-dir` on Windows or wine-enabled CI.
- [ ] `dist/desktop/win-unpacked` launches on Windows.
- [ ] Save data persists after app restart.
- [ ] Gamepad controls work through Steam client.
- [ ] VOICE/BGM/SE toggles work.
- [ ] `steam_appid.txt` is used only for local smoke testing and not committed with a private real app id.
- [ ] SteamPipe VDF placeholders replaced in a local private copy.
- [ ] SteamPipe upload succeeds.
- [ ] Steam client install launches the uploaded build.

## Store Page

- [ ] Short description.
- [ ] Long description.
- [ ] Capsule images.
- [ ] Library images.
- [ ] Screenshots.
- [ ] Trailer.
- [ ] Mature content questionnaire.
- [ ] Supported languages.
- [ ] Controller support.
- [ ] System requirements.
- [ ] AI disclosure.
- [ ] Third-party audio credits.
- [ ] Support contact.

## Review / Release

- [ ] Store page submitted for Valve review.
- [ ] Build submitted for Valve review.
- [ ] Coming Soon page published for at least two weeks.
- [ ] Pricing configured.
- [ ] Release date configured.
- [ ] Launch discount decision recorded.
- [ ] Final release button held until checklist is complete.
