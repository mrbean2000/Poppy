package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "quotes")
public class Quote {
    @Id
    @Column(name = "user_id")
    private Integer id;

    @Column(nullable = false)
    private String quoter;

    @Column(nullable = false)
    private String quote;

    protected Quote() {}

    public String getQuoter() {
        return quoter;
    }

    public String getQuote() {
        return quote;
    }
}
