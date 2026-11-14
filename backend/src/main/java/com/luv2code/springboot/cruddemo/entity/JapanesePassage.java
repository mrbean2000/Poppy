package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "japanese_passage")
public class JapanesePassage {

    @Id
    private Long id;

    @Column(name = "passage", columnDefinition = "TEXT")
    private String passage;

    @Column(name = "title", columnDefinition = "TEXT")
    private String title;

    @Column(name = "image_url", length = 2048)
    private String imageUrl;

    public Long getId() {
        return id;
    }

    public String getPassage() {
        return passage;
    }

    public String getTitle() {
        return title;
    }

    public String getImageUrl() {
        return imageUrl;
    }
}
