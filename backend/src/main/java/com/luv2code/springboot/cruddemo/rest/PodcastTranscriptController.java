package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.PodcastTranscriptDto;
import com.luv2code.springboot.cruddemo.service.PodcastTranscriptionService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/podcasts")
public class PodcastTranscriptController {
    private final PodcastTranscriptionService transcriptionService;

    public PodcastTranscriptController(PodcastTranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @PostMapping(
            value = "/transcript",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PodcastTranscriptDto transcribe(
            @RequestParam String episodeId,
            @RequestPart("audio") MultipartFile audio) {
        return transcriptionService.transcribe(episodeId, audio);
    }
}
