# Soundboard sounds

The bot loads audio files from this folder automatically after restart.

Bundled sounds:

- `ding`
- `coin`
- `alert`
- `launch`
- `success`

## Add your own

Put an `.opus`, `.ogg`, `.mp3`, or `.wav` file here. The slash-command name is the filename without the extension.

For best results on low-memory hosts, use `.opus` because it plays without `ffmpeg`:

```sh
ffmpeg -i input.mp3 -c:a libopus -b:a 64k sounds/myname.opus
```

## Use

- `/sound list`
- `/sound play name:ding`
- `/sound stop`
- `/sound upload file:<attachment> name:optional-name` — Manage Server required
- `/sound delete name:ding` — Manage Server required

`/sound upload` converts `.mp3`, `.wav`, and `.ogg` with `ffmpeg` if it is installed on the host. If `ffmpeg` is unavailable, upload a `.opus` file instead.

The bot joins the normal voice channel you are already in, plays the sound, stays connected, and can auto-join configured channels on launch.
