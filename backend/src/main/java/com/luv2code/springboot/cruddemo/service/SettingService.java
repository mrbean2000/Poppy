package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.SettingsDto;
import com.luv2code.springboot.cruddemo.dto.SettingsLanguageDto;
import com.luv2code.springboot.cruddemo.entity.Settings;

public interface SettingService {
    SettingsLanguageDto findByUserId(int userId);
    Settings create(SettingsDto theSettings);

    Settings update(SettingsDto theSettings);

    void deleteById(int theId);
}
