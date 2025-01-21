docker run \
    --env="NO_AT_BRIDGE=1" \
    --env="DISPLAY" \
    --env="QT_X11_NO_MITSHM=1" \
    --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" \
    --volume="/var/lib/dbus/machine-id:/var/lib/dbus/machine-id:ro" \
    --volume="/etc/machine-id:/etc/machine-id:ro" \
    --device=/dev/dri:/dev/dri \
    taritest