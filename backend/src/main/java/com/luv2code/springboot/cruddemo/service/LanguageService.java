package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.entity.Language;

import java.util.List;

public interface LanguageService {
    List<Language> findAll();
}