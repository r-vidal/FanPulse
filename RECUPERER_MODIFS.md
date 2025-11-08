# 🔧 Récupérer les modifications Scout A&R

## ❌ Problème

GitHub Desktop ne peut pas pull à cause d'une référence Git cassée.

## ✅ Solution (Windows)

### Option 1 : Script automatique (RECOMMANDÉ)

1. Ouvre l'Explorateur de fichiers
2. Va dans `C:\Users\Rodolphe Vidal\Documents\GitHub\FanPulse`
3. Double-clique sur **`fix_git.bat`**
4. Le script va nettoyer automatiquement Git
5. Ensuite, dans GitHub Desktop : **Fetch origin**

### Option 2 : Ligne de commande Git

Ouvre Git Bash ou PowerShell dans le dossier FanPulse :

```bash
# 1. Supprimer la référence cassée
rm -f .git/refs/remotes/origin/HEAD

# 2. Nettoyer Git
git gc --prune=now

# 3. Récupérer depuis GitHub
git fetch origin --prune

# 4. Réinitialiser HEAD
git remote set-head origin main

# 5. Récupérer ta branche
git checkout claude/fanpulse-2026-dashboard-analytics-011CUrhvrHvwkaAr8kDdjA9K
git pull origin claude/fanpulse-2026-dashboard-analytics-011CUrhvrHvwkaAr8kDdjA9K
```

### Option 3 : Clone frais (si tout échoue)

```bash
# Sauvegarde ton .env d'abord !
cp backend/.env backend/.env.backup

# Clone le repo
cd ..
git clone https://github.com/r-vidal/FanPulse.git FanPulse-new
cd FanPulse-new

# Récupère ta branche
git checkout claude/fanpulse-2026-dashboard-analytics-011CUrhvrHvwkaAr8kDdjA9K

# Restaure ton .env
cp ../FanPulse/backend/.env.backup backend/.env
```

## 📦 Commits à récupérer

Voici ce qui a été fait sur Scout A&R :

```
22e401d - docs(scout): Add API testing scripts and Scout A&R test documentation
d78343d - perf(scout): Lazy import librosa/numpy to speed up app startup
583e21e - fix(scout): Correct dependency function name to get_current_user
36c32b9 - feat(scout): Add Scout A&R with Spotify scanning and AI music detection
```

## 📂 Fichiers créés/modifiés

### Backend Scout A&R
- `backend/app/api/routes/scout.py` (NOUVEAU)
- `backend/app/services/spotify_scout.py` (NOUVEAU)
- `backend/app/services/ai_music_detector.py` (NOUVEAU)
- `backend/app/main.py` (modifié - ajout scout router)
- `backend/requirements.txt` (modifié - ajout spotipy, librosa, soundfile)

### Scripts de test
- `backend/test_apis_simple.py` (NOUVEAU)
- `backend/test_scout.py` (NOUVEAU)
- `backend/TEST_SCOUT.md` (NOUVEAU)

### Configuration
- `backend/.env` (DEVRAIT exister avec tes clés API)

## 🎯 Après la récupération

1. **Vérifie que ton `.env` a bien les clés Spotify :**
   ```bash
   cd backend
   python test_apis_simple.py
   ```

2. **Teste Scout A&R avec vraies données :**
   ```bash
   python test_scout.py
   ```

3. **Lance le backend :**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

4. **Ouvre la doc API :**
   ```
   http://localhost:8000/docs
   ```

## ❓ Besoin d'aide ?

Si ça ne marche toujours pas après ces étapes, dis-moi et je t'aide différemment !
