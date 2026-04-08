# Mars Temizlik - Randevu Yönetim Sistemi 🚀

Profesyonel temizlik hizmeti için mobil randevu yönetim uygulaması.

## 🚀 Özellikler

### Müşteri Özellikleri
- JWT tabanlı güvenli kayıt ve giriş
- 4 farklı temizlik hizmeti (Ev, Ofis, Derin, Cam)
- Detaylı randevu rezervasyon
- Randevu takip ve yönetim
- Kullanıcı profil yönetimi

### Admin Özellikleri
- Tüm randevuları görüntüleme
- Müşteri bilgileri görüntüleme  
- Randevu durumu güncelleme (Beklemede → Onaylandı → Devam Ediyor → Tamamlandı)
- Onay/Red işlemleri

## 📱 Teknoloji Stack

- **Frontend:** Expo (React Native) + TypeScript
- **Backend:** FastAPI + Python
- **Database:** MongoDB
- **Authentication:** JWT
- **UI Theme:** Mars (Kırmızı/Turuncu - #DC2626)

## 🛠️ Kurulum

### Gereksinimler
- Node.js 18+
- Python 3.11+
- MongoDB
- Yarn

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Frontend
```bash
cd frontend
yarn install
npx expo start
```

## 📦 Build Alma

### Android APK
```bash
cd frontend
npx eas login
npx eas build --platform android --profile production
```

### iOS IPA (Apple Developer hesabı gerekir)
```bash
cd frontend
npx eas login
npx eas build --platform ios --profile production
```

## 🔐 Test Hesapları

**Admin:**
- Email: `admin@marstemizlik.com`
- Password: `admin123`

**Müşteri:**
- Email: `test@customer.com`
- Password: `test123`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Services
- `GET /api/services` - Tüm hizmetleri listele

### Appointments
- `POST /api/appointments` - Yeni randevu oluştur
- `GET /api/appointments` - Randevuları listele
- `GET /api/appointments/{id}` - Tek randevu detayı
- `PATCH /api/appointments/{id}` - Randevu durumu güncelle
- `DELETE /api/appointments/{id}` - Randevu iptal et

### Reviews
- `POST /api/reviews` - Değerlendirme ekle
- `GET /api/reviews` - Değerlendirmeleri listele

## 🎨 Tasarım

- Mars temalı kırmızı/turuncu palet (#DC2626)
- Modern ve kullanıcı dostu arayüz
- Türkçe dil desteği
- Mobil responsive tasarım
- Bottom tab navigation

## 📁 Proje Yapısı

```
mars-temizlik-app/
├── backend/
│   ├── server.py           # FastAPI backend
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── app/               # Expo Router screens
│   │   ├── (tabs)/       # Tab navigation screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── contexts/          # React contexts
│   ├── app.json          # Expo configuration
│   ├── eas.json          # EAS Build configuration
│   └── package.json
└── memory/
    └── test_credentials.md
```

## 🧪 Testing

Backend: 19/19 tests passed ✅
- Authentication ✓
- Services CRUD ✓
- Appointments management ✓
- Reviews ✓
- Authorization ✓

Frontend: 100% passed ✅
- User authentication ✓
- Booking flow ✓
- Appointment management ✓
- Admin panel ✓

## 🚀 Deployment

Uygulama Expo Application Services (EAS) ile deploy edilir.

## 📄 Lisans

MIT License

## 👤 İletişim

Mars Temizlik - Profesyonel Temizlik Hizmetleri

---

**Not:** Production kullanımı için environment variable'ları güvenli şekilde yönetin ve `.env` dosyalarını asla commit etmeyin.
