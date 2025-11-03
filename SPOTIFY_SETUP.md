# Configuration Spotify pour FanPulse

Ce guide explique comment configurer l'intégration Spotify pour permettre aux utilisateurs d'ajouter et de suivre leurs artistes.

## Étape 1: Créer une App Spotify

1. Aller sur [Spotify for Developers Dashboard](https://developer.spotify.com/dashboard)
2. Se connecter avec un compte Spotify
3. Cliquer sur **"Create app"**
4. Remplir les informations:
   - **App name**: FanPulse
   - **App description**: Analytics platform for music artists
   - **Redirect URIs**: `http://localhost:3000/connect/spotify/callback`
   - **APIs used**: Web API
   - Cocher **"Web API"** dans les permissions

5. Cliquer sur **"Save"**

## Étape 2: Récupérer les Credentials

1. Dans le dashboard de votre app, cliquer sur **"Settings"**
2. Copier le **Client ID**
3. Cliquer sur **"View client secret"** et copier le **Client Secret**

## Étape 3: Configurer l'environnement

### Backend

1. Créer un fichier `.env` dans le dossier `backend/` (si pas déjà fait):
```bash
cd backend
cp .env.example .env
```

2. Éditer `backend/.env` et ajouter vos credentials:
```env
# Spotify API
SPOTIFY_CLIENT_ID=votre_client_id_ici
SPOTIFY_CLIENT_SECRET=votre_client_secret_ici
SPOTIFY_REDIRECT_URI=http://localhost:3000/connect/spotify/callback
```

### Frontend

1. Créer un fichier `.env.local` dans le dossier `frontend/`:
```bash
cd frontend
cp .env.example .env.local
```

2. Ajouter l'URL de l'API:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Étape 4: Redémarrer les services

```bash
# Backend (si Docker)
docker compose restart backend

# Frontend
cd frontend
npm run dev
```

## Test de l'intégration

1. Se connecter à FanPulse: http://localhost:3000
2. Aller dans "Add Artist" / "Ajouter un artiste"
3. Chercher un artiste Spotify
4. Cliquer sur "Import" pour l'ajouter

## Scopes Spotify utilisés

- `user-read-email`: Lire l'email de l'utilisateur
- `user-read-private`: Lire le profil de l'utilisateur
- `user-top-read`: Lire les top artistes et tracks
- `user-library-read`: Lire la bibliothèque

## Limitations Mode Développement

En mode développement (Quota Mode), Spotify limite:
- 25 utilisateurs maximum
- Rate limiting plus strict

Pour passer en Production:
1. Demander un Extended Quota Mode à Spotify
2. Fournir des informations sur votre app
3. Attendre l'approbation (quelques jours)

## Ressources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify for Artists API](https://developer.spotify.com/documentation/web-api/concepts/spotify-for-artists) (pour les stats détaillées)
- [OAuth Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
