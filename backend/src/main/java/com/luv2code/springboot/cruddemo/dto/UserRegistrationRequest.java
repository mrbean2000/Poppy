package com.luv2code.springboot.cruddemo.dto;

import java.time.LocalDate;

public record UserRegistrationRequest(
        String firebaseUid,
        String email,
        String firstName,
        String lastName,
        LocalDate dateOfBirth
) {
}
