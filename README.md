# Voice Input Emulator (VIE)

VIE is a desktop application for simulating controller input through voice commands. It allows users to map custom OpenWakeWord models to simple or macro-based gamepad actions for existing games.

## Components
- **Electron + React GUI**: For managing model-action mappings and macro configuration.
- **Python Backend**: Uses OpenWakeWord for detection and vgamepad for controller emulation.
- **Macro Recorder**: Records and replays sequences of controller actions tied to voice triggers.

## Supported Platforms
- Windows
- Controller Support (tested): Xbox 360, DualShock 4, DualSense 5

This tool is especially useful for enhancing accessibility or adding voice control to games without native support.

## How to use:
If you want to work on the app localy you need to do a few steps to set it up. 
1. Install npm packages in electron_app folder
2. Install npm packages in ui_app folder
3. Run the build
```
npm run build
```
