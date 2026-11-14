# Getting Started

### Recent history

Run `sql-scripts/create_recent_history.sql` on the existing PostgreSQL database.

`GET /api/recent-history/{uid}/{kind}` returns the most recently viewed items
for an existing backend user, newest first. `PUT /api/recent-history/{uid}/{kind}`
records an item and returns HTTP 204. `uid` is the account's Firebase UID,
used only to look up the PostgreSQL user. `kind` is `articles` or `podcasts`;
each list retains up to 50 distinct items, and recording an existing item moves
it to the front.

These endpoints do not authenticate or authorize requests. Anyone with access
to the API and a user's UID can read or change that user's history. Restrict
access at a trusted gateway or add server-side authentication before exposing
the API to untrusted clients.

Article bodies contain `key` (`languageId:id`), numeric `id` and `languageId`,
`language` (`Chinese` or `Japanese`), `title`, and `imageUrl`. Podcast bodies
contain `key` (the episode's audio URL), `channel`, and `episode`, whose
`episodeUrl` must match the key. Item bodies are limited to 64 KiB.
Configure the frontend's `EXPO_PUBLIC_HISTORY_API_URL` as an HTTPS Spring API
base URL ending in `/api`; HTTP is allowed only for localhost.

### Home walkthrough

Run `sql-scripts/add_home_walkthrough_to_setting.sql` before deploying the
walkthrough. Existing settings are marked completed; newly created settings
start incomplete. The `homeWalkthroughCompleted` settings property tracks
completion and skipping across devices. The app can replay the guide without
resetting the saved completion state.

### Profile picture setting

Run `sql-scripts/add_profile_picture_to_setting.sql` on existing databases before
deploying. The settings API accepts and returns the nullable `profilePictureUrl`
field. Include it in `PUT /api/setting` to change it, send `null` to clear it,
or omit it to leave it unchanged. The field does not upload or host an image.
The app also stores bundled mascot choices using stable
`poppy-mascot://` URIs, which the app resolves to its packaged images.

### Vocabulary progress

Vocabulary list, lookup, status, and favorite endpoints under
`/api/users/{userId}/vocabulary` accept an optional `language` query parameter
(`Chinese` or `Japanese`). If omitted, the user's current target language is
used. Each language has its own progress table. Japanese readings are returned
in the existing `pinyin` field for compatibility, with Japanese meanings in
`definitions`.

Before deploying, run `sql-scripts/create_language_user_word_progress_tables.sql`
and then `sql-scripts/migrate_chinese_word_progress.sql`. The migration treats
legacy progress as Chinese and does not overwrite existing Chinese entries.
Stop older backend instances during migration and deployment so they cannot
continue writing to the legacy table. The legacy table is retained.

### Story likes

`GET /api/story-like/user/{userId}/passage/{passageId}?language=Japanese`
and `PUT /api/story-like?language=Japanese` use `story_like_japanese`; use
`language=Chinese` for `story_like_chinese`. The PUT body contains `userId`,
`postId`, and boolean `like`. Omitting `language` defaults to Chinese for
existing clients; unsupported languages return HTTP 400. Run
`sql-scripts/create_language_story_like_tables.sql` followed by
`sql-scripts/migrate_chinese_story_likes.sql` before deploying this change.
The migration preserves existing Chinese likes without overwriting newer ones.
Stop older application instances during migration and deployment to avoid
writes to the legacy `story_like` table after copying.

### Japanese passage segmentation

`GET /api/japanese-passage/{passageId}/segmented-with-furigana` returns an
ordered array of `{ "word": "...", "furigana": "..." }` objects for a
Japanese passage. Concatenating the `word` values reconstructs the original
text, including whitespace. Furigana is the complete token reading in
hiragana for known words containing kanji; it is `null` for other tokens or
when no reading is available. Unknown passage IDs return HTTP 404. This
endpoint accepts an optional `userId` and includes `statusLevel` from Japanese
vocabulary progress, or null when no progress exists.

### Japanese-English dictionary

`GET /api/japaneseDictionary?word=食べる` returns all dictionary entries that
exactly match a spelling or reading. If there is no exact match, it tries the
Kuromoji dictionary form of a single known token; standalone analysis may be
ambiguous and cannot reliably resolve multi-token conjugations. Results are
ordered as they appear in the dictionary.

The JSON response has `requestedWord`, `matchedWord`, and `entries`. Each entry
contains `id`, `writtenForms`, `readings`, `definitions`, and `senses`.
The original `definitions` retain EDICT2's part-of-speech and usage annotations;
each structured sense contains `category` (a label or null) and a `meanings`
array. Unrecognized annotations remain in the meanings. A blank word returns HTTP 400; an
unknown word returns HTTP 404. The `edict2` file must be present in the backend's
classpath and is decoded as EUC-JP.

This service uses EDICT2 by the
[Electronic Dictionary Research and Development Group](https://www.edrdg.org/jmdict/j_jmdict.html),
under [CC BY-SA 4.0 and EDRDG's licence conditions](https://www.edrdg.org/edrdg/licence.html).
Before exposing this dictionary in the app, provide the required visible
attribution and links on an accessible About/Sources screen. Keep the dictionary
updated regularly; EDRDG's guidance gives at least monthly updates for dictionary
servers. Deployments must establish and operate that update procedure.

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/docs/3.0.3/maven-plugin/reference/html/)
* [Create an OCI image](https://docs.spring.io/spring-boot/docs/3.0.3/maven-plugin/reference/html/#build-image)
* [Spring Web](https://docs.spring.io/spring-boot/docs/3.0.3/reference/htmlsingle/#web)
* [Spring Data JPA](https://docs.spring.io/spring-boot/docs/3.0.3/reference/htmlsingle/#data.sql.jpa-and-spring-data)
* [Spring Boot DevTools](https://docs.spring.io/spring-boot/docs/3.0.3/reference/htmlsingle/#using.devtools)

### Guides
The following guides illustrate how to use some features concretely:

* [Building a RESTful Web Service](https://spring.io/guides/gs/rest-service/)
* [Serving Web Content with Spring MVC](https://spring.io/guides/gs/serving-web-content/)
* [Building REST services with Spring](https://spring.io/guides/tutorials/rest/)
* [Accessing Data with JPA](https://spring.io/guides/gs/accessing-data-jpa/)
* [Accessing data with MySQL](https://spring.io/guides/gs/accessing-data-mysql/)
