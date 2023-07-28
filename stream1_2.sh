LD_LIBRARY_PATH=/opt/mjpg-streamer/ /opt/mjpg-streamer/mjpg_streamer -i "input_uvc.so -d /dev/video0 -rot 180 -fps 20 -q 1 -r 320x240" -i "input_uvc.so -d /dev/video1 -rot 180 -fps 20 -q 1 -r 320x240" -o "output_http.so -p 9000 -w /opt/mjpg-streamer/www" > /dev/null 2>&1&

