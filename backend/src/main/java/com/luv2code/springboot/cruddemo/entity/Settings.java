package com.luv2code.springboot.cruddemo.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name="setting")
public class Settings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private int id;

    @Column(name="user_id")
    private int user_id;

    @Column(name ="darkmode", nullable = false)
    private boolean darkmode;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name="nativelanguageid", nullable = false)
    private int nativelanguageid;

    @Column(name="targetlanguageid", nullable = false)
    private int targetlanguageid;

    @Column(name = "daily_reading_goal")
    private Integer dailyReadingGoal;

    @Column(name = "daily_listening_goal")
    private Integer dailyListeningGoal;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "practice_reminders_enabled")
    private Boolean practiceRemindersEnabled;

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
