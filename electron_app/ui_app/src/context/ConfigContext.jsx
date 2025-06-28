import { createContext, useContext, useEffect, useState } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ initialConfig, scriptIsRunning, setScriptRunning, children }) => {
  const [configJson, setConfigJsonState] = useState(initialConfig);
  const [savedConfig, setSavedConfig] = useState(true);

  useEffect(()=>{
    if(scriptIsRunning === false) return
    else if (scriptIsRunning === "launch") StartScript()
    else if(scriptIsRunning === "stop") StopScript()
  }, [scriptIsRunning])

  const StopScript = () => {
    window.api.stopScript()
  }

  const StartScript = () => {
    if(savedConfig === false){
      window.alert("You havent saved your configuration. Please save or revert changes and try again.")
      setScriptRunning(false)
    }else{
      window.api.startScript(configJson.config_name, startedScriptCallback, closedScriptCallback)
    }
  }
  const startedScriptCallback = () => {
    setScriptRunning("running")
  }

  const closedScriptCallback = () => {
    setScriptRunning(false)
  }

  const setConfigJson = (newState) => {
    if (newState.config_name === configJson.config_name) {
      setConfigJsonState(newState);
      setSavedConfig(false);
      return;
    }

    if (!savedConfig && !window.confirm("You haven't saved your current bindings. Do you wish to continue? All changes will be erased!")) {
      return;
    }

    window.api.setStorage("configurations.last_used_config", newState.config_name);
    setConfigJsonState(newState);
    setSavedConfig(true);
  };

  const handleSave = () => {
    if (!configJson) return;

    const result = window.api.saveConfig(configJson);
    if (result.success) {
      console.log("Config saved to:", result.path);
      setSavedConfig(true);
    } else {
      console.error("Save failed:", result.error);
    }
  };

  if (configJson == null) return <div>Loading...</div>;

  return (
    <ConfigContext.Provider value={{
      configJson,
      setConfigJson,
      savedConfig,
      setSavedConfig,
      handleSave
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
