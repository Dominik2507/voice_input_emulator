import time
import sys
import threading
import pygame

pygame.init()
pygame.joystick.init()
joysticks = [pygame.joystick.Joystick(x) for x in range(pygame.joystick.get_count())]

for js in joysticks:
    print(js.get_name(),js.get_power_level())

controller = joysticks[0]
controller.init()
recorded_values = {}

# Variables for session tracking
session_start = None
last_input_time = None

def get_input_states():
    
    if controller.get_name() == "DualSense Wireless Controller":
        input_states = {
            "XUSB_GAMEPAD_DPAD_UP": bool(controller.get_button(11)),
            "XUSB_GAMEPAD_DPAD_DOWN": bool(controller.get_button(12)),
            "XUSB_GAMEPAD_DPAD_LEFT": bool(controller.get_button(13)),
            "XUSB_GAMEPAD_DPAD_RIGHT": bool(controller.get_button(14)),
            "XUSB_GAMEPAD_START": bool(controller.get_button(6)),
            "XUSB_GAMEPAD_BACK": bool(controller.get_button(4)),
            "XUSB_GAMEPAD_LEFT_THUMB": bool(controller.get_button(7)),
            "XUSB_GAMEPAD_RIGHT_THUMB": bool(controller.get_button(8)),
            "XUSB_GAMEPAD_LEFT_SHOULDER": bool(controller.get_button(9)),
            "XUSB_GAMEPAD_RIGHT_SHOULDER": bool(controller.get_button(10)),
            "XUSB_GAMEPAD_GUIDE": bool(controller.get_button(5)),
            "XUSB_GAMEPAD_A": bool(controller.get_button(0)),
            "XUSB_GAMEPAD_B": bool(controller.get_button(1)),
            "XUSB_GAMEPAD_X": bool(controller.get_button(2)),
            "XUSB_GAMEPAD_Y": bool(controller.get_button(3)),
            "XUSB_GAMEPAD_LEFT_TRIGGER": controller.get_axis(4) / 2 + 0.5,
            "XUSB_GAMEPAD_RIGHT_TRIGGER": controller.get_axis(5) / 2 + 0.5,
            "XUSB_GAMEPAD_LEFT_STICK_X": controller.get_axis(0),
            "XUSB_GAMEPAD_LEFT_STICK_Y": controller.get_axis(1),
            "XUSB_GAMEPAD_RIGHT_STICK_X": controller.get_axis(2),
            "XUSB_GAMEPAD_RIGHT_STICK_Y": controller.get_axis(3),
        }
    else:
        input_states = {
            "XUSB_GAMEPAD_DPAD_UP": bool(controller.get_button(11)),
            "XUSB_GAMEPAD_DPAD_DOWN": bool(controller.get_button(12)),
            "XUSB_GAMEPAD_DPAD_LEFT": bool(controller.get_button(13)),
            "XUSB_GAMEPAD_DPAD_RIGHT": bool(controller.get_button(14)),
            "XUSB_GAMEPAD_START": bool(controller.get_button(6)),
            "XUSB_GAMEPAD_BACK": bool(controller.get_button(4)),
            "XUSB_GAMEPAD_LEFT_THUMB": bool(controller.get_button(7)),
            "XUSB_GAMEPAD_RIGHT_THUMB": bool(controller.get_button(8)),
            "XUSB_GAMEPAD_LEFT_SHOULDER": bool(controller.get_button(9)),
            "XUSB_GAMEPAD_RIGHT_SHOULDER": bool(controller.get_button(10)),
            "XUSB_GAMEPAD_GUIDE": bool(controller.get_button(5)),
            "XUSB_GAMEPAD_A": bool(controller.get_button(0)),
            "XUSB_GAMEPAD_B": bool(controller.get_button(1)),
            "XUSB_GAMEPAD_X": bool(controller.get_button(2)),
            "XUSB_GAMEPAD_Y": bool(controller.get_button(3)),
            "XUSB_GAMEPAD_LEFT_TRIGGER": controller.get_axis(4) / 2 + 0.5,
            "XUSB_GAMEPAD_RIGHT_TRIGGER": controller.get_axis(5) / 2 + 0.5,
            "XUSB_GAMEPAD_LEFT_STICK_X": controller.get_axis(0),
            "XUSB_GAMEPAD_LEFT_STICK_Y": controller.get_axis(1),
            "XUSB_GAMEPAD_RIGHT_STICK_X": controller.get_axis(2),
            "XUSB_GAMEPAD_RIGHT_STICK_Y": controller.get_axis(3),
        }
    
    return input_states


def read_physical_inputs():
    global session_start, last_input_time, recorded_values
    
    # Get current time
    now = time.time()
    
    # Check the current button states
    
    button_states = get_input_states()
    
    if session_start is None:
        has_input = False
        if True in button_states.values():
            has_input = True
        else:
            for key, value in button_states.items():
                if key.find("STICK") > -1 or key.find("TRIGGER") > -1:
                    if abs(value) > 0.1:
                        has_input = True
                        break
        if has_input:
            session_start = now
            recorded_values = {}
    
    if session_start is None:
        return
    
    
    for button_name, value in button_states.items():
        if isinstance(value, float):
            if button_name in recorded_values and abs(recorded_values[button_name] - value) > 0.1:
                timestamp_ms = int((now - session_start) * 1000)
                recorded_values[button_name] = value
                print(f"--input {timestamp_ms},{button_name},{value}")
                last_input_time = now
            if button_name not in recorded_values and abs(value) >= 0.1:
                timestamp_ms = int((now - session_start) * 1000)
                recorded_values[button_name] = value
                print(f"--input {timestamp_ms},{button_name},{value}")
                last_input_time = now
                
        elif isinstance(value, bool):
            is_pressed = value
            if is_pressed and button_name not in recorded_values:
                timestamp_ms = int((now - session_start) * 1000)
                recorded_values[button_name] = True
                print(f"--input {timestamp_ms},{button_name},{is_pressed}")
                last_input_time = now
            if button_name in recorded_values and recorded_values[button_name] != is_pressed:
                timestamp_ms = int((now - session_start) * 1000)
                recorded_values[button_name] = is_pressed
                print(f"--input {timestamp_ms},{button_name},{is_pressed}")
                last_input_time = now

restart_flag = False

def stdin_listener():
    global restart_flag
    while True:
        line = sys.stdin.readline().strip()
        if line.lower() == "restart":
            restart_flag = True
            print("--info Restarting recording...")

listener_thread = threading.Thread(target=stdin_listener, daemon=True)
listener_thread.start()

try:
    while True:
        pygame.event.get()

        if restart_flag:
            session_start = None
            last_input_time = None
            recorded_values = {}
            restart_flag = False
            time.sleep(1)
            print("--info Restarted recording, waiting for input")
        read_physical_inputs()
except KeyboardInterrupt:
    print("--info Program interrupted.")
finally:
    pygame.joystick.quit()