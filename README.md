# ds-collector [![CircleCI](https://circleci.com/gh/SocialGouv/ds-collector.svg?style=svg)](https://circleci.com/gh/SocialGouv/ds-collector)

service autonome qui :

- récupère tous les dossiers d'une procédure demarches-simplifiees
- stocke les dossiers en local dans [NeDB](https://github.com/louischatriot/nedb)
- fournit un webhook pour mise à jour des dossiers
- fournit une [API](https://socialgouv.github.io/ds-collector/) pour récupérer des informations sur les dossiers
- fournit une UI minimale pour voir consulter les statistiques

## Usage

⚠ Ce service ne doit PAS être exposé sur internet. Seul le chemin vers `/webhook` doit être autorisé.

Les appels API requièrent que le header `Authorization` contienne la variable d'environnement `TOKEN`.

### Standalone

```sh
npm i

DS_ID_PROCEDURE=1242 \
DS_TOKEN=zfoij76875Koelk09U07fzefzlkjbmlkmh12124 \
TOKEN=amfjkzefkjzefkjzem \
npm start
```

### Docker

```sh
docker build . -t ds-collector

docker run -d \
    -e DS_ID_PROCEDURE=1242 \
    -e DS_TOKEN=zfoij76875Koelk09U07fzefzlkjbmlkmh12124 \
    -e TOKEN=amfjkzefkjzefkjzem \
    -v $PWD/data:/app/data \
    -p 3005:3005 \
    ds-collector
```

Une fois lancé, le service crée un fichier `./data/[DS_ID_PROCEDURE].nedb` qui contient les données.

## API

Voir la doc openapi sur [socialgouv.github.io/ds-collector/](https://socialgouv.github.io/ds-collector/)

## Variables d'environnement

| variable          | valeur                                               | defaut                               |
| ----------------- | ---------------------------------------------------- | ------------------------------------ |
| `PORT`            | webserver port                                       | 3005                                 |
| `TOKEN`           | token to access the API via `authorization` header   | random                               |
| `DS_API_URL`      | URL de l'API demarches-simplifiees                   | https://www.demarches-simplifiees.fr |
| `DS_TOKEN`        | Token API demarches-simplifiees                      |
| `DS_ID_PROCEDURE` | ID de la procédure demarches-simplifiees à récupérer |
