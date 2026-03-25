const apiKey = "";

export async function fetchAIFeedback(stats) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const prompt = `あなたはサイバーパンク世界のAIナビゲーターです。プレイヤーのバイクゲームの走行データを分析し、称号と評価をJSON形式で返して。
データ: 到達Lv: ${stats.lv}, 粉砕した敵: ${stats.destroyed}, 被ダメージ回数: ${stats.damage}, ダッシュ回数: ${stats.dash}, ジャンプ回数: ${stats.jump}
要件:
- "title": プレイスタイルを表すサイバーパンク風の二つ名（例: "音速の破壊者", "ジャンプ・マスター", "傷だらけの狂気"など）
- "feedback": プレイスタイルへの短い評価と熱いアドバイス（2文程度）
JSON形式で出力してください。`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
    };

    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            return JSON.parse(data.candidates[0].content.parts[0].text);
        } catch (e) {
            if (i === 4) return { title: "UNKNOWN RIDER", feedback: "データ解析に失敗しました。再起動を推奨します。" };
            await new Promise(r => setTimeout(r, delays[i]));
        }
    }
}
