#!/bin/bash

# TradeMind AI - Otomatik GitHub Push Scripti
echo "🚀 TradeMind AI - GitHub Push İşlemi Başlıyor..."

# Git klasörü yoksa projeyi başlat
if [ ! -d ".git" ]; then
    echo "📁 Git reposu oluşturuluyor (git init)..."
    git init
fi

# Remoteları kontrol et, origin yoksa ekle
if ! git remote | grep -q "origin"; then
    echo "🔗 Uzak sunucu (remote) ekleniyor..."
    git remote add origin https://github.com/metehan05-eng/TradeMind-Cloude.git
else
    # Eğer origin varsa URLsine bak, yanlışsa düzelt
    current_remote=$(git remote get-url origin)
    if [ "$current_remote" != "https://github.com/metehan05-eng/TradeMind-Cloude.git" ]; then
        echo "🔄 Remote URL güncelleniyor..."
        git remote set-url origin https://github.com/metehan05-eng/TradeMind-Cloude.git
    fi
fi

# Dosyaları ekle
echo "✅ Dosyalar sahneye alınıyor (git add .)..."
git add .

# Yeni Değişiklikleri Commit et
echo "💾 Commit yapılıyor..."
git commit -m "🚀 Otonom Asistan: Kriz Simülatörü, Hukuk Modülü ve API ayarları eklendi."

# Ana branch'i main yap ve pushla
echo "☁️ GitHub'a yükleniyor (git push)..."
git branch -M main
git push -u origin main

echo "🎉 İŞLEM TAMAMLANDI! Projen başarıyla https://github.com/metehan05-eng/TradeMind-Cloude.git adresine yüklendi."
