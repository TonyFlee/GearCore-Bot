import { createAudioPlayer, createAudioResource, getVoiceConnection, StreamType, type AudioPlayer } from "@discordjs/voice";
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import type { Attachment, Client } from "discord.js";
import { joinVoiceTarget } from "./voice";

const soundsDir = resolve(process.cwd(), "sounds");
const allowedExtensions = [".opus", ".ogg", ".mp3", ".wav"];
const activePlayers = new Map<string, AudioPlayer>();

type SoundFile = { name: string; path: string; extension: string };

function soundFiles(): SoundFile[] {
  if (!existsSync(soundsDir)) return [];
  return readdirSync(soundsDir)
    .filter((file) => allowedExtensions.includes(extname(file).toLowerCase()))
    .map((file) => ({
      name: basename(file, extname(file)).toLowerCase(),
      path: join(soundsDir, file),
      extension: extname(file).toLowerCase(),
    }));
}

export function listSounds(): string[] {
  return soundFiles().map((sound) => sound.name).sort((a, b) => a.localeCompare(b));
}

function findSound(name: string): SoundFile | null {
  const target = name.trim().toLowerCase();
  return soundFiles().find((sound) => sound.name === target) ?? null;
}

export function stopSound(guildId: string): boolean {
  const player = activePlayers.get(guildId);
  if (!player) return false;
  player.stop();
  activePlayers.delete(guildId);
  return true;
}

export async function playSound(client: Client, guildId: string, channelId: string, name: string): Promise<{ ok: boolean; error?: string }> {
  const sound = findSound(name);
  if (!sound) return { ok: false, error: `Unknown sound "${name}". Use /sound list.` };

  const joined = await joinVoiceTarget(client, { guildId, channelId, enabled: true });
  if (!joined.ok) return { ok: false, error: joined.error || "Could not join the voice channel." };

  const connection = getVoiceConnection(guildId);
  if (!connection) return { ok: false, error: "Voice connection was not created." };

  stopSound(guildId);
  const player = createAudioPlayer();
  activePlayers.set(guildId, player);
  connection.subscribe(player);

  const resource = sound.extension === ".opus" || sound.extension === ".ogg"
    ? createAudioResource(sound.path, { inputType: StreamType.OggOpus })
    : createAudioResource(sound.path);

  return new Promise((resolve) => {
    const finish = (result: { ok: boolean; error?: string }) => {
      clearTimeout(timer);
      player.off("error", onError);
      player.off("stateChange", onState);
      activePlayers.delete(guildId);
      resolve(result);
    };
    const onError = (error: Error) => finish({ ok: false, error: `Audio failed: ${error.message}. Use an .opus file if ffmpeg is unavailable.` });
    const onState = (_old: unknown, next: { status?: string }) => {
      if (next.status === "idle") finish({ ok: true });
    };
    const timer = setTimeout(() => finish({ ok: true }), 15_000);

    player.on("error", onError);
    player.on("stateChange", onState as never);
    player.play(resource);
  });
}

function cleanSoundName(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return cleaned || "sound";
}

function ffmpegAvailable(): boolean {
  return spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;
}

export async function uploadSound(attachment: Attachment, requestedName?: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  const extension = extname(attachment.name).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { ok: false, error: "Use an .opus, .ogg, .mp3, or .wav file." };
  }
  if (attachment.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Sound files must be 10 MB or smaller." };
  }

  const name = cleanSoundName(requestedName || attachment.name);
  const tempDir = mkdtempSync(join(tmpdir(), "gearcore-sound-"));
  const inputPath = join(tempDir, `input${extension}`);
  mkdirSync(soundsDir, { recursive: true });
  const targetPath = join(soundsDir, `${name}.opus`);

  try {
    const response = await fetch(attachment.url);
    if (!response.ok) return { ok: false, error: "Could not download that attachment." };
    writeFileSync(inputPath, Buffer.from(await response.arrayBuffer()));

    for (const file of readdirSync(soundsDir)) {
      const fileExtension = extname(file).toLowerCase();
      if (allowedExtensions.includes(fileExtension) && basename(file, fileExtension).toLowerCase() === name) {
        rmSync(join(soundsDir, file), { force: true });
      }
    }

    if (extension === ".opus") {
      copyFileSync(inputPath, targetPath);
    } else {
      if (!ffmpegAvailable()) {
        return { ok: false, error: "ffmpeg is not available on this host. Convert the file to .opus locally and upload that instead." };
      }
      const code = await new Promise<number | null>((resolveCode) => {
        const process = spawn("ffmpeg", ["-y", "-i", inputPath, "-c:a", "libopus", "-b:a", "64k", targetPath], { stdio: "ignore" });
        process.on("error", () => resolveCode(1));
        process.on("close", (value) => resolveCode(value));
      });
      if (code !== 0) return { ok: false, error: "Conversion failed. Check that the file is valid audio." };
    }

    return { ok: true, name };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Sound upload failed." };
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

export function deleteSound(name: string): boolean {
  const sound = findSound(name);
  if (!sound) return false;
  rmSync(sound.path, { force: true });
  return true;
}
