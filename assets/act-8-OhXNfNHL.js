var e=`#section Акт 8
➞ {enter|2_8_1} #The Sarn Ramparts
➞ {enter|2_8_town} #The Sarn Encampment
➞ {enter|2_8_2_1} #The Toxic Conduits
    #sub Иди {dir|270}
➞ {enter|2_8_2_2} #Doedre's Cesspool
    #sub Чёрные пятна краски на земле указывают верный путь
➞ {arena|Котёл}, убей {kill|Doedre the Vile}
➞ {arena|Выход из канализации}
Получи рецепт {crafting}
➞ {enter|2_8_8} #The Quay
    #sub Иди {dir|45}
Найди и возьми {quest_text|Анкх Вечности}
    #sub Держись стены в направлении {dir|270}
➞ {arena|Место воскрешения}
    #sub Иди {dir|135}
Поговори с {generic|Клариссой}, убей {kill|Tolman}
➞ {enter|2_8_9} #The Grain Gate
Найди и убей {kill|Gemling Legionnaires}
    #sub Иди по следу мёртвых стражников у дверей
    #sub Ищи значок книги
➞ {enter|2_8_10} #The Imperial Fields
    #sub Иди по следу мёртвых стражников у дверей
➞ {enter|2_8_12_1} #The Solaris Temple Level 1
    #sub Иди по дороге до {waypoint}
    #sub Иди {dir|315}
Активируй {waypoint_get}
➞ {enter|2_8_12_2} #The Solaris Temple Level 2
Найди и убей {kill|Dawn, Harbinger of Solaris}, возьми {quest_text|Сфера Солнца}
Получи рецепт {crafting}
{logout}
Сдай {quest|a8q1} #Essence of the Hag
Сдай {quest|a8q7} #The Gemling Legion
Сдай {quest|a8q6} #Love is Dead
{waypoint|2_8_12_1} #The Solaris Temple Level 1
➞ {enter|2_8_11} #The Solaris Concourse
➞ {enter|2_8_13} #The Harbour Bridge
    #sub Иди {dir|225}
➞ {enter|2_8_6} #The Lunaris Concourse
Активируй {waypoint_get}
    #sub Иди {dir|315}
➞ {enter|2_8_7_1_} #The Lunaris Temple Level 1
➞ {enter|2_8_7_2} #The Lunaris Temple Level 2
Найди и убей {kill|Dusk, Harbinger of Lunaris}, возьми {quest_text|Сфера Луны}
Получи рецепт {crafting}
{logout}
{waypoint|2_8_6} #The Lunaris Concourse
➞ {enter|2_8_13} #The Harbour Bridge
    #sub Иди {dir|135}
➞ {arena|Небесное святилище}, активируй {generic|Статуя сестёр}
Убей {kill|Lunaris, Eternal Moon} и {kill|Solaris, Eternal Sun}
➞ {enter|2_9_1} #The Blood Aqueduct
    #sub Фарм до уровня 58–62
➞ {enter|2_9_town} #Highgate
{waypoint|2_8_6} #The Lunaris Concourse
➞ {enter|2_8_5} #The Bath House
    #sub Иди {dir|180}
#ifdef LEAGUE_START
    Пройди {trial}
        #sub Ищи со стороны {dir|270}
    Получи рецепт {crafting}
#endif
➞ {enter|2_8_4} #The High Gardens
    #sub Ищи со стороны {dir|270}
➞ {arena|Купели ужаса}, убей {kill|Yugul, Reflection of Terror}
{portal|use}
Сдай {quest|a8q4} #Reflection of Terror
`;export{e as default};