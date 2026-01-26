#!/usr/bin/env python3
"""
Run both frontend and backend locally for development.
This script starts the NextJS frontend and FastAPI backend in parallel.
"""

import os
import sys
import subprocess
import signal
import time
import re
import socket
from pathlib import Path

# Track subprocesses for cleanup
processes = []
process_names = {}

def cleanup(signum=None, frame=None):
    """Clean up all subprocess on exit"""
    print("\n🛑 Shutting down services...")
    for proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except:
            proc.kill()
    sys.exit(0)

# Register cleanup handlers
signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def check_requirements():
    """Check if required tools are installed"""
    checks = []

    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        node_version = result.stdout.strip()
        checks.append(f"✅ Node.js: {node_version}")
    except FileNotFoundError:
        checks.append("❌ Node.js not found - please install Node.js")

    # Check npm
    try:
        result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
        npm_version = result.stdout.strip()
        checks.append(f"✅ npm: {npm_version}")
    except FileNotFoundError:
        checks.append("❌ npm not found - please install npm")

    # Check uv (which manages Python for us)
    try:
        result = subprocess.run(["uv", "--version"], capture_output=True, text=True)
        uv_version = result.stdout.strip()
        checks.append(f"✅ uv: {uv_version}")
    except FileNotFoundError:
        checks.append("❌ uv not found - please install uv")

    print("\n📋 Prerequisites Check:")
    for check in checks:
        print(f"  {check}")

    # Exit if any critical tools are missing
    if any("❌" in check for check in checks):
        print("\n⚠️  Please install missing dependencies and try again.")
        sys.exit(1)

def check_env_files():
    """Check if environment files exist"""
    project_root = Path(__file__).parent.parent

    root_env = project_root / ".env"
    frontend_env = project_root / "frontend" / ".env.local"

    missing = []

    if not root_env.exists():
        missing.append(".env (root project file)")
    if not frontend_env.exists():
        missing.append("frontend/.env.local")

    if missing:
        print("\n⚠️  Missing environment files:")
        for file in missing:
            print(f"  - {file}")
        print("\nPlease create these files with the required configuration.")
        print("The root .env should have all backend variables from Parts 1-7.")
        print("The frontend/.env.local should have Clerk keys.")
        sys.exit(1)

    print("✅ Environment files found")

def start_backend():
    """Start the FastAPI backend"""
    backend_dir = Path(__file__).parent.parent / "backend" / "api"

    print("\n🚀 Starting FastAPI backend...")

    def is_alex_backend_healthy() -> bool:
        try:
            import httpx
            r = httpx.get("http://localhost:8000/health", timeout=1)
            if r.status_code != 200:
                return False
            # Alex backend returns {"status":"healthy","timestamp":...}
            data = r.json()
            return data.get("status") == "healthy" and "timestamp" in data
        except Exception:
            return False

    # If an Alex backend is already running on 8000, reuse it instead of starting a second one.
    if is_alex_backend_healthy():
        print("  ✅ Backend already running at http://localhost:8000 (reusing existing process)")
        print("     API docs: http://localhost:8000/docs")
        return None

    # Check if dependencies are installed
    if not (backend_dir / ".venv").exists() and not (backend_dir / "uv.lock").exists():
        print("  Installing backend dependencies...")
        subprocess.run(["uv", "sync"], cwd=backend_dir, check=True)

    # Start the backend
    proc = subprocess.Popen(
        ["uv", "run", "main.py"],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,  # Combine stderr with stdout for easier debugging
        text=True,
        bufsize=1
    )
    processes.append(proc)
    process_names[proc.pid] = "backend"

    # Wait for backend to start
    print("  Waiting for backend to start...")
    for _ in range(30):  # 30 second timeout
        # If the backend process crashed (often due to port 8000 already being in use),
        # don't mistakenly accept some other service on 8000 as "healthy".
        if proc.poll() is not None and not is_alex_backend_healthy():
            print("  ❌ Backend process exited early.")
            print("     Most common cause: port 8000 is already in use by another project.")
            try:
                remaining = proc.stdout.read() if proc.stdout else ""
                if remaining.strip():
                    print("\n----- backend output -----")
                    print(remaining.strip()[-2000:])
                    print("----- end backend output -----\n")
            except Exception:
                pass
            print("     Stop the other service on 8000 and rerun: uv run run_local.py")
            cleanup()
        try:
            import httpx
            if is_alex_backend_healthy():
                print("  ✅ Backend running at http://localhost:8000")
                print("     API docs: http://localhost:8000/docs")
                return proc
        except:
            time.sleep(1)

    print("  ❌ Backend failed to start")
    try:
        remaining = proc.stdout.read() if proc.stdout else ""
        if remaining.strip():
            print("\n----- backend output -----")
            print(remaining.strip()[-2000:])
            print("----- end backend output -----\n")
    except Exception:
        pass
    cleanup()

def start_frontend():
    """Start the NextJS frontend"""
    frontend_dir = Path(__file__).parent.parent / "frontend"

    print("\n🚀 Starting NextJS frontend...")

    # Check if dependencies are installed
    if not (frontend_dir / "node_modules").exists():
        print("  Installing frontend dependencies...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)

    def find_free_port(start: int = 3000, end: int = 3010) -> int:
        for port in range(start, end + 1):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                try:
                    s.bind(("127.0.0.1", port))
                    return port
                except OSError:
                    continue
        raise RuntimeError(f"No free port found in range {start}-{end}")

    port = find_free_port(3000, 3010)
    if port != 3000:
        print(f"  ℹ️  Port 3000 is in use. Starting frontend on port {port} instead.")

    # Start the frontend (pin port so we don't accidentally hit another app on 3000)
    env = os.environ.copy()
    env["PORT"] = str(port)
    proc = subprocess.Popen(
        ["npm", "run", "dev", "--", "-p", str(port)],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,  # Combine stderr with stdout
        text=True,
        bufsize=1,
        env=env,
    )
    processes.append(proc)
    process_names[proc.pid] = "frontend"

    # Wait for frontend to start
    print("  Waiting for frontend to start...")
    import httpx
    import select

    started = False
    frontend_url = f"http://localhost:{port}"
    for i in range(30):  # 30 second timeout
        if proc.poll() is not None:
            print("  ❌ Frontend process exited early.")
            try:
                remaining = proc.stdout.read() if proc.stdout else ""
                if remaining.strip():
                    print("\n----- frontend output -----")
                    print(remaining.strip()[-2000:])
                    print("----- end frontend output -----\n")
            except Exception:
                pass
            cleanup()

        # Check for any output from the process using non-blocking read
        if proc.stdout:
            ready, _, _ = select.select([proc.stdout], [], [], 0)
            if ready:
                line = proc.stdout.readline()
                if line:
                    print(f"    Frontend: {line.strip()}")
                    # Try to detect the actual port Next started on (it may switch to 3001 if 3000 is taken)
                    m = re.search(r"http://localhost:(\d+)", line)
                    if m:
                        frontend_url = f"http://localhost:{m.group(1)}"
                    # NextJS dev server prints "Ready" when it's ready
                    if "ready" in line.lower() or "compiled" in line.lower() or "started server" in line.lower():
                        started = True

        # Also try to connect
        if started or i > 5:  # Start checking after 5 seconds or when we see "ready"
            try:
                response = httpx.get(frontend_url, timeout=1)
                print(f"  ✅ Frontend running at {frontend_url}")
                return proc
            except httpx.ConnectError:
                pass  # Server not ready yet
            except:
                # Any other response means server is up
                print(f"  ✅ Frontend running at {frontend_url}")
                return proc

        time.sleep(1)

    print("  ❌ Frontend failed to start")
    cleanup()

def monitor_processes():
    """Monitor running processes and show their output"""
    print("\n" + "="*60)
    print("🎯 Alex Financial Advisor - Local Development")
    print("="*60)
    print("\n📍 Services:")
    print("  Frontend: http://localhost:3000")
    print("  Backend:  http://localhost:8000")
    print("  API Docs: http://localhost:8000/docs")
    print("\n📝 Logs will appear below. Press Ctrl+C to stop.\n")
    print("="*60 + "\n")

    # Monitor processes
    while True:
        for proc in processes:
            # Check if process is still running
            if proc.poll() is not None:
                name = process_names.get(proc.pid, "process")
                print(f"\n⚠️  {name} stopped unexpectedly (exit={proc.returncode})")
                try:
                    remaining = proc.stdout.read() if proc.stdout else ""
                    if remaining.strip():
                        print(f"\n----- {name} output -----")
                        print(remaining.strip()[-2000:])
                        print(f"----- end {name} output -----\n")
                except Exception:
                    pass
                cleanup()

            # Read any available output
            try:
                line = proc.stdout.readline()
                if line:
                    print(f"[LOG] {line.strip()}")
            except:
                pass

        time.sleep(0.1)

def main():
    """Main entry point"""
    print("\n🔧 Alex Financial Advisor - Local Development Setup")
    print("="*50)

    # Check prerequisites
    check_requirements()
    check_env_files()

    # Install httpx if needed
    try:
        import httpx
    except ImportError:
        print("\n📦 Installing httpx for health checks...")
        subprocess.run(["uv", "add", "httpx"], check=True)

    # Start services
    backend_proc = start_backend()
    frontend_proc = start_frontend()

    # Monitor processes
    try:
        monitor_processes()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()