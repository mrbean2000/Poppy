package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dao.UserRepository;
import com.luv2code.springboot.cruddemo.dto.UserRegistrationRequest;
import com.luv2code.springboot.cruddemo.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/firebase/{firebaseUid}")
    public ResponseEntity<User> findByFirebaseUid(@PathVariable String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No user profile exists for this Firebase account."
                ));
    }

    @PostMapping
    public ResponseEntity<User> create(@RequestBody UserRegistrationRequest request) {
        validate(request);

        if (userRepository.findByFirebaseUid(request.firebaseUid()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A user profile already exists for this Firebase account."
            );
        }

        User user = new User();
        user.setFirebaseUid(request.firebaseUid().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setDateOfBirth(request.dateOfBirth());

        return new ResponseEntity<>(userRepository.save(user), HttpStatus.CREATED);
    }

    private void validate(UserRegistrationRequest request) {
        if (request == null
                || isBlank(request.firebaseUid())
                || isBlank(request.email())
                || isBlank(request.firstName())
                || isBlank(request.lastName())
                || request.dateOfBirth() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "firebaseUid, email, firstName, lastName, and dateOfBirth are required."
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
