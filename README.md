# portfolio_exporter
Ein Prometheus-Exporter, welcher die Positionen in Musterdeports ausgibt.


## Welches Depot?
Sage ich nicht, denn diejenigen schreiben in ihren AGBs *Eine automatisierte Abfrage des von onvista bereitgestellten Content oder von Teilen hieraus ist ohne ausdrückliche schriftliche Einwilligung von onvista in jeglicher Form unzulässig.* und *Verstößt der Kunde gegen die ihm gewährten Nutzungsrechte oder besteht der Verdacht des Missbrauchs der zur Verfügung gestellten Inhalte, so ist onvista berechtigt, den Zugang des Kunden zu dem Content ohne vorherige Ankündigung zu sperren. Ferner ist onvista in einem solchen Fall berechtigt, den Vertrag fristlos zu kündigen. Zudem ist onvista in den zuvor geschilderten Fällen berechtigt, Schadensersatzansprüche bei Vorliegen der gesetzlichen Voraussetzungen geltend zu machen. Im Rahmen dieser Schadensersatzansprüche ist der Kunde verpflichtet, onvista von solchen Ansprüchen freizustellen, die Dritte gegen onvista wegen der unberechtigten Nutzung des Content erheben. Insbesondere hat der Kunde die durch die Nutzung durch Dritte eventuell anfallenden Gebühren von onvista zu tragen*
Ich untersage hiermit ausdrücklich das Ausführen des Codes in diesem Repository. Da sich aber eh keiner dran hält, weise ich darauf hin, daß nicht ich gegen die AGB verstosse, sondern du. Wer also auch immer o.g. Schadenersatzansprüche eintreiben will, ist bei mir an der falschen Adresse. Ich halte absichtlich Informationen zurück, ohne die der Code nicht lauffähig ist, das sollte reichen.

```
XSOCK=/tmp/.X11-unix
XAUTH=/tmp/.docker.xauth
xauth nlist $DISPLAY | sed -e 's/^..../ffff/' | xauth -f $XAUTH nmerge -
chmod 644 $XAUTH
podman run -it --rm -e DISPLAY=:0 --net=host -v /tmp/.X11-unix:/tmp/.X11-unix -v  $XAUTH:/tmp/.Xauthority -e XAUTHORITY=/tmp/.Xauthority:z -v `pwd`:/pwscripts:z --entrypoint bash dercontainerhier

```
Mit Wayland ist das Gemurkse viel schlimmer.
```
podman run -it -v /run/user/1000/:/run/user/1000/ -e XDG_RUNTIME_DIR -e WAYLAND_DISPLAY --device=/dev/dri --security-opt label=disable registry.fedoraproject.org/fedora
dnf --refresh upgrade
dnf install weston
dnf install glx-utils
dnf install xorg-x11-server-Xwayland
mkdir /tmp/.X11-unix/
weston --backend=wayland-backend.so --xwayland
```

