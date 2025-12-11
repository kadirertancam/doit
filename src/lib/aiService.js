// Groq AI Service for generating daily hashtags
// Free tier: 14,400 requests/day for Llama models

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Store API key in environment variable
const getApiKey = () => {
    return import.meta.env.VITE_GROQ_API_KEY || '';
};

// Emoji categories for hashtags
const EMOJI_CATEGORIES = {
    dance: ['💃', '🕺', '🎶', '🪩'],
    comedy: ['😂', '🤣', '😆', '🎭'],
    talent: ['🌟', '⭐', '✨', '🎪'],
    music: ['🎤', '🎵', '🎸', '🎹'],
    sports: ['💪', '🏋️', '⚽', '🏀'],
    food: ['🍕', '🍔', '🍳', '👨‍🍳'],
    pets: ['🐶', '🐱', '🐾', '🦊'],
    art: ['🎨', '🖌️', '✏️', '🎭'],
    lifestyle: ['☀️', '🌅', '✌️', '🌈'],
    beauty: ['💄', '💅', '💎', '👑'],
    fashion: ['👗', '👠', '🧥', '👒'],
    tech: ['📱', '💻', '🎮', '🤖'],
    travel: ['✈️', '🌍', '🗺️', '🏝️'],
    fitness: ['🏋️', '🧘', '🏃', '💪'],
    gaming: ['🎮', '🕹️', '👾', '🎯'],
    diy: ['🔧', '🛠️', '📦', '✂️'],
    photo: ['📸', '📷', '🖼️', '🎬'],
    motivation: ['🔥', '💥', '⚡', '🚀'],
    friends: ['👯', '🤝', '❤️', '🎉'],
    education: ['📚', '📖', '🎓', '💡'],
    nature: ['🌲', '🌸', '🌻', '🍃'],
    romance: ['❤️', '💕', '💘', '🌹'],
    family: ['👨‍👩‍👧', '🏠', '💝', '🤗'],
    coffee: ['☕', '🍵', '🧋', '🥤'],
};

// Color palette for hashtags
const COLORS = [
    '#ec4899', '#f59e0b', '#8b5cf6', '#3b82f6', '#22c55e',
    '#ef4444', '#06b6d4', '#a855f7', '#fbbf24', '#f472b6',
    '#c084fc', '#60a5fa', '#34d399', '#fb923c', '#818cf8',
];

// Generate hashtags using Groq AI
export async function generateAIHashtags() {
    const apiKey = getApiKey();

    if (!apiKey) {
        console.warn('Groq API key not found, using fallback topics');
        return null;
    }

    const today = new Date();
    const dayName = today.toLocaleDateString('tr-TR', { weekday: 'long' });
    const month = today.toLocaleDateString('tr-TR', { month: 'long' });
    const day = today.getDate();

    const prompt = `Bugün ${day} ${month}, ${dayName}. 
Türk sosyal medya kullanıcıları için 15 adet güncel, ilgi çekici ve eğlenceli video challenge hashtag'i öner.

Kurallar:
1. Her hashtag Türkçe olmalı
2. TikTok/Instagram Reels tarzı 6 saniyelik videolara uygun olmalı
3. Günün özelliklerine, mevsimine, popüler trendlere uygun olsun
4. Eğlenceli, yaratıcı ve katılımı teşvik edici olsun
5. Hashtag'ler # ile başlamalı, boşluk içermemeli

JSON formatında döndür:
[
  {"tag": "#HashtagAdı", "title": "Kısa Açıklama", "category": "kategori"}
]

Kategoriler: dance, comedy, talent, music, sports, food, pets, art, lifestyle, beauty, fashion, tech, travel, fitness, gaming, diy, photo, motivation, friends, education, nature, romance, family, coffee`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',
                messages: [
                    {
                        role: 'system',
                        content: 'Sen Türk sosyal medya trendlerini çok iyi bilen bir içerik uzmanısın. Yanıtlarını sadece geçerli JSON formatında ver.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from Groq');
        }

        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Could not parse JSON from response');
        }

        const topics = JSON.parse(jsonMatch[0]);

        // Transform to our format
        return topics.slice(0, 15).map((topic, index) => {
            const category = topic.category || 'lifestyle';
            const emojis = EMOJI_CATEGORIES[category] || EMOJI_CATEGORIES.lifestyle;
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            const color = COLORS[index % COLORS.length];

            return {
                id: topic.tag.replace('#', '').toLowerCase().replace(/[^a-z0-9]/g, ''),
                tag: topic.tag,
                title: topic.title,
                emoji,
                color,
                category,
                position: index + 1,
                videoCount: 0,
                trending: index < 3,
                aiGenerated: true,
            };
        });

    } catch (error) {
        console.error('Error generating AI hashtags:', error);
        return null;
    }
}

// Check if we should regenerate (once per day)
export function shouldRegenerateHashtags(lastGeneratedDate) {
    if (!lastGeneratedDate) return true;

    const today = new Date().toDateString();
    return lastGeneratedDate !== today;
}
