const canvas = document.getElementById("oyunAlani");
const ctx = canvas.getContext("2d");
canvas.width = 1300;
canvas.height = 760;

let gemi, martilar = [], dalga;
const resimler = {};
let arkaPlanMuzik;

function yukleResim(adi, yol) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { resimler[adi] = img; resolve(); };
    img.onerror = () => { console.error(adi + " YÜKLENEMEDİ"); resolve(); };
    img.src = yol;
  });
}

function yukleSes(yol) {
  return new Promise((resolve) => {
    const audio = new Audio(yol);
    audio.oncanplaythrough = () => { arkaPlanMuzik = audio; resolve(); };
    audio.onerror = () => { console.error("MÜZİK YOK"); resolve(); };
  });
}

class Gemi {
  constructor() { this.x = 500; this.y = 520; this.genislik = 220; this.yukseklik = 170; }
  ciz() { if (resimler.gemi) ctx.drawImage(resimler.gemi, this.x, this.y, this.genislik, this.yukseklik); }
}

class Dalga {
  constructor() { this.x = 0; this.baslangicY = 97; this.y = this.baslangicY; this.zaman = 0; }
  hareketEt() { this.zaman += 0.02; this.y = this.baslangicY + Math.sin(this.zaman) * 8; }
  ciz() { if (resimler.dalga) ctx.drawImage(resimler.dalga, this.x, this.y, 1300, 600); }
}

class Marti {
  constructor(x, y, resim, hiz, yon = "sol", tersCevir = true) {
    this.x = x; this.y = y; this.resim = resim; this.hiz = hiz;
    this.yon = yon; this.tersCevir = tersCevir; this.zaman = Math.random() * 100;
  }
  hareketEt() {
    this.zaman += 0.1;
    this.y = this.y + Math.sin(this.zaman) * 6;
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
    new Marti(1400, 60, resimler.marti1, 2.0, "sol", true),
    new Marti(-100, 110, resimler.marti2, 1.6, "sag", false),
    new Marti(1600, 160, resimler.marti3, 2.4, "sol", true)
  ];

  if (arkaPlanMuzik) { arkaPlanMuzik.loop = true; arkaPlanMuzik.volume = 0.6; arkaPlanMuzik.play().catch(() => {}); }

  let dokunmatik = false;
  let sonX = 0, sonY = 0;

  const basla = (e) => { e.preventDefault(); dokunmatik = true; const t = e.touches ? e.touches[0] : e; sonX = t.clientX; sonY = t.clientY; };
  const hareket = (e) => {
    if (!dokunmatik) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const fx = t.clientX - sonX; const fy = t.clientY - sonY;
    gemi.x += fx * 0.3; gemi.y += fy * 0.3;
    gemi.x = Math.max(0, Math.min(1300 - gemi.genislik, gemi.x));
    gemi.y = Math.max(380, Math.min(580, gemi.y));
    sonX = t.clientX; sonY = t.clientY;
  };
  const bitir = () => { dokunmatik = false; };

  canvas.addEventListener("touchstart", basla);
  canvas.addEventListener("touchmove", hareket);
  canvas.addEventListener("touchend", bitir);
  canvas.addEventListener("mousedown", basla);
  canvas.addEventListener("mousemove", hareket);
  canvas.addEventListener("mouseup", bitir);
  canvas.addEventListener("mouseleave", bitir);

  function dongu() {
    ctx.drawImage(resimler.kule, 0, 0, 1300, 760);
    dalga.hareketEt(); dalga.ciz();
    martilar.forEach(m => { m.hareketEt(); m.ciz(); });
    gemi.ciz();
    requestAnimationFrame(dongu);
  }
  dongu();
}