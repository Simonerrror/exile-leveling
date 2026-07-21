# Исследование базы знаний для PoE Tools

Дата проверки: **2026-07-21**
Статус: исследовательский отчёт, **ничего из перечисленного не одобрено для автоматического импорта или production-публикации**.
Охват: Path of Exile 1, Path of Exile 2, англо- и русскоязычные community-ресурсы, Reddit, официальный форум, GitHub, публичные таблицы и сайты игроков.

## Executive summary

На дату исследования актуальная лига **PoE 1 — Mirage, версия 3.28**, запущенная 6 марта 2026 года. Это подтверждается [официальными patch notes 3.28](https://www.pathofexile.com/forum/view-thread/3913392) и [официальным сообщением о запуске Mirage](https://www.pathofexile.com/forum/view-thread/3914487). Актуальная лига **PoE 2 — Runes of Aldur, версия 0.5 / Return of the Ancients**, запущенная 29 мая 2026 года; первичный источник — [официальные patch notes 0.5.0](https://www.pathofexile.com/forum/view-thread/3932540). Это важный baseline: материал без явной совместимости с 3.28 или 0.5 нельзя помечать как «актуальный» только потому, что он доступен в интернете.

Лучший путь для PoE Tools — не превращаться в ещё один каталог случайных ссылок и не копировать чужие spreadsheets целиком. Нужен **версионируемый слой знаний** с короткими нативными карточками, прямой ссылкой на первоисточник, датой последней проверки и ясным разделением:

- проверенная механика;
- авторская стратегия/мнение;
- динамическая экономика;
- архивный или потенциально устаревший материал.

Самые сильные кандидаты на первый этап:

1. [PoE 3.28 Cheat Sheets / QOL Info](https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU/edit?usp=sharing) — богатая многолетняя таблица FixFaxer, уже обновлявшаяся под Mirage.
2. [Betrayal 3.28 custom cheatsheet](https://pathofexile.elrincondelexiliado.com/syndicate) — хороший пример интерактивной адаптации неудобной таблицы.
3. [PoE 3.28 Endgame Content Roadmap](https://www.reddit.com/r/pathofexile/comments/1rkwb67/328_updated_poe_endgame_content_roadmap_for_new/) — качественная визуальная карта прогрессии с прямым разрешением автора на использование.
4. [Wealthy Exile — public strategies](https://wealthyexile.com/strategies/public) — живой каталог пользовательских farm runs с затратами, результатами и изменением цены.
5. [PoE Cook](https://github.com/rbiersbach/poe-cook) — интересная open-source модель «recipe = inputs + outputs + live prices», хотя продукт пока developer alpha.
6. [PoE2 SSF Guide](https://www.poe2wiki.net/wiki/Solo_Self_Found_Guide) — активно поддерживаемая карта target-farm источников для 0.5.
7. [Orboro Atlas Farming Strategies](https://orboro.net/pages/atlas-farming-strategies) — очень свежий пример превращения таблицы BawLoch в кликабельные краткие карточки; требует проверки разрешения автора данных.
8. [Ignatius — PoE2 0.5 farming strategies](https://mobalytics.gg/poe-2/profile/ignatius/builds/endgame-farming-strategies-w-trade-links-ignatius) — компактные варианты Atlas + trade links, но часть ссылок уже указывает на предыдущую лигу, что отлично показывает необходимость автоматической проверки свежести.

Ключевой продуктовый вывод: фарм-стратегия должна храниться не как статья, а как структурированный объект: **игра → патч/лига → стадия прогресса → бюджет → требования к билду → входы → шаги → выходы → способ ликвидации → источник → дата проверки**. Цена и прибыль не должны быть частью «вечного текста»: они должны подставляться динамически и всегда показывать лигу, дату и источник.

## Baseline актуальности

| Игра | Актуальная лига на 2026-07-21 | Версия | Первичный источник | Уверенность |
|---|---|---:|---|---|
| PoE 1 | Mirage | 3.28 | [GGG: Content Update 3.28.0](https://www.pathofexile.com/forum/view-thread/3913392), [GGG: запуск 6 марта](https://www.pathofexile.com/forum/view-thread/3914487) | Высокая |
| PoE 2 | Runes of Aldur / Return of the Ancients | 0.5 | [GGG: Content Update 0.5.0](https://www.pathofexile.com/forum/view-thread/3932540), [poe2wiki: version 0.5.0](https://www.poe2wiki.net/wiki/Version_0.5.0) | Высокая |

### Что считать свежим

- **Current:** материал явно маркирован 3.28/Mirage или 0.5/Runes of Aldur и проверен после последних значимых hotfixes.
- **Evergreen:** механика подтверждена wiki/официальными данными и не менялась в текущем патче.
- **Needs review:** материал создан до текущей лиги, либо автор не указал версию, либо динамические trade links/цены ведут в старую лигу.
- **Archive:** исторически полезно, но не должно попадать в результаты по умолчанию.

## Shortlist: лучшие материалы

### 1. FixFaxer — PoE 3.28 Cheat Sheets / QOL Info

- Ссылки: [Google Sheet](https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU/edit?usp=sharing), [Reddit 3.28 update](https://www.reddit.com/r/pathofexile/comments/1riwxho/poe_328_cheat_sheets_qol_info_help_me_help_you/), [официальный forum thread](https://www.pathofexile.com/forum/view-thread/2451569).
- Игра/лига: PoE 1, Mirage 3.28.
- Формат: многовкладочная Google Sheet — leveling, Atlas, Expedition, Heist, Betrayal, Settlers и другие разделы.
- Почему полезно: наиболее близкий к будущей базе знаний «сырой массив»; поддерживается одним автором много лет и получает обратную связь Reddit.
- Риски: автор прямо пишет, что часть рейтингов субъективна; Google Sheets плохо работает на мобильных; в обсуждении отмечена проблема color blindness; отдельные строки могут отставать от hotfixes.
- Интеграция: **C — импорт/адаптация только после явного разрешения**, до этого **A — ссылка**. При адаптации хранить provenance на уровне каждой карточки/таблицы, не только страницы целиком.

### 2. Ayeleth — Betrayal 3.28 custom cheatsheet

- Ссылки: [интерактивный customizer](https://pathofexile.elrincondelexiliado.com/syndicate), [пост и changelog для 3.28](https://www.reddit.com/r/pathofexile/comments/1rjw0b1/328_ready_updated_betrayal_cheatsheet_customizer/), [PNG-версия Mirage](https://pathofexile.elrincondelexiliado.com/books/liga-mirage/page/chuleta-del-sindicato-betrayal-328).
- Игра/лига: PoE 1, Mirage 3.28.
- Автор/свежесть: Ayeleth, 3 марта 2026; явно перечислены изменения 3.28.
- Формат: интерактивная матрица наград с настройкой, скрытием NPC, светлой/тёмной темой.
- Почему полезно: лучший изученный образец того, как статичную cheat sheet превратить в персонализируемый инструмент.
- Риски: оценки наград — личное мнение автора; Ruthless не поддерживается; экономика быстро меняет «лучшие» ячейки.
- Интеграция: **A сейчас; C после разрешения**. Нативно можно повторить паттерн настройки, но не копировать текст/графику без согласования.

### 3. Stii_V — Endgame Content Roadmap 3.28

- Ссылка: [Reddit + Imgur](https://www.reddit.com/r/pathofexile/comments/1rkwb67/328_updated_poe_endgame_content_roadmap_for_new/).
- Игра/лига: PoE 1, Mirage 3.28.
- Автор/свежесть: Stii_V и community, 4 марта 2026.
- Формат: большая визуальная карта endgame-прогрессии.
- Почему полезно: отвечает на главный вопрос новичка «я дошёл до карт — что дальше?»; материал набрал сильную community-поддержку.
- Доверие/право: автор прямо разрешает свободное использование, но предупреждает, что документ показывает структуру, а не объясняет все механики.
- Интеграция: **B — нативная кликабельная roadmap**, с указанием автора и ссылкой на оригинал. Это один из немногих кандидатов, где разрешение на reuse уже выражено публично.

### 4. Wealthy Exile — public farming strategies

- Ссылка: [каталог стратегий](https://wealthyexile.com/strategies/public).
- Игра/лига: PoE 1; на странице видны Mirage/3.28 стратегии.
- Формат: пользовательские runs с input/output, стоимостью, доходом, тегами механик и динамикой цен.
- Почему полезно: показывает правильный production-паттерн для farm knowledge — не обещание «X div/hour», а конкретный наблюдаемый прогон и его контекст.
- Риски: user-generated data; маленькая выборка у многих стратегий; результат зависит от скорости, фильтра, билда и ликвидности; возможны ошибки/манипуляции.
- Интеграция: **A**, позднее — **B** для агрегированной карточки со ссылкой. Автоматический импорт только при наличии разрешённого API/лицензии.

### 5. PoE Cook — live strategy profit tracker

- Ссылки: [GitHub](https://github.com/rbiersbach/poe-cook), [объявление на Reddit](https://www.reddit.com/r/pathofexile/comments/1rn5efh/poe_cook_your_strategy_profit_live_tracking_tool/).
- Игра/лига: PoE 1, показан в контексте 3.28.
- Формат: локальное open-source приложение; «recipes» с inputs, outputs, poe.ninja и trade URLs.
- Почему полезно: сильная модель данных для будущего «планировщика фарма» PoE Tools.
- Риски: developer alpha, Docker, нет hosted version, ещё нет готовой библиотеки recipes; нужно отдельно проверить лицензию репозитория перед заимствованием кода/схем.
- Интеграция: **A** и изучение модели; **C** только после license review.

### 6. PoE 3.28 Mirage modifiers infographic

- Ссылка: [Reddit-пост с обновлённой инфографикой](https://www.reddit.com/r/pathofexile/comments/1rozqwl/information_mirage_cheatsheet_infographic/).
- Игра/лига: PoE 1, Mirage 3.28.
- Формат: компактная визуальная памятка по wishes/modifiers.
- Почему полезно: хороший кандидат на нативную «что выбрать прямо сейчас» карточку.
- Риски: начальная версия сделана через AI research и исправлялась комментариями; это вторичный материал, требующий покомпонентной сверки с игрой/wiki.
- Интеграция: **B только после независимой верификации**, иначе **A**.

### 7. PoE2 Wiki — Solo Self Found Guide

- Ссылки: [гайд](https://www.poe2wiki.net/wiki/Solo_Self_Found_Guide), [обсуждение обновления под 0.5](https://www.reddit.com/r/PathOfExile2/comments/1uarvkl/want_to_learn_where_to_farm_specific_items/).
- Игра/лига: PoE 2, Runes of Aldur 0.5; в обсуждении есть правки под 0.5.3.
- Формат: community wiki с target-farm источниками.
- Почему полезно: сильная основа для запроса «где добыть X» и SSF-фильтра; легко разбить на карточки по механикам и предметам.
- Риски: редактируется сообществом; отдельные советы могут быть неполными; лицензию wiki нужно проверить перед массовым импортом текста.
- Интеграция: **A**, затем **C** при совместимой лицензии и обязательной атрибуции.

### 8. Orboro — PoE2 Atlas Farming Strategies

- Ссылки: [каталог карточек](https://orboro.net/pages/atlas-farming-strategies), [Reddit-пост с происхождением данных](https://www.reddit.com/r/PathOfExile2/comments/1v2ozrz/any_comprehensive_guides/).
- Игра/лига: PoE 2, 0.5; опубликовано 21 июля 2026.
- Автор/источник: Orboro — presentation layer; исходные данные приписаны BawLoch.
- Формат: кликабельные TL;DR-карточки farm strategies, переработанные из spreadsheet.
- Почему полезно: практически точное подтверждение продуктовой гипотезы пользователя — таблица становится удобнее после разбиения на компактные карточки.
- Риски: двойное авторство данных и представления; до импорта нужно разрешение BawLoch и Orboro; очень свежий проект без истории поддержки.
- Интеграция: **A сейчас; C после письменного разрешения**.

### 9. BawLoch / poe2farm — PoE2 0.5 farming catalog

- Ссылка: [каталог](https://www.poe2farm.com/), пример [200% Doryani Delirium](https://www.poe2farm.com/strategy/200-doryani-deli-farming/).
- Игра/лига: PoE 2, 0.5; страницы отмечены датами июня 2026.
- Формат: tier list + отдельные страницы с difficulty, investment, Atlas, waystones, tablets и trade links.
- Почему полезно: структура страниц почти готова к модели данных PoE Tools; авторство стратегий указано как BawLoch.
- Риски: tier list субъективен; нет видимой методологии выборки на landing page; доходность не гарантирована; нужно проверить, кто владелец сайта и права на данные.
- Интеграция: **A**, потенциально **C** после разрешения.

### 10. Ignatius — Endgame Farming Strategies with Trade Links

- Ссылка: [Mobalytics guide](https://mobalytics.gg/poe-2/profile/ignatius/builds/endgame-farming-strategies-w-trade-links-ignatius).
- Игра/лига: помечено «0.5 RotA», обновлено 17 июня 2026.
- Формат: варианты Atlas, требования к tablets/waystones и готовые trade links.
- Почему полезно: хороший уровень детализации и известный автор; полезный паттерн «вариант стратегии».
- Риски: найденный trade link всё ещё содержит league slug `Fate of the Vaal`, поэтому автоматическая проверка ссылок и league provenance обязательна даже у визуально свежих гайдов.
- Интеграция: **A**; не переносить trade links без перепостроения под текущую лигу.

### 11. PoE 3.28 Q&A: fun and profitable strategies

- Ссылка: [обсуждение на r/PathOfExileBuilds](https://www.reddit.com/r/PathOfExileBuilds/comments/1rwn2b6/what_are_some_fun_and_profitable_atlas_strategies/).
- Игра/лига: PoE 1, Mirage, 17 марта 2026.
- Формат: crowd-sourced thread с конкретными scarab setups и описанием плюсов/минусов механик.
- Почему полезно: даёт качественные признаки, которых нет в таблицах: скучность, количество кликов, сложность ликвидации, требования к single-target/AoE.
- Риски: анекдотические результаты, быстро меняющаяся экономика, нет единой методологии.
- Интеграция: **A** и использовать как research input; не публиковать цифры как факт.

### 12. PoE2 0.5 farming discussions и Aldur Saga case study

- Ссылки: [budget/mid-budget strategies](https://www.reddit.com/r/PathOfExile2/comments/1uwks8l/farming_strats/), [Aldur Saga result после 0.5.4c](https://www.reddit.com/r/PathOfExile2/comments/1uz9b4w/aldur_saga_result_after_054c_showcase/).
- Игра/лига: PoE 2 0.5.4c, июль 2026.
- Формат: обсуждение и один подробно описанный дорогой run.
- Почему полезно: свежие входы/риски/результаты и редкий пример, где автор явно вычитает инвестицию.
- Риски: sample size 1, высокий variance, баги/краши, результаты конкретного персонажа.
- Интеграция: **A**; использовать как кейс, не как tier list.

### 13. PoE Ninja и PoE Wiki / PoEDB как data layer

- Ссылки: [poe.ninja](https://poe.ninja/), [PoE Wiki](https://www.poewiki.net/), [PoE2 Wiki](https://www.poe2wiki.net/), [PoEDB](https://poedb.tw/).
- Игра/лига: PoE 1 и PoE 2; обновляются постоянно.
- Формат: экономика, builds, официальные/извлечённые game data, механики.
- Почему полезно: источники для верификации названий, иконок, acquisition, patch history и цен.
- Риски: цены — наблюдаемая оценка, не обещание сделки; у GGG ограниченные официальные PoE2 API; права на иконки и extracted data не равны открытой лицензии приложения.
- Интеграция: **B/C только через разрешённые API и лицензии**, со временем обновления и league label у каждого значения.

### 14. Poe.re и PoE Tools directories

- Ссылки: [poe.re](https://poe.re/), [PoE Tools directory](https://www.poetools.net/), [Cheatsheet.Monster](https://cheatsheet.monster/poe/), [PoEHow addons](https://poe.how/addons).
- Игра/лига: преимущественно PoE 1; часть каталогов включает PoE 2.
- Формат: regex generator и каталоги community-tools/cheatsheets.
- Почему полезно: discovery и benchmark полноты внешних ресурсов.
- Риски: каталоги содержат устаревшие/неработающие ссылки; Cheatsheet.Monster всё ещё показывает разделы 3.25 и старые материалы; это не trusted source само по себе.
- Интеграция: **A выборочно**, только после health/freshness check каждой конечной ссылки.

### 15. Русскоязычные кандидаты

- Ссылки: [Lootkeeper — билды 3.28 с RU/EN и trade links](https://guides.lootkeeper.com/poe/builds), [esports.ru — Руны Альдура](https://esports.ru/igrovaya-industriya/guides/poe-2-return-of-the-ancients-kak-rabotayut-runy-aldura/).
- Игра/лига: PoE 1 3.28 и PoE 2 0.5.
- Формат: локализованные гайды.
- Почему полезно: примеры двуязычных названий и проблемы, которые испытывает русскоязычный игрок.
- Риски: вторичные коммерческие источники, качество перевода и фактов неоднородно; часть материалов пересказывает reveal вместо проверенной live-механики.
- Интеграция: **A выборочно**; факты перепроверять по официальным источникам/wiki.

## Сводная таблица кандидатов

Обозначения: **A** — внешняя ссылка; **B** — нативная карточка/мини-шпаргалка; **C** — импорт/адаптация после разрешения; **D** — не включать.

| Материал | Игра / версия | Дата / свежесть | Автор / формат | Интерфейс / данные | Главный риск | Рекомендация |
|---|---|---|---|---|---|---|
| [FixFaxer QOL Sheet](https://docs.google.com/spreadsheets/d/1fIs8sdvgZG7iVouPdtFkbRx5kv55_xVja8l19yubyRU/edit?usp=sharing) | PoE1 3.28 | март 2026, ongoing | FixFaxer / Google Sheet | Данные богатые, UX слабый на mobile | субъективность, частичная устарелость | **A → C** |
| [Betrayal Customizer](https://pathofexile.elrincondelexiliado.com/syndicate) | PoE1 3.28 | 2026-03-03 | Ayeleth / web app | Отличный интерактивный UX | экономика и личные оценки | **A → C** |
| [Endgame Roadmap](https://www.reddit.com/r/pathofexile/comments/1rkwb67/328_updated_poe_endgame_content_roadmap_for_new/) | PoE1 3.28 | 2026-03-04 | Stii_V / infographic | Сильная визуальная модель | обзор, не глубокий гайд | **B** |
| [Mirage infographic](https://www.reddit.com/r/pathofexile/comments/1rozqwl/information_mirage_cheatsheet_infographic/) | PoE1 3.28 | 2026-03-09 | Reddit user / image | Хорошая компактность | AI-origin, исправлялась после публикации | **A / B после проверки** |
| [Wealthy Exile strategies](https://wealthyexile.com/strategies/public) | PoE1 3.28 | live | community / web app | Сильные runs и экономика | UGC, малые выборки | **A / B aggregate** |
| [PoE Cook](https://github.com/rbiersbach/poe-cook) | PoE1 3.28 context | март 2026 | rbiersbach / GitHub app | Сильная модель inputs/outputs | alpha, license review | **A → C** |
| [PoE Atlas](https://poe-atlas.com/) | PoE1 3.28 | current | community site | Карточки стратегий + tree | provenance отдельных советов | **A** |
| [PoE2 SSF Guide](https://www.poe2wiki.net/wiki/Solo_Self_Found_Guide) | PoE2 0.5.3+ | июнь 2026, wiki | community / wiki | Отличные acquisition data | неполнота, license attribution | **A → C** |
| [Orboro farming cards](https://orboro.net/pages/atlas-farming-strategies) | PoE2 0.5 | 2026-07-21 | Orboro + BawLoch / cards | Очень удачная адаптация sheet | двойное авторство | **A → C** |
| [poe2farm](https://www.poe2farm.com/) | PoE2 0.5 | июнь 2026 | BawLoch / tier list | Хорошая структура strategy detail | методология не видна | **A → C** |
| [Ignatius farming guide](https://mobalytics.gg/poe-2/profile/ignatius/builds/endgame-farming-strategies-w-trade-links-ignatius) | PoE2 0.5 | 2026-06-17 | Ignatius / Mobalytics | Хорошие варианты и trade links | найден старый league slug | **A** |
| [Dads of Exile](https://dadsofexile.com/) | PoE2 0.5 | май–июнь 2026 | community / dashboard | Интересные day plans | на старте смешивал PoE1/PoE2 данные, AI-assisted | **D пока** |
| [Profit of Exile](https://profitofexile.com/) | PoE1 | live/неясно | web app | Красивый поиск, farms/crafts/prices | часть функций Soon, прозрачность данных | **A после повторной проверки** |
| [Cheatsheet.Monster](https://cheatsheet.monster/poe/) | PoE1 | смесь 3.25 и старше | Thundersphinx / link hub | Удобный zoomable index | заметно устаревшие разделы | **A только как архив** |
| [poe.ninja](https://poe.ninja/) | PoE1 + PoE2 | live | community service | Высокая ценность экономики/builds | оценочные цены, API terms | **B/C API** |
| [PoE Wiki / PoE2 Wiki](https://www.poewiki.net/) | PoE1 + PoE2 | rolling | community wiki | Лучшая механическая база | attribution/license, lag отдельных страниц | **A → C** |
| [PoEDB](https://poedb.tw/) | PoE1 + PoE2 | rolling | community data site | Глубокие item/mod data | extracted data/licensing | **A; C только после review** |
| [Lootkeeper builds](https://guides.lootkeeper.com/poe/builds) | PoE1 3.28 | апрель 2026 | RU community site | RU/EN и готовые trade links | коммерческий вторичный источник | **A** |

## Что сознательно не рекомендуется включать

1. **RMT-сайты и SEO-гайды продавцов валюты.** В выдаче много страниц с громкими обещаниями «1000 div/day», но их бизнес-модель конфликтует с нейтральной базой знаний, а методология часто не раскрыта. Рекомендация: **D**.
2. **AI-generated tier lists без первичных runs.** Они могут выглядеть свежими из-за даты и patch number, но смешивать игры, старые цены и несуществующие предметы. Показательный случай — обсуждение Dads of Exile, где community обнаружило PoE1 price assumptions в PoE2 dashboard; авторы это исправили, но доверие должно строиться через provenance. Рекомендация: **D до ручной верификации**.
3. **Старые cheatsheets без явной версии.** Даже если картинка красивая, Betrayal, Scarabs, Atlas и Heist менялись слишком часто. Рекомендация: хранить только в архиве и не выдавать по умолчанию.
4. **Чужие Google Sheets через iframe.** Это сохраняет все проблемы таблицы: mobile UX, zoom, цветовая доступность, долгую загрузку и отсутствие granular provenance.

## Как превратить spreadsheets в PoE Tools

### 1. Карточка знания вместо строки таблицы

Минимальная карточка:

- иконка механики/предмета;
- RU-название и EN-название;
- короткий ответ в одну-две строки;
- теги: `PoE1`, `3.28`, `Trade`, `Low investment`, `Fast mapper`, `High clicks`;
- статус: `Проверено`, `Авторская стратегия`, `Нужна перепроверка`;
- «проверено 2026-07-21»;
- источник и автор;
- кнопка «подробнее» и внешняя ссылка.

Карточка должна отвечать на один вопрос. Например: «Какие контракты Heist брать?», «Что ставить в Research?», «Какие runes/rewards выбирать?», «Подходит ли эта стратегия моему билду?».

### 2. Структура farm strategy

```text
game: poe1 | poe2
league: Mirage | Runes of Aldur
patch: 3.28.0e | 0.5.4c
stage: league-start | atlas-progression | established | endgame
mode: trade | ssf | hardcore
mechanics: [harvest, breach, ritual]
buildProfile: [clear, single-target, tankiness, speed]
investment: { tier, estimatedValue, priceSource, priceTimestamp }
inputs: [maps/waystones, scarabs/tablets, currency, atlas link]
steps: [...]
outputs: [liquid, bulk, jackpot, self-use]
liquidation: { method, friction, expectedTime }
evidence: { runs, sampleSize, author, sourceUrl }
verifiedAt: timestamp
status: verified | opinion | stale | archived
```

### 3. Фильтры, которые действительно нужны игроку

- PoE 1 / PoE 2.
- Current league / evergreen / archive.
- Trade / SSF / HC.
- Стадия: первые карты, 2 voidstones, T16, T17/juiced endgame.
- Бюджет: без вложений, low, medium, high.
- Профиль билда: AoE clear, bossing, tanky, movement speed, MF/rarity.
- Интенсивность: клики, микроменеджмент, торговля, риск смерти.
- Ликвидность: raw currency, easy bulk, slow bulk, jackpot.
- Цель: деньги, gold, XP, specific item, challenge, crafting material.

### 4. Не прятать неудобные свойства стратегии

Reddit показывает, что «прибыльно» недостаточно. В карточке нужны отдельные оценки:

- clicks per map;
- время на подготовку;
- сложность продажи;
- нужен ли TFT/Discord;
- variance/jackpot dependence;
- насколько стратегия ломается от популярности;
- насколько требовательна к single-target, coverage и survivability.

### 5. Mobile UX

- По умолчанию одна колонка и TL;DR; таблицы — только secondary view.
- Sticky-фильтры в верхней строке, не боковая панель.
- Иконка + 2–3 ключевых числа + короткий verdict должны помещаться без horizontal scroll.
- Сложные матрицы Betrayal/Heist раскрывать по выбранному NPC/job, а не показывать всё сразу.
- Цвет никогда не должен быть единственным носителем смысла: дублировать текстом/иконкой/формой.
- Большие инфографики — zoomable image с параллельным semantic HTML fallback.

## Provenance, обновление и версионирование

### Уровни источников

1. **P0 — официальный:** patch notes, GGG developer docs/data exports.
2. **P1 — структурированная community-база:** PoE Wiki/PoE2 Wiki, PoEDB, poe.ninja при ясном timestamp.
3. **P2 — подтверждённый автор:** известный maintainer, reproducible runs, публичный changelog.
4. **P3 — community observation:** Reddit thread, spreadsheet, видео, единичный тест.
5. **P4 — неподтверждённый/AI/SEO:** только discovery, не production source.

### Поля версии для каждой записи

- `game`;
- `league`;
- `patchIntroduced`;
- `patchLastVerified`;
- `verifiedAt`;
- `sourceUrl`;
- `sourceAuthor`;
- `sourceTier`;
- `translationReviewer`;
- `staleAfter`;
- `changeReason` / changelog.

### Предлагаемый процесс обновления

1. На анонсе patch notes автоматически пометить затронутые механики как `needs-review`, но не переписывать их автоматически.
2. Diff официальных patch notes → очередь проверки по тегам (`Betrayal`, `Scarabs`, `Atlas`, `Heist`, `Runes`).
3. После старта лиги подтверждать live-поведение по wiki и минимум двум независимым наблюдениям для спорных механик.
4. Экономические значения обновлять отдельно от текстовой стратегии; у цены всегда собственные league/timestamp/source.
5. Через 30–45 дней без проверки динамическую farm strategy помечать `stale`; evergreen-механику — только после релевантного patch diff.
6. Link checker ежедневно проверяет 404/redirect/старый league slug в trade links.
7. Каждая ручная правка попадает в маленький changelog, доступный из карточки.

### Защита от ложной точности

- Не показывать `div/hour` без sample size и продолжительности.
- Разделять `revenue`, `profit`, `liquid profit`, `unsold value`.
- Показывать диапазон, а не одно число.
- Цена стратегии пересчитывается отдельно от результатов автора.
- Всегда показывать, включено ли время закупки, ролла карт и продажи.

## Legal / licensing cautions

1. **GGG game assets.** Иконки, названия и игровые данные принадлежат Grinding Gear Games. Их использование нужно сверять с fan content/website terms; наличие файла на CDN или в extracted data не делает его open-source.
2. **Google Sheets и Reddit.** Публичный доступ означает возможность читать и ссылаться, но не автоматически право копировать, переводить и распространять содержимое. Для существенного импорта нужен контакт с автором и зафиксированное разрешение.
3. **Wiki licenses.** Перед импортом проверить конкретную лицензию PoE Wiki/PoE2 Wiki и выполнить требования к атрибуции/share-alike, если применимо. Ссылка на wiki сама по себе не заменяет attribution для адаптированного текста.
4. **GitHub.** Наличие исходников без LICENSE не даёт права переиспользовать код. Проверять лицензию каждого repo и отдельно права на vendored game data/assets.
5. **Логотипы community-сервисов.** Использовать для ссылки допустимее, чем представлять сервис как часть продукта, но всё равно нужны корректное название, отсутствие ложной аффилиации и желательно brand assets/permission.
6. **Переводы.** Перевод чужой cheat sheet — производное произведение; разрешение автора желательно даже при полной переработке визуального слоя.
7. **Атрибуция должна быть granular.** Если одна страница собрана из пяти источников, у каждой карточки должен быть свой source/provenance, а не один общий footer.

## Что делать дальше

### Этап 1 — безопасный production shortlist

1. Добавить curated links на FixFaxer, Ayeleth, Wealthy Exile, PoE2 SSF Guide и Orboro/BawLoch, но только после ручной проверки URL и с labels игры/патча.
2. Сделать нативную кликабельную Endgame Roadmap 3.28 на основе явно разрешённого автором материала, сохранив credit и original link.
3. Ввести единый компонент provenance: `Источник · Автор · Патч · Проверено · Статус`.
4. Не добавлять пока универсальную вкладку «Прочее полезное»; знания группировать по задаче игрока: «Прокачка», «Карты», «Фарм», «Механики», «Крафт», «Экономика».

### Этап 2 — permission outreach

Связаться с:

- FixFaxer — адаптация отдельных tabs в RU/EN карточки;
- Ayeleth — использование структуры/данных Betrayal customizer;
- Stii_V — подтвердить preferred attribution для roadmap;
- BawLoch и Orboro — использование strategy data и карточного представления;
- maintainers PoE Cook — уточнить лицензию/возможность использовать data schema.

### Этап 3 — пилот базы знаний

Выбрать три механики разного типа:

1. **Betrayal** — матрица выбора и персонализация.
2. **Heist** — справочник job/contract/rogue gear с RU/EN названиями.
3. **Farm strategies** — 5–10 карточек с бюджетом, build profile, inputs/outputs и динамической ценой.

Пилот считается успешным, если игрок с телефона за 10–15 секунд отвечает на конкретный вопрос, видит свежесть и может перейти к первоисточнику.

### Этап 4 — автоматизация качества

- patch-note diff;
- stale markers;
- link/league-slug checker;
- price timestamp validation;
- список карточек без источника или без даты проверки;
- переводческий QA для RU/EN терминов;
- ручной release gate для новых community-данных.

## Финальный вывод

Сильная база знаний для PoE Tools должна быть не «вики обо всём» и не складом картинок. Её преимущество — **быстрый выбор в контексте игры**: короткая карточка, правильная иконка, актуальная лига, ясные риски, живые цены отдельно от механики и всегда доступный первоисточник. Уже существуют хорошие community-кирпичи, но production-качество появится только после permission review, granular provenance и системного контроля устаревания.
