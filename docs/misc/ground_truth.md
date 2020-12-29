# Ground Truth Container

The Medifor System includes an optional Ground Truth Container that can be run alongside regular analytic containers.

It operates by searching through the medifor datasets that are hosted on an NFS mount in the program network.

## Adding the NFS Mounts

First ensure that you have access to the Medifor VPN then run the following:

```bash
$ mkdir /mnt/medifor/datasets
$ mkdir /mnt/reference
$
$ mount -t nfs 10.107.253.1:/datasets /mnt/medifor/datasets
$ mount -t nfs 10.107.253.1:/dmc /mnt/reference
```

These will need to be remounted every time your computer restarts.

## Enable Ground Truth

Enabling the Ground Truth container is a configurable flag when using Ansible.

If you want to enable the Ground Truth container in your local pipeline then run the following:

```bash
$ ansible-playbook -i inventory dev.yml -e '{"include_gt":true} -k
```

This will regenerate your local _docker-compose_ with the Ground Truth container included.
