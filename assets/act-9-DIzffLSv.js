var e=`#section Акт 9
{waypoint|2_9_town} #Highgate
➞ {enter|2_9_2} #The Descent
➞ {enter|2_9_3} #The Vastiri Desert
Активируй {waypoint_get}
    #sub Иди {dir|90}
Получи рецепт {crafting}
Найди и возьми {quest_text|Клинок бури}
➞ {enter|2_9_5} #The Foothills
    #sub Иди {dir|315}
Активируй {waypoint_get}
    #sub Иди {dir|45}, пока не найдёшь обрыв
    #sub Иди {dir|315}
➞ {enter|2_9_6} #The Boiling Lake
Найди и убей {kill|The Basilisk}, возьми {quest_text|Кислота василиска}
    #sub Иди {dir|45}, ищи окаменевших солдат
Получи рецепт {crafting}
{logout}
Поговори с {generic|Грехом}
Сдай {quest|a9q3}
Сдай {quest|a9q5|a9q5_offer}, возьми {quest_text|Закупоренная буря}
{waypoint|2_9_3} #The Vastiri Desert
➞ {enter|2_9_4} #The Oasis
    #sub Иди {dir|45}
➞ {arena|Песчаная яма}, убей {kill|Shakari, Queen of the Sands}
{logout}
Сдай {quest|a9q5|a9q5} #Queen of the Sands
{waypoint|2_9_5} #The Foothills
➞ {enter|2_9_7} #The Tunnel
    #sub Иди {dir|315}
#ifdef LEAGUE_START
    До {waypoint} пройди {trial}
    Получи рецепт {crafting}
#endif
➞ {enter|2_9_8} #The Quarry
Активируй {waypoint_get}
    #sub Иди {dir|315}
Получи рецепт {crafting}
➞ {arena|Святилище ветров}, убей {kill|Garukhan, Queen of the Winds}, возьми {quest_text|Перо сехемы}
    #sub {dir|45} или {dir|225}
{logout}
Сдай {quest|a9q2} #The Ruler of Highgate
{waypoint|2_9_8} #The Quarry
➞ {enter|2_9_9} #The Refinery
    #sub {dir|315} или {dir|45}
Получи рецепт {crafting}
    #sub Ищи у рельсов канализационную решётку, ведущую в {arena|Фабричные тоннели}
Найди и убей {kill|General Adus}, возьми {quest_text|Тератновая пыль}
    #sub Иди {dir|45} вдоль рельсов
{logout}
{waypoint|2_9_8} #The Quarry
Поговори с {generic|Грехом}
➞ {enter|2_9_10_1} #The Belly of the Beast
➞ {enter|2_9_10_2} #The Rotting Core
➞ {arena|Средоточие тьмы}
Поговори с {generic|Грехом}
➞ {arena|Отчаяние Доэдре}, убей {kill|Doedre, Darksoul}
➞ {arena|Страдание Малигаро}, убей {kill|Maligaro, The Broken}
➞ {arena|Скорбь Шавронн}, убей {kill|Shavronne, Unbound}
Поговори с {generic|Грехом} ➞ {arena|Чёрное сердце}, убей {kill|The Depraved Trinity}
{portal|use}
`;export{e as default};