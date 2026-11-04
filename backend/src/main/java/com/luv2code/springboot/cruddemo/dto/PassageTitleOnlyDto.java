package com.luv2code.springboot.cruddemo.dto;

public class PassageTitleOnlyDto {
    private int id;
    private String title;
    private String imageUrl;

    // Required: All-args constructor matching the SELECT clause
    public PassageTitleOnlyDto(int id, String title, String imageUrl) {
        this.id = id;
        this.title = title;
        this.imageUrl = imageUrl;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}