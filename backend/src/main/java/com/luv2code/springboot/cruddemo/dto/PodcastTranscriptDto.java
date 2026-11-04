package com.luv2code.springboot.cruddemo.dto;

import java.util.List;

public record PodcastTranscriptDto(
        List<PodcastTranscriptCue> cues,
        boolean isTimed) {
}
