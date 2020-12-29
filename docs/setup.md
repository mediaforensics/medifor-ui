# Development Environment

These instructions assumed a Unix-based system, they will need to be modified if you are using Windows.

### Prerequisites

- Git
- FFmpeg
- NodeJs version > 10.16
- Ansible version > 2.8
- Docker Community Edition > 18.03

## Mac

We recommend installing the above using Homebrew.

### Git, Node and Ansible

In a terminal:

```bash
$ brew install git
$ brew install node
$ brew install ansible
```

### FFMpeg

Follow the instructions here [https://github.com/homebrew-ffmpeg/homebrew-ffmpeg](https://github.com/homebrew-ffmpeg/homebrew-ffmpeg).

### Docker

Follow the instructions here [https://docs.docker.com/docker-for-mac/install/](https://docs.docker.com/docker-for-mac/install/).

## Linux

These instructions are verified to work on Ubuntu 18.04, depending on your flavor of linux they may need to be modified.

### Git, Node, Ansible, FFMpeg

In a terminal:

```bash
$ sudo apt update
$ sudo apt install git node npm ansible ffmpeg
```

### Docker

Follow the instructions here [https://docs.docker.com/engine/install/ubuntu/#installation-methods](https://docs.docker.com/engine/install/ubuntu/#installation-methods).

## FAQ

#### Why are there no instructions for windows?

The MediFor system is designed to run on a Unix-based system, preferably some flavor of Linux. It can be run on windows but that is outside the scope of this repository

#### How much RAM should I allocate to Docker?

We recommened allocating half of your machine's available RAM to Docker.
