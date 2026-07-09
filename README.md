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

- ☀️ Le Soleil, les 8 planètes (avec anneaux de Saturne et d'Uranus) — **vraies textures** issues de l'imagerie NASA
- 🌙 La Lune, les 4 lunes galiléennes de Jupiter (Io, Europe, Ganymède, Callisto) et Titan
- 🛰️ La **Station spatiale internationale** en orbite terrestre (période, vitesse et inclinaison réelles)
- 🛰️ Les sondes **Voyager 1 & 2** avec leurs trajectoires historiques complètes : lancement 1977, survols de Jupiter, Saturne, Uranus, Neptune (aux positions réelles des planètes ces jours-là), puis sortie du système solaire — distances et temps de trajet de la lumière en direct
- ⭐ Panorama réel de la Voie lactée + 4 500 étoiles en toile de fond

## 🎂 Le ciel de ta naissance

Entre ta date de naissance : la simulation se téléporte à cet instant et te raconte ton ciel — combien de tours du Soleil tu as bouclés, la distance parcourue à travers la galaxie depuis, la phase de la Lune à ta naissance, et quelles planètes étaient au-dessus de l'horizon. Puis clique « 🎬 Rejouer ma vie cosmique » : le système s'anime de ta naissance à aujourd'hui en 15 secondes, compteurs à l'appui (tours du Soleil, pleines lunes, kilomètres parcourus dans la galaxie).

## 🌟 La course de la lumière

Lance un photon depuis le Soleil et regarde-le traverser le système solaire — en temps réel ou accéléré. L'onde lumineuse se propage dans la vue 3D, chaque astre s'illumine quand elle l'atteint : 3 min pour Mercure, 8 min 20 pour la Terre, plus de 4 h pour Neptune, presque une journée pour Voyager 1. Avec le comparateur qui remet les idées en place : jusqu'à Mars, c'est 12 minutes en lumière… et 191 ans en voiture.

## 📸 Moments historiques

Revis les grandes dates de l'aventure spatiale : Spoutnik, Gagarine, Apollo 11, les survols des Voyager… Chaque moment téléporte la simulation à la date exacte. Le clou : la **Pale Blue Dot** — place-toi à la position réelle de Voyager 1 le 14 février 1990 et retourne-toi vers la Terre, ce point pâle à 6 milliards de km, avec les mots de Carl Sagan.

## 📅 Événements à venir

Le bouton « Événements à venir » calcule les prochains rendez-vous célestes à partir de la date simulée : éclipses de Soleil et de Lune, oppositions de Mars/Jupiter/Saturne, meilleures visibilités de Mercure et Vénus, phases de la Lune, et le survol de l'astéroïde Apophis en 2029. Chaque événement a un bouton « ▶ Voir » qui téléporte la simulation à la date exacte.

## 🌃 Ce soir dans le ciel

Le bouton « Ce soir dans le ciel » montre, pour ta position (géolocalisation ou Montpellier par défaut), quelles planètes sont au-dessus de l'horizon **en ce moment** : direction (N/SE/O…), hauteur, magnitude, heures de lever/coucher, phase de la Lune et coucher du soleil. Fonctionne aussi à n'importe quelle date simulée.

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
- Événements célestes (éclipses, oppositions, élongations, phases lunaires) et positions dans le ciel local : calculés par astronomy-engine, précision de quelques minutes.

## Crédits

- Calculs astronomiques : [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT) par Don Cross
- Rendu 3D : [Three.js](https://threejs.org/) (MIT)
- Textures des planètes et de la Voie lactée : [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0), d'après l'imagerie NASA
- Textures des petites lunes : procédurales (dessinées par le code)
