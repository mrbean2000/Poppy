package com.luv2code.springboot.cruddemo.dto;

public class PassageOnlyDto {
    private int id;
    private String passage;

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

    public PassageOnlyDto(int id, String passage) {
        this.id = id;
        this.passage = passage;
    }
}
