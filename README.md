# 🔥 The Chaos Kitchen

> Quản lý nhà bếp hỗn loạn với nhân viên AI "vô dụng" powered by ElevenLabs

![Chaos Kitchen Banner](https://img.shields.io/badge/Powered%20by-ElevenLabs-orange?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNEg4VjhIMTB2OHptNCAwaC0yVjhoMnY4eiIvPjwvc3ZnPg==)

## 🎮 Gameplay

Bạn là **Bếp Trưởng** của một nhà hàng đang bốc cháy (nghĩa bóng, nhưng đôi khi cả nghĩa đen). Ba nhân viên của bạn:

| Nhân viên | Tính cách | Giọng nói |
|-----------|-----------|-----------|
| 👨‍🍳 **Marco** (Sous-chef) | Gắt gỏng, hay đổ lỗi | Trầm, mỉa mai |
| 🤵 **Kevin** (Phục vụ) | Hoảng loạn, luôn xin lỗi | Cao, run rẩy |
| 👩‍🍳 **Isabelle** (Đầu bếp bánh) | Kiêu ngạo, không nhận lỗi | Đài các, kịch tính |

**Vòng lặp chơi:**
1. Nhận đơn hàng → chọn nhân viên → ra lệnh
2. Nhân viên phản hồi **bằng giọng nói thật** (ElevenLabs TTS)
3. Kết quả: Thành công 🎉 | Thất bại 💔 | Thảm họa 💥
4. Độ hỗn loạn tăng → giọng nói trở nên bất ổn hơn
5. Đạt 100% chaos = Game Over 💀

## ✨ Tính năng nổi bật

### 🎙️ Dynamic AI Voice (ElevenLabs)
- **Text-to-Speech**: 3 nhân vật, 3 giọng nói độc đáo với `eleven_multilingual_v2`
- **Dynamic Stability**: Chaos càng cao → `stability` parameter giảm → giọng càng bất ổn
- **Sound Effects API**: SFX được tạo real-time từ prompt (không dùng file .mp3 có sẵn)
  - Cháy: `"Loud kitchen fire alarm with sizzling oil sounds"`
  - Vỡ đồ: `"Large ceramic plate smashing on a tiled floor"`
  - Thành công: `"Ding of a service bell and cheering crowd"`

### 🧬 Hire Your Friend (Voice Cloning)
Clone giọng bạn bè của bạn thành nhân viên trong bếp!
1. Tải lên file ghi âm (~30 giây)
2. ElevenLabs Instant Voice Cloning tạo voice ID mới
3. Giọng bạn thân bị mắng vì làm cháy món ăn 😂

## 🚀 Cài đặt

### Yêu cầu
- Node.js 18+
- npm hoặc yarn
- Tài khoản ElevenLabs (lấy API key tại [elevenlabs.io](https://elevenlabs.io/app/settings/api-keys))

### Bước 1: Clone & cài dependencies
```bash
git clone <repo-url>
cd chaos-kitchen
npm install
```

### Bước 2: Cấu hình API Key
```bash
# Tạo file .env.local
cp .env.example .env.local

# Chỉnh sửa file và điền API key của bạn
ELEVENLABS_API_KEY=your_api_key_here
```

### Bước 3: Chạy development server
```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để chơi!

## 🏗️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| State | Zustand |
| Backend | Next.js API Routes (proxy) |
| AI Voice | ElevenLabs TTS + SFX + Voice Cloning |

## 📡 API Architecture

```
Sự kiện game → Frontend → /api/tts (proxy) → ElevenLabs → Audio Stream → Phát ngay lập tức
                        → /api/sfx (proxy) → ElevenLabs → SFX Audio
                        → /api/voice-clone → ElevenLabs → Voice ID mới
```

**Tại sao dùng proxy?** API Key được bảo vệ server-side, không bao giờ lộ ra client.

## 🎯 Chaos System

| Chaos Level | Trạng thái | TTS Stability |
|-------------|------------|---------------|
| 0–25% | Bình thường 😊 | 0.75 |
| 26–50% | Căng thẳng 😰 | 0.55 |
| 51–75% | Hỗn loạn! 🔥 | 0.30 |
| 76–100% | THẢM HỌA!!! 💀 | 0.10 |

## 📁 Cấu trúc dự án

```
src/
├── app/
│   ├── api/
│   │   ├── tts/route.ts          # ElevenLabs TTS proxy
│   │   ├── sfx/route.ts          # ElevenLabs SFX proxy
│   │   └── voice-clone/route.ts  # ElevenLabs IVC proxy
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Screens/                  # MainMenu, GameScreen, GameOver, HireFriend
│   ├── Kitchen/                  # KitchenScene, OrderBoard
│   ├── Staff/                    # StaffCard, StaffManager
│   ├── Effects/                  # FireEffect, ChaosOverlay
│   └── UI/                       # ChaosBar, ScoreBoard, DialogueBox
├── lib/
│   ├── audio.ts                  # AudioManager (Web Audio API)
│   ├── characters.ts             # Staff data + dialogue templates
│   └── gameLogic.ts              # Outcome calculation, chaos math
├── store/
│   └── gameStore.ts              # Zustand game state
└── types/
    └── index.ts                  # TypeScript interfaces
```

## 🏆 Scoring

- ✅ Hoàn thành đúng hạn: +100–200 điểm
- 💥 Thảm họa: Điểm âm + +25% chaos
- ❌ Thất bại thường: -20% điểm + +10% chaos
- 🔥 Đơn hết hạn: +15% chaos
- ⚡ Streak thưởng: Hoàn thành liên tiếp nhân hệ số

---

*Built with ❤️ and 🔥 for ElevenLabs Hackathon*