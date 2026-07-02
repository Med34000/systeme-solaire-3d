# 🌌 Système Solaire 3D — Temps réel

Simulation 3D interactive du système solaire avec les **positions réelles des astres calculées en temps réel** (bibliothèque [astronomy-engine](https://github.com/cosinekitty/astronomy), précision de qualité astronomique, sans connexion internet).

**🚀 Démo en ligne : [med34000.github.io/systeme-solaire-3d](https://med34000.github.io/systeme-solaire-3d/)**

## Lancer l'application

**Double-clique sur `lancer.command`** — ça démarre un petit serveur local et ouvre ton navigateur.

Ou en ligne de commande :
```bash
cd systeme-solaire
python3 -m http.server 8123
# puis ouvre http://localhost:8123
```

> ⚠️ Il faut passer par un serveur local (l'ouverture directe du fichier `index.html` est bloquée par les navigateurs pour les modules JavaScript).

## Contenu

- ☀️ Le Soleil, les 8 planètes (avec anneaux de Saturne et d'Uranus)
- 🌙 La Lune, les 4 lunes galiléennes de Jupiter (Io, Europe, Ganymède, Callisto) et Titan
- ⭐ 4 500 étoiles en toile de fond

## Commandes

| Action | Commande |
|---|---|
| Tourner autour | Glisser avec la souris |
| Zoomer | Molette |
| Déplacer la vue | Clic droit + glisser |
| Détails + zoom sur un astre | Clic sur l'astre ou son étiquette |
| Naviguer | Menu « Aller à… » en haut à droite |

## 🌀 Dérive galactique

Active la case « Dérive galactique » (panneau de droite) : le système solaire entier se déplace vers l'**apex solaire** (RA 18h, Dec +30°, direction Hercule/Véga) — comme dans la réalité, où le Soleil file à ~230 km/s autour du centre de la Voie lactée. Les planètes laissent des **traînées hélicoïdales** colorées derrière elles (le fameux effet « vortex »).

Astuce : combine avec une vitesse élevée (1 s = 1 mois ou 1 an) pour bien voir les spirales se former. La vitesse de dérive affichée est stylisée, comme les distances.

## Contrôle du temps

- **▶ Temps réel** : suit l'horloge de ton ordinateur, positions exactes à la seconde
- **Accélération** : de 1 s = 1 min jusqu'à 1 s = 1 an
- **⏪** : inverser le sens du temps
- **Voyage temporel** : choisis n'importe quelle date entre 1600 et 2500 (ex. : 20 juillet 1969 🚀)
- **📍 Maintenant** : retour au présent

## Précision

- Positions héliocentriques des planètes, de la Lune et des lunes galiléennes : calcul astronomique réel (VSOP87/NOVAS via astronomy-engine). Les directions angulaires sont exactes.
- Les **distances sont compressées** (loi de puissance) pour que tout reste visible — à l'échelle réelle, Neptune serait invisible à 6 000 fois le rayon du Soleil affiché.
- Titan : orbite circulaire approchée (non fournie par astronomy-engine).
- Les distances affichées dans les fiches (Distance au Soleil / à la Terre) sont les **vraies distances**, mises à jour en direct.
