import { useEffect, useState } from "react";
import {MacroEditBody, MacroListBody} from "./MacroBody";
import MacroHeader from "./MacroHeader";
import { useConfig } from "../context/ConfigContext";

export default function MacroTab({configs}){
    const { configJson, setConfigJson, setSavedConfig } = useConfig()
    const [ active_macro, setActiveMacro] = useState(null)
    
    useEffect(()=>{
        if(configJson.macros.length == 0) {
            setActiveMacro(null)
            return
        }

        let lastOpenMacro = localStorage.getItem("last_active_macro")
        
        let am = configJson.macros[0]
        
        if(lastOpenMacro){
            let am_temp = configJson.macros.find(m => m.id == lastOpenMacro)
            if(am_temp) am = am_temp
        }

        HandleChangeActiveMacro(am)
    }, [configJson])

    const HandleChangeActiveMacro = (macro_input) => {
        localStorage.setItem("last_active_macro", macro_input.id)
        setActiveMacro(macro_input)
    }

    const handleSaveUpdatedMacro = (changed_macro) => {
        let config_state = structuredClone(configJson)
        const macro_state = config_state["macros"].find(m=>m.id === active_macro.id)
        macro_state.activation_treshold = changed_macro.activation_treshold
        macro_state.input = changed_macro.input
        macro_state.name = changed_macro.name
        setConfigJson(config_state)
        setSavedConfig(false)
        setActiveMacro(macro_state)
    }

    const LoadModelToMacro = async (macro_name) =>{
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

            console.log(newBinding)
            
            let config_state = structuredClone(configJson)
            const macro_state = config_state["macros"].find(m=>m.name ===macro_name)
            macro_state.model_key = nameWithoutExt
            macro_state.model_path = path
            macro_state.activation_treshold = 0.5
            setConfigJson(config_state)
            setSavedConfig(false)
            setActiveMacro(macro_state)

        };

    }

    return (
    <div
        style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent:"flex-start",
        }}
    >
        <MacroHeader configs={configs}/>

        <div 
            style={{
                display: "flex",
                flexDirection: "row",
                height: "90%",
                backgroundColor: "#202020"
            }}
        >
            <MacroListBody active_macro = {active_macro} setActiveMacro = {HandleChangeActiveMacro}/>
            {active_macro && <><MacroEditBody macro = {active_macro} LoadModelToMacro={LoadModelToMacro} handleSaveUpdatedMacro = {handleSaveUpdatedMacro}/></>}
        </div>

    </div>);
}