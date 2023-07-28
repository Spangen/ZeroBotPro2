var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var exec = require('child_process').exec, child;
var port = process.env.PORT || 3000;
var ads1x15 = require('node-ads1x15');
var adc = new ads1x15(1); // set to 0 for ads1015
//var adc = new ads1x15(1, 0x48, 'dev/i2c-1');

var Gpio = require('pigpio').Gpio,

  A1 = new Gpio(27, {mode: Gpio.OUTPUT}),
  A2 = new Gpio(17, {mode: Gpio.OUTPUT}),
  B1 = new Gpio( 4, {mode: Gpio.OUTPUT}),
  B2 = new Gpio(18, {mode: Gpio.OUTPUT});
  RELAY1 = new Gpio(22, {mode: Gpio.OUTPUT});
  RELAY2 = new Gpio(23, {mode: Gpio.OUTPUT});
  MOTOR_ENABLE = new Gpio(24, {mode: Gpio.OUTPUT});

var globmsx = 0;
var globmsy = 0;
var motmsx = 0;
var motmsy = 0;
var speedset = 1;

var ChData =[];
var Active = "0, 1, 2, 3";
var ActiveCh = Active.split(", ");
var Count = 0;

var systemstat = 0;
var armstat1 = 0;
var drivestat1 = 0;
var drivestat2 = 0;
var relaystat1 = 0;
var relaystat2 = 0;
var stringstat1 = 0;
var camstat1 = 0;
var streamstat1 = 2;
var setstreamstat1 = 1;
var viewstat1 = 1;

var voltage = 0;
var vcell = 0;
var v5v = 0;
var ileft = 0;
var iright = 0;
var strength = 'none';
var quality = 'none';

app.get('/', function(req, res){
  res.sendFile('/home/pi/ZeroBotPro2/Touch.html');
  console.log('HTML sent to client');
});

//#####EDIT################################################################################

  A1.pwmWrite(0);
  A2.pwmWrite(0);
  B1.pwmWrite(0);
  B2.pwmWrite(0);

//#####EDIT################################################################################

child = exec("sudo bash stream1_2.sh", function(error, stdout, stderr){
      if(error !== null){
         console.log('StartStream error: ' + error);
      } else {
         console.log('Stream Initiated');
      }
});

// *********************************************************************************************************
// You can make the node.js script start on boot by adding these lines to /etc/rc.local before "exit 0":
// 
// https://hackaday.io/project/25092/instructions
// 
// cd /home/pi/ZeroBotPro2
// sudo node app.js &
// cd
// *********************************************************************************************************

  setInterval(UpdateStatus, 3000); 

  setInterval(OutpMotor, 5); 
  setInterval(GrabTemp, 4000); 
  setInterval(GrabAD, 500); 
  setInterval(GrabWiFi, 500); 

  // Moved from io.on function to not restart multiple on every reconnect

  function UpdateStatus(){ 
    console.log(armstat1, 		viewstat1, streamstat1, camstat1, relaystat1, relaystat2, stringstat1, systemstat);
  }

  function GrabTemp(){ 
    child = exec("cat /sys/class/thermal/thermal_zone0/temp", function(error, stdout, stderr){
      if(error !== null){	
         console.log('GrabTemp error: ' + error);
      } else {
         var temp = parseFloat(stdout)/1000;
         io.emit('temp', temp);
         //console.log('temp', temp);
      }
    });
  }

  function GrabAD(){ 
    if(!adc.busy){
      var ch = ActiveCh[Count];
        adc.readADCSingleEnded(ch, 4096, 64, function(error, data) {
      if(error !== null){
         console.log('GrabAd error: ' + error);
          }else {
            ChData[ch] = data 
            if (Count !== (ActiveCh.length - 1)) {
              Count++;
              GrabAD();
            }else {
              Count = 0;
              //console.log ( ChData[0], ChData[1], ChData[2], ChData[3] );

              voltage = (4*parseFloat(ChData[0])/521).toFixed(2);
              vcell = (4*parseFloat(ChData[0])/3132).toFixed(2);
              v5v = (parseFloat(ChData[1])/490).toFixed(2);
              ileft = ((parseFloat(ChData[2])/100)+0.30).toFixed(2);
              iright = ((parseFloat(ChData[3])/100)+0.30).toFixed(2);

              io.emit('power', voltage, vcell, v5v, ileft, iright);
              //console.log(vcell, voltage, v5v, ileft, iright )

            }
          }

        return 1;
      });
    }
  }

  function GrabWiFi(){ 
    child = exec("iwconfig wlan0 | grep -Poz 'level=\\K[0-9-]{1,8}'", function(error, stdout, stderr){
      if(error !== null){
         console.log('GrabWifi error: ' + error);
         strength = 'Error';
      } else {
         strength = parseInt(stdout);
      }
    });
    child = exec("iwconfig wlan0 | grep -Poz 'Quality=\\K[0-9/]{1,8}'", function(error, stdout, stderr){
      if(error !== null){
         console.log('GrabWifi error: ' + error);
         quality = 'Error';
      } else {
         quality = (stdout);
      }
    });
          io.emit('wifi', strength, quality);
          //console.log("RSSI: ", strength, quality);
    }

  function OutpMotor(){

    if(globmsx > motmsx+10) {
      motmsx = motmsx + 10; 
      speedset = 1
    } else if(globmsx < motmsx-10) {
      motmsx = motmsx - 10; 
      speedset = 1
    } else if(globmsx > motmsx) {
      motmsx = motmsx + 1; 
      speedset = 1
    } else if(globmsx < motmsx) {
      motmsx = motmsx - 1; 
      speedset = 1
    }

    if(globmsy > motmsy+10) {
      motmsy = motmsy + 10; 
      speedset = 1
    } else if(globmsy < motmsy-10) {
      motmsy = motmsy - 10; 
      speedset = 1
    } else if(globmsy > motmsy) {
      motmsy = motmsy + 1; 
      speedset = 1
    } else if(globmsy < motmsy) {
      motmsy = motmsy - 1; 
      speedset = 1
    }

//    console.log('X:' + globmsx + ' Y: ' + globmsy + ' Xm:' + motmsx + ' Ym: ' + motmsy);


    if(speedset > 0) {
      if(motmsx > 0){
        A1.pwmWrite(motmsx);
        A2.pwmWrite(0);
      } else {
        A1.pwmWrite(0);
        A2.pwmWrite(Math.abs(motmsx));
      }

      if(motmsy > 0){
        B1.pwmWrite(motmsy);
        B2.pwmWrite(0);
      } else {
        B1.pwmWrite(0);
        B2.pwmWrite(Math.abs(motmsy));
      }
//      console.log('Xm:' + motmsx + ' Ym: ' + motmsy);
      speedset = 0;
    }
  }


//#####EDIT################################################################################

//Whenever someone connects this gets executed

io.on('connection', function(socket){

  console.log('A user connected');
    io.emit('arm', 1, armstat1);
    io.emit('cam1', camstat1);
    io.emit('stream', 1, streamstat1);
    io.emit('view', 1, viewstat1);
    io.emit('relay', 1, relaystat1);
    io.emit('relay', 2, relaystat2);
    io.emit('string', 1, stringstat1);
    io.emit('system', systemstat);


  socket.on('pos', function (value1, value2) {

    drivestat1 = value1;
    drivestat2 = value2;
    //io.emit('mdrive1', drivestat1, drivestat2);
    //console.log('X:' + drivestat1 + ' Y: ' + drivestat2);
    globmsx = Math.min(Math.max(parseInt(drivestat1), -255), 255);
    globmsy = Math.min(Math.max(parseInt(drivestat2), -255), 255);

  });


  socket.on('system', function(value) {

    systemstat = value;

    if(systemstat == 1) {
      io.emit('system', systemstat);
      console.log('PowerOff received..');
      child = exec("sudo poweroff");
    } else if(systemstat == 2) {
      io.emit('system', systemstat);
      console.log('Reboot received..');
      child = exec("sudo reboot");
    } else if(systemstat == 3) {
      io.emit('system', systemstat);
      console.log('Exit received..');
      return process.exit(3);
    }

  });

  socket.on('stream', function(value1, value2) {
  
    if(value1 == 1) {
      streamstat1 = value2;
      if(streamstat1 == 1) {
        var command = 'sudo killall mjpg_streamer & sleep 0.5 && sudo bash stream1_1.sh';
      } else if(streamstat1 == 2) {
        var command = 'sudo killall mjpg_streamer & sleep 0.5 && sudo bash stream1_2.sh';
      } else if(streamstat1 == 3) {
        var command = 'sudo killall mjpg_streamer & sleep 0.5 && sudo bash stream1_3.sh';
      } else if(streamstat1 == 4) {
        var command = 'sudo killall mjpg_streamer & sleep 0.5 && sudo bash stream1_4.sh';
      }

      console.log('Stream set to: ', value1, value2);

        child = exec(command, function(error, stdout, stderr){
          if(error !== null){
             console.log('SetStream error: ' + error);
          } else {
            io.emit('stream', 1, streamstat1);
            console.log('Stream restarted');
          }
        });
    }
  });

  socket.on('view', function(value1, value2) {
  
    if(value1 == 1) {
      viewstat1 = value2;
      console.log('View set to: ', value1, value2);
      io.emit('view', value1, value2);
    }
  });

  socket.on('cam', function(value) {
    camstat1 = value;
    var numPics = 0;
    io.emit('cam1', camstat1);
    console.log('Taking a picture..');

    child = exec("find -type f -name '*.jpg' | wc -l", function(error, stdout, stderr){
      numPics = parseInt(stdout)+1;
      var command = 'sudo killall mjpg_streamer ; raspistill -o cam' + numPics + '.jpg -n && sudo bash start_stream.sh';
        child = exec(command, function(error, stdout, stderr){
          camstat1 = 0;
          io.emit('cam', camstat1);
          io.emit('cam1', camstat1);
          console.log('Done..');
        });
    });
  });

  socket.on('relay', function(value) {
    console.log('Relay request: ', value);

    if(value == 1) {
      if(relaystat1 == 0) {
        relaystat1 = 1;
      } else {
        relaystat1 = 0;
      }
        RELAY1.digitalWrite(relaystat1);
        io.emit('relay', value, relaystat1);
        console.log('Relay Driver ', value, relaystat1);
    }
    if(value == 2) {
      if(relaystat2 == 0) {
        relaystat2 = 1;
      } else {
        relaystat2 = 0;
      }
        RELAY2.digitalWrite(relaystat2);
        io.emit('relay', value, relaystat2);
        console.log('Relay Driver ', value, relaystat2);
    }

  });

  socket.on('arm', function(value) {
    console.log('Arm request: ', value);

    if(value == 1) {
      if(armstat1 == 0) {
        armstat1 = 1;
      } else {
        armstat1 = 0;
      }
        MOTOR_ENABLE.digitalWrite(armstat1);
        io.emit('arm', value, armstat1);
        console.log('Motor Driver ', value, armstat1);
    }
  });

  socket.on('string', function(value1, value2) {
    console.log('Stringreq: ', value1, value2);
    if(value1 == 1) {
      if(value2 == stringstat1) {
        stringstat1 = 0;
        var command = 'echo "kill_thread 1,0; fill 1,000000; render 1" | nc -w 0  127.0.0.1 9998';
      } else {
        stringstat1 = value2;
        if(stringstat1 == 0) {
          var command = 'echo "kill_thread 1,0; fill 1,000000; render 1" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 1) {
          var command = 'echo "kill_thread 1,0; fill 1,ffffff; render 1" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 2) {
          var command = 'echo "kill_thread 1,0; fill 1,ff0000; render 1" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 3) {
          var command = 'echo "kill_thread 1,0; fill 1,0000ff; render 1" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 4) {
          var command = 'echo "kill_thread 1,0; thread_start 1,0; do; blink 1,ff9900,000000,50,8,0,18; blink 1,000000,000000,50,8,0,18; loop; thread_stop" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 5) {
          var command = 'echo "kill_thread 1,0; thread_start 1,0; do; blink 1,ff9900,000000,50,4,0,6; blink 1,ff9900,000000,50,4,6,6; blink 1,ff9900,000000,50,4,12,6; loop; thread_stop" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 6) {
          var command = 'echo "kill_thread 1,0; thread_start 1,0; do; blink 1,ff9900,000000,50,2,0,6; blink 1,ff9900,000000,50,2,6,6; blink 1,ff9900,000000,50,2,12,6; loop; thread_stop" | nc -w 0  127.0.0.1 9998';
        } else if(stringstat1 == 7) {
          var command = 'echo "kill_thread 1,0; fill 1,000000; render 1,7,800000800000800000; thread_start 1,0; do; blink 1,0000ff,000000,50,8,0,6;blink 1,0000ff,000000,50,8,12,6; loop; thread_stop" | nc -w 0  127.0.0.1 9998';
        }
      }

      child = exec(command, function(error, stdout, stderr){
        if(error !== null){
           console.log('SetLED error: ' + error);
        } else {
           io.emit('string', value1, stringstat1);
           console.log('String: ', value1, stringstat1);
        }
      });
    }
  });

//Whenever someone disconnects this piece of code is executed

socket.on('disconnect', function () {
  console.log('A user disconnected');
    globmsx = 0;
    globmsy = 0;
    speedset = 1;
});


});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

