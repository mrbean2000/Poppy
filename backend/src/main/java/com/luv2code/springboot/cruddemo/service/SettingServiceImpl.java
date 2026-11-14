package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.SettingsRepository;
import com.luv2code.springboot.cruddemo.dto.SettingsDto;
import com.luv2code.springboot.cruddemo.dto.SettingsLanguageDto;
import com.luv2code.springboot.cruddemo.entity.Settings;
import com.luv2code.springboot.cruddemo.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SettingServiceImpl implements SettingService {

	private final SettingsRepository settingsRepository;

	@Autowired
	public SettingServiceImpl(SettingsRepository settingsRepository) {
		this.settingsRepository = settingsRepository;
	}

	@Override
	public SettingsLanguageDto findByUserId(int userId) {
		SettingsLanguageDto settings = settingsRepository.findByUserId(userId);
		if (settings == null) {
			throw new ResourceNotFoundException("Settings not found for user id: " + userId);
		}
		return settings;
	}

	@Override
	public Settings create(SettingsDto theSettings) {
		Settings settings = new Settings();
		settings.setUser_id(theSettings.getUser_id());
		settings.setDarkmode(Boolean.TRUE.equals(theSettings.getDarkmode()));
		settings.setNativelanguageid(theSettings.getNativelanguageid() == null
				? 0 : theSettings.getNativelanguageid());
		settings.setTargetlanguageid(theSettings.getTargetlanguageid() == null
				? 0 : theSettings.getTargetlanguageid());
		settings.setDailyReadingGoal(theSettings.getDailyReadingGoal());
		settings.setDailyListeningGoal(theSettings.getDailyListeningGoal());
		settings.setDateOfBirth(theSettings.getDateOfBirth());
		settings.setPracticeRemindersEnabled(theSettings.getPracticeRemindersEnabled());
		settings.setProfilePictureUrl(theSettings.getProfilePictureUrl());
		settings.setHomeWalkthroughCompleted(Boolean.TRUE.equals(theSettings.getHomeWalkthroughCompleted()));
		return settingsRepository.save(settings);
	}

	@Override
	public Settings update(SettingsDto theSettings) {
		Settings settings = settingsRepository.findByUserIdEntity(theSettings.getUser_id());
		if (settings == null) {
			throw new ResourceNotFoundException("Settings not found for user id: " + theSettings.getUser_id());
		}
		if (theSettings.getDarkmode() != null) {
			settings.setDarkmode(theSettings.getDarkmode());
		}
		if (theSettings.getNativelanguageid() != null) {
			settings.setNativelanguageid(theSettings.getNativelanguageid());
		}
		if (theSettings.getTargetlanguageid() != null) {
			settings.setTargetlanguageid(theSettings.getTargetlanguageid());
		}
		if (theSettings.getDailyReadingGoal() != null) {
			settings.setDailyReadingGoal(theSettings.getDailyReadingGoal());
		}
		if (theSettings.getDailyListeningGoal() != null) {
			settings.setDailyListeningGoal(theSettings.getDailyListeningGoal());
		}
		if (theSettings.getDateOfBirth() != null) {
			settings.setDateOfBirth(theSettings.getDateOfBirth());
		}
		if (theSettings.getPracticeRemindersEnabled() != null) {
			settings.setPracticeRemindersEnabled(theSettings.getPracticeRemindersEnabled());
		}
		if (theSettings.hasProfilePictureUrl()) {
			settings.setProfilePictureUrl(theSettings.getProfilePictureUrl());
		}
		if (theSettings.getHomeWalkthroughCompleted() != null) {
			settings.setHomeWalkthroughCompleted(theSettings.getHomeWalkthroughCompleted());
		}
		return settingsRepository.save(settings);
	}

	@Override
	public void deleteById(int theId) {
		if (!settingsRepository.existsById(theId)) {
			throw new ResourceNotFoundException("Settings not found for id: " + theId);
		}
		settingsRepository.deleteById(theId);
	}
}
