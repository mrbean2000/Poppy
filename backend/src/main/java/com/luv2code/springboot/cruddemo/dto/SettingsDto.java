package com.luv2code.springboot.cruddemo.dto;

import java.time.LocalDate;

public class SettingsDto {
    private int user_id;

    private Boolean darkmode;

    private Integer nativelanguageid;

    private Integer targetlanguageid;
    private Integer dailyReadingGoal;
    private Integer dailyListeningGoal;
    private LocalDate dateOfBirth;
    private Boolean practiceRemindersEnabled;

    public int getUser_id() {
        return user_id;
    }

    public void setUser_id(int user_id) {
        this.user_id = user_id;
    }

    public Boolean getDarkmode() {
        return darkmode;
    }

    public void setDarkmode(Boolean darkmode) {
        this.darkmode = darkmode;
    }

    public Integer getNativelanguageid() {
        return nativelanguageid;
    }

    public void setNativelanguageid(Integer nativelanguageid) {
        this.nativelanguageid = nativelanguageid;
    }

    public Integer getTargetlanguageid() {
        return targetlanguageid;
    }

    public void setTargetlanguageid(Integer targetlanguageid) {
        this.targetlanguageid = targetlanguageid;
    }

    public Integer getDailyReadingGoal() {
        return dailyReadingGoal;
    }

    public void setDailyReadingGoal(Integer dailyReadingGoal) {
        this.dailyReadingGoal = dailyReadingGoal;
    }

    public Integer getDailyListeningGoal() {
        return dailyListeningGoal;
    }

    public void setDailyListeningGoal(Integer dailyListeningGoal) {
        this.dailyListeningGoal = dailyListeningGoal;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Boolean getPracticeRemindersEnabled() {
        return practiceRemindersEnabled;
    }

    public void setPracticeRemindersEnabled(Boolean practiceRemindersEnabled) {
        this.practiceRemindersEnabled = practiceRemindersEnabled;
    }
}
