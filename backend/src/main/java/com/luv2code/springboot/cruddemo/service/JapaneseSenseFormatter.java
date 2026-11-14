package com.luv2code.springboot.cruddemo.service;

import com.luv2code.springboot.cruddemo.dto.JapaneseDictionarySenseDto;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class JapaneseSenseFormatter {
    private static final Pattern LEADING_TAG = Pattern.compile("^\\(([^()]*)\\)\\s*");
    private static final Pattern SENSE_NUMBER = Pattern.compile("^\\((\\d+)\\)\\s*");
    private static final Pattern VERB = Pattern.compile("^v(?:1|2|4|5|k|n|r|s|z)[a-z-]*$");
    private static final Map<String, String> LABELS = Map.ofEntries(
            Map.entry("n", "Noun"), Map.entry("n-adv", "Adverbial noun"),
            Map.entry("n-pref", "Noun prefix"), Map.entry("n-suf", "Noun suffix"),
            Map.entry("n-t", "Temporal noun"), Map.entry("n-pr", "Proper noun"),
            Map.entry("adj-i", "I-adjective"), Map.entry("adj-na", "Na-adjective"),
            Map.entry("adj-no", "Noun used as an adjective"),
            Map.entry("adj-f", "Prenominal adjective"), Map.entry("adj-t", "Taru adjective"),
            Map.entry("adv", "Adverb"), Map.entry("adv-to", "Adverb"),
            Map.entry("exp", "Expression"), Map.entry("int", "Interjection"),
            Map.entry("pn", "Pronoun"), Map.entry("prt", "Particle"),
            Map.entry("pref", "Prefix"), Map.entry("suf", "Suffix"),
            Map.entry("conj", "Conjunction"), Map.entry("ctr", "Counter"),
            Map.entry("aux", "Auxiliary"), Map.entry("aux-v", "Auxiliary verb"),
            Map.entry("aux-adj", "Auxiliary adjective"),
            Map.entry("vt", "Transitive verb"), Map.entry("vi", "Intransitive verb"));

    private JapaneseSenseFormatter() {
    }

    static List<JapaneseDictionarySenseDto> format(List<String> definitions) {
        List<JapaneseDictionarySenseDto> senses = new ArrayList<>();
        List<String> meanings = new ArrayList<>();
        String category = null;
        String currentCategory = null;
        for (String definition : definitions) {
            String text = definition.trim();
            Matcher tag = LEADING_TAG.matcher(text);
            if (tag.find()) {
                Set<String> labels = new LinkedHashSet<>();
                boolean recognized = true;
                for (String code : tag.group(1).split(",")) {
                    String label = LABELS.get(code);
                    if (label == null && VERB.matcher(code).matches()) {
                        label = "Verb";
                    }
                    if (label == null) {
                        recognized = false;
                        break;
                    }
                    labels.add(label);
                }
                if (recognized) {
                    category = String.join(", ", labels);
                    text = text.substring(tag.end());
                }
            }
            Matcher number = SENSE_NUMBER.matcher(text);
            boolean newSense = number.find();
            if (newSense) {
                text = text.substring(number.end());
            }
            if (!meanings.isEmpty()
                    && (newSense || (category != null && !category.equals(currentCategory)))) {
                senses.add(new JapaneseDictionarySenseDto(currentCategory, List.copyOf(meanings)));
                meanings.clear();
            }
            if (meanings.isEmpty()) {
                currentCategory = category;
            }
            if (!text.isEmpty()) {
                meanings.add(text);
            }
        }
        if (!meanings.isEmpty()) {
            senses.add(new JapaneseDictionarySenseDto(currentCategory, List.copyOf(meanings)));
        }
        return List.copyOf(senses);
    }
}
