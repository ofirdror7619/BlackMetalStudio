import sys
import soundfile as sf
from pathlib import Path
from inference.infer_tool import Svc
import subprocess
import numpy as np

project_root = Path(__file__).resolve().parent.parent

text = sys.argv[1]
pitch = float(sys.argv[2])
formant = float(sys.argv[3])
overdrive = int(sys.argv[4])
echo = sys.argv[5]
highpass = int(sys.argv[6])
layers = int(sys.argv[7])  # כמה layered screams

output_dir = project_root / "generated_songs"
output_dir.mkdir(exist_ok=True)
final_file = output_dir / "scream_final.wav"

svc_model = Svc(model_path="rvc_model.pth")

layer_wavs = []

for i in range(layers):
    # אפשר לשחק מעט ב-pitch וב-formant לכל layer
    pitch_shift = pitch + np.random.uniform(-0.3, 0.3)
    formant_shift = formant + np.random.uniform(-0.1, 0.1)
    wav, sr = svc_model.tts(text=text, pitch_shift=pitch_shift, formant_shift=formant_shift)
    tmp_file = output_dir / f"scream_tmp_{i}.wav"
    sf.write(tmp_file, wav, sr)
    layer_wavs.append(tmp_file)

# Mix all layers with FFmpeg
inputs = []
filter_complex = ""
for idx, f in enumerate(layer_wavs):
    inputs += ["-i", str(f)]
    filter_complex += f"[{idx}:a]"
filter_complex += f"amix=inputs={len(layer_wavs)}:duration=longest"

subprocess.run([
    "ffmpeg",
    "-y",
    *inputs,
    "-filter_complex", filter_complex,
    str(final_file)
])

# Post-processing
subprocess.run([
    "ffmpeg",
    "-y",
    "-i", str(final_file),
    "-af", f"overdrive={overdrive},aecho={echo},highpass=f={highpass}",
    str(final_file)
])