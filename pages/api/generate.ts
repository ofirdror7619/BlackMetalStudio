import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { text, layers } = req.body;

  // Default generation profile
  let pitch = 2.0, formant = 1.2, overdrive = 15, echo = "0.8:0.9:50:0.4";
  let musicPrompt = "raw black metal tremolo guitars blast beats";

  const pitchArg = String(pitch);
  const formantArg = String(formant);
  const overdriveArg = String(overdrive);
  const layersArg = String(layers || 2);

  // Generate scream (layered)
  const pythonScream = spawn("python", [
    path.join(process.cwd(), "python", "rvc_runner.py"),
    text,
    pitchArg,
    formantArg,
    overdriveArg,
    echo,
    "120",
    layersArg,
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

      ffmpeg.on("close", (code3) => {
        if (code3 !== 0) return res.status(500).send("Error mixing final song");

        fs.readFile(finalFile, (error, data) => {
          if (error) return res.status(500).send("Error reading final song");

          res.setHeader("Content-Type", "audio/wav");
          res.setHeader("Content-Disposition", 'inline; filename="blackmetal_song.wav"');
          res.status(200).send(data);
        });
      });
    });
  });
}