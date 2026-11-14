package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.service.RecentHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recent-history")
public class RecentHistoryController {
    private final RecentHistoryService history;

    public RecentHistoryController(RecentHistoryService history) {
        this.history = history;
    }

    @GetMapping("/{uid}/{kind}")
    public List<Object> list(@PathVariable String uid, @PathVariable String kind) {
        return history.list(uid, kind);
    }

    @PutMapping("/{uid}/{kind}")
    public ResponseEntity<Void> record(@PathVariable String uid, @PathVariable String kind,
                                     @RequestBody Map<String, Object> item) {
        history.record(uid, kind, item);
        return ResponseEntity.noContent().build();
    }
}
