# Panduan Deploy ERP & POS Dimsum Mentai 77 ke Vercel

Aplikasi ini dibangun menggunakan **React + Vite + Tailwind CSS**, siap langsung di-deploy secara gratis dan live di **Vercel** (`https://dimsummentai77.vercel.app`).

---

## Opsi 1: Deploy Otomatis via GitHub (Paling Direkomendasikan)

1. **Upload / Push Kode ini ke Repository GitHub Anda**:
   - Buat repo baru di GitHub (misal: `dimsum-mentai-77-erp`).
   - Push seluruh file proyek termasuk `vercel.json`.

2. **Buka Vercel**:
   - Masuk ke [https://vercel.com](https://vercel.com) (login dengan akun GitHub).
   - Klik tombol **"Add New..."** > **"Project"**.
   - Pilih repository GitHub `dimsum-mentai-77-erp` yang baru dibuat, lalu klik **"Import"**.

3. **Pengaturan Project di Vercel**:
   - **Framework Preset**: `Vite` (akan terdeteksi otomatis)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   *(Semua sudah diatur otomatis oleh file `vercel.json`)*.

4. **Klik Deploy**:
   - Dalam ~30 detik, website Anda akan langsung online dengan domain seperti:
     `https://dimsum-mentai-77.vercel.app`!

---

## Opsi 2: Deploy Cepat via Vercel CLI (Lewat Terminal / CMD)

Jika Anda memiliki Node.js di komputer:

1. Buka terminal di folder project:
   ```bash
   npx vercel
   ```
2. Login akun Vercel bila diminta.
3. Jawab konfirmasi:
   - *Set up and deploy?* -> `Y`
   - *Which scope?* -> pilih akun Anda
   - *Link to existing project?* -> `N`
   - *What's your project's name?* -> `dimsum-mentai-77`
   - *In which directory is your code located?* -> `./`
4. Untuk deploy production (live permanen):
   ```bash
   npx vercel --prod
   ```

---

## Fitur Konfigurasi Vercel yang Disediakan

- **`vercel.json`**:
  - `framework: "vite"`
  - `buildCommand: "npm run build"`
  - `outputDirectory: "dist"`
  - `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]` (mencegah error 404 saat navigasi atau refresh halaman).
