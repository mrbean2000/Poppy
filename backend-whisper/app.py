import os
import tempfile
import threading
from collections import OrderedDict
from pathlib import Path

import torch
import whisper
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

MAX_AUDIO_BYTES = 512 * 1024 * 1024
MAX_CACHED_TRANSCRIPTS = 100
ALLOWED_EXTENSIONS = {
    ".mp3",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".m4a",
    ".wav",
    ".webm",
}

app = FastAPI(title="Poppy Podcast Transcription")
transcript_cache = OrderedDict()
cache_lock = threading.Lock()
model_lock = threading.Lock()
model = None


def get_model():
    global model
    if model is None:
        with model_lock:
            if model is None:
                requested_device = os.getenv("WHISPER_DEVICE", "auto").lower()
                if requested_device == "auto":
                    device = "cuda" if torch.cuda.is_available() else "cpu"
                elif requested_device in {"cpu", "cuda"}:
                    if requested_device == "cuda" and not torch.cuda.is_available():
                        raise HTTPException(
                            status_code=503,
                            detail="WHISPER_DEVICE is set to CUDA, but CUDA is unavailable.",
                        )
                    device = requested_device
                else:
                    raise HTTPException(
                        status_code=500,
                        detail="WHISPER_DEVICE must be auto, cpu, or cuda.",
                    )

                model = whisper.load_model("turbo", device=device)
    return model


def get_cached_transcript(episode_id):
    with cache_lock:
        transcript = transcript_cache.get(episode_id)
        if transcript is not None:
            transcript_cache.move_to_end(episode_id)
        return transcript


def cache_transcript(episode_id, transcript):
    with cache_lock:
        transcript_cache[episode_id] = transcript
        transcript_cache.move_to_end(episode_id)
        while len(transcript_cache) > MAX_CACHED_TRANSCRIPTS:
            transcript_cache.popitem(last=False)


@app.get("/health")
def health():
    return {"status": "ok", "model": "turbo"}


@app.post("/transcribe")
def transcribe(
    episode_id: str = Form(...),
    audio: UploadFile = File(...),
):
    normalized_episode_id = episode_id.strip()
    if not normalized_episode_id:
        raise HTTPException(status_code=400, detail="An episode ID is required.")

    cached = get_cached_transcript(normalized_episode_id)
    if cached is not None:
        return cached

    suffix = Path(audio.filename or "podcast.mp3").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        suffix = ".mp3"

    temporary_path = None
    total_size = 0
    try:
        with tempfile.NamedTemporaryFile(
            prefix="poppy-podcast-",
            suffix=suffix,
            delete=False,
        ) as temporary_audio:
            temporary_path = temporary_audio.name
            while chunk := audio.file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > MAX_AUDIO_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Audio must not exceed 512 MB.",
                    )
                temporary_audio.write(chunk)

        if total_size == 0:
            raise HTTPException(status_code=400, detail="The audio file is empty.")

        transcription_model = get_model()
        try:
            with model_lock:
                result = transcription_model.transcribe(
                    temporary_path,
                    fp16=next(transcription_model.parameters()).is_cuda,
                    verbose=False,
                )
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(
                status_code=502,
                detail="Whisper could not transcribe this audio file.",
            ) from error

        cues = [
            {
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip(),
            }
            for segment in result.get("segments", [])
            if segment.get("text", "").strip()
        ]
        if not cues:
            raise HTTPException(
                status_code=502,
                detail="Whisper returned no transcript segments.",
            )

        transcript = {"cues": cues, "isTimed": True}
        cache_transcript(normalized_episode_id, transcript)
        return transcript
    finally:
        if temporary_path and os.path.exists(temporary_path):
            os.remove(temporary_path)
        audio.file.close()


if __name__ == "__main__":
    host = os.getenv("WHISPER_HOST", "127.0.0.1")
    port = int(os.getenv("WHISPER_PORT", "8001"))
    uvicorn_config = {"host": host, "port": port}
    import uvicorn

    uvicorn.run("app:app", **uvicorn_config)
