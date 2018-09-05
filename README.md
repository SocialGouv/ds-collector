# ds-collector

service autonome qui :

- récupère tous les dossiers d'une procédure demarches-simplifiees
- stocke les dossiers en local dans [NeDB](https://github.com/louischatriot/nedb)
- fournit un webhook pour mise à jour des dossiers
- fournit une API pour récupérer des informations sur les dossiers (cors-enabled)
- fournit une UI minimale pour voir consulter les statistiques

## Usage

⚠ Ce service ne doit PAS être exposé sur internet. Seul le chemin vers `/webhook` doit être autorisé.

### Standalone

```sh
npm i

DS_ID_PROCEDURE=1242 \
DS_TOKEN=zfoij76875Koelk09U07fzefzlkjbmlkmh12124 \
npm start
```

### Docker

```sh
docker run -d \
    -e DS_ID_PROCEDURE=1242 \
    -e DS_TOKEN=zfoij76875Koelk09U07fzefzlkjbmlkmh12124 \
    -v $PWD/data:/app/data \
    -p 3005:3005 \
    SocialGouv/ds-collector
```

## API

Voir la doc openapi sur `/doc`

## Variables d'environnement

| variable          | valeur                                               | defaut                               |
| ----------------- | ---------------------------------------------------- | ------------------------------------ |
| `PORT`            | webserver port                                       | 3005                                 |
| `TOKEN`           | token to access the API via `authorization` header   | random                               |
| `DB_PATH`         | chemin vers le fichier de persistance                | `./data.nedb`                        |
| `DS_API_URL`      | URL de l'API demarches-simplifiees                   | https://www.demarches-simplifiees.fr |
| `DS_TOKEN`        | Token API demarches-simplifiees                      |
| `DS_ID_PROCEDURE` | ID de la procédure demarches-simplifiees à récupérer |
