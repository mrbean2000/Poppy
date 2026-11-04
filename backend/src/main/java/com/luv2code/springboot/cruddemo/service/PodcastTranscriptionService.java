package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.PodcastTranscriptDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PodcastTranscriptionService {
    private static final long MAX_AUDIO_BYTES = 512L * 1024 * 1024;
    private static final int MAX_CACHED_TRANSCRIPTS = 100;

    private final RestClient restClient = RestClient.create();
    private final Map<String, PodcastTranscriptDto> transcriptCache =
            new ConcurrentHashMap<>();

    @Value("${podcast.transcription.url:http://localhost:8001/transcribe}")
    private String transcriptionServiceUrl;

    public PodcastTranscriptDto transcribe(String episodeId, MultipartFile audio) {
        if (episodeId == null || episodeId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "An episode ID is required.");
        }
        if (audio == null || audio.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "An audio file is required.");
        }
        if (audio.getSize() > MAX_AUDIO_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE,
                    "The audio file exceeds the 512 MB local transcription limit.");
        }

        String cacheKey = episodeId.trim();
        PodcastTranscriptDto cached = transcriptCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        Path temporaryAudio = null;
        try {
            String filename = safeFilename(audio.getOriginalFilename());
            temporaryAudio = Files.createTempFile(
                    "poppy-podcast-", fileExtension(filename));
            audio.transferTo(temporaryAudio);

            MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
            bodyBuilder.part("episode_id", cacheKey);
            bodyBuilder
                    .part("audio", new FileSystemResource(temporaryAudio))
                    .filename(filename)
                    .contentType(audioContentType(audio.getContentType()));

            MultiValueMap<String, HttpEntity<?>> body = bodyBuilder.build();
            PodcastTranscriptDto transcript = restClient.post()
                    .uri(transcriptionServiceUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(PodcastTranscriptDto.class);

            if (transcript == null || transcript.cues() == null
                    || transcript.cues().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "The local Whisper service returned no transcript segments.");
            }
            if (transcriptCache.size() >= MAX_CACHED_TRANSCRIPTS) {
                transcriptCache.clear();
            }
            transcriptCache.put(cacheKey, transcript);
            return transcript;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (RestClientResponseException exception) {
            HttpStatus status = exception.getStatusCode().value() == 413
                    ? HttpStatus.PAYLOAD_TOO_LARGE
                    : HttpStatus.BAD_GATEWAY;
            throw new ResponseStatusException(
                    status,
                    exception.getStatusCode().value() == 413
                            ? "The audio file exceeds the 512 MB local transcription limit."
                            : "The local Whisper service rejected this audio file.");
        } catch (RestClientException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "The local Whisper service is unavailable. Start the backend-whisper service.");
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unable to read the uploaded audio.");
        } finally {
            if (temporaryAudio != null) {
                try {
                    Files.deleteIfExists(temporaryAudio);
                } catch (IOException ignored) {
                    // Temporary audio is best-effort cleanup after transcription.
                }
            }
        }
    }

    private String safeFilename(String filename) {
        String candidate = filename == null ? "podcast.mp3" : filename;
        Path filenamePath = Path.of(candidate.replace('\\', '/')).getFileName();
        candidate = filenamePath == null ? "" : filenamePath.toString();
        candidate = candidate.replaceAll("[^A-Za-z0-9._-]", "_");
        if (candidate.isBlank() || candidate.equals(".") || candidate.equals("..")) {
            return "podcast.mp3";
        }
        return candidate;
    }

    private String fileExtension(String filename) {
        int separator = filename.lastIndexOf('.');
        if (separator < 0) return ".mp3";
        String extension = filename.substring(separator).toLowerCase();
        return switch (extension) {
            case ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm" -> extension;
            default -> ".mp3";
        };
    }

    private MediaType audioContentType(String contentType) {
        if (contentType == null) return MediaType.parseMediaType("audio/mpeg");
        try {
            MediaType parsed = MediaType.parseMediaType(contentType);
            return parsed.getType().equalsIgnoreCase("audio")
                    ? parsed
                    : MediaType.parseMediaType("audio/mpeg");
        } catch (IllegalArgumentException exception) {
            return MediaType.parseMediaType("audio/mpeg");
        }
    }
}
