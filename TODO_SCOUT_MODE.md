# 📋 FANPULSE - TODO TECHNIQUE SCOUT MODE (Ajout 2 Features)

## 🏢 TIER: LABEL (€999/mois) - SUITE SCOUT MODE

---

## FEATURE 18: Scout Mode - Auto-Filtering Quotidien par Style/Genre

### Frontend à créer

#### 📄 Page "Scout Preferences" - Configuration filtres permanents

- [ ] Section genres prioritaires (checkboxes, max 3)
- [ ] Section sous-genres par genre principal
- [ ] Section zones géographiques (checkboxes multi-select)
- [ ] Slider taille artiste (min/max monthly listeners)
- [ ] Section exclusions (labels concurrents, controverses)
- [ ] Section cohérence catalogue:
  - [ ] Toggle "Ne proposer que artistes similaires à mon roster"
  - [ ] Slider threshold similarité (0-100%)
  - [ ] Multi-select artistes de référence
- [ ] Bouton "Sauvegarder préférences"
- [ ] Preview résultats basés sur filtres (combien d'artistes matchent)

#### 📊 Dashboard Scout avec filtres actifs

- [ ] Banner résumé filtres actifs
- [ ] Compteur "X prospects aujourd'hui (sur Y scannés)"
- [ ] Liste top 20-50 prospects pré-filtrés
- [ ] Badge "Match catalogue" sur chaque prospect (pourcentage)
- [ ] Bouton "Modifier filtres" (vers page preferences)
- [ ] Bouton "Voir tous scans bruts" (847 artistes avant filtre)
- [ ] Stats filtrage: "6,500 exclus par genre, 2,000 par région, etc."

#### 🎴 Card Prospect avec info match

- [ ] Badge "78% match avec Luna" (artiste similaire)
- [ ] Section "Pourquoi ce prospect" avec raisons:
  - [ ] "Même genre: Afrobeat"
  - [ ] "Tempo similaire: 95 BPM"
  - [ ] "Fanbase 45% commune avec Alex"
- [ ] Graphique radar comparison (audio features vs artiste référence)

### Backend API

- [ ] **Endpoint POST `/api/scout/preferences`**
  - [ ] Body: `genres`, `sub_genres`, `regions`, `listener_range`, `exclusions`, `catalog_match_config`
  - [ ] Validation: max 3 genres, min/max listeners cohérents
  - [ ] Sauvegarde préférences user dans DB

- [ ] **Endpoint GET `/api/scout/preferences?user_id={user_id}`**
  - [ ] Response: préférences actives complètes

- [ ] **Endpoint GET `/api/scout/daily-scan?user_id={user_id}`**
  - [ ] Response: top 20-50 prospects filtrés selon préférences
  - [ ] Inclut pour chaque: `breakout_score`, `catalog_match_score`, `match_reasons`

- [ ] **Endpoint GET `/api/scout/scan-stats?user_id={user_id}&date={date}`**
  - [ ] Response: stats détaillées scan quotidien
  - [ ] `total_scanned`, `matched_filters`, `filtered_out`, `filter_breakdown`

- [ ] **Endpoint GET `/api/scout/all-scans?user_id={user_id}&date={date}`**
  - [ ] Response: tous les 10k artistes scannés (avant filtre)
  - [ ] Pour power users qui veulent voir ce qu'ils ratent

- [ ] **Endpoint POST `/api/scout/preview-filters`**
  - [ ] Body: filtres temporaires (pour tester)
  - [ ] Response: combien d'artistes matcheraient (sans sauvegarder)

### Algorithmes

#### A) Genre Classification (ML Model)

- [ ] **Entraînement modèle classification multi-label**
  - [ ] Dataset nécessaire:
    - [ ] 100,000+ tracks Spotify avec genres confirmés
    - [ ] Labelling manuel si nécessaire (20 genres principaux)
  - [ ] Architecture: Multi-label classifier (un artiste peut être "rap + afrobeat")
  - [ ] Features input:
    - [ ] Audio features Spotify (11 dimensions):
      - `danceability`, `energy`, `key`, `loudness`, `mode`
      - `speechiness`, `acousticness`, `instrumentalness`
      - `liveness`, `valence`, `tempo`
    - [ ] Playlist context features:
      - Genres des playlists où artiste apparaît
      - Noms playlists (NLP: "Rap FR", "Drill UK", etc.)
    - [ ] Bio/metadata features:
      - Keywords bio artiste (scraping Spotify)
      - Genre tags Spotify (quand disponibles)
    - [ ] Collaboration network:
      - Genres des artistes avec qui il collabore
  - [ ] Output: `{primary_genre: "rap", sub_genres: ["drill", "trap"], confidence: 0.87}`

- [ ] **Algorithme classification en production**
  - [ ] Pour chaque artiste scanné:
    - [ ] Fetch audio features Spotify API
    - [ ] Run modèle ML → prédiction genre
    - [ ] Si confidence < 70% → classification "unknown" (à vérifier manuellement)
    - [ ] Store résultats dans DB

#### B) Geographic Detection

- [ ] **Localisation artiste (multi-sources)**
  - [ ] Source 1: Spotify artist metadata
    - Field "country" dans API (quand dispo)
  - [ ] Source 2: Top cities fanbase
    - Si 70%+ fans dans 1 pays → artiste probablement de ce pays
    - Pondération: Paris 40% + Lyon 15% + Marseille 10% = France probable
  - [ ] Source 3: Langue lyrics
    - Détection langue via Genius API lyrics
    - Français → France probable (ou Belgique/Suisse/Québec)
  - [ ] Source 4: Bio scraping
    - Cherche "based in", "from", "Paris", "Lyon", etc.
  - [ ] Score de confiance géographique (0-100%)

#### C) Catalog Match Score (Similarité)

- [ ] **Calcul similarité audio (0-100%)**
  - [ ] Pour chaque artiste prospect:
    - [ ] Compare avec artistes de référence du label
    - [ ] Méthode: Cosine similarity sur audio features
    - [ ] Features vectorisées: `[danceability, energy, acousticness, ...]`
    - [ ] Formule: `similarity = cosine(vector_prospect, vector_reference)`
  - [ ] Si plusieurs artistes référence → prend le max similarity

- [ ] **Calcul similarité genre**
  - [ ] Genre exact match = +30 pts
  - [ ] Sous-genre overlap = +20 pts
  - [ ] Genre adjacent (rap vs trap) = +10 pts

- [ ] **Calcul fanbase overlap (si data disponible)**
  - [ ] Via Spotify API (limité, pas toujours dispo)
  - [ ] Si >30% fans communs = +20 pts

- [ ] **Score final Catalog Match**
  - [ ] Audio similarity: 50%
  - [ ] Genre match: 30%
  - [ ] Fanbase overlap: 20%
  - [ ] Total: 0-100 score

- [ ] **Génération raisons match**
  - "Même genre: Afrobeat"
  - "Tempo similaire: 95 BPM (vs 98 pour Luna)"
  - "Energy level comparable: 0.78 (vs 0.81 pour Alex)"
  - "Fanbase 45% commune avec Alex"

#### D) Filtrage Quotidien (Pipeline)

- [ ] **Processus de filtrage séquentiel**

  **Étape 1: Scan baseline 10,000 artistes**
  - [ ] Critères baseline (invariants):
    - Monthly listeners 10k-150k (évite trop petit/trop gros)
    - Compte Spotify vérifié
    - Minimum 3 tracks sortis
    - Actif derniers 90 jours

  **Étape 2: Filtre genre**
  - [ ] Classifie genre chaque artiste (ML model)
  - [ ] Keep seulement si genre IN user preferences
  - [ ] Log: "6,500 artistes filtrés (genre non-match)"

  **Étape 3: Filtre géographique**
  - [ ] Détecte pays artiste
  - [ ] Keep seulement si pays IN user preferences
  - [ ] Log: "2,000 artistes filtrés (géo non-match)"

  **Étape 4: Filtre exclusions**
  - [ ] Check si artiste déjà signé (labels exclus)
  - [ ] Check controverses (si enabled)
  - [ ] Log: "150 artistes filtrés (exclusions)"

  **Étape 5: Calcul Catalog Match (si enabled)**
  - [ ] Pour artistes restants, calcule similarity
  - [ ] Keep seulement si score > threshold (ex: 70%)
  - [ ] Log: "980 artistes filtrés (catalog match insuffisant)"

  **Étape 6: Calcul Breakout Score**
  - [ ] Pour les ~200 artistes restants
  - [ ] Calcule score breakout complet

  **Étape 7: Sort et sélection top 20-50**
  - [ ] Sort by Breakout Score DESC
  - [ ] Take top 20-50
  - [ ] Store résultats pour user

- [ ] **Optimisation performance**
  - [ ] Filtres rapides d'abord (genre, géo) avant calculs lourds
  - [ ] Parallélisation calculs Catalog Match (multiprocessing)
  - [ ] Cache résultats classification genre (30 jours)

### Database

#### Table `scout_preferences`

```sql
- id (uuid)
- user_id (uuid, FK)
- genres (jsonb) # ["rap", "afrobeat", "pop"]
- sub_genres (jsonb) # {"rap": ["drill", "trap"], "afrobeat": ["afrobeats", "afro-fusion"]}
- regions (jsonb) # ["france", "belgium", "switzerland"]
- listener_min (int) # 10000
- listener_max (int) # 150000
- exclusions (jsonb) # {
  #   signed_labels: ["universal", "sony"],
  #   controversies: true,
  #   already_contacted: true
  # }
- catalog_match_enabled (boolean)
- catalog_match_threshold (int) # 70 (score minimum)
- reference_artist_ids (jsonb) # [artist_id_1, artist_id_2, ...] pour similarité
- created_at (timestamp)
- updated_at (timestamp)
- PRIMARY KEY(id)
- UNIQUE(user_id)
```

#### Table `artist_classifications` (Cache)

```sql
- artist_id (varchar)
- primary_genre (varchar) # "rap"
- sub_genres (jsonb) # ["drill", "trap"]
- confidence (float) # 0.87
- audio_features (jsonb) # Spotify audio features vectorisées
- calculated_at (timestamp)
- expires_at (timestamp) # Cache 30 jours
- PRIMARY KEY(artist_id)
- INDEX(primary_genre)
```

#### Table `artist_locations` (Cache)

```sql
- artist_id (varchar)
- country (varchar) # "france"
- cities (jsonb) # ["paris", "lyon"]
- confidence (float) # 0.92
- sources (jsonb) # ["spotify_metadata", "fanbase_geo", "bio_scraping"]
- calculated_at (timestamp)
- expires_at (timestamp)
- PRIMARY KEY(artist_id)
```

#### Table `scout_daily_scan_logs`

```sql
- id (uuid)
- user_id (uuid, FK)
- scan_date (date)
- total_scanned (int) # 10000
- after_genre_filter (int) # 3500
- after_geo_filter (int) # 1500
- after_exclusions (int) # 1350
- after_catalog_match (int) # 370
- top_prospects_count (int) # 50
- top_prospect_ids (jsonb) # [artist_ids]
- filter_breakdown (jsonb) # Stats détaillées
- processing_time_seconds (int)
- created_at (timestamp)
- PRIMARY KEY(id)
- INDEX(user_id, scan_date)
```

#### Table `catalog_match_scores` (Cache)

```sql
- user_id (uuid, FK)
- prospect_artist_id (varchar)
- reference_artist_id (varchar) # L'artiste du roster le plus similaire
- match_score (int) # 0-100
- audio_similarity (float) # 0.78
- genre_similarity (float) # 0.90
- fanbase_overlap (float) # 0.45
- match_reasons (jsonb) # ["même genre", "tempo similaire", ...]
- calculated_at (timestamp)
- expires_at (timestamp) # Recalcule tous les 7 jours
- PRIMARY KEY(user_id, prospect_artist_id)
- INDEX(match_score DESC)
```

### Background Jobs

- [ ] **Job `classify_artists_genres.py`** - Run continu (24/7)
  - [ ] Process queue d'artistes à classifier
  - [ ] 1000 artistes/heure
  - [ ] Utilise ML model genre classification
  - [ ] Store résultats dans `artist_classifications`
  - [ ] TTL cache: 30 jours

- [ ] **Job `detect_artist_locations.py`** - Run continu
  - [ ] Process queue d'artistes à géolocaliser
  - [ ] Multi-sources aggregation
  - [ ] Store dans `artist_locations`
  - [ ] TTL cache: 30 jours

- [ ] **Job `daily_scout_scan_with_filters.py`** - Run 1am quotidien
  - [ ] Pour chaque user LABEL/ENTERPRISE avec Scout activé:
    - [ ] Load preferences
    - [ ] Execute pipeline filtrage (7 étapes)
    - [ ] Calculate Breakout Scores pour finalists
    - [ ] Select top 20-50
    - [ ] Store résultats dans DB
    - [ ] Log stats dans `scout_daily_scan_logs`
  - [ ] Parallélisation par user
  - [ ] Total processing time: <30 minutes pour 100 users

- [ ] **Job `calculate_catalog_match_scores.py`** - Run 2am quotidien
  - [ ] Pour prospects filtrés de chaque user:
    - [ ] Calculate similarity avec artistes roster
    - [ ] Store best match + score
    - [ ] Generate match reasons
  - [ ] Cache résultats 7 jours

- [ ] **Job `send_daily_scout_digest.py`** - Run 8am quotidien
  - [ ] Email récap pour chaque user:
    - "Top 20 prospects aujourd'hui"
    - Highlights: 3 meilleurs prospects avec détails
    - Stats: "847 scannés, 20 retenus"
    - CTA vers dashboard
  - [ ] Notification push mobile (si app)

### Intégrations tierces

- [ ] **Spotify Web API**
  - [ ] Endpoint `/v1/audio-features/{id}` - Audio features track
  - [ ] Endpoint `/v1/artists/{id}` - Metadata artiste
  - [ ] Endpoint `/v1/artists/{id}/top-tracks` - Top tracks pour analyse
  - [ ] Rate limit: 100 req/sec (gérer avec queue)

- [ ] **Genius API** (optionnel)
  - [ ] Fetch lyrics pour language detection
  - [ ] Endpoint `/search` → `/songs/{id}/lyrics`

### ML Models à développer

#### Modèle 1: Genre Classification

- [ ] **Architecture**
  - [ ] Type: Multi-label Neural Network
  - [ ] Input: Vector 11 dimensions (audio features) + 50 dimensions (playlist embeddings)
  - [ ] Hidden layers: 128 → 64 → 32 neurons
  - [ ] Output: 20 genres (probabilités multi-label)
  - [ ] Activation: Sigmoid (multi-label, pas softmax)

- [ ] **Dataset**
  - [ ] Source: Scrape Spotify playlists éditoriales
  - [ ] 100,000 tracks minimum
  - [ ] Labels: 20 genres principaux
  - [ ] Split: 80% train, 10% validation, 10% test

- [ ] **Training**
  - [ ] Loss: Binary crossentropy (multi-label)
  - [ ] Optimizer: Adam
  - [ ] Epochs: 50-100
  - [ ] Early stopping on validation loss
  - [ ] Target accuracy: >85%

- [ ] **Deployment**
  - [ ] Save model: .h5 ou .pkl
  - [ ] API inference: FastAPI endpoint
  - [ ] Latency target: <100ms per prediction
  - [ ] Batch processing: 100 artistes en parallèle

---

## FEATURE 19: Scout Mode - AI Detection + Authenticity Score

### Frontend à créer

#### 🎯 Section "AI Detection" sur profil prospect

- [ ] Badge visuel principal: "✅ 92/100 HUMAN" ou "⚠️ 65/100 SUSPECT"
- [ ] Gauge Authenticity Score (0-100) avec code couleur:
  - [ ] 80-100: Vert (HUMAN verified)
  - [ ] 60-79: Orange (SUSPECT, moderate risk)
  - [ ] 0-59: Rouge (AI LIKELY, high risk)
- [ ] Probabilité musique IA: "8% (Faible)"
- [ ] Confiance détection: "94%"

#### 📊 Panel détaillé "Signaux Détection"

- [ ] **Section "✅ Signaux Positifs (Humain)":**
  - [ ] Liste bullet points:
    - "Présence social media active: 47 posts Instagram"
    - "Photos concerts/studio: 12 trouvées"
    - "Interviews vidéo: 3 trouvées (YouTube)"
    - "Audio analysis: variations naturelles détectées"
    - "Lyrics: style personnel cohérent sur 8 tracks"

- [ ] **Section "⚠️ Signaux Négatifs (IA)":**
  - [ ] Liste bullet points avec contexte:
    - "Sorties très régulières: 1 track/semaine"
    - "  → Peut être productif, mais pattern IA possible"

- [ ] Bouton "Voir analyse complète" (modal détails)

#### 🔍 Modal "Analyse Complète AI Detection"

- [ ] Onglets:
  - [ ] Audio Analysis (waveform + spectrogramme)
  - [ ] Social Media Audit (screenshots posts)
  - [ ] Web Presence (liens interviews/press)
  - [ ] Lyrics Analysis (cohérence style)
- [ ] Recommandation finale: "Safe to approach" ou "Investigate further"

#### ⚙️ Filtres Scout par Authenticity

- [ ] Dans page Scout Preferences:
  - [ ] Checkbox "Seulement artistes humains vérifiés"
  - [ ] Slider "Authenticity Score minimum: [80]"
  - [ ] Checkbox "Inclure artistes suspects (60-79)" avec warning
  - [ ] Checkbox "Inclure tous (même IA probable)" avec gros warning

#### 📋 Liste prospects avec badges authenticity

- [ ] Dans dashboard Scout, chaque prospect a badge:
  - [ ] "✅ 92/100 Human"
  - [ ] "⚠️ 65/100 Suspect" avec icône warning
  - [ ] "🚨 45/100 AI Likely" avec icône danger
- [ ] Click badge → ouvre panel détection
- [ ] Sort par authenticity score (optionnel)

#### 📈 Dashboard Analytics AI Detection

- [ ] Stats globales:
  - [ ] "847 artistes scannés ce mois"
  - [ ] "782 humains vérifiés (92%)"
  - [ ] "53 suspects (6%)"
  - [ ] "12 IA probable (2%)"
- [ ] Graphique évolution détection IA dans le temps
- [ ] Top 10 signaux qui prédisent IA (data viz)

### Backend API

- [ ] **Endpoint GET `/api/scout/prospect/{artist_id}/ai-detection`**
  - [ ] Response complète avec authenticity_score, ai_probability, confidence, status
  - [ ] Signals positive/negative avec weights
  - [ ] Breakdown par composante (audio, social, metadata, lyrics, web)
  - [ ] Recommendation et red_flags

- [ ] **Endpoint GET `/api/scout/ai-detection/batch`**
  - [ ] Body: `{ artist_ids: [id1, id2, ...] }` (max 100)
  - [ ] Response: Array de résultats AI detection
  - [ ] Pour affichage bulk dans liste prospects

- [ ] **Endpoint POST `/api/scout/ai-detection/analyze`**
  - [ ] Body: `{ artist_id, force_refresh: false }`
  - [ ] Déclenche analyse complète immédiate
  - [ ] Pour réanalyser si doute ou nouvelle data

- [ ] **Endpoint GET `/api/scout/ai-detection/stats?user_id={user_id}`**
  - [ ] Response: Stats agrégées détection IA
  - [ ] Pour dashboard analytics

- [ ] **Endpoint PUT `/api/scout/preferences/ai-threshold`**
  - [ ] Body: `{ min_authenticity_score: 80, include_suspects: false }`
  - [ ] Update préférences filtrage AI

### Algorithmes AI Detection

#### A) Audio Analysis (ML Model - Le plus critique)

- [ ] **Modèle Deep Learning: AI Music Detection**
  - [ ] Architecture: Convolutional Neural Network (CNN)
  - [ ] Input: Spectrogramme mel-scale (128 bins × 1000 frames)
  - [ ] Convolution layers: 3-4 layers avec filters [32, 64, 128, 256]
  - [ ] Pooling: MaxPooling après chaque conv
  - [ ] Dense layers: 512 → 256 → 1 (sigmoid output)
  - [ ] Output: Probabilité IA (0-1)

- [ ] **Dataset nécessaire** (CRITIQUE)
  - [ ] **Tracks HUMAINES** (50,000 minimum):
    - Source 1: Scrape Spotify artistes vérifiés établis
    - Source 2: Acheter dataset MusicNet, MAESTRO
    - Label: "human" = 0
  - [ ] **Tracks IA** (50,000 minimum):
    - Génère avec: Suno, Udio, MusicGen, Stable Audio
    - Tous genres, tous styles
    - Label: "ai" = 1
  - [ ] **Augmentation data**:
    - Time stretching, pitch shifting
    - Background noise addition
    - Pour robustesse modèle

- [ ] **Features audio détectées (pourquoi IA)**
  - [ ] Spectral artifacts spécifiques IA:
    - Patterns réguliers inhumains dans hautes fréquences
    - Absence de micro-variations temporelles
    - Over-compression dynamique
  - [ ] Vocal analysis:
    - Breath sounds absents/trop parfaits
    - Consonantes trop "propres"
    - Vibrato artificiel (trop régulier)
  - [ ] Harmonic complexity:
    - IA souvent simpliste harmoniquement
    - Progressions chord trop prévisibles
  - [ ] Mixing artifacts:
    - IA = trop "clean", pas d'imperfections
    - Humans = micro-erreurs subtiles (phase issues, etc.)

- [ ] **Training process**
  - [ ] Loss: Binary crossentropy
  - [ ] Optimizer: Adam (lr=0.0001)
  - [ ] Batch size: 32
  - [ ] Epochs: 100 avec early stopping
  - [ ] Validation split: 20%
  - [ ] Target accuracy: >92%
  - [ ] **IMPORTANT**: Re-entraîner tous les 3 mois (IA évolue)

- [ ] **Inference en production**
  - [ ] Pour chaque track artiste (3-5 tracks analysés):
    - Download preview 30s via Spotify API
    - Convert to mel-spectrogramme
    - Run CNN model → probabilité IA
  - [ ] Agrégation: Moyenne probabilité sur 3-5 tracks
  - [ ] Si variance élevée (tracks inconsistants) → red flag
  - [ ] Latency target: <5 secondes par track

#### B) Metadata & Release Pattern Analysis

- [ ] **Release Frequency Analyzer**
  - [ ] Fetch discographie complète artiste (Spotify API)
  - [ ] Calcul release frequency:
    - Tracks/mois derniers 6 mois
    - Régularité (écart-type entre releases)
  - [ ] Patterns suspects:
    - >4 tracks/mois pendant 3+ mois = 🚨 Red flag (humain impossible)
    - Exactement 1 track/semaine pendant 12+ semaines = ⚠️ Warning (bot possible)
    - Release tous les X jours (pattern machine) = 🚨 Red flag
  - [ ] Pattern normal:
    - 1-3 tracks/mois irrégulier = ✅ OK
    - Bursts puis pauses = ✅ OK (campagne promo)

- [ ] **ISRC Pattern Detection**
  - [ ] Certains générateurs IA ont ISRC patterns:
    - Préfixes spécifiques (ex: "QZ" prefix)
    - Séquences numériques suspectes
  - [ ] Database patterns connus:
    - Maintenir liste ISRC prefixes IA connus
    - Update avec community reports

- [ ] **Distributor Analysis**
  - [ ] Certains distributeurs spécialisés IA:
    - Liste distributors suspects (Soundful, etc.)
    - Si artiste via distributeur IA-friendly = ⚠️ Warning
  - [ ] Cross-check avec d'autres signaux

- [ ] **Track Naming Patterns**
  - [ ] IA a souvent naming générique:
    - "Track 1", "Track 2", "Untitled", "Song 01"
    - Noms très génériques ("Summer Vibes", "Night Drive")
  - [ ] Regex patterns pour détecter
  - [ ] Score: Plus générique = plus suspect

#### C) Social Media Presence (Web Scraping)

- [ ] **Instagram Analysis**
  - [ ] Via Instagram Graph API:
    - Nombre total posts
    - Nombre posts derniers 90 jours (activité récente)
    - Types posts: Photos vs Videos vs Reels
    - Captions analysis (NLP: personnel vs bot)
  - [ ] Scoring:
    - 0 posts = 0/100 (🚨 Énorme red flag)
    - 1-5 posts = 10/100 (⚠️ Très suspect)
    - 5-20 posts = 40/100 (⚠️ Suspect)
    - 20-50 posts = 70/100 (✅ Probable humain)
    - 50+ posts actifs = 95/100 (✅ Confirmé humain)
  - [ ] **Detection photos réelles**
    - Photos studio: équipement visible = ✅ Humain
    - Photos concerts: scène, public = ✅ Humain
    - Selfies variés = ✅ Humain
    - Photos stock/AI-generated faces = 🚨 Red flag
      - Utiliser API détection deepfake (Sensity, etc.)
  - [ ] **Engagement analysis**
    - Comments authentiques:
      - Scrape 50 derniers comments
      - NLP: Comments personnels vs bots
      - Presence amis/famille = ✅ Humain
    - Like/follower ratio:
      - Ratio anormal (tous posts 10k likes mais 500 followers) = 🚨 Bot

- [ ] **TikTok Analysis**
  - [ ] Via TikTok API (ou scraping):
    - Nombre vidéos
    - Face visible dans vidéos = ✅ Humain
    - Behind-the-scenes studio = ✅ Humain
    - Lips-sync challenges = ✅ Humain (AI ne peut pas)
  - [ ] Deepfake detection:
    - Si face visible, run deepfake detector
    - APIs: Sensity, Microsoft Video Authenticator

- [ ] **YouTube Analysis**
  - [ ] Via YouTube Data API:
    - Nombre vidéos channel
    - Types: Interviews, live performances, studio sessions
    - Interview face visible = ✅✅ Strong signal humain
    - Concerts filmés = ✅✅ Strong signal
  - [ ] Scoring:
    - 0 vidéos = 0/100
    - 1-3 vidéos lyrics only = 30/100
    - 3+ vidéos avec face = 90/100
    - Interviews professionnelles = 100/100

#### D) Lyrics Analysis (NLP)

- [ ] **Personal Style Consistency**
  - [ ] Fetch lyrics 5-10 dernières tracks (Genius API)
  - [ ] Analyse:
    - [ ] Vocabulaire récurrent:
      - Argot spécifique régional ("wesh", "gros", etc.)
      - Expressions personnelles uniques
    - [ ] Thèmes personnels:
      - Histoires vécues cohérentes (famille, enfance, ville)
      - Références locales (rues, quartiers)
    - [ ] Flow patterns:
      - Schémas de rimes personnels
      - Cadences signature
  - [ ] Inconsistency detection:
    - Si track 1 parle "ma mère à Paris" et track 5 "my mom in LA" = 🚨 Incohérent
    - Si vocabulaire change radicalement = ⚠️ Suspect

- [ ] **AI Text Detection**
  - [ ] Utilise GPT-Zero API ou Originality.ai
  - [ ] Run sur lyrics de 3-5 tracks
  - [ ] Output: % probabilité généré par GPT/IA
  - [ ] Si >70% = 🚨 Red flag

- [ ] **Generic vs Specific Content**
  - [ ] NLP scoring:
    - Mentions lieux spécifiques = +10 pts (Paris, Brooklyn, etc.)
    - Noms personnes = +10 pts (même si inventés, style personnel)
    - Dates/événements = +10 pts
    - Émotions nuancées = +15 pts (pas juste "happy/sad")
  - [ ] IA tend à être générique:
    - "Love", "Party", "Night", "Dreams" sans détails
    - Clichés sans profondeur

#### E) Web Presence & Press Coverage

- [ ] **Google Search Scraping**
  - [ ] Queries automatiques:
    - "{artist_name} interview"
    - "{artist_name} concert"
    - "{artist_name} live performance"
    - "{artist_name} behind the scenes"
    - "{artist_name} biography"
  - [ ] Parse résultats (top 20):
    - Compter articles pertinents
    - Extraire dates publications
    - Vérifier sources crédibles (blogs musicaux, magazines)
  - [ ] Scoring:
    - 0 résultats = 0/100 (🚨 Red flag)
    - 1-5 résultats = 40/100
    - 5-20 résultats = 70/100
    - 20+ résultats crédibles = 95/100

- [ ] **Press Mentions Database**
  - [ ] Scrape périodiquement:
    - Music blogs (Pitchfork, Stereogum, etc.)
    - Magazines FR (Les Inrocks, Télérama, etc.)
    - Plateformes interview (Genius, Complex)
  - [ ] Store mentions artistes
  - [ ] Check si artiste prospect a mentions = ✅ Humain

- [ ] **Verified Accounts Cross-Check**
  - [ ] Check badges vérifiés:
    - Spotify verified = +20 pts
    - Instagram verified = +30 pts
    - YouTube verified = +20 pts
  - [ ] Attention: IA bots peuvent acheter verifications fake
  - [ ] Cross-check avec autres signaux

#### F) Scoring Final Authenticity (0-100)

- [ ] **Pondération composantes**

```
Authenticity Score = Weighted average:

1. Audio AI Detection (40%) - Le plus critique
   - ai_probability_inverse = (100 - ai_probability)
   - Si ai_probability < 10% → 90-100 pts
   - Si ai_probability 10-30% → 60-90 pts
   - Si ai_probability 30-50% → 30-60 pts
   - Si ai_probability > 50% → 0-30 pts

2. Social Media Presence (30%)
   - Instagram score (15%)
   - TikTok score (10%)
   - YouTube score (5%)

3. Metadata & Release Pattern (15%)
   - Release frequency normal = 100 pts
   - Patterns suspects = 0-50 pts

4. Lyrics Style Consistency (10%)
   - Personal style fort = 100 pts
   - Générique = 50 pts
   - Détecté IA = 0 pts

5. Web Presence & Press (5%)
   - Interviews trouvées = 100 pts
   - Rien trouvé = 0 pts

TOTAL = Sum(component × weight)
```

- [ ] **Classification finale**
  - [ ] 80-100: ✅ **HUMAN** (High confidence, safe to approach)
  - [ ] 60-79: ⚠️ **SUSPECT** (Moderate risk, investigate further)
  - [ ] 0-59: 🚨 **AI LIKELY** (High risk, avoid or request proof of humanity)

- [ ] **Confidence Score (0-100)**
  - [ ] Basé sur:
    - Nombre de signaux disponibles (plus = mieux)
    - Consistance entre signaux (si tous alignés = high confidence)
    - Qualité data (Spotify API vs scraping = différent)
  - [ ] Formule:
```
confidence = (
  signal_count / max_signals * 0.5 +
  signal_consistency * 0.3 +
  data_quality_avg * 0.2
) * 100
```

### Database

#### Table `ai_detection_scores`

```sql
- id (uuid)
- artist_id (varchar)
- authenticity_score (int) # 0-100
- ai_probability (int) # 0-100 (probabilité musique IA)
- confidence (int) # 0-100
- status (enum: human, suspect, ai_likely)
- signals_positive (jsonb) # Array de signaux positifs détaillés
- signals_negative (jsonb) # Array de signaux négatifs
- breakdown (jsonb) # {
  #   audio_score: 95,
  #   social_presence_score: 85,
  #   metadata_score: 90,
  #   lyrics_score: 88,
  #   web_presence_score: 92
  # }
- audio_analysis (jsonb) # Résultats détaillés audio ML
- social_media_data (jsonb) # Stats IG/TikTok/YouTube
- metadata_flags (jsonb) # Release pattern, ISRC, etc.
- lyrics_analysis (jsonb) # NLP results
- web_presence_data (jsonb) # Google search, press mentions
- recommendation (text) # "Safe to approach" ou "Investigate further"
- red_flags (jsonb) # Array de red flags critiques
- calculated_at (timestamp)
- expires_at (timestamp) # Recalcule tous les 30 jours
- PRIMARY KEY(id)
- UNIQUE(artist_id)
- INDEX(authenticity_score DESC)
- INDEX(status)
```

#### Table `ai_detection_cache_audio` (Performance)

```sql
- track_id (varchar)
- ai_probability (float) # 0-1
- spectral_artifacts_detected (boolean)
- breath_sounds_present (boolean)
- harmonic_complexity_score (float)
- mixing_imperfections_score (float)
- analyzed_at (timestamp)
- expires_at (timestamp) # Cache 90 jours
- PRIMARY KEY(track_id)
```

#### Table `known_ai_patterns` (Community DB)

```sql
- id (uuid)
- pattern_type (enum: isrc_prefix, distributor, naming_pattern)
- pattern_value (varchar) # "QZ-ABC", "SoundfulMusic", etc.
- confidence (float) # 0-1
- reported_count (int) # Nombre de reports community
- verified (boolean) # Vérifié par admin
- created_at (timestamp)
- PRIMARY KEY(id)
```

### Background Jobs

- [ ] **Job `analyze_ai_detection_audio.py`** - Run continu (queue-based)
  - [ ] Process queue artistes à analyser
  - [ ] Pour chaque artiste:
    - Download 3-5 tracks preview (30s) via Spotify API
    - Convert to mel-spectrogramme
    - Run CNN AI detection model
    - Agrège résultats (moyenne + variance)
    - Store dans `ai_detection_cache_audio`
  - [ ] Throughput: 200 artistes/heure
  - [ ] Priorité: nouveaux prospects > réanalyses

- [ ] **Job `scrape_social_media_presence.py`** - Run continu
  - [ ] Process queue artistes
  - [ ] Pour chaque:
    - Instagram Graph API → stats + posts récents
    - TikTok API/scraping → vidéos count
    - YouTube Data API → channel stats
  - [ ] Store résultats structurés
  - [ ] Rate limiting respecté (Instagram: 200 calls/hour)
  - [ ] Retry avec backoff si rate limited

- [ ] **Job `analyze_lyrics_consistency.py`** - Run continu
  - [ ] Process queue artistes
  - [ ] Fetch lyrics via Genius API (3-5 tracks)
  - [ ] NLP analysis:
    - Vocabulaire extraction
    - Thèmes detection
    - GPT-Zero API pour AI detection
  - [ ] Store résultats

- [ ] **Job `scrape_web_presence.py`** - Run continu
  - [ ] Google Custom Search API:
    - "{artist_name} interview"
    - "{artist_name} concert"
    - Parse top 20 résultats
  - [ ] Store count + links
  - [ ] Update `ai_detection_scores`

- [ ] **Job `calculate_final_authenticity.py`** - Run après tous analyses
  - [ ] Agrège résultats 5 composantes
  - [ ] Calcule weighted score 0-100
  - [ ] Classification human/suspect/ai_likely
  - [ ] Génère recommandation
  - [ ] Store final score

- [ ] **Job `daily_ai_detection_batch.py`** - Run 3am quotidien
  - [ ] Pour tous nouveaux prospects scannés hier:
    - Trigger analyse complète (pipeline 5 jobs)
    - Priorise prospects avec high Breakout Score
  - [ ] Pour prospects existants:
    - Re-scan si score expiré (30 jours)

- [ ] **Job `update_ai_detection_models.py`** - Run weekly (dimanche)
  - [ ] Re-entraîne CNN audio detection avec nouvelles data
  - [ ] Collecte nouveaux samples IA (Suno, Udio releases)
  - [ ] Améliore précision continue
  - [ ] Deploy nouveau model si accuracy > ancien

- [ ] **Job `community_reports_aggregation.py`** - Run daily
  - [ ] Agrège reports users (si feature community)
  - [ ] Update `known_ai_patterns` database
  - [ ] Flag artistes reportés multiple fois

### Intégrations tierces

- [ ] **Spotify Web API**
  - [ ] `/v1/tracks/{id}` - Metadata track
  - [ ] `/v1/tracks/{id}/audio-features` - Audio features
  - [ ] `/v1/artists/{id}/albums` - Discographie
  - [ ] Track preview URL (30s MP3) pour analyse

- [ ] **Instagram Graph API**
  - [ ] `/me/media` - Liste posts
  - [ ] `/media/{id}` - Détails post (likes, comments)
  - [ ] Rate limit: 200 calls/hour/token

- [ ] **TikTok API** (ou scraping si API indispo)
  - [ ] User profile info
  - [ ] Video count
  - [ ] Engagement metrics

- [ ] **YouTube Data API**
  - [ ] `channels.list` - Channel stats
  - [ ] `search.list` - Cherche interviews artiste
  - [ ] `videos.list` - Détails vidéos

- [ ] **Genius API**
  - [ ] `/search` - Cherche artiste
  - [ ] `/songs/{id}/lyrics` - Fetch lyrics (si dispo)
  - [ ] Alternative: Scraping si API insuffisante

- [ ] **GPT-Zero API** ou **Originality.ai**
  - [ ] Détection texte généré par IA
  - [ ] Input: lyrics text
  - [ ] Output: probability AI-generated

- [ ] **Sensity API** ou **Microsoft Video Authenticator**
  - [ ] Deepfake detection vidéos
  - [ ] Input: video URL (TikTok, YouTube)
  - [ ] Output: deepfake probability

- [ ] **Google Custom Search API**
  - [ ] Programmable search engine
  - [ ] 100 queries/day gratuit, puis payant
  - [ ] Search "{artist_name} interview" etc.

### ML Models à développer/intégrer

#### Modèle 1: AI Music Detection CNN (PRIORITAIRE)

- [ ] **Architecture détaillée**

```
Input: Mel-spectrogram (128 × 1000 × 1)
↓
Conv2D(32 filters, 3×3) + ReLU + BatchNorm
↓
MaxPooling2D(2×2)
↓
Conv2D(64 filters, 3×3) + ReLU + BatchNorm
↓
MaxPooling2D(2×2)
↓
Conv2D(128 filters, 3×3) + ReLU + BatchNorm
↓
MaxPooling2D(2×2)
↓
Conv2D(256 filters, 3×3) + ReLU + BatchNorm
↓
GlobalAveragePooling2D
↓
Dense(512) + ReLU + Dropout(0.5)
↓
Dense(256) + ReLU + Dropout(0.3)
↓
Dense(1) + Sigmoid
↓
Output: AI probability (0-1)
```

- [ ] **Dataset collection strategy**
  - [ ] Phase 1: Initial 10k samples
    - 5k humains (Spotify top tracks artistes vérifiés)
    - 5k IA (générer avec Suno/Udio, 20 genres variés)
    - Train baseline model
  - [ ] Phase 2: Scale to 50k
    - Acheter datasets: MusicNet, MAESTRO, FMA
    - Générer plus IA samples (variations qualité/genres)
    - Augmentation: pitch shift, time stretch, noise
  - [ ] Phase 3: Continuous learning
    - Collecter samples via community reports
    - Re-train monthly avec nouvelles IA releases

- [ ] **Training infrastructure**
  - [ ] GPU nécessaire: NVIDIA A100 ou V100
  - [ ] Cloud option: AWS p3.2xlarge ou Google Cloud TPU
  - [ ] Training time estimé: 48-72h pour 50k samples
  - [ ] Storage: 500GB pour spectrogrammes

- [ ] **Evaluation metrics**
  - [ ] Target: >92% accuracy
  - [ ] Precision: >90% (éviter false positives)
  - [ ] Recall: >88% (détecter le maximum d'IA)
  - [ ] F1-score: >90%
  - [ ] Confusion matrix analysis

- [ ] **Deployment**
  - [ ] Model serving: TensorFlow Serving ou TorchServe
  - [ ] API wrapper: FastAPI
  - [ ] Latency: <5s per track
  - [ ] Batch inference: 100 tracks en parallèle
  - [ ] Fallback: Si model fail → score neutre (50/100)

#### Modèle 2: Deepfake Video Detection (Optionnel, utiliser API)

- [ ] Intégrer API existante plutôt que développer
- [ ] Sensity API ou Microsoft Video Authenticator
- [ ] Backup: FaceForensics++ model (open-source)

#### Modèle 3: AI Text Detection (Utiliser API)

- [ ] GPT-Zero API (recommandé)
- [ ] Alternative: OpenAI Text Classifier
- [ ] Backup: Originality.ai

---

## 🎯 PRIORITÉS DÉVELOPPEMENT SCOUT MODE COMPLET

### Sprint 10-12 (MVP Scout - 3 semaines)
- ✅ Scan automatique 10k artistes/jour
- ✅ Breakout Prediction Score basique
- ✅ Top 50 prospects/semaine
- ✅ Dashboard Scout basique

### Sprint 13-14 (Auto-Filtering - 2 semaines)
- [ ] Genre Classification ML model (entraînement)
- [ ] Page Scout Preferences (filtres config)
- [ ] Pipeline filtrage quotidien (7 étapes)
- [ ] Catalog Match Score algorithm
- [ ] Dashboard avec filtres actifs

### Sprint 15-18 (AI Detection - 4 semaines)
- [ ] Dataset collection (50k samples humains + IA)
- [ ] AI Music Detection CNN (training)
- [ ] Social media scraping (IG/TikTok/YouTube)
- [ ] Lyrics NLP analysis
- [ ] Web presence scraping
- [ ] Authenticity Score calculation
- [ ] UI badges + panels détection
- [ ] Filtres authenticity dans preferences

---

## 📊 MÉTRIQUES DE SUCCÈS

### Auto-Filtering:
- [ ] Réduction bruit: 10,000 → 20-50 prospects (99.5% filtrage)
- [ ] Précision filtres: >95% (prospects pertinents)
- [ ] Temps saved A&R: 10h → 1h/semaine (90% économie)

### AI Detection:
- [ ] Accuracy audio model: >92%
- [ ] False positive rate: <8% (important pour crédibilité)
- [ ] Latency: <10s analyse complète par artiste
- [ ] Coverage: 100% prospects scannés ont score authenticity

---

## 🚀 IMPACT BUSINESS

### Différenciation marché:
- 🔥 **PERSONNE** ne fait l'auto-filtering aussi poussé
- 🔥 **PERSONNE** ne fait la détection IA musicale
- Ces 2 features = **ÉNORMES** différenciateurs 2025-2026

### Pricing justification:
- Scout Mode basique = €999/mois (LABEL)
- Scout Mode + AI Detection = €5,000/mois (ENTERPRISE)
- ROI: Évite 1 seul mauvais signing (€50k perdu) = 50 mois d'abonnement

### Viral potential:
- "First platform to detect AI music automatically"
- Press coverage garantie (TechCrunch, Music Business Worldwide)
- Parlera de toi dans l'industrie
