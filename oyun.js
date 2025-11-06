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
  }
  canvas.addEventListener("touchstart", muzikBaslat);

  gemi = {
    x: canvas.width * 0.1,
    y: canvas.height * 0.3,
    width: canvas.width * 0.3,
    height: canvas.width * 0.27,
    hiz: 18
  };

  dalga = {
    x: 0,
    gorunenYukseklik: canvas.height * 0.55,
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

  // Basit köpük parçacıkları
  const kopukler = Array.from({ length: 25 }).map(() => ({
    x: Math.random() * canvas.width,
    y: canvas.height * (0.6 + Math.random() * 0.2),
    r: Math.random() * 8 + 3,
    hiz: Math.random() * 0.3 + 0.1,
    parlaklik: Math.random()
  }));

  function dongu() {
    ctx.drawImage(resimler.kule, 0, 0, canvas.width, canvas.height);

    dalga.zaman += 0.01;
    const dalgalanma = Math.sin(dalga.zaman * 2) * 10;

    if (resimler.dalga.complete) {
      ctx.save();
      ctx.translate(0, canvas.height - dalga.gorunenYukseklik + dalgalanma);
      ctx.drawImage(
        resimler.dalga,
        0, 0, resimler.dalga.width, resimler.dalga.height,
        0, 0, canvas.width, dalga.gorunenYukseklik
      );
      ctx.restore();
    }

    // Köpük efekti (denizin üstü)
    kopukler.forEach(k => {
      k.x += Math.sin(k.y * 0.05 + dalga.zaman) * 0.5;
      k.y -= k.hiz;
      if (k.y < canvas.height * 0.45) {
        k.y = canvas.height * (0.6 + Math.random() * 0.2);
        k.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(k.parlaklik + dalga.zaman) * 0.2})`;
      ctx.fill();
    });

    // Martılar
    martilar.forEach(m => {
      m.zaman += 0.05;
      m.y = m.baseY + Math.sin(m.zaman) * (canvas.height * 0.05);
      if (m.yon === "sol") { m.x -= m.hiz; if (m.x < -300) m.x = canvas.width + 100; }
      else { m.x += m.hiz; if (m.x > canvas.width + 300) m.x = -200; }
      ctx.drawImage(m.resim, m.x, m.y, canvas.width * 0.12, canvas.width * 0.09);
    });

    // Gemi hareketi
    if (touch) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const targetX = (touch.clientX - rect.left) * scaleX;
      const targetY = (touch.clientY - rect.top) * scaleY - dalgalanma * 0.3;

      if (targetX < gemi.x + gemi.width/2) gemi.x -= gemi.hiz;
      if (targetX > gemi.x + gemi.width/2) gemi.x += gemi.hiz;
      if (targetY < gemi.y + gemi.height/2) gemi.y -= gemi.hiz;
      if (targetY > gemi.y + gemi.height/2) gemi.y += gemi.hiz;

      gemi.x = Math.max(0, Math.min(canvas.width - gemi.width, gemi.x));
      gemi.y = Math.max(0, Math.min(canvas.height - gemi.height, gemi.y));
    }

    // Gemi yansıması (su üzerinde)
    const yansimaY = gemi.y + gemi.height * 1.05;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.scale(1, -1);
    ctx.drawImage(resimler.gemi, gemi.x, -yansimaY - gemi.height, gemi.width, gemi.height);
    ctx.restore();

    // Gemi
    ctx.drawImage(resimler.gemi, gemi.x, gemi.y, gemi.width, gemi.height);

    requestAnimationFrame(dongu);
  }
  dongu();
}
