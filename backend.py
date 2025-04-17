import os
import signal
import subprocess
import sys
import threading
import time

base_dir = os.path.dirname(os.path.abspath(__file__))

processes = []


def run_app(directory, script):
    original_dir = os.getcwd()
    try:
        os.chdir(directory)
        print(f"启动应用: {directory}/{script}")

        process = subprocess.Popen(["python", script])
        processes.append(process)

        process.wait()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"在运行 {directory}/{script} 时出错: {e}")
    finally:
        os.chdir(original_dir)


def signal_handler(sig, frame):
    print("\n正在退出，请稍等...")
    for proc in processes:
        if proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                proc.kill()
    print("所有进程已终止，退出...")
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

t1 = threading.Thread(
    target=run_app, args=(os.path.join(base_dir, "classify"), "run.py")
)
t2 = threading.Thread(
    target=run_app, args=(os.path.join(base_dir, "UniHair"), "run.py")
)

t1.daemon = True
t2.daemon = True

t1.start()
time.sleep(1)
t2.start()

try:
    while True:
        all_exited = all(proc.poll() is not None for proc in processes)
        if all_exited and processes:
            print("所有应用已完成运行，自动退出...")
            break
        time.sleep(1)
except KeyboardInterrupt:
    pass
