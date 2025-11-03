# FanPulse Frontend Development Roadmap

## 📊 État des Lieux (Novembre 2025)

### ✅ Backend Disponible (Prêt à Consommer)
- Momentum Index (algorithme + API)
- Superfans (modèle + service)
- Release Optimizer (service)
- Revenue Forecasting (service complet)
- Next Best Action Engine (service)
- Alerts System (détection + routes)
- Reports (génération PDF)
- Analytics (FVS, momentum, superfans)

### ✅ Frontend Existant (Pages Créées)
- Dashboard principal avec Next Action widget
- `/dashboard/alerts` - Page alertes
- `/dashboard/analytics/[artistId]` - Analytics artiste
- `/dashboard/api-keys` - Gestion API keys
- `/dashboard/artists` - Liste artistes
- `/dashboard/forecasts` - Prévisions (structure de base)
- `/dashboard/releases` - Release optimizer (structure de base)
- `/dashboard/reports` - Rapports (structure de base)

### ❌ Frontend Manquant (À Développer)

#### TIER 1 - CRITIQUE (Core Analytics - SOLO)
1. **Page Actions/Todo** ⭐ PRIORITÉ #1
   - Liste complète toutes actions (pas juste la prochaine)
   - Filtres par artiste/urgence
   - Marquer comme complété/snooze/ignorer
   - Historique actions
   - API: `/api/actions/artist/{id}` existe déjà

2. **Momentum Index Détaillé**
   - Graph historique 90j avec zones colorées
   - Breakdown 5 signaux
   - Détection points inflexion
   - API: `/api/momentum/{artist_id}` à vérifier

3. **Fan Value Score (FVS)**
   - Score par fan (0-100)
   - Distribution par bracket
   - Breakdown: écoute 40% + engagement 35% + monétisation 25%
   - Backend: existe dans analytics mais UI manquante

4. **Superfans Top 20**
   - Liste top 20 avec profils
   - Filtres/recherche
   - Vue détaillée par fan
   - Templates DM
   - API: `/api/superfans/{artist_id}` à vérifier

#### TIER 2 - HAUTE PRIORITÉ (AI Recommendations - PRO)
5. **Opportunity Alerts Page**
   - Liste alertes temps réel
   - 7 types d'alertes (spike viral, momentum drop, etc.)
   - Push notifications
   - Backend: existe déjà `/api/realtime-alerts/*`

6. **Best Time to Post**
   - Widget suggestions jour/heure
   - Basé timezone audience
   - Intégration dans publishing

#### TIER 3 - MOYENNE PRIORITÉ (Predictions - PRO)
7. **Release Optimizer Complet**
   - Finaliser UI existante
   - Score 0-10 par date
   - Liste concurrence
   - Recommandations
   - API: `/api/releases/*` existe

8. **Revenue Forecasting Complet**
   - Finaliser UI existante
   - 3 scénarios
   - Graph interactif
   - Breakdown sources
   - API: `/api/revenue/*` existe

#### TIER 4 - BASSE PRIORITÉ (Publishing & Engagement)
9. **Social Publishing Studio**
   - Editor WYSIWYG
   - Multi-platform preview
   - Scheduler
   - Calendar view
   - Backend: à créer

10. **Artist Link Page Builder**
    - Page builder visuel
    - Themes
    - Analytics
    - Backend: à créer

11. **Email Campaigns**
    - Email editor
    - Templates
    - A/B testing
    - Analytics
    - Backend: à créer

#### TIER 5 - SCOUT MODE (LABEL)
12. **Scout Discovery Dashboard**
    - Liste prospects auto-scannés
    - Filtres genre/région
    - AI Detection Score
    - Watchlist
    - Backend: à créer

#### TIER 6 - PORTFOLIO (LABEL)
13. **Portfolio Health Dashboard**
    - Vue exec label
    - Score global
    - Multi-artist overview
    - Backend: à créer

---

## 🎯 Plan d'Action Immédiat (2 Semaines)

### Semaine 1: Core Features
**Jour 1-2: Page Actions/Todo** ⭐
- Créer `/dashboard/actions/page.tsx`
- API client `/lib/api/actions.ts`
- Components: ActionCard, ActionFilters, ActionHistory
- Intégration dashboard widget existant

**Jour 3-4: Momentum Index Page**
- Créer `/dashboard/analytics/[artistId]/momentum/page.tsx`
- Graph historique (Recharts)
- Breakdown composantes
- Status badges

**Jour 5: Superfans Page**
- Créer `/dashboard/analytics/[artistId]/superfans/page.tsx`
- Liste Top 20
- Profils détaillés
- Export CSV

### Semaine 2: Predictions & Finitions
**Jour 6-7: Release Optimizer (Finalisation)**
- Améliorer `/dashboard/releases/page.tsx`
- Calendar picker dates
- Competitor list
- Score visualization

**Jour 8-9: Revenue Forecasting (Finalisation)**
- Améliorer `/dashboard/forecasts/page.tsx`
- 3 scénarios graph
- Breakdown sources
- Confidence intervals

**Jour 10: Alerts Page (Finalisation)**
- Améliorer `/dashboard/alerts/page.tsx`
- Real-time notifications
- Filtres par type
- Mark as read

---

## 📦 Stack Technique Frontend

### UI Components
```bash
# Déjà installé
- Next.js 14
- TypeScript
- Tailwind CSS
- Lucide React (icons)

# À ajouter si besoin
npm install recharts # Graphs
npm install @tanstack/react-table # Tables avancées
npm install react-datepicker # Date picker
npm install framer-motion # Animations
npm install @headlessui/react # Composants accessibles
```

### API Client Pattern
```typescript
// Pattern existant dans /lib/api/*.ts
export const actionsApi = {
  getNext: () => api.get('/api/actions/next'),
  getForArtist: (artistId: string) => api.get(`/api/actions/artist/${artistId}`),
  update: (actionId: string, status: string) => api.post(`/api/actions/${actionId}/update`, { status })
}
```

### Component Structure
```
src/components/
├── actions/
│   ├── ActionCard.tsx
│   ├── ActionFilters.tsx
│   ├── ActionHistory.tsx
│   └── ActionList.tsx
├── momentum/
│   ├── MomentumGraph.tsx
│   ├── MomentumBreakdown.tsx
│   └── MomentumStatus.tsx
├── superfans/
│   ├── SuperfanCard.tsx
│   ├── SuperfanList.tsx
│   └── SuperfanProfile.tsx
└── ui/ (existants)
    ├── Alert.tsx
    ├── Button.tsx
    ├── Card.tsx
    └── ...
```

---

## 🚀 Par Où Commencer?

### Option A: MVP Quick Win (3 jours)
**Focus: Page Actions complète**
- Exploiter le backend existant (`/api/actions/*`)
- Créer une belle UI professionnelle
- Marquer actions comme complétées
- Démo rapide pour validation

### Option B: Core Analytics (1 semaine)
**Focus: Trio Core**
1. Actions
2. Momentum
3. Superfans
- Couvre les 3 features les plus critiques
- Backend déjà là
- Valeur immédiate pour users

### Option C: Full Featured (2 semaines)
**Focus: Complet Tier SOLO/PRO**
- Toutes les pages core
- Finitions predictions
- Polish UI/UX
- Prêt pour démo clients

---

## 💡 Recommandation

**Je recommande Option B** car:
1. ✅ Backend déjà fonctionnel
2. ✅ Valeur immédiate users (trio core)
3. ✅ Base solide pour suite
4. ✅ Temps raisonnable (1 semaine)
5. ✅ Démo impressionnante possible

**On commence par quoi?** 🎯
- Page Actions/Todo (votre demande initiale)
- Ou trio complet (Actions + Momentum + Superfans)

Dites-moi et je commence le développement! 🚀
