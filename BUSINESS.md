<div align="center">
  <img src="frontend/public/ame.png" alt="Ame, the xflame mascot" width="90" />

  # xflame — Business Model & Monetization

  **Cara xflame menghasilkan uang, siapa yang membayar, dan rencana grant Instawards 3 fase.**
</div>

---

## Business model in one line

Core auto-split **gratis selamanya** — itu hook akuisisi dan sekaligus cerita social-good.
Revenue datang dari **dua hal yang benar-benar kami kontrol**: (a) bagi hasil yield atas uang
yang berhasil kami buat *ditahan & tumbuh* (AUM), dan (b) menjual engine auto-split ke rail
remittance sebagai infra (B2B).

> **Prinsip:** monetisasi kami **selaras dengan misi**. xflame menghasilkan uang justru saat
> user berhasil menabung — kami ambil bagian kecil dari yield yang kami buatkan untuk mereka,
> bukan memungut biaya di depan.

### Kenapa off-ramp BUKAN tulang punggung (koreksi penting)

Godaan awal adalah menjadikan spread transfer/off-ramp (1–2%) sebagai pilar. Itu **tidak
realistis** untuk tim kecil bermodal grant:

- Off-ramp ke Rupiah **berlisensi & berat** (izin PJP/BI, likuiditas, partner bank). Kita
  tidak akan *menjadi* off-ramp-nya — kita **embed provider**.
- Kalau embed, **margin FX-nya milik provider**. Kita paling dapat markup/referral tipis
  (~0.1–0.5%), bukan 1–2%.

Jadi off-ramp diperlakukan sebagai **fitur untuk menutup loop user** (routing ke provider /
rail yang sudah ada seperti cash-out MoneyGram via MGUSD), bukan sumber revenue utama. Fee
gemuknya milik pihak yang punya lisensi — dan justru di situ pintu B2B kita: **kita jual otak
(alokasi/goals/yield), mereka simpan fee off-ramp mereka.**

---

## Revenue streams

Diurutkan dari yang paling **bisa dikontrol & selaras**, bukan dari angka mentah:

| # | Stream | Model | Siapa yang untung | Kapan aktif |
|---|--------|-------|-------------------|-------------|
| 1 | **Yield / AUM fee** ⭐ | 15–20% dari yield + opsional ~0.5%/thn mgmt fee atas saldo yang ditahan | **xflame kontrol penuh** | Fase 1 |
| 2 | **DCA swap fee** | Spread/referral kecil per swap Soroswap | xflame (via routing) | Fase 1 |
| 3 | **B2B2C white-label** ⭐ | SaaS/rev-share: rail bayar untuk pakai engine auto-split | xflame (infra vendor) | Fase 3 |
| 4 | **Off-ramp markup** | Markup tipis di atas rate provider (~0.1–0.5%) — *pass-through* | Mayoritas ke provider | Fase 2 |
| 5 | **Premium (opsional)** | Guardian recovery, household vault, Smart/AI split | xflame | Fase 3+ |

**1. Yield / AUM fee — TULANG PUNGGUNG konsumen.**
Inti value prop xflame adalah membuat uang *ditahan & tumbuh* (pocket stability + goals),
bukan langsung habis. Uang yang ditahan itu = **AUM yang kami monetisasi**: bagian dari yield
DeFindex (15–20%) plus opsi management fee kecil (~0.5%/thn). **Kami yang kontrol** — bukan
provider pihak ketiga. Per-user memang kecil, tapi ini jenis revenue yang benar: recurring,
selaras misi (kami untung saat user berhasil nabung), dan **membesar** seiring saldo naik &
retensi.

**2. DCA swap fee.**
Setiap kali pocket DCA dieksekusi lewat Soroswap, ada spread/referral kecil yang kami atur
lewat routing.

**3. B2B2C white-label — TULANG PUNGGUNG skala.**
Rail remittance (Velo Labs/Lightnet, MoneyGram MGUSD) **sudah punya** off-ramp + lisensi,
tapi **tidak punya** UX auto-split/goals/yield. xflame menjual engine itu sebagai infra:
mereka bayar SaaS/rev-share, mereka simpan fee off-ramp mereka. Di sinilah cek besar berada —
kita jadi *vendor infra*, bukan rebutan margin off-ramp. Ini jawaban langsung atas "kalau
embed, fee-nya milik mereka": betul, jadi kita jual sisi yang mereka tidak punya.

**4. Off-ramp markup — pass-through, bukan pilar.**
Saat user cash-out ke Rupiah/e-wallet, kita routing ke provider dan bisa menaruh markup tipis
(~0.1–0.5%) di atas rate mereka. Mayoritas margin FX tetap milik provider berlisensi. Kita
perlakukan ini sebagai **fitur penutup loop**, bukan sumber revenue utama.

**5. Premium (opsional).**
Guardian recovery, household shared vault, dan Smart/AI split untuk power user. Pelengkap,
bukan andalan — segmen unbanked sensitif terhadap biaya berlangganan.

---

## Unit economics — angka jujur

Kami sengaja pakai angka konservatif, **tanpa** mengklaim margin off-ramp yang sebenarnya
milik provider.

**Sisi konsumen (per keluarga aktif).** Karena xflame mendorong menabung, saldo yang ditahan
tumbuh dari waktu ke waktu — asumsikan rata-rata **$600** tertahan di stability + goals:

| Sumber | Perhitungan | Per tahun |
|--------|-------------|-----------|
| Yield share | $600 × ~6% net yield × 18% cut | **$6.5** |
| Management fee | $600 × 0.5%/thn | **$3.0** |
| DCA swap | ~ | **$1.5** |
| Off-ramp markup | 0.3% × ~$2,000 di-off-ramp (pass-through) | **$6.0** |
| **ARPU konsumen** | | **≈ $17 / keluarga / tahun** |

Lebih kecil dari angka $50 sebelumnya — itu **disengaja**, karena angka lama mengasumsikan
xflame menangkap fee off-ramp yang realitanya milik provider. $17 adalah revenue yang
benar-benar bisa kami pungut.

**Sisi B2B (di sinilah cek besar).** Satu perjanjian white-label dengan rail bisa bernilai
lebih dari ratusan ribu user konsumen, karena kita dibayar sebagai infra atas volume mereka.

**Proyeksi blended:**

| Skenario | Konsumen | + B2B | ARR |
|---|---|---|---|
| Awal | 50k × $17 | 0 | **~$0.85M** |
| Skala | 500k × $17 | 1–2 rail deal | **$8.5M+ + B2B** |

Margin sehat karena infra (DeFindex, Soroswap, rails) **dikomposisi**, bukan dibangun dari
nol. Distribusi lewat komunitas & agen TKI menekan CAC. Revenue tumbuh dua arah: saldo AUM
naik seiring retensi, dan tiap rail deal menambah lapisan B2B.

---

## Market size

| | |
|---|---|
| **TAM** | Remittance inbound Indonesia ~**$10.6B/tahun** (~4.5M TKI). ID + PH + VN + TH gabungan **>$70B/tahun**. |
| **SAM** | Porsi yang beralih ke settlement stablecoin. MoneyGram (MGUSD) & Velo Labs/Lightnet sudah membangun rail di Stellar → mengurangi masalah "bangun trust dari nol". |
| **SOM** | Target awal ~50k keluarga aktif (fraksi kecil dari jutaan penerima remittance ID) → **~$0.85M ARR** konsumen, sebelum lapisan B2B. |

<sub>Sumber angka: Ken Research, World Bank (via `.superstack/idea-context.md`).</sub>

---

## Kenapa ini bukan model yang eksploitatif

Segmen ini rentan: banyak unbanked, sangat sensitif biaya. Core auto-split gratis, dan kami
**tidak memungut biaya di depan**. Revenue utama kami adalah bagi hasil yield — artinya kami
baru untung **setelah** user berhasil menabung dan uangnya tumbuh. Insentif kami dan user
searah: makin banyak yang mereka tahan & tumbuhkan, makin besar juga pendapatan kami. Ini
bukan rent-seeking di atas orang yang butuh; ini bagi hasil atas nilai yang benar-benar
diciptakan untuk mereka.

---

## Moat / defensibility

- **Event-triggered, bukan calendar-based.** Auto-split terjadi saat dana mendarat, bukan
  jadwal harian — hanya ekonomis karena fee Stellar mendekati nol.
- **Dikomposisi dari infra teraudit** (DeFindex/Soroswap/rails) → cepat dibangun, tidak perlu
  bootstrap trust/likuiditas.
- **Distribusi via jaringan agen & komunitas TKI** → CAC rendah, sulit ditiru pemain baru.
- **Switching cost dari goals + yield** → retensi tinggi begitu keluarga menaruh dana dan
  progress goal-nya di xflame.

---

## Rencana Grant Instawards — 3 fase

Aturan yang dipenuhi: tim ≥ 2 orang, tiap fase realistis & dapat di-develop **< 30 hari**,
funding **≤ $5k/fase**, total **≤ $15k**. Setiap fase menghasilkan milestone yang bisa
didemokan. **Revenue utama (yield/AUM) dinyalakan sejak Fase 1**; off-ramp di Fase 2 adalah
fitur penutup loop (pass-through), dan revenue B2B skala dibuka di Fase 3.

### Fase 1 — Mainnet + yield/swap live + fee primitive (~$5k, < 30 hari)

**Tujuan:** produk yang tadinya di testnet jadi live di mainnet dengan yield nyata, dan
monetisasi teknis sudah menyala.

- Deploy splitter contract ke **mainnet** (sekarang masih testnet).
- Integrasi **DeFindex** (stability → yield nyata) + **Soroswap** (DCA) di balik surface yang sama.
- **Fee module**: protocol fee hook di yield & swap.
- Polish PWA + Freighter/xBull; 5+ wawancara user untuk validasi.

**Deliverable demoable:** deposit di mainnet → tersplit → stability menghasilkan yield →
fee tercatat on-chain.

| Budget | ~USD |
|---|---|
| Development (Soroban + frontend) | 2,800 |
| Testing / audit-lite | 1,000 |
| Design / UX | 700 |
| Insentif riset user | 500 |
| **Total** | **5,000** |

### Fase 2 — Automation + tutup loop cash-out (~$5k, < 30 hari)

**Tujuan:** hilangkan aksi manual, dan tutup loop dari "uang masuk" ke "uang terpakai" lewat
off-ramp (via provider, bukan bikin sendiri).

- Income-triggered split (StellarStream / deposit webhook) — split otomatis saat dana mendarat.
- **Off-ramp ke Rupiah/e-wallet via provider berlisensi** (integrasi, bukan membangun rail).
  Kita routing + markup tipis pass-through; loop cash-out selesai.
- Wrap native app (Capacitor).

**Deliverable demoable:** remittance mendarat → auto-split tanpa aksi manual → sebagian
di-cash-out ke e-wallet lewat provider terintegrasi.

| Budget | ~USD |
|---|---|
| Development (automation + native wrap) | 3,000 |
| Integrasi off-ramp / compliance | 1,200 |
| App store / QA | 800 |
| **Total** | **5,000** |

### Fase 3 — Trust, B2B, & scale (~$5k, < 30 hari)

**Tujuan:** hilangkan penghalang kepercayaan untuk non-crypto-native, buka revenue B2B,
mulai ekspansi koridor.

- Guardian multi-sig recovery (hilangkan risiko seed-loss).
- Household shared vault (group goal — banyak anggota keluarga kontribusi ke satu dana).
- **Pilot B2B**: integrasi/POC dengan 1 rail (Velo/Lightnet) → revenue-share.
- Ekspansi 1 koridor baru (Philippines).

**Deliverable demoable:** akun dipulihkan lewat guardian; satu household vault dgn 2+
kontributor; POC integrasi rail berjalan.

| Budget | ~USD |
|---|---|
| Development (recovery + shared vault) | 3,000 |
| Security / testing | 1,000 |
| BD / partnership rail | 1,000 |
| **Total** | **5,000** |

> **Total 3 fase ≤ $15k.** Angka budget adalah template — sesuaikan saat mengisi form; yang
> penting struktur, rasio, dan tiap fase demoable dalam < 30 hari.

---

## Tim & eksekusi

Instawards mensyaratkan tim **≥ 2 orang**. Lengkapi sebelum submit:

| Peran | Nama | Tanggung jawab |
|---|---|---|
| Soroban / smart-contract | _(isi)_ | Contract, integrasi DeFindex/Soroswap |
| Frontend / GTM | _(isi)_ | PWA/native app, distribusi & user research |

---

<sub>Dokumen ini mendampingi [README](README.md) (produk & arsitektur) dan
`.superstack/idea-context.md` (riset pasar & rasional). Angka pasar bersumber dari Ken
Research & World Bank.</sub>
