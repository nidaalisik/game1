// oyun.js – LAPTOP SON HAL (20 Kasım 2025) – MOBİL DENİZ HAREKETİ EKLENDİ
const canvas = document.getElementById("oyunAlani");
const ctx = canvas.getContext("2d");
canvas.width = 1300;
canvas.height = 760;

let gemi, martilar = [], dalga;
let baloncuklar = [];
const resimler = {};
let arkaPlanMuzik;

// === GEMİ YÜKLEME ===
document.getElementById("dosyaSec").addEventListener("change", function(e) {
  const dosya = e.target.files[0];
  if (!dosya) return;
  const img = new Image();
  img.onload = function() {
    resimler.gemi = img;
    document.getElementById("yuklemeEkran").style.display = "none";
    baslatOyun();
  };
  img.src = URL.createObjectURL(dosya);
});

// === RESİM VE SES YÜKLEME ===
function yukleResim(adi, yol) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { resimler[adi] = img; resolve(); };
    img.onerror = () => { console.error(`${adi} YÜKLENEMEDİ: ${yol}`); resolve(); };
    img.src = yol;
  });
}

// === YENİ GEMİ SINIFI (salınım + gölge) ===
class Gemi {
  constructor() {
    this.x = 500;
    this.y = 450;
    this.baseY = 450;
    this.hiz = 5;
    this.zaman = Math.random() * 100;
    this.genislik = 220;
    this.yukseklik = 200;
  }
  hareketEt(tuslar) {
    if (tuslar.ArrowLeft || tuslar.KeyA) this.x -= this.hiz;
    if (tuslar.ArrowRight || tuslar.KeyD) this.x += this.hiz;
    if (tuslar.ArrowUp || tuslar.KeyW) this.y -= this.hiz;
    if (tuslar.ArrowDown || tuslar.KeyS) this.y += this.hiz;

    this.x = Math.max(0, Math.min(canvas.width - this.genislik, this.x));
    this.y = Math.max(370, Math.min(530, this.y));
    this.baseY = this.y;
  }
  ciz() {
    this.zaman += 0.025;   // çok yumuşak salınım

    const salinimY = Math.sin(this.zaman * 2) * 7;
    const salinimX = Math.sin(this.zaman * 1.4) * 10;
    const renderX = this.x + salinimX;
    const renderY = this.baseY + salinimY;

    // gölge
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(renderX + 110, renderY + this.yukseklik + 8 + salinimY * 0.3, 92, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // gemi
    ctx.drawImage(resimler.gemi, renderX, renderY, this.genislik, this.yukseklik);
  }
}

// === DİĞER SINIFLAR (değişmedi) ===
class Baloncuk {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * (canvas.height / 3) + 500;
    this.r = Math.random() * 4 + 2;
    this.hiz = Math.random() * 1 + 0.5;
    this.alpha = Math.random() * 0.5 + 0.5;
  }
  hareketEt() { this.y -= this.hiz; this.alpha -= 0.002; }
  ciz() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${this.alpha})`;
    ctx.fill();
  }
}

class Marti {
  constructor(x, y, resim, hiz, yon = "sol", tersCevir = true) {
    this.x = x; this.y = y; this.resim = resim; this.hiz = hiz;
    this.yon = yon; this.tersCevir = tersCevir;
    this.zaman = Math.random() * 100;
  }
  hareketEt() {
    this.zaman += 0.1;
    this.y = this.y + Math.sin(this.zaman) * 4;
    if (this.yon === "sol") { this.x -= this.hiz; if (this.x < -200) this.x = 1400; }
    else { this.x += this.hiz; if (this.x > 1400) this.x = -200; }
  }
  ciz() {
    ctx.save();
    if (this.yon === "sag" && this.tersCevir) {
      ctx.translate(this.x + 140, this.y);
      ctx.scale(-1, 1);
      ctx.drawImage(this.resim, 0, 0, 140, 100);
    } else {
      ctx.drawImage(this.resim, this.x, this.y, 140, 100);
    }
    ctx.restore();
  }
}

class Dalga { constructor() { this.zaman = 0; } }  // sadece zaman tutuyoruz artık

// === OYUN BAŞLAT ===
async function baslatOyun() {
  await Promise.all([
    yukleResim("kule", "kiz_kulesi.jpg"),
    yukleResim("dalga", "dalga.png"),
    yukleResim("marti1", "marti1.png"),
    yukleResim("marti2", "marti2.png"),
    yukleResim("marti3", "marti3.png"),
    new Promise(resolve => {
      const audio = new Audio("istanbul_sarkisi.mp3");
      audio.oncanplaythrough = () => { arkaPlanMuzik = audio; resolve(); };
      audio.onerror = () => resolve();
    })
  ]);

  gemi = new Gemi();
  dalga = new Dalga();

  martilar = [
    new Marti(1400, 50, resimler.marti1, 1.0, "sol", true),
    new Marti(-100, 110, resimler.marti2, 1.5, "sag", false),
    new Marti(1400, 200, resimler.marti3, 2.5, "sol", true)
  ];

  if (arkaPlanMuzik) {
    arkaPlanMuzik.loop = true;
    arkaPlanMuzik.volume = 0.6;
    arkaPlanMuzik.play().catch(() => {});
  }

  const tuslar = {};
  window.addEventListener("keydown", e => tuslar[e.key] = true);
  window.addEventListener("keyup", e => tuslar[e.key] = false);

  // === YENİ DONUK – MOBİLDEKİ DENİZ HAREKETİ LAPTOPTA ===
  function dongu() {
    dalga.zaman += 0.019;

    const toplamDalga = Math.sin(dalga.zaman * 1.5) * 16;
    const yatayDalga  = Math.sin(dalga.zaman * 1.2) * 8;
    const denizY = 97 + toplamDalga * 0.7;

    // arka plan
    ctx.drawImage(resimler.kule, 0, 0, 1300, 760);

    // dalga (mobildeki gibi kayıyor)
    ctx.save();
    ctx.translate(yatayDalga, denizY - 10);
    ctx.drawImage(resimler.dalga, -50, -40, 1400, 650);
    ctx.restore();

    // köpük çizgisi (çok güzel duruyor)
    const gradient = ctx.createLinearGradient(0, denizY + 440, 0, denizY + 500);
    gradient.addColorStop(0, "rgba(255,255,255,0.7)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, denizY + 440, 1300, 60);

    martilar.forEach(m => { m.hareketEt(); m.ciz(); });

    gemi.hareketEt(tuslar);
    gemi.ciz();

    // baloncuklar
    if (baloncuklar.length < 30 && Math.random() < 0.3) baloncuklar.push(new Baloncuk());
    baloncuklar.forEach((b, i) => {
      b.hareketEt();
      b.ciz();
      if (b.alpha <= 0) baloncuklar.splice(i, 1);
    });

    requestAnimationFrame(dongu);
  }

  dongu();
}
