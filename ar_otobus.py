
import pygame
import sys
import os
from pathlib import Path
import math

# Pygame başlat
pygame.init()

# ============================================
# AYARLAR - Buradan gemi değiştirin!
# ============================================
AKTIF_GEMI = "gemi1.png"   
# ============================================

# Ekran ayarları (2560x1600 için optimize)

EKRAN_GENISLIK = 1300   
EKRAN_YUKSEKLIK = 760
FPS = 60

# Renkler
MAVI = (41, 128, 185)  # Deniz mavisi
BEYAZ = (255, 255, 255)
SARI = (241, 196, 15)
KIRMIZI = (255, 0, 0)

# Pencere oluştur
ekran = pygame.display.set_mode((EKRAN_GENISLIK, EKRAN_YUKSEKLIK))
pygame.display.set_caption("🚢 İstanbul - Kız Kulesi Gemi Oyunu 🏰")
saat = pygame.time.Clock()

# Dalga animasyonu için değişkenler
dalga_offset = 0
dalga_hiz = 2

class Gemi:
    def __init__(self, x, y, resim_yolu):
        self.orijinal_resim = None
        self.resim = None
        self.rect = None
        self.hiz = 8
       
        # Gemi resmini yükle
        try:
            self.orijinal_resim = pygame.image.load(resim_yolu).convert_alpha()
            # Gemiyi uygun boyuta ölçekle (max 300px genişlik)
            genislik = self.orijinal_resim.get_width()
            yukseklik = self.orijinal_resim.get_height()
            
            if genislik > 300:
                yeni_genislik = 300
                yeni_yukseklik = int(yukseklik * (300 / genislik))
                self.resim = pygame.transform.scale(self.orijinal_resim, (yeni_genislik, yeni_yukseklik))
            else:
                self.resim = self.orijinal_resim
                
            self.rect = self.resim.get_rect()
            self.rect.x = x
            self.rect.y = y
            
        except Exception as e:
            print(f"❌ Hata: Gemi resmi yüklenemedi! ({resim_yolu})")
            print(f"   Hata mesajı: {e}")
            print(f"📁 Lütfen gemi resmini buraya koyun:")
            print(f"   {Path(resim_yolu).absolute()}")
            pygame.quit()
            sys.exit()
    
    def hareket_et(self, tuslar):
        
        if tuslar[pygame.K_LEFT]:  # Sol ok
            self.rect.x -= self.hiz
        if tuslar[pygame.K_RIGHT]:  # Sağ ok
            self.rect.x += self.hiz
        if tuslar[pygame.K_UP]:  # Yukarı ok
            self.rect.y -= self.hiz
        if tuslar[pygame.K_DOWN]:  # Aşağı ok
            self.rect.y += self.hiz
        
        # Ekran dışına çıkmasın
        if self.rect.x < 0:
            self.rect.x = 0
        if self.rect.x > EKRAN_GENISLIK - self.rect.width:
            self.rect.x = EKRAN_GENISLIK - self.rect.width
        #if self.rect.y < 0:
        #    self.rect.y = 0
        #if self.rect.y > EKRAN_YUKSEKLIK - self.rect.height:
        #    self.rect.y = EKRAN_YUKSEKLIK - self.rect.height
    

        # Üst sınır: Geminin ekranın en üstüne çıkmasını engellemek için (Deniz seviyesi kuralına uyarak)
        # Buraya bir 'min_y' değeri koymalıyız. Örneğin, gemi en fazla 250. satıra kadar çıksın.
        MIN_Y_SEVIYESI = 340
        
        # 2. MAX_Y_SEVIYESI (EN ALT SINIR: Gemi buradan aşağı inemez)
        # Geminin en altta kalacağı Y değeri. (Daha büyük sayı = Daha aşağıda)
        # ESC yazısı gemiyi kesiyorsa, bu sayıyı küçültün (örneğin 650 yapın).
        MAX_Y_SEVIYESI = 510
        
        if self.rect.y < MIN_Y_SEVIYESI:
            self.rect.y = MIN_Y_SEVIYESI
        
        if self.rect.y > MAX_Y_SEVIYESI: # Bu kontrol MUTLAKA AÇIK OLMALI!
            self.rect.y = MAX_Y_SEVIYESI



    def ciz(self, ekran):
       
        ekran.blit(self.resim, self.rect)

class Marti:
    def __init__(self, x, y, resim_yolu, hiz=4):
        self.resim = None
        self.rect = None
        self.hiz = hiz
        self.baslangic_y = y # Dikey sallanma için başlangıç Y konumu
        self.zaman_sayac = 0
        
        # !!! ÖNEMLİ: HATA AYIKLAMA İÇİN try-except KALDIRILDI !!!
        # Hata olursa program kapanacak ve doğru yolu gösterecek.
        self.resim = pygame.image.load(resim_yolu).convert_alpha()
        self.resim = pygame.transform.scale(self.resim, (80, 50)) 
        self.rect = self.resim.get_rect()
        self.rect.x = x
        self.rect.y = y
        # !!! ÖNEMLİ: HATA AYIKLAMA İÇİN try-except KALDIRILDI !!!
            
    def hareket_et(self):
        # Eğer resim yüklendiyse (yani program çökmediyse) hareket et.
        # Martılar yatayda geriye (sola) hareket ederken dikeyde sallanır.
        
        self.zaman_sayac += 0.1 
        y_kayma = int(15 * math.sin(self.zaman_sayac)) # 15 piksel yukarı/aşağı sallanma
        
        self.rect.x -= self.hiz # Soldan sağa doğru hareket (ekrandan dışarı çıkacak)
        
        # Baslangıç Y'sine göre sallanma
        self.rect.y = self.baslangic_y + y_kayma 

        # Eğer ekranın soluna geçerse, sağdan tekrar başlasın
        if self.rect.right < 0:
            self.rect.left = EKRAN_GENISLIK
            # Yeni Y konumu rastgeleleştirilebilir (daha doğal görünmesi için)
            self.baslangic_y = 50 + (self.baslangic_y % 150) # Basit bir rastgele Y ayarı
            self.zaman_sayac = 0 # Salınımı sıfırla

    def ciz(self, ekran):
        ekran.blit(self.resim, self.rect)

class KizKulesi: # Yeni Sınıf
    def __init__(self, x, y, resim_yolu, max_salinim=5):
        self.resim = None
        self.rect = None
        
        try:
            # Burayı resim yolunuza göre güncelleyin
            self.orijinal_resim = pygame.image.load(resim_yolu).convert_alpha()
            
            # Boyutlandırma: Örneğin 150 piksel yüksekliğinde olsun
            orijinal_yukseklik = self.orijinal_resim.get_height()
            hedef_yukseklik = 900
            oran = hedef_yukseklik / orijinal_yukseklik
            yeni_genislik = int(self.orijinal_resim.get_width() * oran)
            
            self.resim = pygame.transform.scale(self.orijinal_resim, (yeni_genislik, hedef_yukseklik))
            self.rect = self.resim.get_rect(center=(x, y))

        except Exception as e:
            print(f"❌ Hata: Kız Kulesi resmi yüklenemedi! ({resim_yolu})")
            print(f"   Hata mesajı: {e}")
            pygame.quit()
            sys.exit()
            
        self.baslangic_y = y
        self.salinim_miktari = max_salinim # Maksimum dikey kayma (piksel)
        self.salinim_hizi = 0.05 # Ne kadar hızlı sallanacağı
        self.zaman_sayac = 0

    def hareket_et(self):
        self.zaman_sayac += self.salinim_hizi
        # Sinüs fonksiyonu ile dikey hareket
        y_kayma = int(self.salinim_miktari * math.sin(self.zaman_sayac))
        self.rect.y = self.baslangic_y + y_kayma

    def ciz(self, ekran):
        ekran.blit(self.resim, self.rect)

def dalga_ciz(ekran, offset):
  
    dalga_yukseklik = 20
    dalga_genislik = 100
    dalga_sayisi = (EKRAN_GENISLIK // dalga_genislik) + 2
    
    # Alt kısımda dalgalar
    for i in range(dalga_sayisi):
        x = i * dalga_genislik + offset
        # Sinüs dalgası efekti
        for j in range(3):
            y_baslangic = EKRAN_YUKSEKLIK - 200 + (j * 30)
            pygame.draw.arc(ekran, BEYAZ, 
                          (x - dalga_genislik, y_baslangic, dalga_genislik * 2, dalga_yukseklik * 2),
                          0, 3.14, 3)


def arkaplan_yukle():
    
    arkaplan_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\kiz_kulesi.jpg"
    
    try:
        arkaplan = pygame.image.load(arkaplan_yolu).convert()
        # Ekran boyutuna ölçekle
        arkaplan = pygame.transform.scale(arkaplan, (EKRAN_GENISLIK, EKRAN_YUKSEKLIK))
        return arkaplan, True
    except Exception as e:
        print(f"⚠️  Uyarı: Kız Kulesi arkaplanı yüklenemedi")
        print(f"   Arkaplan yerine mavi deniz kullanılacak")
        print(f"   Arkaplan için resmi buraya koyun: {arkaplan_yolu}")
        return None, False



def main():

    global dalga_offset
    
    # Arkaplanı yükle
    arkaplan, arkaplan_var = arkaplan_yukle()
    
    marti1_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\marti1.png" # <-- LÜTFEN BU YOLU KONTROL EDİN
    marti2_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\marti2.png" # İkinci resim yolu
    marti3_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\marti3.png"
    # Martı 1: Biraz yüksekte, yavaş
    marti1 = Marti(EKRAN_GENISLIK + 200, 100, marti1_yolu, hiz=3) 
    # Martı 2: Biraz daha aşağıda, daha hızlı
    marti2 = Marti(EKRAN_GENISLIK + 300, 150, marti2_yolu, hiz=4)
    marti3 = Marti(EKRAN_GENISLIK +400, 250, marti3_yolu, hiz=3)

    # Gemi oluştur
    gemi_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\gemi1.png"
    gemi = Gemi(EKRAN_GENISLIK // 2 - 150, EKRAN_YUKSEKLIK // - 300, gemi_yolu)
    
    # === YENİ: KIZ KULESİ OLUŞTURMA ===
    # Bu yolu ve başlangıç konumunu, kule resminizin konumuna göre ayarlayın
    kule_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\deniz_deseni.png" # <-- Yeni resim yolu
    # Kuleyi, arkaplan resmindeki kabaca konumuna yerleştirin (Bu değerleri deneme yanılma ile bulmanız gerekebilir)
    kule_x = EKRAN_GENISLIK - 658
    kule_y = EKRAN_YUKSEKLIK - 845 # Deniz seviyesinden biraz yukarıda
    
    kiz_kulesi = KizKulesi(kule_x, kule_y, kule_yolu, max_salinim=5) # max_salinim=3 ile çok az sallanır

    # Yazı fontu
    font_buyuk = pygame.font.Font(None, 72)
    font_kucuk = pygame.font.Font(None, 48)
    
    # Başlık metni
    baslik = font_buyuk.render(" İSTANBUL - KIZ KULESİ ", True, KIRMIZI)
    baslik_rect = baslik.get_rect(center=(EKRAN_GENISLIK // 2, 60))
    
    # Talimat metni
    talimat = font_kucuk.render("-> Ok tuşlarıyla hareket ettir! <- ", True, KIRMIZI)
    talimat_rect = talimat.get_rect(center=(EKRAN_GENISLIK // 2, 140))
    
    # Çıkış metni
    cikis = font_kucuk.render("ESC - Çıkış", True, BEYAZ)
    cikis_rect = cikis.get_rect(bottomright=(EKRAN_GENISLIK - 30, EKRAN_YUKSEKLIK - 30))
    
    print("\" + \"="*60)
    print("🎮 OYUN BAŞLADI!")
    print("="*60)
    print(f"✅ Aktif Gemi: {AKTIF_GEMI}")
    print("🎮 Kontroller:")
    print("   ⬆️ ⬇️ ⬅️ ➡️ : Gemi hareketi")
    print("   ESC        : Çıkış")
    print("=\"*60 + \"")
    # === YENİ: ARKA PLAN MÜZİĞİNİ YÜKLEME ===
    
    # 1. Şarkı dosyanızın yolunu ve adını buraya yazın
    sarki_yolu = r"C:\Users\Sedat Akgül.SEDATAKGUL\Desktop\schproject\istanbul_sarkisi.mp3" # <<< DOSYA YOLUNU KONTROL EDİN
    
    try:
        # Pygame Mixer başlat
        print("DEBUG: Mixer başlatılıyor...")
        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=4096)
        
        # Müziği yükle
        print("DEBUG: Müzik yükleniyor...")
        pygame.mixer.music.load(sarki_yolu)
        
        # Müziği sonsuza kadar döngüde çal (-1 sonsuz döngü demektir)
        pygame.mixer.music.play(-1)
        
        # İsteğe bağlı: Sesi ayarlama (0.0 en kısık, 1.0 en yüksek)
        pygame.mixer.music.set_volume(1.0) 
        
        print("🎶 Arka plan müziği yüklendi ve çalmaya başladı.")

    except pygame.error as e:
        print(f"⚠️ Uyarı: Arka plan müziği yüklenemedi veya ses sistemi hatası var.")
        print(f"   Hata mesajı: {e}")
        print(f"   Kontrol edin: Ses dosyası doğru klasörde mi? ({sarki_yolu})")
    # ===========================================

    # Ana oyun döngüsü
    calisma = True
    while calisma:
        # Olayları kontrol et
        for olay in pygame.event.get():
            if olay.type == pygame.QUIT:
                calisma = False
            if olay.type == pygame.KEYDOWN:
                if olay.key == pygame.K_ESCAPE:
                    calisma = False
        
        # Tuş basımlarını al
        tuslar = pygame.key.get_pressed()
        
        # Gemi hareketini güncelle
        gemi.hareket_et(tuslar)
        
        # === YENİ: KIZ KULESİ HAREKETİNİ GÜNCELLE ===
        kiz_kulesi.hareket_et()


       # === YENİ: MARTI HAREKETİNİ GÜNCELLE ===
        marti1.hareket_et()
        marti2.hareket_et()
        marti3.hareket_et()

        # Dalga animasyonunu güncelle
        dalga_offset -= dalga_hiz
        if dalga_offset < -100:
            dalga_offset = 0
        
        # ÇİZİM
        # Arkaplan
        if arkaplan_var:
            ekran.blit(arkaplan, (0, 0))
       # else:
       #     ekran.fill(MAVI)
       # ekran.fill(MAVI)
        # Dalgalar
        dalga_ciz(ekran, dalga_offset)
        marti1.ciz(ekran)
        marti2.ciz(ekran)
        marti3.ciz(ekran)
        kiz_kulesi.ciz(ekran) # <-- Bu, hareket eden kuleyi çizecek
        # Gemi
        gemi.ciz(ekran)
        

        

        
        # Metinler (yarı saydam arkaplan ile)
        # Başlık için arkaplan
        s = pygame.Surface((EKRAN_GENISLIK, 200))
        s.set_alpha(128)
        s.fill((0, 0, 0))
        #ekran.blit(s, (0, 0))
        
        ekran.blit(baslik, baslik_rect)
        ekran.blit(talimat, talimat_rect)
        ekran.blit(cikis, cikis_rect)
        
        # Ekranı güncelle
        pygame.display.flip()
        saat.tick(FPS)

        #if pygame.mixer.music.get_busy():
        #    pygame.mixer.music.stop()
    
    print("👋 Oyun kapatıldı. Görüşmek üzere!")
    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()
