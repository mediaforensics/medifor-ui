# Medifor UI Container

In production environments the Medifor UI is intended to run as a Docker container.

This set of instructions will give users an overview on how the the UI works when running in a container environment

## Configuration and Environment Variables

The MediforUI leverages [configJs](https://www.npmjs.com/package/config) to manage its configuration and environment variables. It is HIGHLY RECOMMENDED to have a cursory understanding of this package.

Default configuration for the application can be found at [server/config/default.json](../server/config/default.json).

| Parameter           | Description                                                                                                                 | Default             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `CONTAINER_ROOT`    | Internal directory that the UI container will write static resources to.                                                    | `/medifor`          |
| `WORKFLOW_HOST`     | DNS Name of the analyticworkflow service.                                                                                   | `analytic_workflow` |
| `WORKFLOW_PORT`     | GRPC port that the analyticworklow service listens on.                                                                      | `50051`             |
| `PORT`              | Port that the UI Node server listens on.                                                                                    | `3000`              |
| `CACHE_TTL_SECONDS` | Number of seconds that the node server will cache the analytic list response from the pipeline before issuing a new request | `600`               |
| `UI.enableGroups`   | Boolean flag to enable the user grouping feature in the UI.                                                                 | `false`             |
| `UI.enableDelete`   | Boolean flag to allow users to delete their own uploaded media                                                              | `true`              |
| `UI.defaultFuserId` | ID of a fusion model that the system will default to on initial load.                                                       | `""`                |
| `UI.unknownUsers `  | "Deny"/"Allow" on how the system handles users that aren't verified.                                                        | `deny`              |
| `UI.groupPrefix`    | Prefix that will append the groups in request headers                                                                       | `medifor-uigrp-`    |
| `UI.userTagPrefix`  | Prefix to append to system level user tags                                                                                  | `user`              |
| `UI.groupTagPrefix` | Prefix to append to system level group tags                                                                                 | `group`             |
| `UI.tagPrefixFlag`  | Flag to append to system level group/user tags `__user/__group`                                                             | `__`                |

You can override any of the configuration values by passing in environment variables to the container. The file [custom-environment-variables.json](../server/config/custom-environment-variables.json) provides the mappings of environment variables to these configuration values.

The order of precedence using configJs is:

- Environment Variables
- development.json/production.json
- default.json

This means that configJs will first see if the enviroment variable exists, if not then it will look in either development.json or production.json, lastly it will check default.json.

## Running the UI as a Container

[pipeline/docker-compose-full.yml](../pipeline/docker-compose-full.yml) provides a _docker-compose_ file that will run the Medifor System locally with the UI running as a container.

Lets look at how this works:

```yaml
medifor_ui:
  image: "gitlab-registry.mediforprogram.com/medifor/medifor-demo-ui:develop" # Prebuilt Docker Image of the Medifor UI
  restart: always
  networks:
    - mfnet # Docker Compose Network being created
  environment:
    - CONTAINER_ROOT=${CONTAINER_DATA_DIR} # Populating the CONTAINER_ROOT env variable inside the container with the value of CONTAINER_DATA_DIR
    - WORKFLOW_HOST=${WORKFLOW_HOST} # Populating the WORKFLOW_HOST env variable inside the container with the value of WORKFLOW_HOST
    - WORKFLOW_PORT=${WORKFLOW_PORT} # Populating the WORKFLOW_PORT env variable inside the container with the value of WORKFLOW_PORT
  volumes:
    - "${MEDIFOR_DEMO_DATA_DIR}:${CONTAINER_DATA_DIR}" # Mounting a local directory into the container directory. In this case its /tmp/analyticsui:/medifor
    - ../server/config/development.json:/usr/src/app/config/production.json # Mounting your local development.json file in place of the production.json file inside the container
  ports:
    - "3000:3000" # Forwarding your local port 3000 to port 3000 inside the container
```

To run this docker-compose:

```bash
$ cd pipeline
$ docker-compose -f "docker-compose-full.yml" up -d
```

The UI will now be available at `localhost:3000` in your browser.

## Building the Container

This repo's CI pipeline manages building the container and storing it on Gitlab's Container registry. If you would like to build it locally then you can use the `dockerBuild.sh` script in the root of this project.

## FAQ

#### So you can either mount a configuration file or pass in environment variables to the UI container?

Yes, you can even do both but remember that environment variables take precedence. The ability to chose either method is advantageous for people who are working in multiple environments. In kubernetes it may be easier to pass everything in as environment variables, in docker-compose you may find it simpler to just mount the configuration file.

#### Why is there production.json and development.json?

When the UI is running from source, if it does not see the value it needs in the environment variables it will look in development.json, conversely if the UI is running from a Docker container and it does not see the value it needs in the environment variables it will look in production.json. When the UI is running in a container, NODE_ENV will be set to `production` and configJs will recognize this behind the scenes and look for values accordingly. Long story short, if you are mounting a config file into the container, make sure you mount it as `production.json`.

#### Why is the config file being mounted into /usr/src/app/production.json?

`/usr/src/app/` is where the UI application actually lives when inside a container. You can see our [Dockerfile](../Dockerfile) for how we have this set up.

#### The config files say "Ansible Managed", what is that?

Our configuration files are managed and generated by Ansible. You can read more about that in our [Ansible](./ansible.md) ReadMe.

### Why is the FACETS field exluded from the table?

Don't worry about this, this is for a specific Medifor analytic and since it lives in `default.json` it will always be there.
