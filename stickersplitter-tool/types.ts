
export interface Sticker {
  id: string;
  url: string; // Original cropped image
  processedUrl?: string; // Transparent background version
  isSelected: boolean;
}

export interface StickerInput {
  expression: string;
  text: string;
}

export enum GridType {
  SINGLE = '1x1',
  TWO_BY_TWO = '2x2',
  THREE_BY_THREE = '3x3',
  FOUR_BY_THREE = '4x3', // 12 stickers (3 rows x 4 cols)
}
