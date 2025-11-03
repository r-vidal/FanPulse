# 🧪 Testing Release Optimizer - Guide Complet

Ce guide te montre comment tester le **Release Optimizer** end-to-end.

---

## 📋 **Prérequis**

1. **Backend en cours d'exécution**
2. **Database PostgreSQL** active
3. **Celery + Redis** configurés (optionnel pour tester manuellement)
4. **Au moins 1 artiste** créé avec des données

---

## 🚀 **Étape 1: Migrer la Database**

### **Créer les nouvelles tables**

```bash
cd backend

# Appliquer la migration
alembic upgrade head
```

**Vérifie que ça fonctionne:**
```bash
# Liste les migrations appliquées
alembic current

# Devrait afficher:
# 003_release_optimizer (head)
```

**Rollback si besoin:**
```bash
# Revenir à la version précédente
alembic downgrade -1

# Réappliquer
alembic upgrade head
```

---

## 🔧 **Étape 2: Démarrer le Backend**

### **Terminal 1: FastAPI Server**

```bash
cd backend
python -m app.main

# Ou avec uvicorn directement:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Check l'API Docs:**
Ouvre http://localhost:8000/docs

Tu devrais voir une nouvelle section **"releases"** avec:
- `GET /{artist_id}/release-scores`
- `GET /{artist_id}/release-scores/{release_date}`
- `GET /{artist_id}/competing-releases/{release_date}`
- `POST /{artist_id}/scheduled-releases`
- `GET/PUT/DELETE /{artist_id}/scheduled-releases`

---

## 📊 **Étape 3: Tester les API Endpoints**

### **3.1 - Login et Get Token**

```bash
# Login pour obtenir un JWT
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_email@example.com&password=your_password"

# Response:
# {
#   "access_token": "eyJhbGci...",
#   "token_type": "bearer"
# }
```

**Sauvegarde le token:**
```bash
export TOKEN="eyJhbGci..."
```

---

### **3.2 - Créer un Artiste (si pas encore fait)**

```bash
# Via Swagger UI: http://localhost:8000/docs
# Ou avec curl:

curl -X POST "http://localhost:8000/api/artists" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Artist",
    "genre": "hip-hop",
    "spotify_id": "test123"
  }'

# Response:
# {
#   "id": "uuid-here",
#   "name": "Test Artist",
#   ...
# }
```

**Sauvegarde l'artist_id:**
```bash
export ARTIST_ID="uuid-here"
```

---

### **3.3 - Calculer Release Scores**

```bash
# Get scores pour 8 semaines
curl -X GET "http://localhost:8000/api/releases/$ARTIST_ID/release-scores?weeks=8" \
  -H "Authorization: Bearer $TOKEN"

# Response (exemple):
# [
#   {
#     "id": "...",
#     "release_date": "2025-11-08",
#     "overall_score": 7.2,
#     "momentum_score": 6.5,
#     "competition_score": 8.0,
#     "historical_performance_score": 7.5,
#     "audience_readiness_score": 6.8,
#     "calendar_events_score": 7.0,
#     "competing_releases_count": 5,
#     "major_competing_artists": [],
#     "predicted_first_week_streams": 50000,
#     "confidence_interval_low": 35000,
#     "confidence_interval_high": 65000,
#     "advantages": [
#       "📈 Solid upward momentum heading into release",
#       "👍 Moderate competition - still a good window"
#     ],
#     "risks": [],
#     "recommendation": "✅ GREEN LIGHT - This is an optimal release window",
#     "calculated_at": "2025-11-03T17:30:00"
#   },
#   ...
# ]
```

**💡 Note**: La première fois, ça calcule frais (peut prendre quelques secondes). Ensuite, c'est mis en cache (24h).

---

### **3.4 - Détails d'une Date Spécifique**

```bash
# Get score détaillé pour une date
curl -X GET "http://localhost:8000/api/releases/$ARTIST_ID/release-scores/2025-11-15" \
  -H "Authorization: Bearer $TOKEN"

# Response: Score complet avec tous les détails
```

---

### **3.5 - Voir Competing Releases**

```bash
# Get sorties concurrentes pour une date
curl -X GET "http://localhost:8000/api/releases/$ARTIST_ID/competing-releases/2025-11-15" \
  -H "Authorization: Bearer $TOKEN"

# Response:
# [
#   {
#     "artist_name": "Drake",
#     "album_name": "New Album",
#     "album_type": "album",
#     "followers": 50000000,
#     "popularity": 95,
#     "genres": ["hip-hop", "rap"],
#     "is_major": true,
#     "spotify_url": "https://..."
#   },
#   ...
# ]
```

**💡 Note**: Pour l'instant, cette liste sera vide car le scraper n'a pas encore tourné. Teste après l'étape 4.

---

### **3.6 - Planifier une Release**

```bash
# Planifier une sortie
curl -X POST "http://localhost:8000/api/releases/$ARTIST_ID/scheduled-releases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My New Single",
    "release_type": "single",
    "release_date": "2025-11-15",
    "notes": "First single from upcoming EP"
  }'

# Response:
# {
#   "id": "...",
#   "artist_id": "...",
#   "title": "My New Single",
#   "release_date": "2025-11-15",
#   "status": "planned",
#   "chosen_score": 7.2,
#   "created_at": "..."
# }
```

---

### **3.7 - Lister Scheduled Releases**

```bash
# Get toutes les releases planifiées
curl -X GET "http://localhost:8000/api/releases/$ARTIST_ID/scheduled-releases" \
  -H "Authorization: Bearer $TOKEN"

# Response: Array of scheduled releases
```

---

### **3.8 - Update Status d'une Release**

```bash
# Marquer comme "confirmed"
curl -X PUT "http://localhost:8000/api/releases/$ARTIST_ID/scheduled-releases/RELEASE_ID?status=confirmed" \
  -H "Authorization: Bearer $TOKEN"

# Statuts possibles:
# - planned
# - confirmed
# - released
# - cancelled
```

---

## 🔄 **Étape 4: Tester les Background Tasks**

### **Terminal 2: Celery Worker**

```bash
cd backend

# Démarrer le worker
celery -A app.core.celery_app worker --loglevel=info
```

### **Terminal 3: Celery Beat (Scheduler)**

```bash
cd backend

# Démarrer beat
celery -A app.core.celery_app beat --loglevel=info
```

**💡 Les tâches planifiées:**
- **Monday 6AM**: Calculate release scores (tous les artistes)
- **Daily 3AM**: Scrape competing releases (Spotify)

---

### **4.1 - Tester Manuellement les Tasks**

#### **Test Scraping Competing Releases**

```bash
# Dans un shell Python
cd backend
python

>>> from app.tasks.releases import scrape_competing_releases_task
>>> result = scrape_competing_releases_task()
>>> print(result)
# {
#   'status': 'success',
#   'releases_added': 50,
#   'releases_deleted': 10,
#   'date_range': '2025-11-03 to 2025-12-01'
# }
```

**Check la database:**
```sql
-- Dans psql
SELECT COUNT(*) FROM competing_releases;
-- Devrait avoir des releases

SELECT * FROM competing_releases LIMIT 5;
```

---

#### **Test Calculating Release Scores**

```bash
# Dans un shell Python
cd backend
python

>>> from app.tasks.releases import calculate_release_scores_task
>>> result = calculate_release_scores_task()
>>> print(result)
# {
#   'status': 'success',
#   'artists_processed': 5,
#   'artists_failed': 0,
#   'total_artists': 5
# }
```

**Check la database:**
```sql
SELECT artist_id, release_date, overall_score, recommendation
FROM release_scores
ORDER BY overall_score DESC
LIMIT 10;
```

---

## 🧮 **Étape 5: Test le Scoring Algorithm Directement**

```python
# backend/test_release_optimizer.py
from app.core.database import get_db_sync
from app.services.release_optimizer import ReleaseOptimizer
from app.models.artist import Artist
from datetime import date

db = next(get_db_sync())

# Get an artist
artist = db.query(Artist).first()

if artist:
    optimizer = ReleaseOptimizer(db)

    # Calculate scores for 8 weeks
    scores = optimizer.calculate_release_scores(str(artist.id), weeks_ahead=8)

    print(f"\n🎯 Release Scores for {artist.name}:\n")
    for score in scores:
        print(f"📅 {score.release_date}: {score.overall_score}/10")
        print(f"   Momentum: {score.momentum_score}")
        print(f"   Competition: {score.competition_score}")
        print(f"   Predicted Streams: {score.predicted_first_week_streams:,}")
        print(f"   {score.recommendation}")
        print()
else:
    print("❌ No artists found. Create an artist first.")
```

**Run:**
```bash
cd backend
python test_release_optimizer.py
```

---

## 🎨 **Étape 6: Test via Swagger UI**

1. **Ouvre** http://localhost:8000/docs
2. **Click "Authorize"** et entre ton JWT token
3. **Expand** la section **"releases"**
4. **Try Out** chaque endpoint:
   - GET release-scores
   - GET release-scores/{date}
   - GET competing-releases
   - POST scheduled-releases
   - etc.

**Exemple de flow UI:**
1. Click `GET /{artist_id}/release-scores`
2. Try it out
3. Enter `artist_id` (ton UUID)
4. Enter `weeks=4`
5. Execute
6. Check response!

---

## 📊 **Étape 7: Vérifier les Données**

### **Check Release Scores Table**

```sql
-- Nombre de scores calculés
SELECT COUNT(*) FROM release_scores;

-- Meilleurs scores
SELECT
  a.name,
  rs.release_date,
  rs.overall_score,
  rs.recommendation
FROM release_scores rs
JOIN artists a ON rs.artist_id = a.id
WHERE rs.overall_score >= 7.5
ORDER BY rs.overall_score DESC
LIMIT 10;

-- Scores par artiste
SELECT
  a.name,
  COUNT(*) as num_scores,
  AVG(rs.overall_score) as avg_score
FROM release_scores rs
JOIN artists a ON rs.artist_id = a.id
GROUP BY a.name;
```

### **Check Scheduled Releases**

```sql
SELECT
  a.name,
  sr.title,
  sr.release_date,
  sr.status,
  sr.chosen_score
FROM scheduled_releases sr
JOIN artists a ON sr.artist_id = a.id
ORDER BY sr.release_date;
```

### **Check Competing Releases**

```sql
-- Releases par date
SELECT
  release_date,
  COUNT(*) as num_releases,
  SUM(CASE WHEN is_major_release THEN 1 ELSE 0 END) as major_releases
FROM competing_releases
GROUP BY release_date
ORDER BY release_date;

-- Top competing artists
SELECT
  artist_name,
  album_name,
  release_date,
  artist_followers,
  artist_popularity
FROM competing_releases
WHERE is_major_release = true
ORDER BY artist_followers DESC
LIMIT 10;
```

---

## 🧪 **Test Scenarios**

### **Scenario 1: Artiste avec bon momentum**
1. Crée données stream_history avec tendance positive
2. Calcule release scores
3. Check que momentum_score est élevé
4. Overall score devrait être bon (7+)

### **Scenario 2: Date avec beaucoup de compétition**
1. Scrape competing releases
2. Check une date avec 10+ releases
3. Competition_score devrait être bas (<6)
4. Recommendation devrait être YELLOW ou RED

### **Scenario 3: Planifier une release**
1. Get release scores
2. Trouve meilleure date (highest score)
3. POST scheduled release sur cette date
4. Vérifie chosen_score est sauvegardé

### **Scenario 4: Update release status**
1. Crée scheduled release (status=planned)
2. PUT status=confirmed
3. PUT status=released
4. Check released_at timestamp est set

---

## 🐛 **Troubleshooting**

### **Erreur: "No module named 'app.api.routes.releases'"**
```bash
# Vérifie que le fichier existe
ls backend/app/api/routes/releases.py

# Vérifie les imports dans main.py
cat backend/app/main.py | grep releases
```

### **Erreur: "Table release_scores does not exist"**
```bash
# Run migration
cd backend
alembic upgrade head

# Check current version
alembic current
```

### **Scores tous à 5.0 (neutral)**
C'est normal si pas de données historiques!
- Crée stream_history data pour l'artiste
- Attends data sync (ou run manuellement)
- Recalcule scores

### **Competing releases vide**
```bash
# Run scraper manuellement
python -c "from app.tasks.releases import scrape_competing_releases_task; scrape_competing_releases_task()"

# Check result
psql -d fanpulse -c "SELECT COUNT(*) FROM competing_releases;"
```

### **Celery tasks ne tournent pas**
```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Check Celery config
python -c "from app.core.config import settings; print(settings.CELERY_BROKER_URL)"

# Restart worker et beat
```

---

## ✅ **Checklist de Test Complet**

- [ ] Migration appliquée (alembic upgrade head)
- [ ] Backend démarre sans erreur
- [ ] Swagger UI montre routes "releases"
- [ ] Peut login et get token
- [ ] GET release-scores retourne data
- [ ] Scores sont sensés (0-10 range)
- [ ] Peut voir competing releases
- [ ] Peut POST scheduled release
- [ ] Peut GET/PUT/DELETE scheduled releases
- [ ] Celery worker démarre
- [ ] Celery beat démarre
- [ ] Scraper task fonctionne manuellement
- [ ] Calculate scores task fonctionne
- [ ] Database contient data dans 3 tables:
  - [ ] release_scores
  - [ ] scheduled_releases
  - [ ] competing_releases

---

## 📞 **Support**

Si problème:
1. Check logs backend: `tail -f logs/backend.log`
2. Check logs Celery worker
3. Check PostgreSQL connexion
4. Vérifie migration version: `alembic current`

---

## 🎉 **Success!**

Si tous les tests passent, le Release Optimizer est **100% fonctionnel** ! 🔥

Tu peux maintenant:
- L'intégrer au frontend
- Tester avec de vrais artistes
- Lancer les background tasks en production
- Monitorer la performance des prédictions

**Next**: Crée un beau UI pour visualiser les scores et planifier les releases! 🎨
