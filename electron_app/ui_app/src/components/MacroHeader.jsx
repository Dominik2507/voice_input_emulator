import ConfigComponent from "./ConfigComponent";

export default function MacroHeader({configs}){
    return (
    <div
        style={{
            height: "10%"
        }}
    >
        <ConfigComponent configs = {configs}/>
    </div>
    );
}