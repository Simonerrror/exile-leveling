export type LabyrinthId = "normal" | "cruel" | "merciless" | "eternal";

export interface LabyrinthLink {
  id: LabyrinthId;
  url: string;
  areaId: string;
}

export const labyrinthLinks = [
  {
    id: "normal",
    url: "https://www.poelab.com/gtgax",
    areaId: "1_Labyrinth_boss_3",
  },
  {
    id: "cruel",
    url: "https://www.poelab.com/r8aws",
    areaId: "2_Labyrinth_boss_3",
  },
  {
    id: "merciless",
    url: "https://www.poelab.com/riikv",
    areaId: "3_Labyrinth_boss_3",
  },
  {
    id: "eternal",
    url: "https://www.poelab.com/wfbra",
    areaId: "EndGame_Labyrinth_boss_3",
  },
] as const satisfies readonly LabyrinthLink[];

export const labyrinthLinksById = Object.fromEntries(
  labyrinthLinks.map((link) => [link.id, link]),
) as Record<LabyrinthId, (typeof labyrinthLinks)[number]>;
