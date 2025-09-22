# Liveboard
![Hackatime](https://hackatime-badge.hackclub.com/U081TBVQLCX/liveboard)
![License](https://img.shields.io/github/license/madavidcoder/liveboard)
![Created At](https://img.shields.io/github/created-at/madavidcoder/liveboard)
![Top Language](https://img.shields.io/github/languages/top/madavidcoder/liveboard)
![Commits](https://img.shields.io/github/commit-activity/t/madavidcoder/liveboard)
![Last Commit](https://img.shields.io/github/last-commit/madavidcoder/liveboard)
![Build Status](https://img.shields.io/github/actions/workflow/status/madavidcoder/liveboard/release.yml)

<div>
<img src=https://hc-cdn.hel1.your-objectstorage.com/s/v3/d9a863f15245995c9c7ca94535221e483ec23b2c_screenshot_2025-09-21_203311.png width=500>
<img src=https://hc-cdn.hel1.your-objectstorage.com/s/v3/884feae879bc1d8b02acc0b998564d3c40e6aaa3_image.png width=500>
<img src=https://hc-cdn.hel1.your-objectstorage.com/s/v3/61393ba6bf243e9aba30b302e1a695a732a8b6be_image.png width=400>
<img src=https://hc-cdn.hel1.your-objectstorage.com/s/v3/3d27ae03b2d68ba54beaad3489c4932cec40fdd5_image.png width=250>
<img src=https://hc-cdn.hel1.your-objectstorage.com/s/v3/cca4ab53c69b309b554598bbf91b8cccd4317f83_image.png width=400>
</div>

### Download it [here](https://github.com/MadAvidCoder/Liveboard/releases)!
Liveboard transforms your desktop into an infinite creative canvas, letting you sketch, write notes, and capture inspiration directly on your background. Always accessible on your desktop, Liveboard keeps your ideas just a click away.

## Features
- **Infinitely Large Canvas** - Just drag it around or zoom for more space
- **Multiple Colours and Pen thicknesses** - Keep your notes and drawings visually interesting
- **Lives on your desktop** - just minimise your window and get straight to the whiteboard
- **Undo and Redo** - Fix up any mistakes by simply undoing your last action
- **Pen Eraser** - Erase your pen marks simply by switching tools
- **Fully Open-Source** - Fork the repo and implement your own new features

## Usage
Head over to the [releases tab](https://github.com/MadAvidCoder/Liveboard/releases), and download the relevant installer for your system, from the latest release. Run the installer *(your computer may warn you it is unverified. It's safe to manually bypass this, and feel free to check the code if you're concerned about security)*. Once you've downloaded it, run the installer, and you're good to go!

If the app doesn't auto-start, manually open it, and it should appear on your desktop. An icon will appear in the tray, from where you can control it and quit the app. To use the whiteboard, minimise your window, and start drawing!

**Note:** Due to security limitations set by the OS, if you use a minimise shorcut (e.g. `Win + D` or a three-finger swipe), then Liveboard will likely be hidden. You can simply use the tray icon to show it again. 

## Development
To run Liveboard locally or contribute:
```bash
git clone https://github.com/MadAvidCoder/Liveboard.git
cd Liveboard
npm install
npm run start # Start the development server
npm run electron # Launch electron (if necessary)
```
To build and package it:
```bash
npm run build
npm run package # Run Electron Builder (will take ~5-10mins).
```

## Tech Stack
- **React** & **TypeScript** for UI
- **NPM** for package management
- **Electron** for desktop app framework
- **Electron Builder** for packaging
- **Konva** for the infinite canvas

## License

Liveboard is licensed under the [MIT License](LICENSE).

You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software. You must include the original copyright and license notice in any copies or substantial portions of the project.

**There is no warranty.** Liveboard is provided “as is”, without warranty of any kind. Use at your own risk.