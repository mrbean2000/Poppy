package com.luv2code.springboot.cruddemo.dto;

public class PassageOnlyDto {
    private long id;
    private String passage;

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getPassage() {
        return passage;
    }

    public void setPassage(String passage) {
        this.passage = passage;
    }

    public PassageOnlyDto(long id, String passage) {
        this.id = id;
        this.passage = passage;
    }
}
