# GitHub'a Push Talimatları

## Adım 1: GitHub'da Yeni Repo Oluşturun

1. GitHub.com'a gidin
2. "New Repository" butonuna tıklayın
3. Repository adı: `mars-temizlik-app`
4. Public veya Private seçin
5. "Create repository" butonuna tıklayın

## Adım 2: Proje Dosyalarını Hazırlayın

Emergent'teki proje dosyalarını bilgisayarınıza indirin:

### Yöntem 1: Manuel İndirme
1. Her dosyayı tek tek görüntüleyin ve kopyalayın
2. Aynı klasör yapısında oluşturun

### Yöntem 2: Git Clone (Eğer Emergent'te git varsa)
```bash
# Emergent terminalinde
cd /app
git init
git add .
git commit -m "Initial commit - Mars Temizlik App"
```

## Adım 3: GitHub'a Push

Kendi bilgisayarınızda terminal açın:

```bash
# Proje dizinine gidin
cd mars-temizlik-app

# Git başlatın (eğer başlatılmadıysa)
git init

# Tüm dosyaları ekleyin
git add .

# İlk commit
git commit -m "Initial commit: Mars Temizlik appointment system"

# GitHub repo'nuzu remote olarak ekleyin
git remote add origin https://github.com/KULLANICI_ADINIZ/mars-temizlik-app.git

# Push edin
git branch -M main
git push -u origin main
```

## Adım 4: Build Alın

GitHub'a push ettikten sonra:

```bash
# Repo'yu clone edin
git clone https://github.com/KULLANICI_ADINIZ/mars-temizlik-app.git
cd mars-temizlik-app

# Frontend build
cd frontend
yarn install
npx eas login
npx eas build --platform android --profile production

# İOS için
npx eas build --platform ios --profile production
```

## Dosya Yapısı

```
mars-temizlik-app/
├── README.md
├── backend/
│   ├── .env
│   ├── requirements.txt
│   └── server.py
├── frontend/
│   ├── .env
│   ├── app.json
│   ├── eas.json
│   ├── package.json
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       ├── home.tsx
│   │       ├── appointments.tsx
│   │       ├── book.tsx
│   │       └── profile.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── assets/
└── memory/
    └── test_credentials.md
```

## Önemli Notlar

1. `.env` dosyalarını GitHub'a push etmeyin (güvenlik)
2. `.gitignore` dosyası oluşturun
3. Production'da environment variable'ları ayrı yönetin
4. API key'leri asla commit etmeyin

## Build Sonrası

Build tamamlandığında:
- Android: APK dosyası indirilir
- iOS: IPA dosyası indirilir (Apple Developer hesabı gerekir)

Her iki dosyayı da doğrudan telefonlara yükleyebilirsiniz.
