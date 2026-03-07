import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { text, preset, layers } = req.body;

  // פרמטרים לפי preset
  let pitch = 2.0, formant = 1.2, overdrive = 15, echo = "0.8:0.9:50:0.4";
  let musicPrompt = "raw black metal tremolo guitars blast beats";

  if (preset === "Darkthrone") { pitch=2.3; formant=1.25; overdrive=18; musicPrompt="tremolo guitars, blast beats, lo-fi"; }
  if (preset === "Immortal") { pitch=1.8; formant=1.15; overdrive=14; musicPrompt="blast beats, deep guitars, cold reverb"; }
  if (preset === "Mayhem") { pitch=2.0; formant=1.2; overdrive=15; musicPrompt="harsh vocals, tremolo guitars, heavy reverb"; }

  // Generate scream (layered)
  const pythonScream = spawn("python", [
    path.join(process.cwd(), "python", "rvc_runner.py"),
    text, pitch, formant, overdrive, echo, 120, layers || 2
  ]);

  pythonScream.on("close", (code) => {
    if (code !== 0) return res.status(500).send("Error generating scream");

    // Generate music
    const pythonMusic = spawn("python", [
      path.join(process.cwd(), "python", "musicgen_runner.py"),
      musicPrompt
    ]);

    pythonMusic.on("close", (code2) => {
      if (code2 !== 0) return res.status(500).send("Error generating music");

      // Mix scream + music
      const finalFile = path.join(process.cwd(), "generated_songs", "blackmetal_song.wav");
      const ffmpeg = spawn("ffmpeg", [
        "-y",
        "-i", path.join(process.cwd(), "generated_songs", "scream_final.wav"),
        "-i", path.join(process.cwd(), "generated_songs", "music.wav"),
        "-filter_complex", "amix=inputs=2:duration=longest",
        finalFile
      ]);

      ffmpeg.on("close", () => res.sendFile(finalFile));
    });
  });
}