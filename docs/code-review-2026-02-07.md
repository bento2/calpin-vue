# Revue de code — 2026-02-07

## Objectif
Identifier le code mort et vérifier les bonnes pratiques sur le projet.

## Code mort identifié

1. `src/__tests__/__snapshots__/ExerciceCard.spec.ts.snap`
   - Snapshot orphelin (doublon avec `src/__tests__/components/__snapshots__/ExerciceCard.spec.ts.snap`).
   - Plus aucun test ne référence ce chemin historique.

2. `src/__tests__/pages/__snapshots__/TrainingEditPage.spec.ts.snap`
   - Snapshot orphelin.
   - Aucun fichier de test `TrainingEditPage.spec.ts` présent dans le dépôt.

## Actions réalisées
- Suppression des deux snapshots orphelins pour réduire le bruit dans la suite de tests.

## Vérification des bonnes pratiques

### ✅ Points positifs
- Typage strict cohérent dans la majorité du code métier (`zod`, types explicites, composables bien factorisés).
- Nommage globalement homogène et architecture claire (stores/composables/services/pages).
- Couverture de tests unitaires large, incluant services, stores, composants et utilitaires.

### ⚠️ Points à améliorer
- Plusieurs `console.log`/`console.error` sont utilisés dans le code runtime (hors tests). Une abstraction de logging (niveau + environnement) améliorerait la maintenabilité et éviterait du bruit en production.
- Les tests unitaires dépendent partiellement de la config Firebase d’environnement (échec `auth/invalid-api-key` en environnement CI/local non configuré). Recommandé: mock systématique du module `@/firebase` dans tous les tests qui l’importent indirectement.
