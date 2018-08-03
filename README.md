# ds-catcher

service autonome qui :

- récupère tous les dossiers d'une procédure demarches-simplifiees
- stocke les dossiers en local dans [NeDB](https://github.com/louischatriot/nedb)
- fournit un webhook pour mise à jour des dossiers
- fournit une API CORS pour récupérer des informations sur les dossiers

## Usage

```sh
docker run -d \
    -e DS_ID_PROCEDURE=1242 \
    -e DS_TOKEN=zf87zfzelk09U07fzefzlkjbmlkmh12124 \
    -p 80:80 \
    SocialGouv/ds-catcher
```

## Variables d'environnement

| variable          | valeur                                | defaut                               |
| ----------------- | ------------------------------------- | ------------------------------------ |
| `DB_PATH`         | chemin vers le fichier de persistance | `./data.nedb`                        |
| `DS_API_URL`      | URL de l'api demarches-simplifiees    | https://www.demarches-simplifiees.fr |
| `DS_ID_PROCEDURE` | ID de la procédure DS à récupérer     |
| `DS_TOKEN`        | Token API demarches-simplifiees       |
