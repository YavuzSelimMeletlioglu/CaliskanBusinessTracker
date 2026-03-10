# Çalışkan Business Tracker

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
</p>

<p align="center">
  <a href="#türkçe">🇹🇷 Türkçe</a> &nbsp;|&nbsp;
  <a href="#english">🇬🇧 English</a>
</p>

---

## Türkçe

### 📖 Proje Hakkında

**Çalışkan Business Tracker**, galvanizleme / asit banyosu sektörüne yönelik geliştirilmiş kapsamlı bir iş takip ve otomasyon platformudur. Sistem; ürün hareketlerini, asit havuzu yönetimini, çalışan görev atamalarını ve iş performansını gerçek zamanlı olarak izleyerek akıllı bir otomasyon altyapısı sunar.

Sistem, bir Node.js REST API'si, Python/Flask tabanlı makine öğrenimi servisi ve MySQL veritabanından oluşmakta olup tamamı Docker ile konteynerize edilmiştir.

---

### 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                                                                 │
│   ┌───────────────┐       ┌───────────────────────────┐        │
│   │  Node.js API  │◄─────►│  Python ML Service (Flask)│        │
│   │   (Port 3000) │       │       (Port 5001)         │        │
│   └───────┬───────┘       └───────────────────────────┘        │
│           │                                                     │
│   ┌───────▼───────┐                                            │
│   │  MySQL DB     │                                            │
│   │  (Port 3306)  │                                            │
│   └───────────────┘                                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP (Motor & Pas Kontrol API)
                ┌───────────────▼────────────────────────┐
                │        Raspberry Pi (motor.py)          │
                │            (Port 5000)                  │
                │                                         │
                │  ┌──────────────┐  ┌────────────────┐  │
                │  │  Step Motor  │  │  Servo Motor   │  │
                │  │ (GPIO 14,15, │  │   (GPIO 18)    │  │
                │  │   17, 23)    │  └────────────────┘  │
                │  └──────────────┘                       │
                │  ┌──────────────────────────────────┐   │
                │  │  IP Kamera (Android Telefon)     │   │
                │  │      192.168.1.20:8080           │   │
                │  └──────────────────────────────────┘   │
                └─────────────────────────────────────────┘
```

---

### ✨ Temel Özellikler

#### 🏭 Üretim & Stok Yönetimi
- **Gelen Ürün (Incoming):** Firma ve ürün bazında gelen hammadde kayıtları
- **İşleme (Process):** Asit banyosuna giren ürünlerin takibi ve ML tabanlı süre tahmini
- **Depo (Store):** İşlenmiş ürünlerin depo stok yönetimi
- **Toplam Hareketler:** Aylık / yıllık giriş-çıkış ve net kütle grafikleri

#### 🧪 Asit Havuzu (Acid Bath) Yönetimi
- Birden fazla asit havuzunun eş zamanlı yönetimi
- Havuz doluluk durumu ve kalan süre takibi (saniye bazında sayaç)
- Kuyruk sistemi: tüm havuzlar doluyken ürünler otomatik sıraya alınır
- **Pas Kontrolü (Rust Check):** MobileNetV2 tabanlı derin öğrenme modeliyle ürünlerin pas tespiti; pas varsa ürün tekrar daldırılır (+1 dk), pas yoksa havuz boşaltılır
- Havuz boşalınca kuyruktaki ürün otomatik olarak bir sonraki boş havuza atanır

#### 🤖 Raspberry Pi Motor Kontrol Sistemi
- **Donanım:** Raspberry Pi üzerinde çalışan `motor.py` Flask servisi (Port 5000)
- **Step Motor:** 4 GPIO pini (14, 15, 17, 23) ile `gpiod` kütüphanesi üzerinden kontrol; havuzlar arası hareket için `512 adım/havuz` hassasiyeti
- **Servo Motor:** GPIO 18 pini üzerinden PWM kontrolü; ürünleri asit banyosuna daldırma (0°→180°) ve kaldırma (180°→90°) işlemleri
- **Kamera Entegrasyonu:** Ürün kaldırıldığında Android telefon IP kamerası (`192.168.1.20:8080`) üzerinden otomatik fotoğraf çekimi
- Çekilen görüntü Base64'e dönüştürülerek ML pas kontrol API'sine (`/rust/check`) gönderilir

| GPIO Pini | Bileşen | Görev |
|-----------|---------|-------|
| 14, 15, 17, 23 | Step Motor | Yatay ray hareketi |
| 18 | Servo Motor | Dikey daldırma/kaldırma |

#### 🤖 Makine Öğrenimi
- **Süre Tahmini:** `product_id`, `company_id` ve `quantity` parametrelerine göre Linear Regression modeliyle asit banyosu süresini tahmin eder
- **Otomatik Yeniden Eğitim:** Her 5 işlemde model otomatik olarak yeniden eğitilir
- **Pas Sınıflandırıcı:** MobileNetV2 tabanlı PyTorch modeli, Base64 kodluyla gönderilen görüntülerden pas tespiti yapar (`CORROSION` / `NOCORROSION`)

#### 👷 Çalışan & Görev Yönetimi
- Çalışanlara firma ve ürün bazında görev atama
- Tamamlanan iş miktarının güncellenmesi
- **Akıllı Öneri:** Çalışanların mevcut iş yüküne ve geçmiş performans verilerine göre en uygun çalışanı önerir
- Son teslim tarihi takibi

#### 📊 Raporlama
- Firma bazlı PDF raporu oluşturma (gelen / giden / net ürün grafikleri)
- Grafik görselleri (QuickChart.js) PDF içine gömülü
- Rapor **e-posta eki** olarak otomatik gönderim (Nodemailer / Gmail)

#### 🔐 Kullanıcı Rolleri ve Kimlik Doğrulama

| Rol ID | Rol Adı |
|--------|---------|
| 1 | Owner (Sahip) |
| 2 | Admin |
| 3 | Steelyard Responsible (Kantarcu) |
| 4 | Worker (İşçi) |

---

### 🗂️ Proje Yapısı

```
CaliskanBusinessTracker/
├── backend/                    # Node.js REST API
│   ├── index.js                # Uygulama girişi, route tanımları
│   ├── config/
│   │   └── db.js               # MySQL bağlantı havuzu
│   ├── routes/
│   │   ├── auth.js             # Kimlik doğrulama
│   │   ├── company.js          # Firma CRUD işlemleri
│   │   ├── product.js          # Ürün CRUD işlemleri
│   │   ├── movement.js         # Giriş/çıkış ve grafik verileri
│   │   ├── operations.js       # Incoming / Process / Store işlemleri
│   │   ├── assignments.js      # Görev atama ve öneri sistemi
│   │   ├── pool_router.js      # Asit havuzu yönetimi ve zamanlayıcı
│   │   ├── performance.js      # Performans log kayıtları
│   │   ├── report.js           # PDF rapor ve e-posta gönderimi
│   │   └── users.js            # Kullanıcı işlemleri
│   ├── assets/
│   │   └── fonts/              # PDF için font dosyaları
│   ├── Dockerfile
│   └── package.json
│
├── ml/                         # Python Flask ML Servisi
│   ├── app.py                  # Flask uygulama girişi
│   ├── ml.py                   # Linear Regression eğitim & tahmin
│   ├── rust_classifier.py      # MobileNetV2 pas sınıflandırıcı
│   ├── config.py               # Konfigürasyon
│   ├── models/                 # Eğitilmiş model dosyaları (.pkl)
│   └── Dockerfile
│
├── database/                   # MySQL veri ve init script'leri
│   └── db_data/
│
├── mobile/                     # Mobil uygulama (Expo / React Native)
├── docker-compose.yml          # Tüm servislerin orkestrasyon dosyası
├── motor.py                    # Raspberry Pi motor kontrol servisi (Flask, Port 5000)
│                               #   → Step motor (gpiod), Servo motor, IP Kamera entegrasyonu
└── user-roles.txt              # Rol tanımları
```

---

### 🛠️ Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Backend API** | Node.js, Express.js |
| **Veritabanı** | MySQL 8 |
| **ML Servisi** | Python 3, Flask, scikit-learn, PyTorch, MobileNetV2 |
| **Konteynerizasyon** | Docker, Docker Compose |
| **PDF & Grafik** | PDFKit, QuickChart.js |
| **E-posta** | Nodemailer (Gmail SMTP) |
| **Görüntü İşleme** | Pillow, torchvision |
| **Donanım Kontrol** | Raspberry Pi, Python Flask, gpiod, Step Motor, Servo Motor |

---

### 🚀 Kurulum ve Çalıştırma

#### Ön Gereksinimler
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) yüklenmiş olmalıdır
- Git
- Donanım için: Raspberry Pi (Raspberry Pi OS), Step Motor, Servo Motor, Android telefon (IP Kamera uygulaması)

#### 1. Depoyu Klonlayın

```bash
git clone https://github.com/YavuzSelimMeletlioglu/CaliskanBusinessTracker.git
cd CaliskanBusinessTracker
```

#### 2. Ortam Değişkenlerini Ayarlayın

`backend/.env` dosyasını oluşturun:

```env
PORT=3000
MLPORT=5001
DB_HOST=db
DB_USER=user
DB_PASSWORD=password
DB_NAME=galvaniz
GMAIL_PASS=your_gmail_app_password
MOTORIP=<motor_ip>
MOTORPORT=<motor_port>
```

`ml/.env` dosyasını oluşturun:

```env
DB_HOST=db
DB_USER=user
DB_PASSWORD=password
DB_NAME=galvaniz
RUST_MODEL_PATH=/app/models/rust_classifier1.pkl
NODEJS_HOST=node-backend
NODEJS_PORT=3000
```

#### 3. Docker Ağını Oluşturun

```bash
docker network create ending_project
```

#### 4. Servisleri Başlatın

```bash
docker-compose up --build -d
```

#### 5. Servisleri Doğrulayın

| Servis | URL |
|--------|-----|
| Node.js API | http://localhost:3000 |
| ML Servisi | http://localhost:5001 |
| MySQL | localhost:3306 |

```bash
# Log takibi
docker-compose logs -f
```

#### 5. Raspberry Pi Motor Servisini Başlatın

Raspberry Pi üzerinde aşağıdaki komutu çalıştırın:

```bash
# Gerekli kütüphaneleri yükleyin
pip install flask gpiod requests

# Servisi başlatın
python motor.py
```

> **Not:** `motor.py` içindeki `CAMERA_IP` ve `RUST_API_URL` değerlerini kendi ağ yapılandırmanıza göre güncelleyin.

---

### 📡 API Uç Noktaları (Özet)

#### Operasyonlar
| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `POST` | `/operations/incomings` | Gelen ürün kaydı ekle |
| `POST` | `/operations/processes` | İşleme al (ML süre tahmini tetiklenir) |
| `POST` | `/operations/stores` | Depoya ekle (5 kayıtta model yeniden eğitilir) |
| `DELETE` | `/operations/stores` | Depodan çıkar |

#### Havuz Yönetimi
| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `POST` | `/pools/assign-to-pool` | Ürünü havuza ata |
| `POST` | `/pools/release-pool` | Havuzu boşalt |
| `POST` | `/pools/redip-product` | Ürünü tekrar daldır (+1 dk) |
| `GET` | `/pools/list-pools` | Tüm havuz durumlarını listele |
| `GET` | `/pools/empty-pool` | Boş havuz bul |

#### Grafikler
| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `GET` | `/incoming-graph-data` | Gelen ürün grafiği (aylık/yıllık) |
| `GET` | `/outgoing-graph-data` | Giden ürün grafiği |
| `GET` | `/net-graph-data` | Net kütle grafiği |
| `GET` | `/incoming-graph-data-by-product` | Ürün bazlı gelen grafiği |

#### Görevler & Raporlar
| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `GET` | `/assignments` | Tüm görevleri listele |
| `POST` | `/assignments/add-assignment` | Görev ata |
| `POST` | `/assignments/recommendation` | En uygun çalışanı öner |
| `POST` | `/send-company-report` | PDF rapor oluştur ve e-posta ile gönder |

#### ML Servisi
| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `POST` | `/ml/train` | Modeli eğit |
| `POST` | `/ml/predict` | Süre tahmini al |
| `POST` | `/rust/check` | Pas kontrolü yap (Base64 görüntü) |

#### Raspberry Pi Motor Servisi *(Port 5000)*
| Yöntem | Uç Nokta | Açıklama |
|--------|----------|----------|
| `GET` | `/motor/move?from=X&to=Y` | X pozisyonundan Y havuzuna taşı |
| `GET` | `/motor/lift?pool_number=X` | Havuzdan ürün kaldır + fotoğraf çek |
| `GET` | `/motor/dip` | Ürünü havuza daldır |
| `GET` | `/motor/home` | Ana pozisyona dön (0. havuz) |

---

### 🤝 Katkıda Bulunma

1. Repoyu fork'layın
2. Feature branch'i oluşturun: `git checkout -b feature/yeni-ozellik`
3. Değişikliklerinizi commit'leyin: `git commit -m 'feat: yeni özellik eklendi'`
4. Branch'i push'layın: `git push origin feature/yeni-ozellik`
5. Pull Request açın

---

---

## English

### 📖 About The Project

**Çalışkan Business Tracker** is a comprehensive business tracking and automation platform built for the galvanizing / acid bath industry. The system monitors product movements, acid bath pool management, employee task assignments, and job performance in real time, providing an intelligent automation infrastructure.

The system consists of a Node.js REST API, a Python/Flask-based machine learning service, and a MySQL database — all containerized with Docker.

---

### 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                           │
│                                                                 │
│   ┌───────────────┐       ┌───────────────────────────┐        │
│   │  Node.js API  │◄─────►│  Python ML Service (Flask)│        │
│   │   (Port 3000) │       │       (Port 5001)         │        │
│   └───────┬───────┘       └───────────────────────────┘        │
│           │                                                     │
│   ┌───────▼───────┐                                            │
│   │  MySQL DB     │                                            │
│   │  (Port 3306)  │                                            │
│   └───────────────┘                                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP (Motor & Rust Check API)
                ┌───────────────▼────────────────────────┐
                │     Raspberry Pi (motor.py)             │
                │           (Port 5000)                   │
                │                                         │
                │  ┌──────────────┐  ┌────────────────┐  │
                │  │  Stepper     │  │  Servo Motor   │  │
                │  │  Motor       │  │   (GPIO 18)    │  │
                │  │ (GPIO 14,15, │  └────────────────┘  │
                │  │   17, 23)    │                       │
                │  └──────────────┘                       │
                │  ┌──────────────────────────────────┐   │
                │  │  IP Camera (Android Phone)       │   │
                │  │      192.168.1.20:8080           │   │
                │  └──────────────────────────────────┘   │
                └─────────────────────────────────────────┘
```

---

### ✨ Key Features

#### 🏭 Production & Inventory Management
- **Incoming:** Recording raw materials received per company and product
- **Process:** Tracking products entering the acid bath with ML-based duration prediction
- **Store:** Warehouse stock management for processed products
- **Total Movements:** Monthly / yearly incoming, outgoing, and net mass charts

#### 🧪 Acid Bath Pool Management
- Simultaneous management of multiple acid bath pools
- Pool occupancy status and remaining time tracking (second-by-second countdown)
- Queue system: products are automatically queued when all pools are occupied
- **Rust Check:** Deep learning model based on MobileNetV2 detects rust on products; if rust is detected the product is re-dipped (+1 min), otherwise the pool is released
- When a pool is freed, the next product in the queue is automatically assigned to it

#### 🤖 Raspberry Pi Motor Control System
- **Hardware:** `motor.py` Flask service running on Raspberry Pi (Port 5000)
- **Stepper Motor:** Controlled via `gpiod` library on 4 GPIO pins (14, 15, 17, 23); horizontal rail movement at `512 steps/pool` precision
- **Servo Motor:** PWM control on GPIO 18; dips products into acid bath (0°→180°) and lifts them out (180°→90°)
- **Camera Integration:** After a product is lifted, an Android phone IP camera (`192.168.1.20:8080`) automatically takes a photo
- The captured image is Base64-encoded and sent to the ML rust check API (`/rust/check`)

| GPIO Pin | Component | Function |
|----------|-----------|----------|
| 14, 15, 17, 23 | Stepper Motor | Horizontal rail movement |
| 18 | Servo Motor | Vertical dip / lift |

#### 🤖 Machine Learning
- **Duration Prediction:** Uses a Linear Regression model to predict acid bath duration based on `product_id`, `company_id`, and `quantity`
- **Automatic Retraining:** The model is automatically retrained every 5 process records
- **Rust Classifier:** MobileNetV2-based PyTorch model — performs rust detection from Base64-encoded images (`CORROSION` / `NOCORROSION`)

#### 👷 Employee & Task Management
- Assign tasks to employees by company and product
- Update completed work quantities
- **Smart Recommendation:** Recommends the best available employee based on current workload and historical performance data
- Deadline tracking

#### 📊 Reporting
- Company-based PDF report generation (incoming / outgoing / net product charts)
- Chart images (QuickChart.js) embedded directly in the PDF
- Automatic e-mail delivery of the PDF report as an attachment (Nodemailer / Gmail)

#### 🔐 User Roles & Authentication

| Role ID | Role Name |
|---------|-----------|
| 1 | Owner |
| 2 | Admin |
| 3 | Steelyard Responsible |
| 4 | Worker |

---

### 🗂️ Project Structure

```
CaliskanBusinessTracker/
├── backend/                    # Node.js REST API
│   ├── index.js                # App entry point, route registration
│   ├── config/
│   │   └── db.js               # MySQL connection pool
│   ├── routes/
│   │   ├── auth.js             # Authentication
│   │   ├── company.js          # Company CRUD
│   │   ├── product.js          # Product CRUD
│   │   ├── movement.js         # Incoming/outgoing & chart data
│   │   ├── operations.js       # Incoming / Process / Store operations
│   │   ├── assignments.js      # Task assignment & recommendation
│   │   ├── pool_router.js      # Acid bath pool mgmt & scheduler
│   │   ├── performance.js      # Performance log records
│   │   ├── report.js           # PDF report & e-mail delivery
│   │   └── users.js            # User operations
│   ├── assets/
│   │   └── fonts/              # Fonts for PDF generation
│   ├── Dockerfile
│   └── package.json
│
├── ml/                         # Python Flask ML Service
│   ├── app.py                  # Flask application entry point
│   ├── ml.py                   # Linear Regression train & predict
│   ├── rust_classifier.py      # MobileNetV2 rust classifier
│   ├── config.py               # Configuration
│   ├── models/                 # Trained model files (.pkl)
│   └── Dockerfile
│
├── database/                   # MySQL data & init scripts
│   └── db_data/
│
├── mobile/                     # Mobile app (Expo / React Native)
├── docker-compose.yml          # Service orchestration
├── motor.py                    # Raspberry Pi motor control service (Flask, Port 5000)
│                               #   → Stepper motor (gpiod), Servo motor, IP Camera integration
└── user-roles.txt              # Role definitions
```

---

### 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Node.js, Express.js |
| **Database** | MySQL 8 |
| **ML Service** | Python 3, Flask, scikit-learn, PyTorch, MobileNetV2 |
| **Containerization** | Docker, Docker Compose |
| **PDF & Charts** | PDFKit, QuickChart.js |
| **Email** | Nodemailer (Gmail SMTP) |
| **Image Processing** | Pillow, torchvision |
| **Hardware Control** | Raspberry Pi, Python Flask, gpiod, Stepper Motor, Servo Motor |

---

### 🚀 Setup & Running

#### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Git
- For hardware: Raspberry Pi (Raspberry Pi OS), Stepper Motor, Servo Motor, Android phone (IP Camera app)

#### 1. Clone the Repository

```bash
git clone https://github.com/YavuzSelimMeletlioglu/CaliskanBusinessTracker.git
cd CaliskanBusinessTracker
```

#### 2. Configure Environment Variables

Create `backend/.env`:

```env
PORT=3000
MLPORT=5001
DB_HOST=db
DB_USER=user
DB_PASSWORD=password
DB_NAME=galvaniz
GMAIL_PASS=your_gmail_app_password
MOTORIP=<motor_ip>
MOTORPORT=<motor_port>
```

Create `ml/.env`:

```env
DB_HOST=db
DB_USER=user
DB_PASSWORD=password
DB_NAME=galvaniz
RUST_MODEL_PATH=/app/models/rust_classifier1.pkl
NODEJS_HOST=node-backend
NODEJS_PORT=3000
```

#### 3. Create the Docker Network

```bash
docker network create ending_project
```

#### 4. Start All Services

```bash
docker-compose up --build -d
```

#### 5. Verify Services

| Service | URL |
|---------|-----|
| Node.js API | http://localhost:3000 |
| ML Service | http://localhost:5001 |
| MySQL | localhost:3306 |

```bash
# Follow logs
docker-compose logs -f
```

#### 5. Start the Raspberry Pi Motor Service

Run the following on your Raspberry Pi:

```bash
# Install dependencies
pip install flask gpiod requests

# Start the service
python motor.py
```

> **Note:** Update `CAMERA_IP` and `RUST_API_URL` inside `motor.py` to match your local network configuration.

---

### 📡 API Endpoints (Summary)

#### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/operations/incomings` | Add incoming product record |
| `POST` | `/operations/processes` | Send to process (ML prediction triggered) |
| `POST` | `/operations/stores` | Add to warehouse (model retrained every 5 records) |
| `DELETE` | `/operations/stores` | Remove from warehouse |

#### Pool Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/pools/assign-to-pool` | Assign product to a pool |
| `POST` | `/pools/release-pool` | Release finished pool |
| `POST` | `/pools/redip-product` | Re-dip product (+1 min) |
| `GET` | `/pools/list-pools` | List all pool statuses |
| `GET` | `/pools/empty-pool` | Find an empty pool |

#### Charts
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/incoming-graph-data` | Incoming product chart (monthly/yearly) |
| `GET` | `/outgoing-graph-data` | Outgoing product chart |
| `GET` | `/net-graph-data` | Net mass chart |
| `GET` | `/incoming-graph-data-by-product` | Incoming chart by product |

#### Tasks & Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/assignments` | List all assignments |
| `POST` | `/assignments/add-assignment` | Create assignment |
| `POST` | `/assignments/recommendation` | Get best available employee |
| `POST` | `/send-company-report` | Generate PDF report & send via e-mail |

#### ML Service
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ml/train` | Train the duration model |
| `POST` | `/ml/predict` | Get duration prediction |
| `POST` | `/rust/check` | Run rust detection (Base64 image) |

#### Raspberry Pi Motor Service *(Port 5000)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/motor/move?from=X&to=Y` | Move from pool X to pool Y |
| `GET` | `/motor/lift?pool_number=X` | Lift product from pool + capture photo |
| `GET` | `/motor/dip` | Dip product into pool |
| `GET` | `/motor/home` | Return to home position (pool 0) |

---

### 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'feat: added new feature'`
4. Push the branch: `git push origin feature/new-feature`
5. Open a Pull Request

---

<p align="center">
  Made with ❤️ by <strong>Yavuz Selim Meletlioğlu</strong>
</p>
