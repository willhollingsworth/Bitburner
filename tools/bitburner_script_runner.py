import keyboard
import win32gui
from time import sleep

"""
    rebinds the default keyboard shortcut for running in vscode (with coderunner extension installed) 
    to execute the script in bitburner

https://github.com/boppreh/keyboard
https://github.com/mhammond/pywin32

"""


def switch_bitburner():
    current_title = win32gui.GetWindowText(win32gui.GetForegroundWindow())
    current_script = current_title.split(".")[0]
    print("hotkey pressed, running", current_script)
    sleep(0.2)
    # switch to bitburner window
    win32gui.SetForegroundWindow(win32gui.FindWindow(None, "Bitburner"))

    # sleep(0.2)
    # keyboard.press_and_release("alt+t")
    sleep(0.2)
    keyboard.write("run updater.js " + current_script)
    sleep(0.2)
    keyboard.press_and_release("enter")


keyboard.add_hotkey(
    "ctrl + alt + n",
    switch_bitburner,
    suppress=True,
)

print("bitburner script runner started")
keyboard.wait()  # leave program running awaiting the hotkey
