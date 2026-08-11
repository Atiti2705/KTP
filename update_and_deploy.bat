@echo off
echo ==========================================
echo  Updating SEO Lyrics Catalog from Firebase
echo ==========================================
python build_seo_lyrics.py

echo.
echo ==========================================
echo  Deploying Updated Site to Firebase Hosting
echo ==========================================
npx firebase-tools deploy --only hosting

echo.
echo Done! All new lyrics have been pre-rendered and deployed to Firebase!
