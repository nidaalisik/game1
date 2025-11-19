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

document.getElementById("aikaLogo").style.display = "none";
document.getElementById("imza").style.display = "none";

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
  img.onerror = () => { durumDiv.innerText = "GEMİ BULUNAMADI!"; };
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
  document.getElementById("aikaLogo").style.display = "block";
  document.getElementById("imza").style.display = "block";

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

  gemi = { x: canvas.width * 0.1, y: canvas.height * 0.45, genislik: canvas.width * 0.52, yükseklik: canvas.width * 0.48, hiz: 18 };
  dalga = { zaman: 0, zaman2: 0, zaman3: 0 };

  // Köpükler
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
    // 3 katmanlı gerçekçi dalga
    dalga.zaman += 0.018;
    dalga.zaman2 += 0.012;
    dalga.zaman3 += 0.025;

    const dalga1 = Math.sin(dalga.zaman * 1.8) * 28;
    const dalga2 = Math.sin(dalga.zaman2 * 2.4 + 1) * 18;
    const dalga3 = Math.sin(dalga.zaman3 * 3.1 + 2) * 10;
    const toplamDalga = dalga1 + dalga2 + dalga3;
    const yatayDalga = Math.sin(dalga.zaman * 1.3) * 12;

    const denizY = canvas.height * 0.04 + toplamDalga * 0.9;

    // 1. Arka plan (hafif dalgalı)
    ctx.drawImage(resimler.kule, yatayDalga * 0.3, toplamDalga * 0.08, canvas.width, canvas.height);

    // 2. DALGA – EKRANDAN ASLA ÇIKMAZ!
    ctx.save();
    ctx.translate(yatayDalga * 0.8, denizY);
    const ekstraGenislik = canvas.width + Math.abs(yatayDalga) * 4;

    // İlk dalga
    ctx.drawImage(
      resimler.dalga,
      0, resimler.dalga.height * 0.05,
      resimler.dalga.width, resimler.dalga.height * 0.95,
      -ekstraGenislik / 2, 0,
      ekstraGenislik, canvas.height * 1.2
    );
    // İkinci dalga (kesinlikle boşluk kalmasın diye)
    ctx.drawImage(
      resimler.dalga,
      0, resimler.dalga.height * 0.05,
      resimler.dalga.width, resimler.dalga.height * 0.95,
      -ekstraGenislik / 2 + ekstraGenislik, 0,
      ekstraGenislik, canvas.height * 1.2
    );
    ctx.restore();

    // 3. Köpük baloncukları
    kopukler.forEach(k => {
      k.x += k.hizX + Math.cos(dalga.zaman3 + k.x * 0.02) * 1.2;
      k.y += k.hizY + toplamDalga * 0.18;
      if (k.x < 0) k.x = canvas.width;
      if (k.x > canvas.width) k.x = 0;
      const minY = denizY + 20;
      if (k.y < minY) k.y = minY + Math.random() * 80;
      if (k.y > canvas.height) k.y = minY + Math.random() * 100;

      const parlaklik = 0.3 + Math.abs(toplamDalga) * 0.02;
      ctx.beginPath();
      ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${k.saydam + parlaklik})`;
      ctx.fill();
    });

    // 4. Köpük üst çizgisi (her zaman görünür)
    const gradient = ctx.createLinearGradient(0, denizY - 20, 0, denizY + 60);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, denizY - 20, canvas.width, 80);

    // 5. Martılar
    martilar.forEach(m => {
      m.zaman += 0.05;
      m.y = m.baseY + Math.sin(m.zaman) * (canvas.height * 0.05) + toplamDalga * 0.25;
      if (m.yon === "sol") { m.x -= m.hiz; if (m.x < -300) m.x = canvas.width + 100; }
      else { m.x += m.hiz; if (m.x > canvas.width + 300) m.x = -200; }
      ctx.drawImage(m.resim, m.x, m.y, canvas.width * 0.12, canvas.width * 0.09);
    });

    // 6. Gemi hareketi
    if (touch) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const targetX = (touch.clientX - rect.left) * scaleX;
      const targetY = (touch.clientY - rect.top) * scaleY;

      if (targetX < gemi.x + gemi.genislik / 2) gemi.x -= gemi.hiz;
      if (targetX > gemi.x + gemi.genislik / 2) gemi.x += gemi.hiz;
      if (targetY < gemi.y + gemi.yükseklik / 2) gemi.y -= gemi.hiz;
      if (targetY > gemi.y + gemi.yükseklik / 2) gemi.y += gemi.hiz;

      const ustSinir = canvas.height * 0.15;
      gemi.x = Math.max(0, Math.min(canvas.width - gemi.genislik, gemi.x));
      gemi.y = Math.max(ustSinir, Math.min(canvas.height - gemi.yükseklik, gemi.y));
    } else {
      gemi.y = canvas.height * 0.45 + Math.sin(dalga.zaman * 2) * 10;
    }

    // 7. Gemi gölgesi
    const gölgeY = gemi.y + gemi.yükseklik - 10 + toplamDalga * 0.3;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.ellipse(gemi.x + gemi.genislik * 0.5, gölgeY + 10, gemi.genislik * 0.4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. Gemi
    ctx.drawImage(resimler.gemi, gemi.x, gemi.y, gemi.genislik, gemi.yükseklik);

    requestAnimationFrame(dongu);
  }
  dongu();
}
