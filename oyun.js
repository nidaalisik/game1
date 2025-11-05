const canvas = document.getElementById("oyunAlani");
const ctx = canvas.getContext("2d");
canvas.width = 1300;
canvas.height = 760;

let gemi, martilar = [], dalga;
const resimler = {};
let arkaPlanMuzik;

const urlParams = new URLSearchParams(window.location.search);
const gemiAdi = urlParams.get('gemi');

if (gemiAdi) {
  document.getElementById("durum").innerText = `${gemiAdi.toUpperCase()}'İN GEMİSİ YÜKLENİYOR...`;
  const img = new Image();
  img.onload = () => {
    resimler.gemi = img;
    document.getElementById("yuklemeEkran").style.display = "none";
    baslatOyun();
  };
  img.onerror = () => {
    document.getElementById("durum").innerText = "GEMİ BULUNAMADI!";
  };
  img.src = `gemiler/${gemiAdi}.png`;
} else {
  document.getElementById("durum").innerText = "QR KOD YOK!";
}

// === RESİM VE SES YÜKLEME ===
function yukleResim(adi, yol) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { resimler[adi] = img; resolve(); };
    img.onerror = () => { console.error(`${adi} YÜKLENEMEDİ: ${yol}`); resolve(); };
    img.src = yol;
  });
}

function yukleSes(yol) {
  return new Promise((resolve) => {
    const audio = new Audio(yol);
    audio.oncanplaythrough = () => { arkaPlanMuzik = audio; resolve(); };
    audio.onerror = () => { console.error("MÜZİK YÜKLENEMEDİ!"); resolve(); };
  });
}

// === SINIFLAR ===
class Gemi {
  constructor() { this.x = 500; this.y = 450; this.hiz = 8; }
  hareketEt(touch) {
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = touch.clientX - rect.left;
    const clientY = touch.clientY - rect.top;
    const targetX = clientX * scaleX;
    const targetY = clientY * scaleY;

    if (targetX < this.x) this.x -= this.hiz;
    if (targetX > this.x) this.x += this.hiz;
    if (targetY < this.y) this.y -= this.hiz;
    if (targetY > this.y) this.y += this.hiz;

    this.x = Math.max(0, Math.min(1080, this.x));
    this.y = Math.max(400, Math.min(530, this.y));
  }
  ciz() { ctx.drawImage(resimler.gemi, this.x, this.y, 220, 200); }
}

class Dalga {
  constructor() { this.x = 0; this.baslangicY = 97; this.y = this.baslangicY; this.zaman = 0; }
  hareketEt() { this.zaman += 0.02; this.y = this.baslangicY + Math.sin(this.zaman) * 8; }
  ciz() { if (resimler.dalga) ctx.drawImage(resimler.dalga, this.x, this.y, 1300, 600); }
}

class Marti {
  constructor(x, y, resim, hiz, yon = "sol", tersCevir = true) {
    this.x = x; this.y = y; this.resim = resim; this.hiz = hiz; this.yon = yon; this.tersCevir = tersCevir; this.zaman = Math.random() * 100;
  }
  hareketEt() {
    this.zaman += 0.1; this.y = this.y + Math.sin(this.zaman) * 4;
    if (this.yon === "sol") { this.x -= this.hiz; if (this.x < -200) this.x = 1400; }
    else if (this.yon === "sag") { this.x += this.hiz; if (this.x > 1400) this.x = -200; }
  }
  ciz() {
    ctx.save();
    if (this.yon === "sag" && this.tersCevir) {
      ctx.translate(this.x + 140, this.y); ctx.scale(-1, 1); ctx.drawImage(this.resim, 0, 0, 140, 100);
    } else {
      ctx.drawImage(this.resim, this.x, this.y, 140, 100);
    }
    ctx.restore();
  }
}

// === OYUN BAŞLAT ===
async function baslatOyun() {
  await Promise.all([
    yukleResim("kule", "kiz_kulesi.jpg"),
    yukleResim("dalga", "dalga.png"),
    yukleResim("marti1", "marti1.png"),
    yukleResim("marti2", "marti2.png"),
    yukleResim("marti3", "marti3.png"),
    yukleSes("istanbul_sarkisi.mp3")
  ]);

  gemi = new Gemi();
  dalga = new Dalga();
  martilar = [
    new Marti(1400, 50, resimler.marti1, 1.0, "sol", true),
    new Marti(-100, 110, resimler.marti2, 1.5, "sag", false),
    new Marti(1400, 200, resimler.marti3, 2.5, "sol", true)
  ];

  if (arkaPlanMuzik) { arkaPlanMuzik.loop = true; arkaPlanMuzik.volume = 0.6; arkaPlanMuzik.play().catch(() => {}); }

  let touch;
  canvas.addEventListener("touchstart", e => { e.preventDefault(); touch = e.touches[0]; });
  canvas.addEventListener("touchmove", e => { e.preventDefault(); touch = e.touches[0]; });
  canvas.addEventListener("touchend", () => touch = null);

  function dongu() {
    ctx.drawImage(resimler.kule, 0, 0, 1300, 760);
    dalga.hareketEt(); dalga.ciz();
    martilar.forEach(m => { m.hareketEt(); m.ciz(); });
    gemi.hareketEt(touch);
    gemi.ciz();
    requestAnimationFrame(dongu);
  }
  dongu();
}

// === PARMAKLA SÜRÜKLEME (TELEFON İÇİN) ===
let dokunmatik = false;
let sonX = 0, sonY = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  dokunmatik = true