import time
import sys
import threading
#import inputs
from dualsense_controller import DualSenseController
# gamepad = vg.VX360Gamepad()

# # press a button to wake the device up
# time.sleep(3)
# gamepad.press_button(button=vg.XUSB_BUTTON.XUSB_GAMEPAD_A)
# gamepad.update()
# time.sleep(0.5)
# gamepad.release_button(button=vg.XUSB_BUTTON.XUSB_GAMEPAD_A)
# gamepad.update()
# time.sleep(3)
 
# gamepad.press_button(button=vg.XUSB_BUTTON.XUSB_GAMEPAD_A)
# gamepad.update()
# time.sleep(0.5)
# gamepad.release_button(button=vg.XUSB_BUTTON.XUSB_GAMEPAD_A)
# gamepad.update()

controller = DualSenseController(microphone_initially_muted=False)
controller.activate()
# Dictionary to track button states and timestamps


recorded_values = {}

# Variables for session tracking
session_start = None
last_input_time = None

def get_input_states():
    
    input_states = {
        "XUSB_GAMEPAD_DPAD_UP": controller.btn_up.pressed,
        "XUSB_GAMEPAD_DPAD_DOWN": controller.btn_down.pressed,
        "XUSB_GAMEPAD_DPAD_LEFT": controller.btn_left.pressed,
        "XUSB_GAMEPAD_DPAD_RIGHT": controller.btn_right.pressed,
        "XUSB_GAMEPAD_START": controller.btn_options.pressed,
        "XUSB_GAMEPAD_BACK": controller.btn_create.pressed,
        "XUSB_GAMEPAD_LEFT_THUMB": controller.btn_l3.pressed,
        "XUSB_GAMEPAD_RIGHT_THUMB": controller.btn_r3.pressed,
        "XUSB_GAMEPAD_LEFT_SHOULDER": controller.btn_l1.pressed,
        "XUSB_GAMEPAD_RIGHT_SHOULDER": controller.btn_r1.pressed,
        "XUSB_GAMEPAD_GUIDE": controller.btn_ps.pressed,
        "XUSB_GAMEPAD_A": controller.btn_cross.pressed,
        "XUSB_GAMEPAD_B": controller.btn_circle.pressed,
        "XUSB_GAMEPAD_X": controller.btn_square.pressed,
        "XUSB_GAMEPAD_Y": controller.btn_triangle.pressed,
        "XUSB_GAMEPAD_LEFT_TRIGGER": controller.left_trigger.value,
        "XUSB_GAMEPAD_RIGHT_TRIGGER": controller.right_trigger.value,
        "XUSB_GAMEPAD_LEFT_STICK_X": controller.left_stick_x.value,
        "XUSB_GAMEPAD_LEFT_STICK_Y": controller.left_stick_y.value,
        "XUSB_GAMEPAD_RIGHT_STICK_X": controller.right_stick_x.value,
        "XUSB_GAMEPAD_RIGHT_STICK_Y": controller.right_stick_y.value
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
        if restart_flag:
            session_start = None
            last_input_time = None
            recorded_values = {}
            restart_flag = False
            time.sleep(1)
            print("--info Restarted recording, waiting for input")
        read_physical_inputs()
        time.sleep(0.001)
except KeyboardInterrupt:
    print("\--info nProgram interrupted.")
finally:
    # Stop the controller when done
    controller.deactivate()