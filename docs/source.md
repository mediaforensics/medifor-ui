# Run from Source

Running the UI from source is the method used when developing locally.

Instead of the UI running as a Docker container it will be running locally as a Node server and a VueJs server; however, it will still be interfacing with the other containerized Medifor System microservices.

## Getting Started

Please fork this repository to get started developing. You can email [help@mediforprogram.com](help@mediforprogram.com) for general questions.

### Install Dependencies

The UI repo leverages [lerna](https://www.npmjs.com/package/lerna) to manage the `client/` and `server/` subdirectories. You can think of them as two seperate Node projects with seperate sets of dependencies.

```bash
$ cd medifor-ui
$ npm install
$ npm run bootstrap
```

### Medifor System Docker Containers

When running the UI from source on your local machine this repo will setup a [bridge docker network](https://docs.docker.com/network/bridge/) called **pipeline_mfnet** via _docker-compose_ so the UI can communicate with the rest of the Medifor System.

You can pull these container from the Medifor program-registry and spin up the docker network:

```bash
$ cd medifor-ui/pipeline
$ docker login docker.pkg.github.com # Use your github id and access token
$ docker-compose pull # This pulls the Docker images from docker-compose.yml to your local machine
$ docker-compose up -d # This will create Docker containers for the services defined in docker-compose.yml
```

Check that your containers are running:

```bash
$ docker ps
$ CONTAINER ID        IMAGE                                                                 COMMAND                  CREATED             STATUS              PORTS                                NAMES
984fbd043b7e        docker.pkg.github.com/mediaforensics/packages/analyticworker:latest   "analyticworker --eq…"   11 minutes ago      Up 11 minutes       2112/tcp                             pipeline_aw_ela_1
9f5d4b1def04        docker.pkg.github.com/mediaforensics/packages/ta2avg:latest           "make start"             11 minutes ago      Up 11 minutes       50051/tcp                            pipeline_ac_ta2avg_1
5f38b696fa95        docker.pkg.github.com/mediaforensics/packages/exif:latest             "make start"             11 minutes ago      Up 11 minutes       50051/tcp                            pipeline_ac_exif_1
26e1f6b5d6e5        docker.pkg.github.com/mediaforensics/packages/analyticworker:latest   "fusionworker --eqad…"   11 minutes ago      Up 11 minutes       2112/tcp                             pipeline_aw_ta2avg_1
5c29aceff907        shiblon/entroq:v0.2                                                   "./eqsvc.sh pg --dba…"   11 minutes ago      Up 11 minutes                                            pipeline_eqmedifor_1
bf64bc9f604b        docker.pkg.github.com/mediaforensics/packages/ela:latest              "make start"             11 minutes ago      Up 11 minutes       50051/tcp                            pipeline_ac_ela_1
a53d47f1faa5        postgres:11                                                           "docker-entrypoint.s…"   11 minutes ago      Up 11 minutes       0.0.0.0:5432->5432/tcp               pipeline_pgmedifor_1
d95774a77789        docker.pkg.github.com/mediaforensics/packages/analyticworker:latest   "analyticworkflow --…"   11 minutes ago      Up 11 minutes       2112/tcp, 0.0.0.0:50051->50051/tcp   pipeline_analytic_workflow_1
f0f9d8b61e0b        docker.pkg.github.com/mediaforensics/packages/analyticworker:latest   "analyticworker --eq…"   11 minutes ago      Up 11 minutes       2112/tcp                             pipeline_aw_exif_1
```

### Run the UI

After ensuring that the containers are running then you can spin up the UI:

```bash
$ cd medifor-ui
$ npm start
```

Access the UI by visiting `localhost:8080` in your browser.

**NOTE: If you are running the system on Linux you may have to explicitly give write permissions to the mounted directory**

```bash
$ sudo mkdir /tmp/analyticsui
$ sudo chown -fR <username> /tmp/analyticsui
```
