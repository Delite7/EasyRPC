/* eslint-disable no-console */
const config = require('../../config.json');
if (config.musicType == 'spotify') {
  const nodeSpotifyWebhelper = require('node-spotify-webhelper')
  const spotify = new nodeSpotifyWebhelper.SpotifyWebHelper()

  process.on('unhandledRejection', (err) => {
    console.error(err);
  });


  const {
    app,
    BrowserWindow
  } = require('electron');
  const open = require("open");
  const os = require('os');
  const path = require('path');
  const url = require('url');
  const DiscordRPC = require('discord-rpc');
  const fs = require('fs');
  const parse = require('parse-duration')
  const moment = require('moment')

  const ClientId = "327592981580349440";

  let mainWindow;

  function createWindow() {
    var width = 600 //320
    var height = 330 //500
    mainWindow = new BrowserWindow({
      width: width,
      height: height,
      resizable: false,
      titleBarStyle: 'hidden',
      vibrancy: 'light',
      hasShadow: false,
      frame: false,
      show: false
    });

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '/../index.html'),
      protocol: 'file:',
      slashes: true,
    }));

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.on('ready', createWindow);

  app.on('window-all-closed', () => {
    app.quit();
  });

  app.on('activate', () => {
    if (mainWindow === null)
      createWindow();
  });

  DiscordRPC.register(ClientId);

  const rpc = new DiscordRPC.Client({
    transport: 'ipc'
  });

  var oldID
  var songName = undefined;

  async function setActivity() {
    if (!rpc || !mainWindow)
      return;

    var activity = {
      largeImageKey: 'spotify',
      largeImageText: 'Spotify',
      instance: false
    }

    if (!openTimestamp) {
      var openTimestamp = new Date();
    }

    activity.startTimestamp = moment(openTimestamp).add(parse('0s'), 'ms').toDate();

    spotify.getStatus(function(err, res) {
      if (err) return console.error(err);
      if (res.track.track_resource && res.track.track_resource.name && res.track.track_resource.name != songName) {
        //activity.startTimestamp = new Date(new Date() - (res.playing_position * 1000));
        //activity.startTimestamp = moment(openTimestamp).add(res.playing_position * 100, 's').toDate();
        activity.startTimestamp = moment(openTimestamp).add(parse('0s'), 'ms').toDate();
        activity.endTimestamp = moment(openTimestamp).add(res.track.length, 's').toDate();
        //console.log(res.track)
        activity.details = res.track.track_resource.name
        activity.state = res.track.artist_resource.name
        songName = res.track.track_resource.name;
        if (!oldID) {
          oldID = res.track
          console.log('Set initial track successfully.');
          rpc.setActivity(activity);
        }
        if (oldID !== res.track) {
          oldID = res.track
          rpc.setActivity(activity);
          console.log(`[${new Date().toLocaleTimeString()}]: ${res.track.track_resource.name} - Updating Rich Presence.`);
        }

      }
    })
  }

  rpc.on('ready', () => {
    rpc.subscribe('ACTIVITY_SPECTATE', ({
      secret
    }) => {
      console.log('Spectating is not currently supported. Sorry!')
    });

    setActivity();

    setInterval(() => {
      setActivity();
    }, 1000);
  });

  rpc.login(ClientId).catch(console.error);
}
