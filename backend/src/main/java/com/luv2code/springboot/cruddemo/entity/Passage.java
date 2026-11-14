package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.*;

@Entity
@Table(name="chinese_passage")
public class Passage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private int id;

    @Column(name="passage", columnDefinition="TEXT")
    private String passage;

    @Column(name="title")
    private String title;

    @Column(name="image_url")
    private String imageUrl;

    @Column(name="source_url")
    private String sourceUrl;

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getPassage() {
        return passage;
    }

    public void setPassage(String passage) {
        this.passage = passage;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Passage(int id, String passage, String title, String imageUrl) {
        this.id = id;
        this.passage = passage;
        this.title = title;
        this.imageUrl = imageUrl;
    }

    public Passage() {
    }
}
