import os
import re
import shutil
import signal
import subprocess
import sys
import threading
import time
import traceback
import uuid
from typing import Any, Dict, Generator, List, Optional, Tuple

import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data/img"
OUTPUT_DIR = "data/logs"
LOG_DIR = "data/server_logs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

active_processes = {}
process_lock = threading.Lock()

original_sigint_handler = signal.getsignal(signal.SIGINT)
original_sigterm_handler = signal.getsignal(signal.SIGTERM)

start_time = time.time()

PROGRESS_REGEX = re.compile(r"(\d+%|\d+/\d+|\d+\.\d+it/s)")


def log_to_console(
    message: str,
    process_id: Optional[str] = None,
    error: bool = False,
    progress: bool = False,
):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    prefix = f"[{timestamp}]"
    if process_id:
        prefix += f" [PID:{process_id}]"
    if progress:
        prefix += " [PROGRESS]"

    log_message = f"{prefix} {message}"

    if error:
        print(log_message, file=sys.stderr, flush=True)
    else:
        print(log_message, flush=True)

    log_file = os.path.join(LOG_DIR, f"server_{time.strftime('%Y-%m-%d')}.log")
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(f"{log_message}\n")
    except Exception as e:
        print(f"[ERROR] 无法写入日志文件: {str(e)}", file=sys.stderr)


def is_progress_line(line: str) -> bool:
    if not line.strip():
        return False
    return bool(PROGRESS_REGEX.search(line))


def process_output_line(
    line: str, prefix: str, is_error: bool = False
) -> Tuple[str, bool]:
    ansi_escape = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
    cleaned_line = ansi_escape.sub("", line).rstrip()

    is_progress = is_progress_line(cleaned_line)

    if is_progress:
        type_label = "PROGRESS"
    elif is_error:
        type_label = "ERR"
    else:
        type_label = "OUT"

    formatted_line = f"{prefix} [{type_label}]: {cleaned_line}"

    return formatted_line, is_progress


class ProcessOutputReader:

    def __init__(self, process: subprocess.Popen, process_id: str, prefix: str):
        self.process = process
        self.process_id = process_id
        self.prefix = prefix
        self.stdout_lines = []
        self.stderr_lines = []
        self.progress_lines = {}
        self.active = True
        self.lock = threading.Lock()
        self.stdout_thread = None
        self.stderr_thread = None
        self.queue = []
        self.queue_lock = threading.Lock()
        self.queue_event = threading.Event()
        self.stdout_done = threading.Event()
        self.stderr_done = threading.Event()
        self.all_done = threading.Event()
        self.exit_code = None

    def start(self):
        self.stdout_thread = threading.Thread(
            target=self._read_output,
            args=(self.process.stdout, False, self.stdout_done),
            daemon=True,
        )
        self.stderr_thread = threading.Thread(
            target=self._read_output,
            args=(self.process.stderr, True, self.stderr_done),
            daemon=True,
        )

        self.stdout_thread.start()
        self.stderr_thread.start()
        return self

    def _read_output(
        self, pipe, is_error: bool = False, done_event: threading.Event = None
    ):
        thread_name = "stderr" if is_error else "stdout"
        log_to_console(f"{thread_name}读取线程启动", self.process_id)

        try:
            for line in iter(pipe.readline, ""):
                if not self.active:
                    break

                line = line.rstrip("\r\n")
                if not line:
                    continue

                formatted_line, is_progress = process_output_line(
                    line, self.prefix, is_error
                )

                with self.lock:
                    if is_progress:
                        progress_type = line[:10]
                        self.progress_lines[progress_type] = formatted_line
                    else:
                        if is_error:
                            self.stderr_lines.append(line)
                        else:
                            self.stdout_lines.append(line)

                    with self.queue_lock:
                        self.queue.append((formatted_line, is_progress, is_error))
                    self.queue_event.set()

                log_to_console(
                    line, self.process_id, error=is_error, progress=is_progress
                )

            log_to_console(f"{thread_name}读取管道到达EOF", self.process_id)
        except (BrokenPipeError, IOError) as e:
            log_to_console(
                f"{thread_name}读取出错: {str(e)}", self.process_id, error=True
            )
        except Exception as e:
            log_to_console(
                f"{thread_name}读取异常: {str(e)}", self.process_id, error=True
            )
            log_to_console(traceback.format_exc(), self.process_id, error=True)
        finally:
            log_to_console(f"{thread_name}读取线程结束", self.process_id)
            if done_event:
                done_event.set()

            if self.stdout_done.is_set() and self.stderr_done.is_set():
                self.exit_code = self.process.poll()
                log_to_console(
                    f"所有输出读取完成，退出码: {self.exit_code}", self.process_id
                )
                self.all_done.set()

    def read(self) -> Generator[str, None, None]:
        time.sleep(0.1)

        while self.active:
            items_to_process = []
            with self.queue_lock:
                if self.queue:
                    items_to_process = self.queue.copy()
                    self.queue.clear()

            for formatted_line, is_progress, is_error in items_to_process:
                yield formatted_line

            if self.all_done.is_set() and not items_to_process:
                with self.lock:
                    for progress_line in self.progress_lines.values():
                        yield progress_line
                break

            if not items_to_process:
                wait_result = self.queue_event.wait(timeout=0.1)
                if wait_result:
                    self.queue_event.clear()

                if not self.all_done.is_set() and self.process.poll() is not None:
                    log_to_console(
                        f"进程已退出(返回码:{self.process.poll()})，但读取线程尚未完成",
                        self.process_id,
                    )
                    time.sleep(0.5)

            if self.process.poll() is not None and not self.all_done.is_set():
                if not self.stdout_done.is_set() or not self.stderr_done.is_set():
                    log_to_console(
                        f"进程已退出，等待读取线程完成: stdout={self.stdout_done.is_set()}, stderr={self.stderr_done.is_set()}",
                        self.process_id,
                    )
                    time.sleep(0.5)
                else:
                    self.all_done.set()

        if not self.active and not self.all_done.is_set():
            yield f"{self.prefix} [INFO]: 进程被中断"

    def get_exit_code(self) -> Optional[int]:
        if self.exit_code is not None:
            return self.exit_code
        return self.process.poll()

    def stop(self):
        self.active = False
        if not self.all_done.is_set():
            log_to_console(f"正在停止 {self.prefix} 的输出读取", self.process_id)
            try:
                if self.process and self.process.poll() is None:
                    log_to_console(f"终止进程 {self.process.pid}", self.process_id)
                    if os.name == "nt":
                        self.process.terminate()
                    else:
                        try:
                            pgid = os.getpgid(self.process.pid)
                            os.killpg(pgid, signal.SIGTERM)
                            time.sleep(0.5)
                            if self.process.poll() is None:
                                os.killpg(pgid, signal.SIGKILL)
                        except (ProcessLookupError, OSError) as e:
                            log_to_console(
                                f"发送信号时出错: {str(e)}", self.process_id, error=True
                            )
            except Exception as e:
                log_to_console(f"终止进程异常: {str(e)}", self.process_id, error=True)


def run_process_with_output(
    cmd: List[str], process_id: str, prefix: str = "", timeout: int = 3600
) -> Generator[str, None, Dict[str, Any]]:
    log_to_console(f"启动命令: {' '.join(cmd)}", process_id)

    env = os.environ.copy()
    env["PYTHONUNBUFFERED"] = "1"

    try:
        if os.name == "nt":
            creation_flags = subprocess.CREATE_NEW_PROCESS_GROUP
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                creationflags=creation_flags,
                env=env,
                universal_newlines=True,
            )
        else:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                start_new_session=True,
                env=env,
                universal_newlines=True,
            )
    except Exception as e:
        log_to_console(f"启动进程失败: {str(e)}", process_id, error=True)
        log_to_console(traceback.format_exc(), process_id, error=True)
        yield f"{prefix} [ERROR]: 启动进程失败: {str(e)}"
        return {"returncode": -1, "stdout": "", "stderr": f"启动进程失败: {str(e)}"}

    log_to_console(f"启动{prefix}进程 PID: {process.pid}", process_id)

    with process_lock:
        active_processes[process_id] = {
            "process": process,
            "prefix": prefix,
            "active": True,
            "start_time": time.time(),
        }

    result = {"returncode": None, "stdout": "", "stderr": ""}
    output_reader = ProcessOutputReader(process, process_id, prefix).start()

    start_time = time.time()
    deadline = start_time + timeout

    try:
        output_count = 0
        for line in output_reader.read():
            yield line
            output_count += 1

            with process_lock:
                is_active = (
                    process_id in active_processes
                    and active_processes[process_id]["active"]
                )

            if time.time() > deadline:
                log_to_console(
                    f"{prefix}进程超时 ({timeout}秒)", process_id, error=True
                )
                yield f"{prefix} [ERROR]: 进程超时 ({timeout}秒)"
                break

            if not is_active:
                log_to_console(f"{prefix}进程被标记为非活跃", process_id)
                break

        if output_count == 0:
            log_to_console(f"{prefix}进程没有产生任何输出", process_id, error=True)
            yield f"{prefix} [WARNING]: 进程没有产生任何输出"

    except Exception as e:
        log_to_console(f"处理{prefix}输出时异常: {str(e)}", process_id, error=True)
        log_to_console(traceback.format_exc(), process_id, error=True)
        yield f"{prefix} [ERROR]: 处理输出异常: {str(e)}"
    finally:
        output_reader.stop()

        try:
            if process.poll() is None:
                log_to_console(f"等待{prefix}进程结束", process_id)
                try:
                    process.wait(timeout=5.0)
                except subprocess.TimeoutExpired:
                    log_to_console(f"强制终止{prefix}进程", process_id)
                    try:
                        if os.name == "nt":
                            process.terminate()
                        else:
                            pgid = os.getpgid(process.pid)
                            os.killpg(pgid, signal.SIGTERM)
                            time.sleep(0.5)
                            if process.poll() is None:
                                os.killpg(pgid, signal.SIGKILL)
                    except (ProcessLookupError, OSError) as e:
                        log_to_console(
                            f"终止进程失败: {str(e)}", process_id, error=True
                        )
        except Exception as e:
            log_to_console(f"清理进程异常: {str(e)}", process_id, error=True)

        returncode = process.poll()
        if returncode is not None:
            result["returncode"] = returncode

        result["stdout"] = "\n".join(output_reader.stdout_lines)
        result["stderr"] = "\n".join(output_reader.stderr_lines)

        with process_lock:
            if process_id in active_processes:
                active_processes[process_id] = {
                    "process": None,
                    "prefix": prefix,
                    "active": False,
                    "end_time": time.time(),
                    "returncode": returncode if returncode is not None else -1,
                }

        log_to_console(f"{prefix}进程处理完成，退出码: {returncode}", process_id)

    return result


def execute_script_with_bash(script_path, args, process_id):
    try:
        script_abs_path = os.path.abspath(script_path)
        script_dir = os.path.dirname(script_abs_path)

        log_to_console(f"脚本绝对路径: {script_abs_path}", process_id)
        log_to_console(f"脚本所在目录: {script_dir}", process_id)

        cmd = ["/bin/bash", script_abs_path] + args
        cmd_str = " ".join(cmd)
        log_to_console(f"执行命令: {cmd_str}", process_id)

        temp_out = os.path.join(OUTPUT_DIR, f"script_output_{process_id}.txt")
        cmd_with_redirect = f"{cmd_str} > {temp_out} 2>&1"

        returncode = subprocess.call(cmd_with_redirect, shell=True, cwd=script_dir)

        output = ""
        if os.path.exists(temp_out):
            with open(temp_out, "r") as f:
                output = f.read()
            log_to_console(f"脚本输出: {output}", process_id)
            os.remove(temp_out)

        return {"returncode": returncode, "output": output}
    except Exception as e:
        log_to_console(f"执行脚本时出错: {str(e)}", process_id, error=True)
        log_to_console(traceback.format_exc(), process_id, error=True)
        return {"returncode": -1, "output": f"执行出错: {str(e)}"}


@app.post("/run-unihair")
async def run_unihair_stream(file: UploadFile = File(...)):
    process_id = str(uuid.uuid4())
    log_to_console("收到新的处理请求", process_id)

    filename = os.path.splitext(file.filename)[0]

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    upload_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    log_to_console(f"文件已保存到: {upload_path}", process_id)

    cwd = os.getcwd()
    log_to_console(f"当前工作目录: {cwd}", process_id)

    hairalign_script = os.path.abspath(
        os.path.join(BASE_DIR, "UniHair", "scripts", "run_hairalign.sh")
    )
    unihair_script = os.path.abspath(
        os.path.join(BASE_DIR, "UniHair", "scripts", "run_unihair.sh")
    )

    log_to_console(f"BASE_DIR: {BASE_DIR}", process_id)
    log_to_console(f"脚本路径(HairAlign): {hairalign_script}", process_id)
    log_to_console(f"脚本路径(UniHair): {unihair_script}", process_id)

    if not os.path.exists(hairalign_script):
        error_msg = f"错误: HairAlign脚本不存在: {hairalign_script}"
        log_to_console(error_msg, process_id, error=True)
        return JSONResponse(content={"error": error_msg}, status_code=500)

    if not os.path.exists(unihair_script):
        error_msg = f"错误: UniHair脚本不存在: {unihair_script}"
        log_to_console(error_msg, process_id, error=True)
        return JSONResponse(content={"error": error_msg}, status_code=500)

    try:
        os.chmod(hairalign_script, 0o755)
        os.chmod(unihair_script, 0o755)

        hairalign_stat = os.stat(hairalign_script)
        unihair_stat = os.stat(unihair_script)
        log_to_console(f"HairAlign脚本权限: {oct(hairalign_stat.st_mode)}", process_id)
        log_to_console(f"UniHair脚本权限: {oct(unihair_stat.st_mode)}", process_id)

    except Exception as e:
        log_to_console(f"处理脚本时出错: {str(e)}", process_id, error=True)
        log_to_console(traceback.format_exc(), process_id, error=True)

    with process_lock:
        active_processes[process_id] = {
            "process": None,
            "prefix": "初始化",
            "active": True,
            "start_time": time.time(),
        }

    async def generate_output():
        yield f"进程ID: {process_id}\n"
        yield "开始处理文件...\n"
        yield f"上传文件: {file.filename}\n"

        def is_process_active():
            with process_lock:
                return (
                    process_id in active_processes
                    and active_processes[process_id]["active"]
                )

        hairalign_success = False
        unihair_success = False

        try:
            log_to_console("准备运行HairAlign", process_id)
            yield "\n===== 运行 HairAlign =====\n"

            cmd = [
                "bash",
                hairalign_script,
                upload_path,
                "-o",
                OUTPUT_DIR,
            ]

            log_to_console(f"执行HairAlign命令: {' '.join(cmd)}", process_id)

            hairalign_result = {}
            for line in run_process_with_output(
                cmd, process_id, "HairAlign", timeout=1800
            ):
                yield f"{line}\n"
                hairalign_result["last_line"] = line

                if not is_process_active():
                    yield "处理已被取消\n"
                    return

            with process_lock:
                if process_id in active_processes:
                    hairalign_exitcode = active_processes[process_id].get("returncode")
                    hairalign_result["returncode"] = hairalign_exitcode

            if hairalign_result.get("returncode", -1) != 0:
                error_msg = f"HairAlign执行失败，退出码: {hairalign_result.get('returncode', 'unknown')}"
                log_to_console(error_msg, process_id, error=True)
                yield f"错误: {error_msg}\n"
                return

            hairalign_success = True
            log_to_console("HairAlign执行成功", process_id)
            yield "HairAlign处理完成，准备运行UniHair...\n"

            hairalign_output = os.path.join(OUTPUT_DIR, f"{filename}_hairalign.ply")
            if os.path.exists(hairalign_output):
                log_to_console(f"找到HairAlign输出文件: {hairalign_output}", process_id)
                yield f"HairAlign输出文件已生成: {os.path.basename(hairalign_output)}\n"
            else:
                log_to_console("警告: 未找到HairAlign输出文件", process_id, error=True)
                yield "警告: 未找到HairAlign输出文件，但继续处理...\n"
                try:
                    output_files = os.listdir(OUTPUT_DIR)
                    log_to_console(f"输出目录中的文件: {output_files}", process_id)
                    yield f"输出目录中的文件: {', '.join(output_files)}\n"
                except Exception as e:
                    log_to_console(
                        f"列出输出目录文件时出错: {str(e)}", process_id, error=True
                    )

            log_to_console("=== 尝试直接执行UniHair脚本 ===", process_id)
            yield "\n===== 直接执行 UniHair =====\n"

            script_args = [upload_path, "-i", OUTPUT_DIR, "-o", OUTPUT_DIR]
            direct_result = execute_script_with_bash(
                unihair_script, script_args, process_id
            )

            if direct_result["returncode"] == 0:
                log_to_console("直接执行UniHair成功", process_id)
                yield "直接执行UniHair成功\n"
                if direct_result["output"]:
                    yield f"输出:\n{direct_result['output']}\n"
                unihair_success = True
            else:
                log_to_console(
                    f"直接执行UniHair失败，错误码: {direct_result['returncode']}",
                    process_id,
                    error=True,
                )
                yield f"直接执行UniHair失败，错误码: {direct_result['returncode']}\n"
                if direct_result["output"]:
                    yield f"错误输出:\n{direct_result['output']}\n"

                log_to_console("=== 常规方式运行UniHair ===", process_id)
                yield "\n===== 常规执行 UniHair =====\n"

                cmd = [
                    "bash",
                    unihair_script,
                    upload_path,
                    "-i",
                    OUTPUT_DIR,
                    "-o",
                    OUTPUT_DIR,
                ]

                log_to_console(f"执行UniHair命令: {' '.join(cmd)}", process_id)

                unihair_result = {}
                for line in run_process_with_output(
                    cmd, process_id, "UniHair", timeout=1800
                ):
                    yield f"{line}\n"
                    unihair_result["last_line"] = line

                    if not is_process_active():
                        yield "处理已被取消\n"
                        return

                with process_lock:
                    if process_id in active_processes:
                        unihair_exitcode = active_processes[process_id].get(
                            "returncode"
                        )
                        unihair_result["returncode"] = unihair_exitcode

                if unihair_result.get("returncode", -1) == 0:
                    unihair_success = True
                    log_to_console("UniHair执行成功", process_id)
                    yield "UniHair处理完成!\n"
                else:
                    error_msg = f"UniHair执行失败，退出码: {unihair_result.get('returncode', 'unknown')}"
                    log_to_console(error_msg, process_id, error=True)
                    yield f"错误: {error_msg}\n"
        except Exception as e:
            log_to_console(f"任务执行异常: {str(e)}", process_id, error=True)
            log_to_console(traceback.format_exc(), process_id, error=True)
            yield f"错误: {str(e)}\n"
            return

        finally:
            enhance_path = os.path.join(OUTPUT_DIR, f"{filename}_enhance.ply")
            refine_path = os.path.join(OUTPUT_DIR, f"{filename}_refine.ply")

            try:
                output_files = os.listdir(OUTPUT_DIR)
                log_to_console(f"输出目录中的文件: {output_files}", process_id)
                yield f"输出目录中的文件: {', '.join(output_files)}\n"
            except Exception as e:
                log_to_console(
                    f"列出输出目录文件时出错: {str(e)}", process_id, error=True
                )

            if os.path.exists(enhance_path) and os.path.exists(refine_path):
                log_to_console("输出文件生成成功", process_id)
                yield "输出文件生成成功!\n"
                yield f"增强文件: /download/{filename}_enhance.ply\n"
                yield f"精细文件: /download/{filename}_refine.ply\n"
            else:
                log_to_console("警告: 未找到预期的输出文件", process_id)
                yield "警告: 未找到预期的输出文件!\n"
                if os.path.exists(enhance_path):
                    log_to_console(f"只找到增强文件: {enhance_path}", process_id)
                    yield f"只找到增强文件: /download/{filename}_enhance.ply\n"
                elif os.path.exists(refine_path):
                    log_to_console(f"只找到精细文件: {refine_path}", process_id)
                    yield f"只找到精细文件: /download/{filename}_refine.ply\n"
                else:
                    log_to_console("未找到任何输出文件!", process_id)
                    yield "未找到任何输出文件!\n"

            log_to_console("===== 处理结束 =====", process_id)
            yield "===== 处理结束 =====\n"

            with process_lock:
                if process_id in active_processes:
                    log_to_console(f"清理进程ID: {process_id} 的资源", process_id)
                    del active_processes[process_id]

    response = StreamingResponse(
        generate_output(),
        media_type="text/plain",
    )
    response.headers["X-Process-ID"] = process_id
    return response


@app.post("/cancel/{process_id}")
async def cancel_process(process_id: str):
    log_to_console(f"尝试取消进程：{process_id}", process_id)

    with process_lock:
        if process_id in active_processes:
            process_info = active_processes[process_id]
            process = process_info.get("process")

            process_info["active"] = False
            log_to_console(f"进程 {process_id} 已标记为非活跃", process_id)

            if process:
                try:
                    log_to_console(f"终止进程 PID: {process.pid}", process_id)
                    if os.name == "nt":
                        subprocess.run(
                            ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                            check=False,
                        )
                    else:
                        try:
                            pgid = os.getpgid(process.pid)
                            os.killpg(pgid, signal.SIGTERM)
                            log_to_console(
                                f"已发送 SIGTERM 信号到进程组 {pgid}", process_id
                            )

                            time.sleep(0.5)

                            if process.poll() is None:
                                os.killpg(pgid, signal.SIGKILL)
                                log_to_console(
                                    f"已发送 SIGKILL 信号到进程组 {pgid}", process_id
                                )
                        except (ProcessLookupError, OSError) as e:
                            log_to_console(
                                f"终止进程错误: {str(e)}", process_id, error=True
                            )
                except Exception as e:
                    log_to_console(f"终止进程时异常: {str(e)}", process_id, error=True)
                    log_to_console(traceback.format_exc(), process_id, error=True)
            return JSONResponse(content={"success": True, "message": "进程已取消"})
        else:
            log_to_console(f"未找到进程ID: {process_id}", process_id)
            return JSONResponse(
                content={"success": False, "message": "进程不存在或已完成"},
                status_code=404,
            )


@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    log_to_console(f"尝试下载文件: {file_path}")

    if os.path.isfile(file_path):
        return FileResponse(path=file_path, filename=filename)
    else:
        log_to_console(f"文件不存在: {file_path}", error=True)
        return JSONResponse(content={"error": "文件不存在"}, status_code=404)


@app.get("/status")
async def get_status():
    uptime = time.time() - start_time
    active_count = 0

    with process_lock:
        processes_info = {}
        for pid, info in active_processes.items():
            processes_info[pid] = {k: v for k, v in info.items() if k != "process"}
            if info.get("active", False):
                active_count += 1

    return {
        "status": "运行中",
        "uptime": uptime,
        "active_processes_count": active_count,
        "total_processes": len(active_processes),
        "processes": processes_info,
    }


@app.get("/")
async def root():
    return {"message": "UniHair API 服务正在运行"}


def sigterm_handler(signum, frame):
    log_to_console("收到SIGTERM信号，清理资源并退出...")
    cleanup()
    sys.exit(0)


def sigint_handler(signum, frame):
    log_to_console("收到SIGINT信号，清理资源并退出...")
    cleanup()
    sys.exit(0)


def cleanup():
    log_to_console("清理所有正在运行的进程...")
    with process_lock:
        for process_id, info in list(active_processes.items()):
            process = info.get("process")
            if process and process.poll() is None:
                log_to_console(f"终止进程 {process_id}")
                try:
                    if os.name == "nt":
                        process.terminate()
                    else:
                        try:
                            pgid = os.getpgid(process.pid)
                            os.killpg(pgid, signal.SIGTERM)
                        except (ProcessLookupError, OSError) as e:
                            log_to_console(f"终止进程错误: {str(e)}", error=True)
                except Exception as e:
                    log_to_console(f"终止进程异常: {str(e)}", error=True)


def register_signal_handlers():
    signal.signal(signal.SIGTERM, sigterm_handler)
    signal.signal(signal.SIGINT, sigint_handler)


if __name__ == "__main__":
    register_signal_handlers()

    log_to_console("启动服务器...")
    uvicorn.run(app, host="0.0.0.0", port=5001)
