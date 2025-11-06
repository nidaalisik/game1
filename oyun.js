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

async function baslatOyun() {
  await Promise.all([
    yukleResim("kule", "kiz_kulesi_uzun.jpg"),
    yukleResim("dalga", "dalga.png"),  // İNCE YATAY DALGA!
    yukleResim("marti1", "marti1.png"),
    yukleResim("marti2", "marti2.png"),
    yukleResim("marti3", "marti3.png")
  ]);

  arkaPlanMuzik = new Audio("istanbul_sarkisi.mp3");
  arkaPlanMuzik.loop = true;
  arkaPlanMuzik.volume = 0.6;
  arkaPlanMuzik.play().catch(() => {});

  gemi = {
    x: canvas.width * 0.1,
    y: canvas.height * 0.3,
    width: canvas.width * 0.3,
    height: canvas.width * 0.27,
    hiz: 18
  };
  const yazi = {
  metin: "KAPTAN!",
  x: canvas.width / 2,
  y: canvas.height * 0.18,  // YUKARI → TAŞMAZ!
  fontSize: canvas.width * 0.08,
  renk: "#FF0000"  // KIRMIZI!
};
  // DALGA AYARLARI → İNCE + EKRANA OTURUYOR!
  dalga = {
    x: 0,
    baseY: canvas.height * 0.22,  // DALGA DENİZ YÜZEYİNDE
    width: canvas.width,
    height: canvas.height * 0.48,  // İNCE YÜKSEKLİK
    zaman: 0
  };

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
    // 1. ARKA PLAN
    ctx.drawImage(resimler.kule, 0, 0, canvas.width, canvas.height);

    // 2. DALGA KATMANI (İNCE + DOĞAL)
    dalga.zaman += 0.02;
    const dalgaOfset = Math.sin(dalga.zaman) * 20;  // HAFİF HAREKET
    const dalgaY = dalga.baseY + dalgaOfset;

    ctx.drawImage(resimler.dalga, dalga.x, dalgaY, dalga.width, dalga.height);


    // 3. YAZI → KIRMIZI + ORTADA!
    ctx.font = `bold ${yazi.fontSize}px Arial`;
    ctx.fillStyle = yazi.renk;
    ctx.textAlign = "center";
    ctx.fillText(yazi.metin, yazi.x, yazi.y);

    
    // 3. MARTILAR
    martilar.forEach(m => {
      m.zaman += 0.05;
      m.y = m.baseY + Math.sin(m.zaman) * (canvas.height * 0.05);
      if (m.yon === "sol") { m.x -= m.hiz; if (m.x < -300) m.x = canvas.width + 100; }
      else { m.x += m.hiz; if (m.x > canvas.width + 300) m.x = -200; }
      ctx.drawImage(m.resim, m.x, m.y, canvas.width * 0.12, canvas.width * 0.09);
    });

    // 4. GEMİ HAREKET
    if (touch) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const targetX = (touch.clientX - rect.left) * scaleX;
      const targetY = (touch.clientY - rect.top) * scaleY - dalgaOfset * 0.3;

      if (targetX < gemi.x + gemi.width/2) gemi.x -= gemi.hiz;
      if (targetX > gemi.x + gemi.width/2) gemi.x += gemi.hiz;
      if (targetY < gemi.y + gemi.height/2) gemi.y -= gemi.hiz;
      if (targetY > gemi.y + gemi.height/2) gemi.y += gemi.hiz;

      gemi.x = Math.max(0, Math.min(canvas.width - gemi.width, gemi.x));
      gemi.y = Math.max(0, Math.min(canvas.height - gemi.height, gemi.y));
    }

    // 5. GEMİ
    ctx.drawImage(resimler.gemi, gemi.x, gemi.y, gemi.width, gemi.height);

    requestAnimationFrame(dongu);
  }
  dongu();
}












