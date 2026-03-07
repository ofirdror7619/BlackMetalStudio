# דוגמה בסיסית ל-MusicGen
import sys
from pathlib import Path
import subprocess

prompt = sys.argv[1]  # לדוגמה: "tremolo guitars, blast beats, black metal"
output_file = Path("../generated_songs/music.wav")
output_file.parent.mkdir(exist_ok=True)

# כאן אתה קורא MusicGen או מודל אחר
# לדוגמה CLI:
# musicgen-cli --prompt "..." --output "music.wav"

subprocess.run([
    "musicgen-cli",
    "--prompt", prompt,
    "--output", str(output_file)
])