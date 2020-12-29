# Ansible

This repo leverages ansible to mananage deployments and configurations. Use of this tool is option but this repo is designed with it in mind so it is recommended.

We also recommonded taking a look at the [official docs](https://github.com/ansible/ansible/tree/devel/docs/docsite).

## How its Used

There are three main scripts that are used to manage local and remote configuration:

- `ansible/setup.yml` - This will install accessory software and add public keys to a remote instance intended to run the Medifor System
- `ansible/deploy.yml` - This will deploy the Medifor System to the remote instance. This works by generating all configuration files and a _docker-compose_ file based off the analytic containers defined in group and host variables then copying those file to the remote instance.
- `ansible/dev.yml` - This will generate all the necessary configuration files to deploy the system locally

## Templates being Used

- `ansible/templates/.env` - Environment variables that are used by docker-compose
- `ansible/templates/analytic_config.json` - Templated Json file that will produce the list of analytics being run in the system. This file is mounted into the Analytic Worker container so it can know what analytics it must run the media uploads against. See the [local example](../pipeline/config/analytic_config.json)
- `ansible/templates/config.json` - Configuration file for the UI, ansible will generate this for you based on the values that you define in the group and host variables
- `ansible/templates/docker-compose.yml` - Docker-compose file that is generated based on the analytic container definitions in the group and host variables
- `ansible/templates/mediforBackup.sh` - Script copied to remote machines which runs a cron job to backup all the medifor data
- `ansible/templates/nodemon.json` - Nodemon file that is only used in local develop, nodemon acts as a wrapper around Node
- `ansible/templates/watchdog.py` - Python script that will watch _docker-compose_ commands for exiting containers and will automatically restart them

## How it Works

We'll use the case of local development for an example.

```bash
$ cd ansible
$ ansible-playbook -i inventory dev.yml -K
```

This tells ansible to run the `dev.yml` script, dev.yml is bound to the hosts "localhost", ansible will look into its `inventory` file for a server named "localhost" and will run the script against that host.

- Generate Config - Ansible copies `ansible/templates/config.json` into `server/config/development.json`
- Generate Analytics Config - Ansible copies `ansible/templates/analytic_config.json` into `pipeline/config/analytic_config.json`. The analytics are based on the containers defined in `localhost.yml`
- Generate Nodemon - Ansible copies `ansible/templates/nodemon.json` into `server/nodemon.json`
- Generate Pipeline Docker Compose - Ansible copies `ansible/templates/docker-compose.yml` and `ansible/templates/.env` into `pipeline/docker-compose.yml` and `pipeline/.env`
- Generate Pipeline Plus UI Docker Compose - Ansible copies `ansible/templates/docker-compose.yml` into `pipeline/docker-compose-full.yml`. This new docker compose will include the medifor-ui container

## FAQ

#### How do the variables work in Ansible?

Traditionally in an ansible playbook you will have `group_vars` and `host_vars` which allow you to define variables for groups of servers but also define variables for individual servers. These servers and their groups are defined in the `inventory` file.

Typically you will have an `all` group within `group_vars` that will define some values for all servers, these can easily be overriden by redefining them in either a group file or a host file. When a script is run and the script is for a specific server it will look in the file that shares the same name with the server for the values, if those values are not defined it will go up the line looking in the group file, then lastly the all file.

#### Why is the analytic_config file formatted that way?

This is the format the the Analytic Worker container accepts, we strongly advise against modifying this file as it will more than likely break the entire pipeline. To see an example of how its mounted please check out the `analytic_workflow` service definition in the [local docker-compose](../pipeline/docker-compose.yml).
