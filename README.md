# Kalkulator Javascript (8th Anniversary Modern Edition) 🚀

[![Pure Vanilla](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%7C%20CSS%20%7C%20JS-F7DF1E?logo=javascript&logoColor=black)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20Web%20API)-brightgreen)](#)
[![Theme Support](https://img.shields.io/badge/Theme-Dark%20%26%20Light%20Mode-6366f1)](#)

> **"Project awal 8 tahun lalu (2016) yang dirombak total menjadi kalkulator modern, elegan, dan aman di tahun 2026."**

Aplikasi kalkulator multi-input berbasis web yang mempertahankan filosofi dan alur kerja konsep original (input nilai terpisah dengan validasi verifikasi checkbox), namun dirombak total menggunakan standar web modern tanpa dependensi berat.

---

## 🌟 Transformasi 8 Tahun: Sebelum vs Sesudah

| Fitur / Aspek | Kode Awal (2016) | Versi Modern (2026) |
|---|---|---|
| **Eksekusi Matematika** | Rentan memakai `eval(...)` | Parser matematika aman & presisi floating-point |
| **Variabel & Scope** | Global leak (`a=...`, `b=...`) | Clean Scoped ES6+ (`const`, `let`, strict mode) |
| **Form Handling** | `type="submit"` memicu refresh halaman | `type="button"` & event handler terkontrol |
| **Validasi Checkbox** | `alert('ceklis semua terlebih dahulu')` + undefined var | Toast notification elegan + shake animation & opsi fleksibel |
| **Jumlah Baris Input** | Statis 3 baris (a, b, c) | Dinamis (bisa tambah hingga 10 baris atau hapus) |
| **Tampilan / UI** | Inline style `margin-left: 600px;` | Fully Responsive Modern Glassmorphism & Micro-animations |
| **Tema** | Default Bootstrap 3 | Dark Mode & Light Mode (disimpan ke `localStorage`) |
| **Riwayat Perhitungan** | Tidak ada | Riwayat tersimpan otomatis + fitur klik untuk salin |
| **Audio Feedback** | Tidak ada | Synthesizer audio interaktif (Web Audio API) + toggle mute |
| **Keyboard Navigation** | Terbatas | Navigasi cepat `+`, `-`, `*`, `/`, `Enter`, dan `Esc` |

---

## ✨ Fitur Unggulan

1. **Konsep Multi-Input Asli yang Ditingkatkan**:
   - Memulai dengan baris **Input A**, **Input B**, dan **Input C** sesuai kode original.
   - Tombol **"+ Tambah Baris Input Baru"** untuk kalkulasi banyak angka sekaligus.
   - Checkbox di tiap baris untuk mengontrol apakah nilai diikutsertakan dalam hitungan.
2. **Mode Validasi**:
   - **Mode Wajib Centang Semua**: Menjaga behavior autentik kode awal (harus diceklis sebelum operasi).
   - **Mode Fleksibel**: Bebas menghitung hanya baris-baris yang aktif dicentang.
3. **Operasi Lengkap**:
   - Operasi Dasar: Tambah (`+`), Kurang (`-`), Kali (`*`), Bagi (`/`).
   - Operasi Ekstra: Modulo (`%`) dan Nilai Rata-rata (`x̄ / avg`).
   - Proteksi pembagian / modulo dengan angka 0.
4. **Riwayat Perhitungan (History Log)**:
   - Menyimpan jejak hitungan beserta waktu dan formula.
   - Klik pada riwayat untuk langsung menyalin hasil ke clipboard.
5. **Zero External Dependencies**:
   - Tidak memerlukan Node modules, npm install, jQuery, atau file eksternal yang besar.
   - Cepat, ringan, dan langsung bisa dibuka di browser apa saja.

---

## 🚀 Cara Menjalankan

### Cara 1: Buka Langsung di Browser
Cukup klik ganda (double click) file [index.html](file:///d:/Pentest/Tools/calculator/index.html) atau [kalkulator.html](file:///d:/Pentest/Tools/calculator/kalkulator.html) di file explorer.

### Cara 2: Menggunakan Local Web Server
Buka terminal di direktori proyek dan jalankan:
```bash
# Menggunakan Python 3
python -m http.server 8085
```
Lalu buka di browser: `http://localhost:8085/index.html`

---

## 📁 Struktur Berkas

```
calculator/
├── index.html        # Halaman utama kalkulator modern
├── kalkulator.html   # File legacy yang telah dimodernisasi
├── css/
│   └── style.css     # Design system modern (Glassmorphism & Responsif)
├── js/
│   └── app.js        # Logika aplikasi ES6+, audio synthesis & state management
└── README.md         # Dokumentasi proyek
```

---

Dibuat dengan ❤️ oleh **[iczombie4](https://github.com/iczombie4)** &bull; Refactored & Enhanced.
