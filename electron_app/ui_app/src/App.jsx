import { useEffect, useState } from 'react'
import './App.css'
import ControllerBindingsTab from './components/ControllerBindingsTab'
import MacroTab from './components/MacroTab'
import { ConfigProvider } from './context/ConfigContext'
import { FaPlay, FaStop } from 'react-icons/fa'


function App() {
  const [tab, setTab] = useState("bindings")
  const [configs, setConfigs] = useState([]);

  const [initialConfig, setInitialConfig] = useState(null);

  const [scriptIsRunning, setScriptRunning] = useState(false)


  const onStartScript = () => {
    if(scriptIsRunning === false) setScriptRunning("launch")
    else if(scriptIsRunning === "running") setScriptRunning("stop")
  }
  
  useEffect(() => {
    const c_list = window.api.getConfigs();
    setConfigs(c_list);
    let last_used_config = window.api.getStorage("configurations.last_used_config", null)
    console.log("last used config:" + last_used_config)
    console.log(c_list)
    if(last_used_config !== null){
      const found = c_list.find(cfg => cfg.config_name === last_used_config)
      console.log("found", found)
      if(found) {
        setInitialConfig(found)
        return
      }
    }

    setInitialConfig(c_list[0])
  }, []);

  if (!initialConfig) return <div>Loading...</div>;

  return (
    <ConfigProvider initialConfig={initialConfig} scriptIsRunning = {scriptIsRunning} setScriptRunning={setScriptRunning}>
      <div className='app-containter'>
        <div className='tab-bar'>
          <div className='tab-buttons-left'>
            <button className={tab == "bindings" ? 'tab-button-active' : 'tab-button'} onClick={()=>setTab("bindings")}>Controler Bindings</button>
            <button className={tab == "macros" ? 'tab-button-active' : 'tab-button'} onClick={()=>setTab("macros")}>Macros</button>
          </div>
          <div>
            <button onClick={onStartScript} style={{backgroundColor: "gray"}}>
              {scriptIsRunning === false && <><FaPlay/> Start</>}
              {scriptIsRunning === "launch" && <>Starting...</>}
              {scriptIsRunning === "running" && <><FaStop/> Stop</>} 
              {scriptIsRunning === "stop" && <>Stopping...</>}
            </button>
          </div>
        </div>

        <div className="tab-content">
          {tab == "bindings" && <ControllerBindingsTab configs = {configs}/>}
          {tab == "macros" && <MacroTab configs = {configs}/>}
        </div>
        
      </div>
    </ConfigProvider>
  )
}

export default App
