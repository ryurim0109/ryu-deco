export const DEVELOPER_TYPES = [
  "Full-stack Developer",
  "Backend Developer",
  "Frontend Developer",
  "Server Engineer",
  "DevOps Engineer",
  "Software Engineer",
  "Creative Developer",
] as const;
export type DeveloperType = (typeof DEVELOPER_TYPES)[number];
export type ThemeId =
  "snowy-night" | "spring-garden" | "cozy-room" | "starry-sky";
export type SpriteId =
  | "cat"
  | "rabbit"
  | "fox"
  | "tree"
  | "snowman"
  | "house"
  | "moon"
  | "stars"
  | "flowers";
export type PanelId =
  "profile" | "character" | "background" | "decorations" | "effects";
export interface WorldObject {
  id: string;
  sprite: SpriteId;
  x: number;
  y: number;
  scale: number;
  assetId?: string;
}
export interface PixelAsset {
  id: string;
  name: string;
  size: 16 | 32;
  frames: (string | null)[][];
  cycles: 1 | 2 | 4;
}
export const MAX_CUSTOM_ASSETS = 12;
export const MAX_ASSET_FRAMES = 8;
export interface EditorDocument {
  version: 1;
  profile: {
    name: string;
    developerType: DeveloperType;
    title: string;
    techStack: string[];
  };
  theme: ThemeId;
  accent: string;
  objects: WorldObject[];
  assets: PixelAsset[];
  effects: {
    snow: boolean;
    stars: boolean;
    floating: boolean;
    walking: boolean;
  };
  export: {
    scale: 1 | 2;
    format: "png" | "gif";
    filename: string;
    assetFolder: string;
  };
}
export const THEMES: {
  id: ThemeId;
  name: string;
  caption: string;
  color: string;
}[] = [
  {
    id: "snowy-night",
    name: "Snowy Night",
    caption: "A little winter magic",
    color: "#a4a7c5",
  },
  {
    id: "spring-garden",
    name: "Spring Garden",
    caption: "Where ideas bloom",
    color: "#dfb4c0",
  },
  {
    id: "cozy-room",
    name: "Cozy Room",
    caption: "One more line of code",
    color: "#c6aa94",
  },
  {
    id: "starry-sky",
    name: "Starry Sky",
    caption: "Dream a little bigger",
    color: "#8b87b1",
  },
];
export const SPRITE_LABELS: Record<SpriteId, string> = {
  cat: "Pixel Cat",
  rabbit: "Little Rabbit",
  fox: "Cozy Fox",
  tree: "Christmas Tree",
  snowman: "Snowman",
  house: "Tiny House",
  moon: "Moon",
  stars: "Stars",
  flowers: "Flowers",
};
export function createDefaultDocument(): EditorDocument {
  return {
    version: 1,
    profile: {
      name: "YOUR NAME",
      developerType: "Full-stack Developer",
      title: "I'm a full-stack developer\nwho loves tiny worlds.",
      techStack: ["TypeScript", "React", "Next.js", "Python", "Docker"],
    },
    theme: "snowy-night",
    accent: "#d7778e",
    objects: [
      { id: "character", sprite: "cat", x: 570, y: 202, scale: 1.5 },
      { id: "tree-1", sprite: "tree", x: 697, y: 200, scale: 1.5 },
      { id: "snowman-1", sprite: "snowman", x: 467, y: 205, scale: 1 },
    ],
    effects: { snow: false, stars: false, floating: false, walking: false },
    assets: [],
    export: {
      scale: 1,
      format: "png",
      filename: "pixel-dev-card",
      assetFolder: "assets",
    },
  };
}
