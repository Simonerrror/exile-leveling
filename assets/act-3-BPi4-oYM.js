var e=`#section Акт 3
➞ {enter|1_3_1} #The City of Sarn
Получи рецепт {crafting}
Помоги {generic|Клариссе} и поговори с ней
➞ {enter|1_3_town} #The Sarn Encampment
➞ {enter|1_3_2} #The Slums
    #sub Иди {dir|0}
➞ {enter|1_3_3_1} #The Crematorium
    #sub Иди по лестницам
#ifdef LEAGUE_START
    Пройди {trial}
#endif
Найди и убей {kill|Piety}, возьми {quest_text|Браслет Толмана}
Получи рецепт {crafting}
{logout}
Поговори с {generic|Клариссой}, возьми {quest_text|Ключи от канализации}
Сдай {quest|a3q1} #Lost in Love
➞ {enter|1_3_2} #The Slums
    #sub Иди {dir|0}
➞ {enter|1_3_10_1} #The Sewers
Найди 1×{quest_text|Платиновый бюст}
Активируй {waypoint_get}
Найди 2×{quest_text|Платиновый бюст}
➞ {enter|1_3_5} #The Marketplace
Активируй {waypoint_get}
#ifdef LEAGUE_START
    ➞ {enter|1_3_6} #The Catacombs
        #sub Ищи поблизости
    Пройди {trial}
    Получи рецепт {crafting}
#endif
{logout}
Сдай {quest|a3q11} #Victario's Secrets
{waypoint|1_3_5} #The Marketplace
➞ {enter|1_3_7} #The Battlefront
    #sub Ищи {dir|0}
Активируй {waypoint_get}
    #sub Иди {dir|315}
Найди и возьми {quest_text|Катушка для лент}
    #sub Иди {dir|225}
➞ {enter|1_3_8_1} #The Solaris Temple Level 1
    #sub Иди {dir|45}
➞ {enter|1_3_8_2} #The Solaris Temple Level 2
➞ {arena|Вечная лаборатория}, получи рецепт {crafting}
{waypoint|1_3_7} #The Battlefront
➞ {enter|1_3_9} #The Docks
    #sub Иди {dir|315}
Найди и возьми {quest_text|Волшебная соль}
{logout}
{waypoint|1_3_8_2} #The Solaris Temple Level 2
Поговори с {generic|госпожой Диаллой}
Сдай {quest|a3q4} #The Ribbon Spool
Сдай {quest|a3q5}, возьми {quest_text|Пылающий тальк} #Fiery Dust
{waypoint|1_3_10_1} #The Sewers
Сожги {quest_text|Бессмертная преграда}
Получи рецепт {crafting}
➞ {enter|1_3_13} #The Ebony Barracks
Активируй {waypoint_get}
Убей {kill|General Gravicius}
    #sub Иди {dir|315}
➞ {enter|1_3_14_1} #The Lunaris Temple Level 1
➞ {enter|1_3_14_2} #The Lunaris Temple Level 2
Найди и убей {kill|Piety}, возьми {quest_text|Ключ от башни}
    #sub Иди по лестницам, ведущим вверх
    #sub На развилке с повозками иди туда, где 1 повозка, а не 2
Получи рецепт {crafting}
{logout}
Сдай {quest|a3q9} #Piety's Pets
Сдай {quest|a3q8} #Sever the Right Hand
{waypoint|1_3_13} #The Ebony Barracks
➞ {enter|1_3_15} #The Imperial Gardens
    #sub Иди {dir|45}
Активируй {waypoint_get}
    #sub Иди по дороге
#ifdef LEAGUE_START
    Пройди {trial}
        #sub Иди {dir|0}
    Получи рецепт {crafting}
    {logout}
    {waypoint|1_3_15} #The Imperial Gardens
#endif
#ifdef LIBRARY
    ➞ {enter|1_3_17_1} #The Library
        #sub Иди {dir|315}
    Активируй {waypoint_get}
    Найди {generic|Незакреплённая свеча} ➞ {enter|1_3_17_2} #The Archives
    Получи рецепт {crafting}
        #sub Ищи свечу в узком коридоре
    Найди 4×{quest_text|Золотая страница}
    {logout}
    {waypoint|1_3_17_1} #The Library
        #sub Положи в инвентарь валюту для покупки камней умений
    Сдай {quest|a3q12} #A Fixture of Fate
    {waypoint|1_3_15} #The Imperial Gardens
#endif
➞ {enter|1_3_18_1} #The Sceptre of God
➞ {enter|1_3_18_2} #The Upper Sceptre of God
    #sub Лестницы появляются в одном из углов
➞ {arena|Крыша башни}, убей {kill|Dominus, High Templar}
    #sub Ищи баррикады
`;export{e as default};