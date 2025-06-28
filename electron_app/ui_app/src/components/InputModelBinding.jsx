import { useRef } from "react";

export default function InputModelBinding({name, config_key, binding_object, onLoadModel, onEditBinding}){

    const handleFileChange = async () => {
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
            
            if(config_key.includes("STICK") || config_key.includes("TRIGGER")) newBinding.input_value = 1
            
            console.log(newBinding)

            onLoadModel(config_key, newBinding)
        };

    }

    const onEditThisBinding = () => {
        onEditBinding(config_key)
    }

    return (
    <div className="input-binding-tab">
        <div>
            {name}
        </div>
        <div>
            {binding_object != null && <button onClick={onEditThisBinding}>{binding_object["model_key"]}</button>}
            {binding_object == null && <button onClick={handleFileChange}>Load model</button>}
        </div>

    </div>);
}