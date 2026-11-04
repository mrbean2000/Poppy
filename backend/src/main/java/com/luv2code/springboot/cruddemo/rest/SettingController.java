package com.luv2code.springboot.cruddemo.rest;

import com.luv2code.springboot.cruddemo.dto.SettingsDto;
import com.luv2code.springboot.cruddemo.dto.SettingsLanguageDto;
import com.luv2code.springboot.cruddemo.entity.Settings;
import com.luv2code.springboot.cruddemo.service.SettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SettingController {

    private final SettingService settingService;

    @Autowired
    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    @GetMapping("/setting/user/{userId}")
    public ResponseEntity<SettingsLanguageDto> findByUserId(@PathVariable int userId) {
        return ResponseEntity.ok(settingService.findByUserId(userId));
    }

    @PostMapping("/setting")
    public ResponseEntity<Settings> create(@RequestBody SettingsDto settingsDto) {
        return new ResponseEntity<>(settingService.create(settingsDto), HttpStatus.CREATED);
    }

    @PutMapping("/setting")
    public ResponseEntity<Settings> update(@RequestBody SettingsDto settingsDto) {
        return ResponseEntity.ok(settingService.update(settingsDto));
    }

    @DeleteMapping("/setting/{settingId}")
    public ResponseEntity<Void> deleteById(@PathVariable int settingId) {
        settingService.deleteById(settingId);
        return ResponseEntity.noContent().build();
    }
}