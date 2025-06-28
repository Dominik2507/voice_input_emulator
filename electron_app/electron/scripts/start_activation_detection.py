import pyaudio
import numpy as np
from openwakeword.model import Model # type: ignore
import argparse
import json
import sys
import pygame
import threading

import vgamepad as vg
import time
#from inputs import get_gamepad
from dualsense_controller import DualSenseController

parser = argparse.ArgumentParser()

parser.add_argument(
    "--config_file",
    help="Path to the selected configuration json file",
    type=str,
    default="D:\\Faks\\dipl_rad\\voice_input_emulator\\electron_app\\electron\\configurations\\player1.json",
    required=False
)

parser.add_argument(
    "--inference_framework",
    help="The inference framework to use (either 'onnx' or 'tflite')",
    type=str,
    default='onnx',
    required=False
)

args = parser.parse_args()

with open(args.config_file, 'r') as file:
    player_config = json.load(file)

model_files = []

for button, binding in player_config["input_bindings"].items():
    if binding and binding.get("model_path"):
        model_files.append(binding["model_path"])

for macro in player_config["macros"]:
    model_files.append(macro["model_path"])
    
model_files = list(set(model_files))

# microphone streaming
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000
CHUNK = 1280
audio = pyaudio.PyAudio()
mic_stream = audio.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)

# Load models
owwModel = Model(wakeword_models=model_files, inference_framework="onnx")
n_models = len(owwModel.models.keys())


#controller setup

pygame.init()
pygame.joystick.init()
joysticks = [pygame.joystick.Joystick(x) for x in range(pygame.joystick.get_count())]

for js in joysticks:
    print(js.get_name(),js.get_power_level())

controller = joysticks[0]
controller.init()


def try_initialize_gamepad(retries=5, delay=1):
    for attempt in range(retries):
        try:
            gamepad = vg.VX360Gamepad()
            return gamepad
        except AssertionError as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(delay)
    raise RuntimeError("Could not connect to ViGEmBus after several attempts")

gamepad = try_initialize_gamepad()
#gamepad = vg.VX360Gamepad()

# ds5 = DualSenseController(microphone_initially_muted=False)
# ds5.activate()

cooldowns = {}
cooldown_duration = 0.6

def input_detected_binding(button_str: str):
    
    print(f"pressing {button_str}")
    
    read_physical_inputs()
    
    if str.__contains__(button_str, "STICK"):
        if button_str == "XUSB_GAMEPAD_LEFT_STICK_UP":
            gamepad.left_joystick_float(0, 1)
        elif button_str == "XUSB_GAMEPAD_LEFT_STICK_DOWN":
            gamepad.left_joystick_float(0, -1)
        elif button_str == "XUSB_GAMEPAD_LEFT_STICK_LEFT":
            gamepad.left_joystick_float(-1, 0)
        elif button_str == "XUSB_GAMEPAD_LEFT_STICK_RIGHT":
            gamepad.left_joystick_float(1, 0)
            
        elif button_str == "XUSB_GAMEPAD_RIGHT_STICK_UP":
            gamepad.right_joystick_float(0, 1)
        elif button_str == "XUSB_GAMEPAD_RIGHT_STICK_DOWN":
            gamepad.right_joystick_float(0, -1)
        elif button_str == "XUSB_GAMEPAD_RIGHT_STICK_LEFT":
            gamepad.right_joystick_float(-1, 0)
        elif button_str == "XUSB_GAMEPAD_RIGHT_STICK_RIGHT":
            gamepad.right_joystick_float(1, 0)
            
    elif str.__contains__(button_str, "TRIGGER"):
        if button_str == "XUSB_GAMEPAD_LEFT_TRIGGER":
            gamepad.left_trigger_float(1)
        elif button_str == "XUSB_GAMEPAD_RIGHT_TRIGGER":
            gamepad.right_trigger_float(1)
    else:
        button = getattr(vg.XUSB_BUTTON, button_str)
        gamepad.press_button(button)
        
    
    gamepad.update()
    
    threading.Thread(target= release_button_after, args=(button,0.15)).start()
    
def input_detected_macro(macro):
    start_time = time.time()
    
    index = 0
    
    input_values = {
        
    }
     
    while index < len(macro["input"]):
        input = macro["input"][index]
        passed_time = time.time() - start_time
        if int(passed_time * 1000) >= int(input.get("timestamp", 0)):
            # execute input
            gamepad.reset()
            set_left_stick = False
            left_stick_x = 0
            left_stick_y = 0
        
            set_right_stick = False
            right_stick_x = 0
            right_stick_y = 0
            read_physical_inputs()
            for binding, value in input["values"].items():
                
                if ["XUSB_GAMEPAD_LEFT_TRIGGER", "XUSB_GAMEPAD_RIGHT_TRIGGER"].__contains__(binding):
                    input_values[binding] = value
                    if abs(value) < 0.1:
                        input_values.pop(binding)
                    # if binding == "XUSB_GAMEPAD_LEFT_TRIGGER":
                    #     gamepad.left_trigger_float(value)
                    # elif binding == "XUSB_GAMEPAD_RIGHT_TRIGGER":
                    #     gamepad.right_trigger_float(value)
                elif ["XUSB_GAMEPAD_LEFT_STICK_X", "XUSB_GAMEPAD_LEFT_STICK_Y", "XUSB_GAMEPAD_RIGHT_STICK_X", "XUSB_GAMEPAD_RIGHT_STICK_Y"].__contains__(binding):
                    
                    input_values[binding] = value
                    if abs(value) < 0.1:
                        input_values.pop(binding)
                            
                    # if binding == "XUSB_GAMEPAD_LEFT_STICK_X":
                    #     set_left_stick = True
                    #     left_stick_x = value
                    # elif binding == "XUSB_GAMEPAD_LEFT_STICK_Y":
                    #     set_left_stick = True
                    #     left_stick_y = value
                    # elif binding == "XUSB_GAMEPAD_RIGHT_STICK_X":
                    #     set_right_stick = True
                    #     right_stick_x = value
                    # elif binding == "XUSB_GAMEPAD_RIGHT_STICK_Y":
                    #     set_right_stick = True
                    #     right_stick_y = value
                else:
                    button = getattr(vg.XUSB_BUTTON, binding)
                    
                    if value:
                        input_values[binding] = True
                        #gamepad.press_button(button)
                    else:
                        if input_values.get(binding):
                            input_values.pop(binding)
                        #gamepad.release_button(button)
            
            for key, value in input_values.items():
                
                if key.__contains__("TRIGGER"):
                    if key == "XUSB_GAMEPAD_LEFT_TRIGGER":
                        gamepad.left_trigger_float(value)
                    elif key == "XUSB_GAMEPAD_RIGHT_TRIGGER":
                        gamepad.right_trigger_float(value)
                elif key.__contains__("STICK"):
                    if key == "XUSB_GAMEPAD_LEFT_STICK_X":
                        set_left_stick = True
                        left_stick_x = value
                    elif key == "XUSB_GAMEPAD_LEFT_STICK_Y":
                        set_left_stick = True
                        left_stick_y = value
                    elif key == "XUSB_GAMEPAD_RIGHT_STICK_X":
                        set_right_stick = True
                        right_stick_x = value
                    elif key == "XUSB_GAMEPAD_RIGHT_STICK_Y":
                        set_right_stick = True
                        right_stick_y = value
                else:
                    button = getattr(vg.XUSB_BUTTON, key)
                    gamepad.press_button(button)
                    
                    
            if set_left_stick:
                gamepad.left_joystick_float(left_stick_x, left_stick_y)
            if set_right_stick:
                gamepad.right_joystick_float(right_stick_x, right_stick_y)

            gamepad.update()
        if index + 1 == len(macro["input"]):
            time.sleep(0.1)
            index+=1 
        else:
            next_input = macro["input"][index + 1]
            if int(passed_time * 1000) >= int(next_input.get("timestamp", 0)):
                index += 1
        time.sleep(0.001)
    gamepad.reset()
    gamepad.update()
        
        
    
def release_button_after(button, delay): 
    time.sleep(delay)
    gamepad.reset()
    read_physical_inputs()
    gamepad.update()
    

def read_from_ds5(controller: DualSenseController):
    buttons = {}

    # Face buttons
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_A] = controller.btn_cross._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_B] = controller.btn_circle._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_X] = controller.btn_square._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_Y] = controller.btn_triangle._get_value()

    # Start / Back
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_START] = controller.btn_options._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK] = controller.btn_create._get_value()

    # D-Pad
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN] = controller.btn_down._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT] = controller.btn_left._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT] = controller.btn_right._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP] = controller.btn_up._get_value()

    # Bumpers
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER] = controller.btn_l1._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER] = controller.btn_r1._get_value()

    # Thumbstick Clicks (L3/R3)
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB] = controller.btn_l3._get_value()
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB] = controller.btn_r3._get_value()

    # Triggers
    triggers = {
        "left": int(controller.left_trigger.value * 255),
        "right": int(controller.right_trigger.value * 255)
    }
    
    left_stick = (controller.left_stick_x.value, controller.left_stick_y.value)
    right_stick = (controller.right_stick_x.value, controller.right_stick_y.value)
    
    return buttons, triggers, left_stick, right_stick

def read_from_pygame(controller: pygame.joystick):
    pygame.event.get()
    
    buttons = {}

    # Face buttons
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_A] = bool(controller.get_button(0))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_B] = bool(controller.get_button(1))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_X] = bool(controller.get_button(2))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_Y] = bool(controller.get_button(3))

    # Start / Back
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_START] = bool(controller.get_button(6))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_BACK] = bool(controller.get_button(4))

    # D-Pad
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_UP] = bool(controller.get_button(11))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_DOWN] = bool(controller.get_button(12))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_LEFT] = bool(controller.get_button(13))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_DPAD_RIGHT] = bool(controller.get_button(14))

    # Bumpers
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_SHOULDER] = bool(controller.get_button(9))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_SHOULDER] = bool(controller.get_button(10))

    # Thumbstick Clicks (L3/R3)
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_LEFT_THUMB] = bool(controller.get_button(7))
    buttons[vg.XUSB_BUTTON.XUSB_GAMEPAD_RIGHT_THUMB] = bool(controller.get_button(8))

    # Triggers
    triggers = {
        "left": int((controller.get_axis(4) / 2 + 0.5) * 255),
        "right": int((controller.get_axis(5) / 2 + 0.5) * 255)
    }
    
    left_stick = (controller.get_axis(0), controller.get_axis(1))
    right_stick = (controller.get_axis(2), controller.get_axis(3))
    
    return buttons, triggers, left_stick, right_stick

def read_physical_inputs():
    
    gamepad.reset()
    
    buttons, triggers, lstick, rstick = read_from_pygame(controller)

    for key, value in buttons.items():
        if value:
            gamepad.press_button(key)
        else:
            gamepad.release_button(key)

    # Apply triggers (L2 and R2)
    gamepad.left_trigger(triggers["left"])
    gamepad.right_trigger(triggers["right"])
    gamepad.left_joystick_float(lstick[0], lstick[1])
    gamepad.right_joystick_float(rstick[0], rstick[1])
    
    gamepad.update()


if __name__ == "__main__":
    
    print("Started models: ")
    for _model in owwModel.models.keys():
        print(_model)
    
    while True:
        try:
            audio = np.frombuffer(mic_stream.read(CHUNK), dtype=np.int16)
            prediction = owwModel.predict(audio)
            
            for _model in owwModel.prediction_buffer.keys():
                scores = list(owwModel.prediction_buffer[_model])
                curr_score = scores[-1]
                
                current_time = time.time()
                
                for button, binding in player_config["input_bindings"].items():
                    if binding and binding.get("model_key") == _model:
                        cooldown_time = cooldowns.get(button, 0)
                        
                        if binding.get("activation_treshold") < curr_score and current_time - cooldown_time > cooldown_duration:
                            print(f"Detected activation: {_model}, {float(curr_score)}")
                            input_detected_binding(button)
                            cooldowns[button] = current_time
                
                for macro in player_config["macros"]:
                    if macro["model_key"] == _model:
                        cooldown_time = cooldowns.get(macro["name"], 0)
                        if macro["activation_treshold"] < curr_score and current_time - cooldown_time > cooldown_duration:
                            print("Detected macro: " + macro["name"] + f", {float(curr_score)}")
                            threading.Thread(target= input_detected_macro, args=(macro,)).start()
                            #input_detected_macro(macro)
                            cooldowns[macro["name"]] = current_time
        except Exception as e:
            print(f"Error: {str(e)}")
            pygame.joystick.quit()
            pygame.quit()
            
            
            
            
            
            
            
            

