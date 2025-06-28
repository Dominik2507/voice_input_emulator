const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require("electron-store")
const { spawn, exec } = require('child_process');
const sudo = require('sudo-prompt')

console.log("Preload script loaded")


const store = new Store();

const isDev = process.env.IS_DEV === "true";

const appRoot = process.cwd();

checkIfViGEmBusInstalled((isInstalled) => {
  if (!isInstalled) {
    console.log("Vigiembus not installed")
    installViGEmBus();
  }else{
    console.log("Vigiembus installed")
  }
});

console.log('App root directory:', appRoot);
console.log('_dirname', __dirname)
const configDir = isDev ? __dirname + '\\configurations' : path.join(process.resourcesPath, "electron", "configurations");

const pythonExecutable = path.join(process.resourcesPath, "electron", "python", "python.exe");

const pythonPath = isDev
  ? path.join(__dirname, "python", "python.exe")
  : pythonExecutable;

if (!fs.existsSync(pythonPath)) {
  console.error("Python executable not found");
}

const scriptsPath = isDev ? path.join(__dirname, 'scripts') : path.join(process.resourcesPath, "electron", "scripts");

const activationsDetectionScriptPath = path.join(scriptsPath, 'start_activation_detection.py');
const recordingScriptPath = path.join(scriptsPath, "test_simulate_input.py")

if (!fs.existsSync(activationsDetectionScriptPath)) {
  console.error("Activations detection script not found");
}

if (!fs.existsSync(recordingScriptPath)) {
  console.error("Recording macro script not found");
}

let pyActivationsProcess = null;
let pyRecordingProcess = null;


function startPythonScript(configName, onStarted, onError) {
  if (pyActivationsProcess) {
    console.log('Script already running');
    return { success: false, error: 'Script already running' };
  }

  const configPath = path.join(configDir, `${configName}.json`);
  const args = ['--config_file', configPath];

  pyActivationsProcess = spawn(pythonPath, [activationsDetectionScriptPath, ...args], {
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  pyActivationsProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    if(data.toString().includes("Started models")) onStarted()
  });

  pyActivationsProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pyActivationsProcess.on('close', (code) => {

    console.log(`Python script exited with code ${code}`);
    onError()
    pyActivationsProcess = null;
  });

  return { success: true };
}

function stopPythonScript() {
  if (pyActivationsProcess) {
    pyActivationsProcess.kill('SIGINT');
    console.log('Stopped Python script');
    pyActivationsProcess = null;
    return { success: true };
  }
  return { success: false, error: 'No script running' };
}


contextBridge.exposeInMainWorld('api', {
  getConfigs: () => {
    try {
      const files = fs.readdirSync(configDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      return jsonFiles.map(file => {
        const fullPath = path.join(configDir, file);
        const data = fs.readFileSync(fullPath, 'utf-8');
        return JSON.parse(data);
      });
    } catch (e) {
      console.error("Failed to load configs:", e);
      return [];
    }
  },
  saveConfig: (data) => {
    try {
      const filePath = path.join(configDir, `${data.config_name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, path: filePath };
    } catch (e) {
      console.error("Failed to save config:", e);
      return { success: false, error: e };
    }
  },
  createConfig: (data) => {
    try {
      const filePath = path.join(configDir, `${data.config_name}.json`);
  
      // Check if file already exists
      if (fs.existsSync(filePath)) {
        return { success: false, error: "Configuration already exists." };
      }
  
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, path: filePath };
    } catch (e) {
      console.error("Failed to create config:", e);
      return { success: false, error: e };
    }
  },
  renameConfig: (data, new_name) => {
    try {
      const oldPath = path.join(configDir, `${data.config_name}.json`);
      const newPath = path.join(configDir, `${new_name}.json`);
  
      if (!fs.existsSync(oldPath)) {
        return { success: false, error: "Original configuration does not exist." };
      }
  
      if (fs.existsSync(newPath)) {
        return { success: false, error: "A configuration with the new name already exists." };
      }
  
      data.config_name = new_name

      fs.renameSync(oldPath, newPath);
      fs.writeFileSync(newPath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, path: newPath };
    } catch (e) {
      console.error("Failed to rename config:", e);
      return { success: false, error: e };
    }
  },
  deleteConfig: (config_name) => {
    try {
      const filePath = path.join(configDir, `${config_name}.json`);
  
      if (!fs.existsSync(filePath)) {
        return { success: false, error: "Configuration does not exist." };
      }
      
      fs.unlinkSync(filePath)

      return { success: true, path: filePath };
    } catch (e) {
      console.error("Failed to delete config:", e);
      return { success: false, error: e };
    }
  },
  getStorage: (name) => {
    return store.get(name)
  },
  setStorage: (name, value) => {
    store.set(name, value)
  },
  openModelFileBrowser: () => ipcRenderer.invoke("dialog:openModel"),

  startScript: (configName, onStarted, onError) => startPythonScript(configName, onStarted, onError),
  stopScript: () => stopPythonScript(),

  startRecordingScript: (updateCallback) => onStartRecordingInputs(updateCallback),
  restartRecording: (updateCallback) => onRestartRecording(updateCallback),
  stopRecording: () => onStopRecording(),

});

const recorded_inputs_list = []

function onStartRecordingInputs(updateCallback){
  if (pyRecordingProcess) {
    console.log('Script already running');
    return { success: false, error: 'Script already running' };
  }


  pyRecordingProcess = spawn(pythonPath, [recordingScriptPath, ], {
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });

  recorded_inputs_list.length = 0
  updateCallback(recorded_inputs_list)

  pyRecordingProcess.stdout.on('data', (data) => {
    data_string = data.toString()
    console.log(data_string)
    if(data_string.startsWith("--input")){
      const [timestamp, button_name, button_value] = parseRecordingData(data_string.split(" ", 2)[1])
      console.log(timestamp, button_name, button_value)
      
      let i = recorded_inputs_list.findIndex(i => i.timestamp == timestamp)

      if(i > -1){
        recorded_inputs_list[i].values[button_name] = button_value
      }else{
        const values = {}
        values[button_name] = button_value
        recorded_inputs_list.push({
          timestamp: timestamp,
          values: values
        })
      }
      updateCallback(recorded_inputs_list)
    }
    else if(data_string.startsWith("--info")){
      console.log(`info: ${data_string}`);
    }
  });

  pyRecordingProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pyRecordingProcess.on('close', (code) => {
    console.log(`Python script exited with code ${code}`);
    pyRecordingProcess = null;
  });

  return { success: true };
}

function parseRecordingData(data){
  const inputs_split = data.split(",", 3)
  const timestamp = parseInt(inputs_split[0])
  const button_name = inputs_split[1]
  const button_value_string = inputs_split[2]
  let button_value = true
  
  if(button_name.includes("STICK") || button_name.includes("TRIGGER")){
    button_value = parseFloat(button_value_string)
  }else{
    button_value = button_value_string.trim() === "True" ? true : false
  }

  return [timestamp, button_name, button_value]
}

function onRestartRecording(updateCallback){
  recorded_inputs_list.length = 0
  pyRecordingProcess.stdin.write("restart\n")
  updateCallback(recorded_inputs_list)
}

function onStopRecording(){
  if (pyRecordingProcess) {
    pyRecordingProcess.kill('SIGINT');
    console.log('Stopped Python script');
    pyRecordingProcess = null;
    return { success: true };
  }
  return { success: false, error: 'No script running' };
}

function checkIfViGEmBusInstalled(callback) {
  exec('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Services\\ViGEmBus"', (err, stdout, stderr) => {
    console.log('ViGEmBus registry entry:', stdout);
    console.log('ViGEmBus registry error:', stderr);
    callback(!err);
  });
}

function installViGEmBus() {

  const installerPath = path.join(scriptsPath, 'ViGEmBus_Setup.exe');
  
  const options = {
    name: 'Voice input emulator',
  };
  
  sudo.exec(`"${installerPath}"`, options, (error, stdout, stderr) => {
    if (error) {
      console.error('Failed to install ViGEmBus:', error);
      return;
    }
    console.log('ViGEmBus installed successfully');
  });

  // const installer = spawn(installerPath, ['/S'], {
  //   detached: true,
  //   stdio: 'ignore',
  //   shell: true
  // });

  // installer.unref();
}