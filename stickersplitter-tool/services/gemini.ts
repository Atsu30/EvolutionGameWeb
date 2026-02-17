
import { GoogleGenAI } from "@google/genai";
import { StickerInput } from "../types";

const MODEL_NAME = 'gemini-3-pro-image-preview';

export class GeminiService {
  async generateStickerSheet(generalPrompt: string, stickerInputs: StickerInput[], referenceImageBase64: string): Promise<string> {
    // 常に最新のプロセス環境変数からAPIキーを取得してインスタンス化（Proモデルの要件）
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    const listStr = stickerInputs.map((item, i) => 
      `${i + 1}. 【表情/アクション】${item.expression} 【テキスト】「${item.text}」`
    ).join('\n');

    const fullPrompt = `${generalPrompt}

# 12個のスタンプ詳細リスト（3行×4列のグリッド構成で出力）
${listStr}

# 最終確認事項:
- 添付画像のキャラクターデザインを12個すべてにおいて厳密に維持してください。
- 各スタンプに指定されたテキストを、読みやすく適切な位置に配置してください。
- 背景は必ず「完全な緑色（クロマキー用）」で出力してください。`;

    const parts: any[] = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: referenceImageBase64,
        },
      },
      { text: fullPrompt }
    ];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K" // 高画質設定
        },
      },
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error('画像の生成に失敗しました。');
    }

    return imageUrl;
  }
}

export const geminiService = new GeminiService();
