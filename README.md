# ZeroBotPro v3

Must add info on project later. Have just learned to push to GIT. But lots of additions that might interest someone.

Enjoy...

//Spangen

____________________________________________________________________________________________________________
Original TXT:

# ZeroBotPro v2

Unofficial update of the *Raspberry Pi Zero FPV Robot* by CoretechR. 
Visit https://hackaday.io/project/25092-zerobot-raspberry-pi-zero-fpv-robot for build instructions.

The objective of this port is to allow the robot software to be build over newest dependencies after a fresh install.

Tested on *Raspbian Buster Lite*.

**Complete robot and raspberry install instruction on official robot page:**
https://hackaday.io/project/25092/instructions

## Install the software

```
sudo apt-get update
sudo apt-get install nodejs apache2 npm pigpio

cd ~
git clone https://github.com/dclause/ZeroBotPro2.git
cd ZeroBotPro2
npm install
```

## Install the video streaming

```
sudo apt-get install libjpeg62-turbo-dev
sudo apt-get install cmake
cd
git clone https://github.com/jacksonliam/mjpg-streamer.git ~/mjpg-streamer
cd mjpg-streamer/mjpg-streamer-experimental
make clean all
sudo mkdir /opt/mjpg-streamer
sudo mv * /opt/mjpg-streamer
```

## Run the software manually
```
sudo node app.js & start_stream.sh
```
Visit **http://*your-ip*:3000** to operate your robot.

## Tweak

The video stream will be served from apache server located in /var/www
From your install folder, you can use `cp apache/index.html /var/www/html/` to copy the index.html file inside the apache folder.
This file will automatically redirect you to the proper URL when visiting the robot IP address.

