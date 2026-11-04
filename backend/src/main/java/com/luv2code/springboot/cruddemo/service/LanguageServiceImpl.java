package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dao.LanguageRepository;
import com.luv2code.springboot.cruddemo.entity.Language;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LanguageServiceImpl implements LanguageService {

    private final LanguageRepository languageRepository;

    public LanguageServiceImpl(LanguageRepository languageRepository) {
        this.languageRepository = languageRepository;
    }

    @Override
    public List<Language> findAll() {
        return languageRepository.findAll();
    }
}