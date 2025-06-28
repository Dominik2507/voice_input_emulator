import { useState, useEffect } from "react";
import { useConfig } from "../context/ConfigContext";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function ConfigComponent({configs}){
  const {savedConfig, configJson, setConfigJson, handleSave} = useConfig()

  const [popupOpen, setPopupOpen] = useState(false)
  const [formName, setFormName] = useState("")

  const [option_list, setOptionList] = useState([])

  useEffect(()=>{
    let ol = configs?.map((cfg, index) => (
      <option key={cfg.config_name} value={cfg.config_name}>
        {cfg.config_name + (!savedConfig && configJson?.config_name == cfg.config_name ? "*" : "")}
      </option>
    ))
    if(ol)
      setOptionList(ol)
  }, [])

  const handleAddNewConfig = () => {
    
    const new_config = structuredClone(CONFIG_TEMPLATE)
    new_config.config_name = formName
    if(window.api.createConfig(new_config)){
      window.api.setStorage("configurations.last_used_config", formName);
      window.location.reload()
    }else{
      console.log("failed creating config")
    }
  }

  const handleChangeConfig = (e) => {
    if(e.target.value === "!new_file"){
      setPopupOpen(true)
      return
    } 

    const selected = configs.find(cfg => cfg.config_name === e.target.value);
    if (selected) setConfigJson(selected);
  }

  const handleClosePopup = () => {
    setFormName("")
    setPopupOpen(false)
  }

  const handleEditConfig = () => {
    window.api.renameConfig(configJson, formName)
    handleClosePopup()
    window.api.setStorage("configurations.last_used_config", formName);
    window.location.reload()
  }

  const openEditPopup = () => {
    setFormName(configJson.config_name)
    setPopupOpen("edit")
  }

  const handleDeleteConfig = () => {
    const result = window.api.deleteConfig(configJson.config_name)
    if(result.success)  window.location.reload()
    else console.log(result.error)
  }

  const handleRemoveChanges = () => {
    window.location.reload()
  }

  return (
    <div> 
      {
        popupOpen === true &&
        <div
          style={{
            position: "fixed",
            width: "50vw",
            height: "50vh",
            left:"25vw",
            top: "25vh",
            background: "black",
            display: "flex",
            justifyContent: "center",
            alignItems:"center"
          }}
          >
              <div>
                <div> Set the name of the new configuration:</div>
                
                <input value={formName} onChange={(e) => setFormName(e.target.value)}/>

                <div>
                  <button onClick={handleAddNewConfig}> Create </button>
                  <button onClick={handleClosePopup}> Cancel </button>
                </div>
              </div>
        </div>
      }
      {
        popupOpen === "edit" &&
        <div
          style={{
            position: "fixed",
            width: "50vw",
            height: "50vh",
            left:"25vw",
            top: "25vh",
            background: "black",
            display: "flex",
            justifyContent: "center",
            alignItems:"center"
          }}
          >
              <div>
                <div> Edit name:</div>
                
                <input value={formName} onChange={(e) => setFormName(e.target.value)}/>

                <div>
                  <button onClick={handleEditConfig}> Confirm & Save changes</button>
                  <button onClick={handleClosePopup}> Cancel </button>
                </div>
              </div>
        </div>
      }
      <select value={configJson?.config_name} onChange={handleChangeConfig}>
        {option_list}
        <option key="new_config_file" value={"!new_file"}>
          --new config--
        </option>
      </select>
      <button onClick={openEditPopup}> <FaEdit/> </button>
      <button onClick={handleDeleteConfig}> <FaTrash/> </button>
      {!savedConfig && <button onClick={handleSave}>Save</button>}
      {!savedConfig && <button onClick={handleRemoveChanges}> Remove changes </button>}
    </div> 
  );
}


const CONFIG_TEMPLATE = {
  "config_name": "",
  "controler_type": "xbox",
  "input_bindings": {
    "XUSB_GAMEPAD_DPAD_UP": null,
    "XUSB_GAMEPAD_DPAD_DOWN": null,
    "XUSB_GAMEPAD_DPAD_LEFT": null,
    "XUSB_GAMEPAD_DPAD_RIGHT": null,
    "XUSB_GAMEPAD_START": null,
    "XUSB_GAMEPAD_BACK": null,
    "XUSB_GAMEPAD_LEFT_THUMB": null,
    "XUSB_GAMEPAD_RIGHT_THUMB": null,
    "XUSB_GAMEPAD_LEFT_SHOULDER": null,
    "XUSB_GAMEPAD_RIGHT_SHOULDER": null,
    "XUSB_GAMEPAD_GUIDE": null,
    "XUSB_GAMEPAD_A": null,
    "XUSB_GAMEPAD_B": null,
    "XUSB_GAMEPAD_X": null,
    "XUSB_GAMEPAD_Y": null,
    "XUSB_GAMEPAD_LEFT_TRIGGER": null,
    "XUSB_GAMEPAD_RIGHT_TRIGGER": null,
    "XUSB_GAMEPAD_LEFT_STICK_UP": null,
    "XUSB_GAMEPAD_LEFT_STICK_DOWN": null,
    "XUSB_GAMEPAD_LEFT_STICK_LEFT": null,
    "XUSB_GAMEPAD_LEFT_STICK_RIGHT": null,
    "XUSB_GAMEPAD_RIGHT_STICK_UP": null,
    "XUSB_GAMEPAD_RIGHT_STICK_DOWN": null,
    "XUSB_GAMEPAD_RIGHT_STICK_LEFT": null,
    "XUSB_GAMEPAD_RIGHT_STICK_RIGHT": null
  },
  "macros": []
}