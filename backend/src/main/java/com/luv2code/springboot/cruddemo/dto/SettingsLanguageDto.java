package com.luv2code.springboot.cruddemo.dto;

import java.time.LocalDate;

public class SettingsLanguageDto {
    private int id;
    private int user_id;
    private boolean darkmode;
    private int nativelanguageid;
    private int targetlanguageid;
    private String nativelanguage;
    private String targetlanguage;
    private String nativeLanguageFlag;
    private String targetLanguageFlag;
    private Integer dailyReadingGoal;
    private Integer dailyListeningGoal;
    private LocalDate dateOfBirth;
    private Boolean practiceRemindersEnabled;
    private String profilePictureUrl;
    private boolean homeWalkthroughCompleted;

    public SettingsLanguageDto(int id, int user_id, boolean darkmode,
                               int nativelanguageid, int targetlanguageid,
                               Integer dailyReadingGoal, Integer dailyListeningGoal,
                               LocalDate dateOfBirth, Boolean practiceRemindersEnabled,
                               String profilePictureUrl,
                               boolean homeWalkthroughCompleted,
                               String nativelanguage, String targetlanguage,
                               String nativeLanguageFlag, String targetLanguageFlag) {
        this.id = id;
        this.user_id = user_id;
        this.darkmode = darkmode;
        this.nativelanguageid = nativelanguageid;
        this.targetlanguageid = targetlanguageid;
        this.dailyReadingGoal = dailyReadingGoal;
        this.dailyListeningGoal = dailyListeningGoal;
        this.dateOfBirth = dateOfBirth;
        this.practiceRemindersEnabled = practiceRemindersEnabled;
        this.profilePictureUrl = profilePictureUrl;
        this.homeWalkthroughCompleted = homeWalkthroughCompleted;
        this.nativelanguage = nativelanguage;
        this.targetlanguage = targetlanguage;
        this.nativeLanguageFlag = nativeLanguageFlag;
        this.targetLanguageFlag = targetLanguageFlag;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getUser_id() {
        return user_id;
    }

    public void setUser_id(int user_id) {
        this.user_id = user_id;
    }

    public boolean isDarkmode() {
        return darkmode;
    }

    public void setDarkmode(boolean darkmode) {
        this.darkmode = darkmode;
    }

    public int getNativelanguageid() {
        return nativelanguageid;
    }

    public void setNativelanguageid(int nativelanguageid) {
        this.nativelanguageid = nativelanguageid;
    }

    public int getTargetlanguageid() {
        return targetlanguageid;
    }

    public void setTargetlanguageid(int targetlanguageid) {
        this.targetlanguageid = targetlanguageid;
    }

    public String getNativelanguage() {
        return nativelanguage;
    }

    public void setNativelanguage(String nativelanguage) {
        this.nativelanguage = nativelanguage;
    }

    public String getTargetlanguage() {
        return targetlanguage;
    }

    public void setTargetlanguage(String targetlanguage) {
        this.targetlanguage = targetlanguage;
    }

    public String getNativeLanguageFlag() {
        return nativeLanguageFlag;
    }

    public void setNativeLanguageFlag(String nativeLanguageFlag) {
        this.nativeLanguageFlag = nativeLanguageFlag;
    }

    public String getTargetLanguageFlag() {
        return targetLanguageFlag;
    }

    public void setTargetLanguageFlag(String targetLanguageFlag) {
        this.targetLanguageFlag = targetLanguageFlag;
    }

    public Integer getDailyReadingGoal() {
        return dailyReadingGoal;
    }

    public Integer getDailyListeningGoal() {
        return dailyListeningGoal;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public Boolean getPracticeRemindersEnabled() {
        return practiceRemindersEnabled;
    }

    public String getProfilePictureUrl() {
        return profilePictureUrl;
    }

    public boolean isHomeWalkthroughCompleted() {
        return homeWalkthroughCompleted;
    }
}
