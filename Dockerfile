FROM --platform=$BUILDPLATFORM mcr.microsoft.com/playwright:v1.38.1-jammy AS playwright

RUN echo "pwuser    ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/pwuser && \
    chmod 640 /etc/sudoers.d/pwuser
ENV DEBIAN_FRONTEND="noninteractive" TZ="UTC"
RUN apt-get update && \
    apt-get install -y x11-xserver-utils && \
    apt-get install -y x11-utils && \
    apt-get install -y sudo && \
    rm -rf /var/lib/apt/lists/*

USER pwuser
WORKDIR /home/pwuser
ENV NODE_PATH=/home/pwuser/node_modules
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm install -D playwright
RUN npm install @playwright/test@1.38.1
# sonst rotzt npx bei jedem Aufruf irgendwelche minor-updates-found-Meldungen
RUN npm config set update-notifier false && \
    npm install -D chai && \
    npm install -D expect && \
    npm install -D prom_client
# sonst ist die Ausgabe voller (xterm-)Steuerzeichen
RUN npm config set color false

COPY README.md .
COPY VERSION .
RUN chmod 644 README VERSION
COPY run.sh .
COPY ./onvista.js .
RUN chmod 755 run.sh onvista.js

EXPOSE 10000
CMD ["/home/pwuser/run.sh"]
