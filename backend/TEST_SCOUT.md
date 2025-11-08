# 🎵 Scout A&R - Test Instructions

## Configuration Status ✅

Toutes les APIs critiques sont configurées et prêtes :

- ✅ **Spotify API** - Scout A&R discovery
- ✅ **YouTube API** - Analytics
- ✅ **TikTok API** - Social metrics
- ✅ **Stripe API** - Payments
- ✅ **Database** - PostgreSQL
- ✅ **Redis** - Caching

## Test Scout A&R (Windows)

### 1. Vérifier les APIs

```bash
cd backend
python test_apis_simple.py
```

### 2. Tester Scout A&R avec vraies données Spotify

```bash
cd backend
python test_scout.py
```

Ce script va :
- ✅ Se connecter à Spotify
- ✅ Scanner les nouveaux artistes émergents (1-10 releases)
- ✅ Analyser l'audio pour détecter l'IA
- ✅ Générer des tags automatiques
- ✅ Calculer le score de potentiel
- ✅ Afficher le top 5 des artistes découverts

### 3. Lancer le backend avec les vraies données

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Puis teste les endpoints API :

**Scanner des nouveaux artistes (US) :**
```
GET http://localhost:8000/api/scout/scan/new-releases?country=US&limit=20
```

**Scanner par genre (Hip-Hop) :**
```
GET http://localhost:8000/api/scout/scan/by-genre/hip-hop?limit=10
```

**Analyser le potentiel d'un artiste :**
```
GET http://localhost:8000/api/scout/artist/{spotify_id}/potential
```

**Liste des tags disponibles :**
```
GET http://localhost:8000/api/scout/tags
```

### 4. Documentation interactive

Ouvre dans ton navigateur :
```
http://localhost:8000/docs
```

Tu verras tous les endpoints Scout A&R avec la possibilité de les tester directement !

## Fonctionnalités disponibles

### 🎯 Scan de nouveaux artistes
- Filtre automatique : artistes avec 1-10 releases seulement
- Détection des premiers EP/singles
- Scan par pays (US, FR, UK, etc.)
- Filtre par genre

### 🤖 Détection d'IA
- Analyse audio avec librosa
- Score de confiance (0-100%)
- Détecte les patterns d'IA :
  - Consistance spectrale trop parfaite
  - Tempo métronomique
  - Ratios harmoniques non-naturels
  - Dynamique compressée

### 🏷️ Tags automatiques
- **Release** : first_release, emerging, single, ep
- **Popularité** : underground, rising, trending
- **Taille** : micro, small, growing
- **Authenticité** : ai_generated, authentic
- **Audio** : high_energy, danceable, acoustic
- **Timing** : new_this_week, new_this_month

### ⭐ Score de potentiel (0-100)
Basé sur :
- Popularité Spotify
- Nombre de followers
- Fréquence de releases
- Authenticité (bonus si pas IA)
- Premier release (bonus +10)

## Exemples de résultats

```json
{
  "total": 15,
  "artists": [
    {
      "spotify_id": "abc123",
      "name": "Rising Star",
      "genres": ["indie", "pop"],
      "popularity": 25,
      "followers": 3500,
      "release_type": "single",
      "release_name": "First Song",
      "is_first_release": true,
      "is_ai_generated": false,
      "ai_confidence": 0.12,
      "tags": ["first_release", "underground", "micro", "authentic", "new_this_week"],
      "potential_score": 78.5,
      "preview_url": "https://..."
    }
  ]
}
```

## Prochaines étapes

1. ✅ Tester les endpoints API
2. ⏳ Connecter le frontend Scout au backend
3. ⏳ Remplacer les données mock par les vraies
4. ⏳ Ajouter l'authentification OAuth pour les autres plateformes
5. ⏳ Créer le dashboard analytics avec YouTube/TikTok

## Problèmes courants

### "No module named 'spotipy'"
```bash
pip install -r requirements.txt
```

### "Spotify credentials not found"
Vérifie que ton fichier `.env` contient :
```env
SPOTIFY_CLIENT_ID=a18741ff80ea418f9a1d599abb844583
SPOTIFY_CLIENT_SECRET=8b12543ef93543059d873a3fe254aa03
```

### "Login anormalement long"
C'est déjà corrigé ! Les imports lourds (librosa/numpy) sont maintenant lazy.

---

**🚀 Tout est prêt ! Lance `python test_scout.py` pour voir Scout A&R en action avec de vraies données Spotify !**
