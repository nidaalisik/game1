const canvas = document.getElementById("oyunAlani");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * 2;
  canvas.height = height * 2;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let gemi, martilar = [], dalga, kopukler = [];
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

async function baslatOyun() {
  await Promise.all([
    yukleResim("kule", "kiz_kulesi_uzun.jpg"),
    yukleResim("dalga", "dalga.png"),
    yukleResim("marti1", "marti1.png"),
    yukleResim("marti2", "marti2.png"),
    yukleResim("marti3", "marti3.png")
  ]);

  arkaPlanMuzik = new Audio("istanbul_sarkisi.mp3");
  arkaPlanMuzik.loop = true;
  arkaPlanMuzik.volume = 0.6;

  function muzikBaslat() {
    arkaPlanMuzik.play().catch(() => {});
    canvas.removeEventListener("touchstart", muzikBaslat);
    canvas.removeEventListener("click", muzikBaslat);
  }
  canvas.addEventListener("touchstart", muzikBaslat);
  canvas.addEventListener("click", muzikBaslat);

  gemi = {
    x: canvas.width * 0.1,
    y: canvas.height * 0.45,
    genislik: canvas.width * 0.3,
    yükseklik: canvas.width * 0.27,
    hiz: 18
  };

  dalga = { zaman: 0 };

  // Köpük baloncuklarını oluştur
  kopukler = [];
  for (let i = 0; i < 40; i++) {
    kopukler.push({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.4 + Math.random() * (canvas.height * 0.3),
      r: Math.random() * 12 + 3,
      hizX: (Math.random() - 0.5) * 0.5,
      hizY: (Math.random() - 0.5) * 0.3,
      saydam: Math.random() * 0.5 + 0.2
    });
  }

  martilar = [
    { x: canvas.width, baseY: canvas.height * 0.1, y: canvas.height * 0.1, resim: resimler.marti1, hiz: 1.5, yon: "sol", zaman: 0 },
    { x: -200, baseY: canvas.height * 0.2, y: canvas.height * 0.2, resim: resimler.marti2, hiz: 2.0, yon: "sag", zaman: 1.5 },
    { x: canvas.width, baseY: canvas.height * 0.3, y: canvas.height * 0.3, resim: resimler.marti3, hiz: 1.0, yon: "sol", zaman: 3 }
  ];

  let touch = null;
  canvas.addEventListener("touchstart", e => { e.preventDefault(); touch = e.touches[0]; });
  canvas.addEventListener("touchmove", e => { e.preventDefault(); touch = e.touches[0]; });
  canvas.addEventListener("touchend", () => touch = null);

  function dongu() {
    // --- ARKA PLAN --- //
    ctx.drawImage(resimler.kule, 0, 0, canvas.width, canvas.height);

    // --- DALGA VE GÖLGE --- //
dalga.zaman += 0.02;
const dalgalanma = Math.sin(dalga.zaman * 2) * 10;

// dalganın yukarıdan başlaması
const denizBaslangicY = canvas.height * 0.30; 
// perde gibi aşağı doğru uzasın
const maxDalgaYukseklik = canvas.height * 0.70;
const uzama = (Math.sin(dalga.zaman) * 0.5 + 0.5) * 0.3 + 0.7; // 0.7–1.0 arası uzama oranı
const dalgaYukseklik = maxDalgaYukseklik * uzama;

const kaynakY = resimler.dalga.height * 0.18;
const kaynakYukseklik = resimler.dalga.height * 0.82;

ctx.save();
ctx.translate(0, denizBaslangicY + dalgalanma);
ctx.drawImage(
  resimler.dalga,
  0, kaynakY,
  resimler.dalga.width, kaynakYukseklik,
  0, 0,
  canvas.width, dalgaYukseklik // 👈 işte bu yukarı-aşağı uzuyor
);
ctx.restore();



    // --- KÖPÜK BALONCUKLARI --- //
    kopukler.forEach(k => {
      k.x += k.hizX;
      k.y += k.hizY + Math.sin(dalga.zaman + k.x * 0.01) * 0.3;
      if (k.x < 0) k.x = canvas.width;
      if (k.x > canvas.width) k.x = 0;
      if (k.y < denizBaslangicY) k.y = denizBaslangicY + 20 + Math.random() * 100;
      if (k.y > canvas.height) k.y = denizBaslangicY + Math.random() * 100;

      ctx.beginPath();
      ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${k.saydam})`;
      ctx.fill();
    });

    // --- KÖPÜK (beyaz parlak üst kenar) --- //
    const köpükY = denizBaslangicY - 15 + dalgalanma;
    const köpükYukseklik = 40;
    const gradient = ctx.createLinearGradient(0, köpükY, 0, köpükY + köpükYukseklik);
    gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, köpükY, canvas.width, köpükYukseklik);

    // --- MARTILAR --- //
    martilar.forEach(m => {
      m.zaman += 0.05;
      m.y = m.baseY + Math.sin(m.zaman) * (canvas.height * 0.05);
      if (m.yon === "sol") { m.x -= m.hiz; if (m.x < -300) m.x = canvas.width + 100; }
      else { m.x += m.hiz; if (m.x > canvas.width + 300) m.x = -200; }
      ctx.drawImage(m.resim, m.x, m.y, canvas.width * 0.12, canvas.width * 0.09);
    });

    // --- GEMİ HAREKET --- //
    if (touch) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const targetX = (touch.clientX - rect.left) * scaleX;
      const targetY = (touch.clientY - rect.top) * scaleY - dalgalanma * 0.3;

      if (targetX < gemi.x + gemi.genislik / 2) gemi.x -= gemi.hiz;
      if (targetX > gemi.x + gemi.genislik / 2) gemi.x += gemi.hiz;
      if (targetY < gemi.y + gemi.yükseklik / 2) gemi.y -= gemi.hiz;
      if (targetY > gemi.y + gemi.yükseklik / 2) gemi.y += gemi.hiz;

      gemi.x = Math.max(0, Math.min(canvas.width - gemi.genislik, gemi.x));
      gemi.y = Math.max(0, Math.min(canvas.height - gemi.yükseklik, gemi.y));
    }

    // --- GEMİ GÖLGESİ --- //
    const gölgeY = gemi.y + gemi.yükseklik + 10; // hemen altı
    ctx.save();
    ctx.scale(1, -1); // ters
    ctx.globalAlpha = 0.25;
    ctx.drawImage(
      resimler.gemi,
      gemi.x,
      -(gölgeY + gemi.yükseklik),
      gemi.genislik,
      gemi.yükseklik
    );
    ctx.restore();
    ctx.globalAlpha = 1;

    // --- GEMİ --- //
    ctx.drawImage(resimler.gemi, gemi.x, gemi.y, gemi.genislik, gemi.yükseklik);

    requestAnimationFrame(dongu);
  }

  dongu();
}










