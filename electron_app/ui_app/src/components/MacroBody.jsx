import { useEffect, useState } from "react";
import {FaPlus, FaTrash} from 'react-icons/fa'
import { useConfig } from "../context/ConfigContext";
import { TiDelete } from "react-icons/ti";

export function MacroEditBody({ macro, LoadModelToMacro, handleSaveUpdatedMacro}) {

    const {configJson, setConfigJson} = useConfig()
    const [formName, setFormName] = useState(macro.name)
    const [isRecording, setIsRecording] = useState(false)

    useEffect(()=>{
        setFormName(macro.name)
    }, [macro])

    const updateActivationThreshold = (e) => {
        const val = Math.max(0, Math.min(1, parseFloat(e.target.value)));
        macro.activation_treshold = val.toFixed(2);
        setConfigJson({ ...configJson });
    };

    const updateMacroName = (e) => {
        macro.name = e.target.value;
        setConfigJson({ ...configJson });
    };

    const onUpdateNameForm = (e) => {
        setFormName(e.target.value)
    }

    const updateMacroInputBinding = (timestamp, binding_key, binding_value) => {
        const m = structuredClone(macro)
        if(binding_value != null)
            m.input.find(m => m.timestamp == timestamp).values[binding_key] = binding_value
        else
            delete m.input.find(m => m.timestamp == timestamp).values[binding_key]
        console.log(m)
        handleSaveUpdatedMacro(m)
    }

    const handleTimestampUpdate = (newTimestamp, index) => {
        macro.input[index].timestamp = newTimestamp;
        macro.input.sort((a, b) => a.timestamp - b.timestamp);
        setConfigJson({ ...configJson });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const handleAddInputToMacro = () => {

        let new_input = undefined

        if(macro.input.length == 0){
            new_input = {
                "timestamp": 0,
                "values": {
                }
            }
        }else{
            const max_timestamp = (macro.input.toSorted((i1, i2) => i1 - i2)).reverse()[0].timestamp
            
            new_input = {
                "timestamp": max_timestamp + 50,
                "values": {
                }
            }
        }

        const m = structuredClone(macro);
        m.input.push(new_input)
        handleSaveUpdatedMacro(m)
    }

    const handleRemoveInput = (timestamp) => {
        console.log("remove", timestamp);
    
        const c = structuredClone(configJson);
    
        const macroToUpdate = c.macros.find(m => m.id === macro.id);
        if (!macroToUpdate) return;
    
        macroToUpdate.input = macroToUpdate.input.filter(i => i.timestamp !== timestamp);
    
        console.log("updated", c);
        setConfigJson(c);
    };

    const handleRecordMacro = () =>{
        setIsRecording(true)
        window.api.startRecordingScript(onInputParsed)
    }

    const handleRestartRecord = () => {
        window.api.restartRecording(onInputParsed)
    }

    const handleStopRecording = () => {
        setIsRecording(false)
        window.api.stopRecording()
    }

    const onInputParsed = (inputs_list) => {
        const m = structuredClone(macro)
        m.input = inputs_list
        handleSaveUpdatedMacro(m)
    }

    const handleDeleteMacro = (e) => {
        const c = structuredClone(configJson);
    
        c.macros = c.macros.filter(m => m.id !== macro.id);
        setConfigJson(c);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "85%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "start", height: "30%" }}>
                <div>
                    Name: <input value={formName} onChange={onUpdateNameForm} onKeyDown={handleKeyDown} onBlur={updateMacroName}/>
                </div>
                <div>Model: {macro.model_key}</div>
                <div>Path: {macro.model_path}</div>
                <div>
                    Activation threshold:{" "}
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={macro.activation_treshold}
                        onChange={updateActivationThreshold}
                    />
                </div>
                <div>
                    <button onClick={() => LoadModelToMacro(macro.name)}>Load model</button>
                    {
                        !isRecording && <button onClick={handleRecordMacro}> Record macro</button>
                    }
                    {
                        isRecording && <button onClick={handleRestartRecord}> Restart recording</button>
                    }
                    {
                        isRecording && <button onClick={handleStopRecording}> Stop recording</button>
                    }
                    <button onClick={handleDeleteMacro}> Delete Macro</button>
                </div>
            </div>

            <div style={{ backgroundColor: "#151520", height: "70%", overflowY: "auto" }}>
                {macro.input.map((input, i) => (
                    <MacroSingleInput
                        key={input.timestamp + '-' + i}
                        input={input}
                        onUpdateTimestamp={(newTs) => handleTimestampUpdate(newTs, i)}
                        updateMacroInputBinding = {updateMacroInputBinding}
                        handleRemoveInput = {handleRemoveInput}
                        
                    />
                ))}
                <div>
                    <button onClick={handleAddInputToMacro}>
                        <FaPlus />
                    </button>
                </div>
            </div>
        </div>
    );
}


export function MacroListBody({active_macro, setActiveMacro}){
    const {configJson, setConfigJson} = useConfig()
    const macros = configJson.macros

    const HandleChangeActiveMacro = (macro_name) => {
        let next_macro = macros.find((m) => m.name == macro_name)
        if(next_macro){
            setActiveMacro(next_macro)
        }
    }
    
    const macro_list = macros?.map(macro => <MacroListOption active={active_macro?.name === macro?.name} key={macro?.name} macro = {macro} setActive={HandleChangeActiveMacro}/>)

    const handleAddNewMacroCommand = () => {
        const newMacro = {
            "id": 1,
            "name": "",
            "model_key": "",
            "model_path": "",
            "activation_treshold": 0,
            "input": []
        }

        let maxId = 0
        let naming_counter = 0
        macros.forEach(m => {
            if(m.id > maxId) maxId += 1
            if(m.name.startsWith("newMacro")){
                naming_counter += 1
            }
        });

        newMacro.id = maxId + 1
        newMacro.name = "newMacro" + ((naming_counter > 0) ? naming_counter.toString() : "")

        const c = structuredClone(configJson)
        c.macros.push(newMacro)
        setConfigJson(c)
    }

    return (
    <div style={{
        backgroundColor: "#242424",
        height: "100%",
        width: "15%",
        display: "flex",
        flexDirection: "column"
        }}>
        {macro_list}

        <div> 
            <button onClick={handleAddNewMacroCommand}><FaPlus/></button>
        </div>
    </div>
    );
}

function MacroListOption({macro, active, setActive}){
    return (
    <button disabled={active} onClick={()=>setActive(macro?.name)}>
        {macro?.name}
    </button>);
}

function MacroSingleInput({ input, onUpdateTimestamp, updateMacroInputBinding, handleRemoveInput }) {
    const [expanded, setExpanded] = useState(false);
    const [tempTimestamp, setTempTimestamp] = useState(input.timestamp);

    const [form, setForm] = useState({});

    useEffect(() => {
        setForm(structuredClone(input.values));
    }, [input]);

    const handleInputChange = (e) => {
        setTempTimestamp(e.target.value);
    };

    const handleInputButtonBindingChange = (e) => {
        const val = e.target.value === "true";
        updateMacroInputBinding(input.timestamp, e.target.name, val)
    }

    const handleInputTriggerBindingChange = (e) => {
        const updatedForm = {...form}
        updatedForm[e.target.name] = e.target.value
        setForm(updatedForm)
    }

    const handleInputStickBindingChange = (e) => {
        const updatedForm = {...form}
        updatedForm[e.target.name] = e.target.value
        setForm(updatedForm)
    }

    const handleBlurStickInput = (e) =>{
        let value = parseFloat(e.target.value)
        let key = e.target.name
        if(value < -1) value = -1
        if(value > 1) value = 1

        updateMacroInputBinding(input.timestamp, key, value)
    }

    const handleBlurTriggerInput = (e) =>{
        let value = parseFloat(e.target.value)
        let key = e.target.name
        if(value < 0) value = 0
        if(value > 1) value = 1

        updateMacroInputBinding(input.timestamp, key, value)
    }

    const commitTimestampChange = () => {
        const parsed = parseInt(tempTimestamp);
        if (!isNaN(parsed) && parsed !== input.timestamp) {
            onUpdateTimestamp(parsed);
        } else {
            setTempTimestamp(input.timestamp);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    const handleAddValue = (e, key, valueType) =>{
        console.log(key)

        e.target.value = ""
        let default_value = true
        if(valueType != "button") default_value = 0
        updateMacroInputBinding(input.timestamp, key, default_value)
    }

    const handleToggleExpand = (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (tag === "input" || tag === "select" || tag === "button" || e.target.closest('select')) return;

        setExpanded((prev) => !prev);
    };

    const possibleInputs = [
        "XUSB_GAMEPAD_DPAD_UP",
        "XUSB_GAMEPAD_DPAD_DOWN",
        "XUSB_GAMEPAD_DPAD_LEFT",
        "XUSB_GAMEPAD_DPAD_RIGHT",
        "XUSB_GAMEPAD_START",
        "XUSB_GAMEPAD_BACK",
        "XUSB_GAMEPAD_LEFT_THUMB",
        "XUSB_GAMEPAD_RIGHT_THUMB",
        "XUSB_GAMEPAD_LEFT_SHOULDER",
        "XUSB_GAMEPAD_RIGHT_SHOULDER",
        "XUSB_GAMEPAD_GUIDE",
        "XUSB_GAMEPAD_A",
        "XUSB_GAMEPAD_B",
        "XUSB_GAMEPAD_X",
        "XUSB_GAMEPAD_Y",
        "XUSB_GAMEPAD_LEFT_TRIGGER",
        "XUSB_GAMEPAD_RIGHT_TRIGGER",
        "XUSB_GAMEPAD_LEFT_STICK_Y",
        "XUSB_GAMEPAD_LEFT_STICK_X",
        "XUSB_GAMEPAD_RIGHT_STICK_Y",
        "XUSB_GAMEPAD_RIGHT_STICK_X"
    ];

    const inputTypes = {
        "XUSB_GAMEPAD_LEFT_TRIGGER": "trigger",
        "XUSB_GAMEPAD_RIGHT_TRIGGER": "trigger",
        "XUSB_GAMEPAD_LEFT_STICK_Y": "stick",
        "XUSB_GAMEPAD_LEFT_STICK_X": "stick",
        "XUSB_GAMEPAD_RIGHT_STICK_Y": "stick",
        "XUSB_GAMEPAD_RIGHT_STICK_X": "stick",
    };

    const unusedInputs = possibleInputs.filter(key => !(key in form));

    const removeBinding = (key) => {
        updateMacroInputBinding(input.timestamp, key, null)
    }

    const removeInput = () => {
        handleRemoveInput(input.timestamp)
    }

    return (
        <div style={{ borderBottom: "1px solid #333", padding: "8px 0", userSelect: "none"}}>
            <div
                style={{ textAlign: "start", paddingLeft: "10px", cursor: "pointer" }}
                onClick={handleToggleExpand}
            >
                <button
                    style={{backgroundColor : "white"}}
                    onClick={removeInput}
                >
                    <FaTrash color="black" />
                </button>

                {!expanded && <> Timestamp: {input.timestamp} ms</>}
                {expanded && (
                    <> Timestamp:{" "}
                        <input
                            type="number"
                            value={tempTimestamp}
                            onChange={handleInputChange}
                            onBlur={commitTimestampChange}
                            onKeyDown={handleKeyDown}
                        />{" "}
                        ms
                    </>
                )}
            </div>
            {expanded && (
                <div style={{ padding: "20px" }}>
                    {Object.entries(input.values).map(([key, value]) => (
                        <div key={key} style={{ display: "flex", flexDirection: "row", gap: "20px", alignItems:"center" }}>
                            <TiDelete color="cyan" style={{cursor: "pointer"}} onClick={()=>removeBinding(key)} />
                            <div className="input-binding-name">{key}</div>
                            <div className="input-binding-value-containter">
                                {
                                    inputTypes[key] === "trigger" && <TriggerInputBinding value={form[key]} binding_key={key} onChange={handleInputTriggerBindingChange} onBlur={handleBlurTriggerInput}/>
                                }
                                {
                                    inputTypes[key] === "stick" && <StickInputBinding value={form[key]} binding_key={key} onChange={handleInputStickBindingChange} onBlur={handleBlurStickInput}/>
                                }
                                {
                                    inputTypes[key] == undefined && <ButtonInputBinding value={value} binding_key={key} onChange = {handleInputButtonBindingChange}/>
                                }
                            </div>
                        </div>
                    ))}
                </div>

            )}
            {expanded && unusedInputs.length > 0 && (
                <div style={{ marginTop: "10px" }}>
                    <label>Add input:</label>
                    <select onChange={(e) => handleAddValue(e, e.target.value, inputTypes[e.target.value] || 'button')}>
                        <option value="">--select--</option>
                        {unusedInputs.map((key) => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}


const StickInputBinding = ({binding_key, value, onChange, onBlur})=>{
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
    <div>
        <input type="number" step="0.01" min="0" max = "1" value={value} name={binding_key} onChange={onChange} onBlur={onBlur} onKeyDown={handleKeyDown}/>
    </div>);
}

const ButtonInputBinding = ({value, binding_key, onChange}) =>{
    return (
    <select value={value} name={binding_key} onChange={onChange}>
        <option value={"true"}> Down </option>
        <option value={"false"}> Up </option>
    </select>);
}

const TriggerInputBinding = ({binding_key, value, onChange, onBlur}) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    return (
        <div>
            <input type="number" step="0.01" min="-1" max = "1" value={value} name={binding_key} onChange={onChange} onBlur={onBlur} onKeyDown={handleKeyDown}/>
        </div>);
}

