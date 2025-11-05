const canvas = document.getElementById("oyunAlani");
const ctx = canvas.getContext("2d");

// RESPONSIVE CANVAS
function resizeCanvas() {
  const ratio = 1300 / 760;
  const width = window.innerWidth;
  const height = width / ratio;
  canvas.width = 1300;
  canvas.height = 760;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let gemi, martilar = [], dalga;
const resimler = {};
let arkaPlanMuzik;

const urlParams = new URLSearchParams(window.location.search);
const gemiAdi = urlParams.get('gemi')?.toLowerCase();
const durumDiv = document.getElementById("durum");

if (gemiAdi) {
  durumDiv.innerText = `${gemiAdi.toUpperCase()}'İN GEMİSİ YÜKLENİYOR...`;
  const img = new Image();
  img.onload = () => {
    resimler.gemi = img;
    document.getElementById("yuklemeEkran").style.display = "none";
    baslatOyun();
  };
  img.onerror = () => {
    durumDiv.innerText = "GEMİ BULUNAMADI!";
  };
  img.src = `gemiler/${gemiAdi}.png`;
} else {
  durumDiv.innerText = "QR KOD YOK!";
}

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

class Gemi {
  constructor() { this.x = 500; this.y = 450; this.hiz = 12; }
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

class Dalga { /* aynı */ }
class Marti { /* aynı */ }

async function baslatOyun() {
  await Promise.all([
    yukleResim("kule", "kiz_kulesi.jpg"),
    yukleResim("dalga", "dalga.png"),
    yukleResim("marti1", "marti1.png"),
    yukleResim("marti2", "marti2.png"),
    yukleResim("marti3", "marti3.png"),
    yukleSes("istanbul_sarkisi.ogg")
  ]);

  gemi = new Gemi();
  dalga = new Dalga();
  martilar = [ /* aynı */ ];

  if (arkaPlanMuzik) { arkaPlanMuzik.loop = true; arkaPlanMuzik.volume = 0.6; arkaPlanMuzik.play().catch(() => {}); }

  let touch = null;
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
