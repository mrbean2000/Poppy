package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dao.QuoteRepository;
import com.luv2code.springboot.cruddemo.dto.QuoteDto;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {
    private final QuoteRepository quoteRepository;

    public QuoteController(QuoteRepository quoteRepository) {
        this.quoteRepository = quoteRepository;
    }

    @GetMapping("/random")
    public QuoteDto getRandomQuote() {
        return quoteRepository.findRandom()
                .map(quote -> new QuoteDto(quote.getQuote(), quote.getQuoter()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No quotes available"));
    }
}
