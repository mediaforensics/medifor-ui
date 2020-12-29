# Run from Source

Running the UI from source is the method used when developing locally.

Instead of the UI running as a Docker container it will be running locally as a Node server and a VueJs server; however, it will still be interfacing with the other containerized Medifor System microservices.

## Getting Started

You must first have access to the the program registry. Please email [help@mediforprogram.com](help@mediforprogram.com) to get access.

### Clone Repository

```bash
$ git clone git@gitlab.mediforprogram.com:medifor/medifor-demo-ui.git #SSH

or

$ git clone git clone https://gitlab.mediforprogram.com/medifor/medifor-demo-ui.git #HTTP
```

### Install Dependencies

The UI repo leverages [lerna](https://www.npmjs.com/package/lerna) to manage the `client/` and `server/` subdirectories. You can think of them as two seperate Node projects with seperate sets of dependencies.

```bash
$ cd medifor-demo-ui
$ npm install
$ npm run bootstrap
```

### Medifor System Docker Containers

When running the UI from source on your local machine this repo will setup a [bridge docker network](https://docs.docker.com/network/bridge/) called **pipeline_mfnet** via _docker-compose_ so the UI can communicate with the rest of the Medifor System.

You can pull these container from the Medifor program-registry and spin up the docker network:

```bash
$ cd medifor-demo-ui/pipeline
$ docker login gitlab-registry.mediforprogram.com # Use your Medifor Credentials
$ docker-compose pull # This pulls the Docker images from docker-compose.yml to your local machine
$ docker-compose up -d # This will create Docker containers for the services defined in docker-compose.yml
```

Check that your containers are running:

```bash
$ docker ps
$ CONTAINER ID        IMAGE                                                                                                                                    COMMAND                  CREATED             STATUS
CONTAINER ID        IMAGE                                                                                                                                    COMMAND                  CREATED             STATUS                          PORTS                                                                                  NAMES
e472871ba7c9        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "fusionworker --eqad…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_ta2-combo_1
c16d90b91e99        gitlab-registry.mediforprogram.com/medifor/program-registry/uscisi__ta11_s_sb__face:2019-03-09T12-59-24f883000                           "bash ./server.sh"       35 seconds ago      Up 30 seconds                   50051/tcp                                                                              pipeline_ac_splicebuster-face_1
0bca050218b2        gitlab-registry.mediforprogram.com/medifor/program-registry/kitware_s_ualbany-headpose-forensic:2019-03-22T23-14-13f299000               "python3 analytic/he…"   35 seconds ago      Up 31 seconds                                                                                                          pipeline_ac_kitware-deepfake-video_1
ba76da924793        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_unifi-ed209_1
78f4e4c1a4e3        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_ela-base_1
b0297f32e6ee        gitlab-registry.mediforprogram.com/medifor/program-registry/nextcentury_s_fusion-container:2019-12-16T16-43-51f527000                    "make start"             35 seconds ago      Up 30 seconds                   50051/tcp                                                                              pipeline_ac_multi_1
177cc3ab81c2        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_splicebuster-face_1
f25f14172e98        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_umdgsrnet_1
1e170c18e351        gitlab-registry.mediforprogram.com/medifor/program-registry/nextcentury_s_fusion-container:2019-12-12T19-54-07f733000                    "make start"             35 seconds ago      Up 31 seconds                   50051/tcp                                                                              pipeline_ac_ta2avg_1
b247403902b3        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_colorphenomenology_1
696c94f629a7        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up Less than a second           2112/tcp                                                                               pipeline_aw_luisa_1
786a77287d83        gitlab-registry.mediforprogram.com/medifor/program-registry/uo_s_fusion:2019-06-24T21-16-58f105000                                       "make start"             35 seconds ago      Up 31 seconds                   50051/tcp                                                                              pipeline_ac_tauo_1
ed189a1cb4f0        gitlab-registry.mediforprogram.com/medifor/program-registry/uscisi__ta11_s_face__cnn__video:2019-09-12T17-27-14f027164                   "bash ./server.sh"       35 seconds ago      Up 31 seconds                   50051/tcp                                                                              pipeline_ac_luisa_1
e53285c5f883        gitlab-registry.mediforprogram.com/medifor/program-registry/bmiller_s_fibber-cpt-proto_s_colorphenomenology:2019-03-07T18-36-48f596000   "python3 ../python/f…"   35 seconds ago      Up 31 seconds                   50051/tcp                                                                              pipeline_ac_colorphenomenology_1
96a47c152af2        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworker --eq…"   35 seconds ago      Up 1 second                     2112/tcp                                                                               pipeline_aw_kitware-deepfake-video_1
37af0ead6798        gitlab-registry.mediforprogram.com/medifor/program-registry/nextcentury_s_fusion-container:2019-12-16T16-44-24f533000                    "make start"             35 seconds ago      Up 32 seconds                   50051/tcp                                                                              pipeline_ac_ta2-combo_1
3ea627db7bb8        gitlab-registry.mediforprogram.com/medifor/program-registry/nextcentury_s_ela-base:2019-11-14T17-17-26f378000                            "make start"             35 seconds ago      Up 32 seconds                   50051/tcp                                                                              pipeline_ac_ela-base_1
781654dcf510        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "fusionworker --eqad…"   35 seconds ago      Up 1 second                     2112/tcp                                                                               pipeline_aw_gan_1
f01c13359158        shiblon/entroq:v0.2                                                                                                                      "./eqsvc.sh pg --dba…"   35 seconds ago      Up 31 seconds                                                                                                          pipeline_eqmedifor_1
bc4b68563033        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "fusionworker --eqad…"   35 seconds ago      Up 2 seconds                    2112/tcp                                                                               pipeline_aw_tauo_1
80549813e4bc        gitlab-registry.mediforprogram.com/medifor/program-registry/unifi-fence_s_unifi__ed209:2019-04-04T10-08-41f615000                        "python3 main.py"        35 seconds ago      Up 32 seconds                   50051/tcp                                                                              pipeline_ac_unifi-ed209_1
afe2af97eb99        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "fusionworker --eqad…"   35 seconds ago      Up 1 second                     2112/tcp                                                                               pipeline_aw_ta2avg_1
0ce581013120        postgres:11                                                                                                                              "docker-entrypoint.s…"   35 seconds ago      Restarting (1) 10 seconds ago                                                                                          pipeline_pgmedifor_1
ff9503027326        gitlab-registry.mediforprogram.com/medifor/program-registry/nextcentury_s_fusion-container:2019-12-12T19-54-42f909000                    "make start"             35 seconds ago      Up 33 seconds                   50051/tcp                                                                              pipeline_ac_gan_1
76f43acffb36        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "analyticworkflow --…"   35 seconds ago      Up 33 seconds                   2112/tcp, 0.0.0.0:50051->50051/tcp                                                     pipeline_analytic_workflow_1
7ec3a58b940c        gitlab-registry.mediforprogram.com/medifor/analytic-worker/analyticworker:develop                                                        "fusionworker --eqad…"   35 seconds ago      Up 2 seconds                    2112/tcp                                                                               pipeline_aw_multi_1
ce57094a1f2c        gitlab-registry.mediforprogram.com/medifor/program-registry/bchen2_s_umd__gsrnet:2019-10-04T17-29-34f427000                              "make start"             35 seconds ago      Up 33 seconds                   50051/tcp                                                                              pipeline_ac_umdgsrnet_1
```

### Run the UI

After ensuring that the containers are running then you can spin up the UI:

```bash
$ cd medifor-demo-ui
$ npm start
```

Access the UI by visiting `localhost:8080` in your browser.

**NOTE: If you are running the system on Linux you may have to explicitly give write permissions to the mounted directory**

```bash
$ sudo mkdir /tmp/analyticsui
$ sudo chown -fR <username> /tmp/analyticsui
```
