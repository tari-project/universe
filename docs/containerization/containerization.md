# Tari Universe Containerization with Docker

## Description

This document describes the process of containerizing the `Tari Universe` application using Docker and running it from an AppImage. This was done as a proof of concept to create a lightweight VM/container that allows running `Tari Universe` on different machines with various operating systems and architectures.

## Limitations

It is important to note that GPU mining is not feasible on different machines using this method. GPU mining would only work if the host machine is running Linux with NVIDIA drivers. For such cases, consider using [`rocker`](https://github.com/osrf/rocker), which allows running containers with X11 tunneling and accessing the host GPU with NVIDIA.

For other cases, the only reasonable way to run `Tari Universe` with different CPU and GPU architectures would be using a hosted cloud machine with remote desktop access.

## Motivation and Context

The primary motivation for this containerization is to allow testing `Tari Universe` on different operating systems and architectures from a single machine.

## How Has This Been Tested?

### Linux Only:

1. Allow access to the X11 server (at least for the time of testing) with the command:
    ```sh
    xhost +local:root
    ```
    This can be later revoked with:
    ```sh
    xhost -local:root
    ```

2. Copy the AppImage to the directory containing `Dockerfile` and rename all occurrences of `Tari Universe (Alpha)_0.8.45_amd64.AppImage` to your just copied file.

3. Build the Docker image with:
    ```sh
    docker build -t taritest .
    ```

4. Run the Docker image from the script:
    ```sh
    ./docker_script.sh
    ```

By following these steps, you can test `Tari Universe` on different operating systems and architectures using Docker.