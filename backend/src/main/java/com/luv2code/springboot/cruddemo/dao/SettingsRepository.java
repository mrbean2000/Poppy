package com.luv2code.springboot.cruddemo.dao;

import com.luv2code.springboot.cruddemo.dto.SettingsLanguageDto;
import com.luv2code.springboot.cruddemo.entity.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SettingsRepository extends JpaRepository<Settings, Integer> {
	@Query("select new com.luv2code.springboot.cruddemo.dto.SettingsLanguageDto(" +
			"settings.id, settings.user_id, settings.darkmode, " +
			"settings.nativelanguageid, settings.targetlanguageid, " +
			"settings.dailyReadingGoal, settings.dailyListeningGoal, " +
			"settings.dateOfBirth, settings.practiceRemindersEnabled, " +
			"nativeLanguage.language, targetLanguage.language, " +
			"nativeLanguage.countryFlag, targetLanguage.countryFlag) " +
			"from Settings settings " +
			"left join Language nativeLanguage on nativeLanguage.id = settings.nativelanguageid " +
			"left join Language targetLanguage on targetLanguage.id = settings.targetlanguageid " +
			"where settings.user_id = :userId")
	SettingsLanguageDto findByUserId(@Param("userId") int userId);

	@Query("select settings from Settings settings where settings.user_id = :userId")
	Settings findByUserIdEntity(@Param("userId") int userId);
}
