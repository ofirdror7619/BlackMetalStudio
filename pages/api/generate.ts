import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const runCommand = (
  command: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv
) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    const child = spawn(command, args, {
      cwd,
      env,
    });

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });

const getLatestFile = (dir: string, extension: string, includeText?: string) => {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.toLowerCase().endsWith(extension.toLowerCase()))
    .filter((file) => (includeText ? file.toLowerCase().includes(includeText.toLowerCase()) : true))
    .map((file) => {
      const fullPath = path.join(dir, file);
      return {
        fullPath,
        mtime: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return files[0]?.fullPath ?? null;
};

const getLatestTrainingDir = (root: string) => {
  if (!fs.existsSync(root)) return null;
  const trainings = fs
    .readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        (entry.name.startsWith("training_backup_") || entry.name.startsWith("training_snapshot_"))
    )
    .map((entry) => {
      const fullPath = path.join(root, entry.name);
      return {
        fullPath,
        mtime: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  return trainings[0]?.fullPath ?? null;
};

const getTrainingDirFromEnv = (blackMetalTtsRoot: string) => {
  const explicitTrainingDir = process.env.BLACKMETAL_TRAINING_DIR;
  if (!explicitTrainingDir) return null;

  if (path.isAbsolute(explicitTrainingDir)) {
    return explicitTrainingDir;
  }

  return path.join(blackMetalTtsRoot, explicitTrainingDir);
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  let responded = false;
  const sendOnce = (status: number, message: string) => {
    if (responded || res.headersSent) return;
    responded = true;
    res.status(status).send(message);
  };

  const { text, layers } = req.body;

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).send("Text is required");
  }

  const generatedDir = path.join(process.cwd(), "generated_songs");
  const finalFile = path.join(generatedDir, "scream_final.wav");

  void (async () => {
    try {
      void layers;

      const blackMetalTtsRoot = process.env.BLACKMETAL_TTS_ROOT || path.resolve(process.cwd(), "..", "BlackMetalTTS");
      if (!fs.existsSync(blackMetalTtsRoot)) {
        return sendOnce(500, `BlackMetalTTS project not found: ${blackMetalTtsRoot}`);
      }

      const preferredSnapshot = path.join(blackMetalTtsRoot, "training_snapshot_20260308_210312");
      const envTrainingDir = getTrainingDirFromEnv(blackMetalTtsRoot);
      const latestTraining = getLatestTrainingDir(blackMetalTtsRoot);
      const selectedTrainingDir =
        envTrainingDir ||
        (fs.existsSync(preferredSnapshot) ? preferredSnapshot : null) ||
        latestTraining;

      const weightsDir = selectedTrainingDir ? path.join(selectedTrainingDir, "weights") : "";
      const logsDir = selectedTrainingDir ? path.join(selectedTrainingDir, "logs_blackmetal") : "";

      const modelPath =
        process.env.RVC_MODEL_PATH ||
        (weightsDir ? getLatestFile(weightsDir, ".pth") : null) ||
        (selectedTrainingDir ? getLatestFile(selectedTrainingDir, ".pth") : null);
      const indexPath =
        process.env.RVC_INDEX_PATH ||
        (logsDir ? getLatestFile(logsDir, ".index", "added") || getLatestFile(logsDir, ".index") : null) ||
        (selectedTrainingDir
          ? getLatestFile(selectedTrainingDir, ".index", "added") || getLatestFile(selectedTrainingDir, ".index")
          : null);

      if (!modelPath) {
        return sendOnce(500, "No model .pth found in selected BlackMetalTTS training folder");
      }

      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
      }

      const ttsScript = [
        "const createTTS = require('./tts');",
        "createTTS(process.argv[1], 'voice.wav')",
        "  .then(() => process.exit(0))",
        "  .catch((err) => {",
        "    console.error(err && err.stack ? err.stack : String(err));",
        "    process.exit(1);",
        "  });",
      ].join("\n");

      const ttsEnv: NodeJS.ProcessEnv = {
        ...process.env,
        NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0",
      };

      const ttsResult = await runCommand("node", ["-e", ttsScript, text.trim()], blackMetalTtsRoot, ttsEnv);
      if (ttsResult.code !== 0) {
        const stderrSnippet = ttsResult.stderr.trim().slice(-1200);
        console.error("[generate] tts failed", ttsResult);
        return sendOnce(500, stderrSnippet ? `Error generating TTS input: ${stderrSnippet}` : "Error generating TTS input");
      }

      const pythonExe = process.env.BLACKMETAL_TTS_PYTHON || "C:/Users/ofird/AppData/Local/Programs/Python/Python310/python.exe";
      const pythonEnv: NodeJS.ProcessEnv = {
        ...process.env,
        TORCH_FORCE_NO_WEIGHTS_ONLY_LOAD: "1",
        RVC_MODEL_PATH: modelPath,
      };
      if (indexPath) {
        pythonEnv.RVC_INDEX_PATH = indexPath;
      }

      const rvcResult = await runCommand(pythonExe, ["rvc_auto.py"], blackMetalTtsRoot, pythonEnv);
      if (rvcResult.code !== 0) {
        const stderrSnippet = rvcResult.stderr.trim().slice(-2000);
        console.error("[generate] rvc failed", rvcResult);
        return sendOnce(500, stderrSnippet ? `Error generating scream: ${stderrSnippet}` : "Error generating scream");
      }

      const blackMetalOutput = path.join(blackMetalTtsRoot, "blackmetal.wav");
      if (!fs.existsSync(blackMetalOutput)) {
        return sendOnce(500, "RVC completed but blackmetal.wav was not created");
      }

      fs.copyFileSync(blackMetalOutput, finalFile);
      const data = fs.readFileSync(finalFile);

      if (responded || res.headersSent) return;
      responded = true;
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Content-Disposition", 'inline; filename="blackmetal_tts.wav"');
      res.status(200).send(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[generate] unexpected error", error);
      sendOnce(500, `Unexpected generation error: ${message}`);
    }
  })();
}