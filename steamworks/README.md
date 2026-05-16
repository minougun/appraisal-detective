# Steamworks Upload Templates

These files are templates for SteamPipe. They are not valid until the placeholders are replaced inside a Steamworks partner account.

Required manual values:

- `REPLACE_WITH_STEAM_APP_ID`
- `REPLACE_WITH_WINDOWS_DEPOT_ID`
- Steamworks SDK path on the upload machine
- Steamworks user account with build upload permission

Local build flow:

```bash
npm run test:steam-readiness
npm run build:steam:win-dir
```

After building, copy `steam_appid.txt` with the real app id next to the packaged executable if you need a local Steam API smoke test outside the Steam client. Do not commit the real app id file if it belongs to a private pre-release app.

Upload flow after replacing placeholders:

```bash
path/to/steamcmd +login <steamworks-user> +run_app_build steamworks/app_build_template.vdf +quit
```

Release boundary:

Uploading a build is not the same as releasing it. Steam store presence, pricing, build review, and final release controls remain in Steamworks.
