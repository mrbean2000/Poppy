# Local podcast transcription with Whisper turbo

This service runs the open-source `openai-whisper` **turbo** model locally.
It does not use the hosted OpenAI API or need an OpenAI API key. The first
transcription downloads the model checkpoint (about 1.6 GB); later requests
reuse the model loaded in memory.

## Prerequisites

- Python 3.10–3.12
- FFmpeg installed and available on `PATH`
- About 4 GB of free disk space for the Python dependencies and model cache
- A CUDA-capable NVIDIA GPU is recommended for faster transcription. CPU mode
  works but can take much longer than the podcast's duration.

## Windows setup

From the repository root, create an environment and install the service:

```powershell
py -3.11 -m venv backend-whisper\.venv
backend-whisper\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend-whisper\requirements.txt
```

Install FFmpeg and ensure `ffmpeg.exe` is on `PATH`. Then start the service:

```powershell
Set-Location backend-whisper
python app.py
```

The service listens on `127.0.0.1:8001` by default. The Spring backend proxies
requests to it. If the Python service runs on another host, set
`PODCAST_TRANSCRIPTION_URL` on the Spring backend to
`http://<host>:8001/transcribe`, and configure the Python service's
`WHISPER_HOST` so that host is reachable.

By default, the service uses CUDA when PyTorch detects it and otherwise uses
CPU. Set `WHISPER_DEVICE=cpu` or `WHISPER_DEVICE=cuda` to choose explicitly.
The endpoint accepts audio files up to 512 MB. Generated transcripts are
cached in memory for the current service process.
