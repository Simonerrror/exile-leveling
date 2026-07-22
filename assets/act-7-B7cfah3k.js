var e=`#section Акт 7
{waypoint|2_7_town} #The Bridge Encampment
➞ {enter|2_7_1} #The Broken Bridge
#ifdef LEAGUE_START
    Найди и забери {quest_text|Серебряный медальон}
        #sub Иди по дороге, ищи разрушенную {waypoint}
#endif
➞ {enter|2_7_2} #The Crossroads
    #sub Иди по дороге
Активируй {waypoint_get}
➞ {enter|2_7_3} #The Fellshrine Ruins
    #sub Иди {dir|135}
➞ {enter|2_7_4} #The Crypt
    #sub Иди по дороге
#ifdef LEAGUE_START
    Пройди {trial}
    Получи рецепт {crafting}
#endif
Найди {generic|Саркофаг} и спустись ниже
Найди и забери {quest_text|Карта Малигаро}
{logout}
{waypoint|2_7_2} #The Crossroads
➞ {enter|2_7_5_1} #The Chamber of Sins Level 1
    #sub Иди {dir|315}
Получи рецепт {crafting}
Активируй {waypoint_get}
Активируй {quest_text|машину картоходца} с помощью {quest_text|карты Малигаро}
➞ {enter|2_7_5_map} #Maligaro's Sanctum
➞ {arena|Мастерская Малигаро}, убей {kill|Maligaro, the Artist}, забери {quest_text|Чёрный яд}
    #sub Иди вдоль границ локации и переходи мосты в углах
    #sub Обычно мосты появляются в противоположных углах по диагонали
{logout}
Сдай {quest|a7q2} #Essence of the Artist
#ifdef LEAGUE_START
    Сдай {quest|a7q5} #The Silver Locket
#endif
{waypoint|2_7_5_1} #The Chamber of Sins Level 1
Сдай {quest|a7q3}, забери {quest_text|Обсидиановый ключ} #Web of Secrets
➞ {enter|2_7_5_2} #The Chamber of Sins Level 2
    #sub Иди в том же направлении, что и {waypoint}
#ifdef LEAGUE_START
    Пройди {trial}
    Получи рецепт {crafting}
#endif
Открой {generic|Тайный проход} ➞ {enter|2_7_6} #The Den
➞ {enter|2_7_7} #The Ashen Fields
➞ {arena|Лесной лагерь}, убей {kill|Greust, Lord of the Forest}
    #sub Иди {dir|225}
➞ {enter|2_7_8} #The Northern Forest
{waypoint|2_7_town} #The Bridge Encampment
Сдай {quest|a7q1} #The Master of a Million Faces
{waypoint|2_6_8} #Prisoner's Gate
➞ {arena|Долина пожирателя огня}, убей {kill|Abberath, the Cloven One}
    #sub Спустись с уступа рядом с дорогой
{portal|use}
Сдай {quest|a6q7} #The Cloven One
{waypoint|2_7_8} #The Northern Forest
➞ {enter|2_7_10} #The Causeway
Получи рецепт {crafting}
Найди и забери {quest_text|Звезда Кишары}
➞ {enter|2_7_11} #The Vaal City
Найди {waypoint_get}
{waypoint|2_7_8} #The Northern Forest
➞ {enter|2_7_9} #The Dread Thicket
Найди и забери 7×{quest_text|Светлячок}
Получи рецепт {crafting}
➞ {arena|Логово отчаяния}, убей {kill|Gruthkul, Mother of Despair}
{portal|use}
Сдай {quest|a7q9} #Queen of Despair
Сдай {quest|a7q6} #Kishara's Star
{waypoint|Labyrinth_Airlock} #Aspirants' Plaza
{ascend|cruel}
Получи рецепт {crafting|2_Labyrinth_boss_3}
{waypoint|2_7_11} #The Vaal City
Сдай {quest|a7q7} #Lighting the Way
➞ {enter|2_7_12_1} #The Temple of Decay Level 1
➞ {enter|2_7_12_2} #The Temple of Decay Level 2
Получи рецепт {crafting}
➞ {arena|Паутина Аракаали}, убей {kill|Arakaali, Spinner of Shadows}
`;export{e as default};