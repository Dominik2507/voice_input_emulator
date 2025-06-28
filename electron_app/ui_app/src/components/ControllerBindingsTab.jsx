import { useState, useEffect, useContext } from "react"
import './Tabs.css'
import ConfigComponent from "./ConfigComponent"
import InputModelBinding from "./InputModelBinding"

import { useConfig } from "../context/ConfigContext"

import gamepad_default from '../assets/gamepad-default.png'
import gamepad_y from '../assets/gamepad_y.png'
import gamepad_x from '../assets/gamepad_x.png'
import gamepad_b from '../assets/gamepad_b.png'
import gamepad_a from '../assets/gamepad_a.png'
import gamepad_l1 from '../assets/gamepad_l1.png'
import gamepad_l2 from '../assets/gamepad_l2.png'
import gamepad_r1 from '../assets/gamepad_r1.png'
import gamepad_r2 from '../assets/gamepad_r2.png'


export default function ControllerBindingsTab({configs}){
    const { configJson, setConfigJson, savedConfig, setSavedConfig, handleSave } = useConfig()
    const [activeGamepadImage, setActiveImage] = useState(gamepad_default)

    const [editBindingPopup, setEditPopup] = useState(null)
    const [editBindingForm, setEditForm] = useState({})
    
    const OnLoadModel = (config_key, new_binding) => {
        let config_state = structuredClone(configJson)
        console.log(config_state, configJson)
        config_state["input_bindings"][config_key] = new_binding
        setConfigJson(config_state)
        setSavedConfig(false)
    }

    const popup_handleLoadModel = async () => {
        const result = await window.api.openModelFileBrowser();
        console.log(result)
        if (result.canceled === false && result.filePaths.length > 0) {
            const path = result.filePaths[0];
            const fileName = path.split('\\').pop().split('/').pop();
            const nameWithoutExt = fileName.replace(/\.onnx$/i, '');

            const newBinding = {
                model_key: nameWithoutExt,
                model_path: path,
                activation_treshold: 0.5
            };

            if(editBindingPopup.includes("STICK") || editBindingPopup.includes("TRIGGER")) newBinding.input_value = 1

            console.log(newBinding)

            OnLoadModel(editBindingPopup, newBinding)
        };

    }

    const handleClosePopup = () => {
        setEditPopup(null)
    }

    if(configJson == null){
        return (<></>)
    }

    const HandleEditBinding = (binding_key) => {
        let obj = configJson["input_bindings"][binding_key]
        setEditForm(obj)
        setEditPopup(binding_key)
    }

    return (
    <div className="controller-input-tab-body">
        {
            editBindingPopup &&
        
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
                    <div> Edit binding:</div>
                    <div> {editBindingForm.model_key} </div>
                    <div> {editBindingForm.model_path} </div>
                    <div> Activation treshold <input 
                        type="number" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={editBindingForm.activation_treshold} 
                        onBlur={()=>{
                            let val = editBindingForm.activation_treshold
                            if(val < 0) val = 0
                            if(val > 1) val = 1
                            const newBinding = {...editBindingForm, activation_treshold: val}
                            setEditForm(newBinding)
                            const c = structuredClone(configJson)
                            c.input_bindings[editBindingPopup] = newBinding
                            setConfigJson(c)
                        }} 
                        onChange={
                            (e) => setEditForm(prev => {return {...prev, activation_treshold: e.target.value}})
                        }
                    />
                    </div>
                    {

                    
                        (editBindingPopup.includes("STICK") || editBindingPopup.includes("TRIGGER")) && 
                        <div>
                            Input value <input 
                                type="number" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value={editBindingForm.input_value} 
                                onBlur={()=>{
                                    let val = editBindingForm.input_value
                                    if(val < 0) val = 0
                                    if(val > 1) val = 1
                                    const newBinding = {...editBindingForm, input_value: val}
                                    setEditForm(newBinding)
                                    const c = structuredClone(configJson)
                                    c.input_bindings[editBindingPopup] = newBinding
                                    setConfigJson(c)
                                }} 
                                onChange={
                                    (e) => setEditForm(prev => {return {...prev, input_value: e.target.value}})
                                }
                            />
                        </div> 
                    }
                    <div>
                        <button onClick={popup_handleLoadModel}> Load model</button>
                        <button onClick={handleClosePopup}> Close </button>
                    </div>
                </div>
            </div>
        }
        <div className="controller-input-column">
            <InputModelBinding onEditBinding={HandleEditBinding} name={"dpad up"} config_key={"XUSB_GAMEPAD_DPAD_UP"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_DPAD_UP"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"dpad down"} config_key={"XUSB_GAMEPAD_DPAD_DOWN"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_DPAD_DOWN"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"dpad left"} config_key={"XUSB_GAMEPAD_DPAD_LEFT"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_DPAD_LEFT"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"dpad right"} config_key={"XUSB_GAMEPAD_DPAD_RIGHT"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_DPAD_RIGHT"]} onLoadModel={OnLoadModel}/>
            <div onMouseEnter={()=>setActiveImage(gamepad_l1)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"left shoulder / L1"} config_key={"XUSB_GAMEPAD_LEFT_SHOULDER"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_SHOULDER"]} onLoadModel={OnLoadModel}/></div>
            <div onMouseEnter={()=>setActiveImage(gamepad_l2)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"left trigger / L2"} config_key={"XUSB_GAMEPAD_LEFT_TRIGGER"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_TRIGGER"]} onLoadModel={OnLoadModel}/></div>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"left thumb / L3"} config_key={"XUSB_GAMEPAD_LEFT_THUMB"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_THUMB"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"left stick up"} config_key={"XUSB_GAMEPAD_LEFT_STICK_UP"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_STICK_UP"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"left stick down"} config_key={"XUSB_GAMEPAD_LEFT_STICK_DOWN"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_STICK_DOWN"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"left stick left"} config_key={"XUSB_GAMEPAD_LEFT_STICK_LEFT"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_STICK_LEFT"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"left stick right"} config_key={"XUSB_GAMEPAD_LEFT_STICK_RIGHT"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_LEFT_STICK_RIGHT"]} onLoadModel={OnLoadModel}/>
        </div>
        <div className="controller-input-gamepad">
            <ConfigComponent configs = {configs}/>
            <img src={activeGamepadImage} alt="GamepadImage" className="gamepad-image"/>
        </div>
        <div className="controller-input-column">
            <div onMouseEnter={()=>setActiveImage(gamepad_y)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"Y"} config_key={"XUSB_GAMEPAD_Y"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_Y"]} onLoadModel={OnLoadModel}/></div>
            
            <div onMouseEnter={()=>setActiveImage(gamepad_x)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"X"} config_key={"XUSB_GAMEPAD_X"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_X"]} onLoadModel={OnLoadModel}/></div>
            <div onMouseEnter={()=>setActiveImage(gamepad_a)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"A"} config_key={"XUSB_GAMEPAD_A"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_A"]} onLoadModel={OnLoadModel}/></div>
            <div onMouseEnter={()=>setActiveImage(gamepad_b)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"B"} config_key={"XUSB_GAMEPAD_B"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_B"]} onLoadModel={OnLoadModel}/></div>
            <div onMouseEnter={()=>setActiveImage(gamepad_r1)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"right shoulder / R1"} config_key={"XUSB_GAMEPAD_RIGHT_SHOULDER"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_SHOULDER"]} onLoadModel={OnLoadModel}/></div>
            <div onMouseEnter={()=>setActiveImage(gamepad_r2)} onMouseLeave={()=>setActiveImage(gamepad_default)}><InputModelBinding onEditBinding={HandleEditBinding} name={"right trigger / R2"} config_key={"XUSB_GAMEPAD_RIGHT_TRIGGER"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_TRIGGER"]} onLoadModel={OnLoadModel}/></div>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"right thumb / R3"} config_key={"XUSB_GAMEPAD_RIGHT_THUMB"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_THUMB"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"right stick up"} config_key={"XUSB_GAMEPAD_RIGHT_STICK_UP"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_STICK_UP"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"right stick down"} config_key={"XUSB_GAMEPAD_RIGHT_STICK_DOWN"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_STICK_DOWN"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"right stick left"} config_key={"XUSB_GAMEPAD_RIGHT_STICK_LEFT"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_STICK_LEFT"]} onLoadModel={OnLoadModel}/>
            <InputModelBinding onEditBinding={HandleEditBinding} name={"right stick right"} config_key={"XUSB_GAMEPAD_RIGHT_STICK_RIGHT"} binding_object={configJson["input_bindings"]["XUSB_GAMEPAD_RIGHT_STICK_RIGHT"]} onLoadModel={OnLoadModel}/>
        </div>
    </div> 
    ); 
}