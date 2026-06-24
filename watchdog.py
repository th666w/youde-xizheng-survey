#!/usr/bin/env python3
"""Watchdog: keeps the Express server and localtunnel running"""
import subprocess
import time
import urllib.request
import sys

SERVER_PORT = 3001
TUNNEL_SUBDOMAIN = "youde-survey-data"
CHECK_INTERVAL = 30  # seconds

def check_server():
    try:
        urllib.request.urlopen(f"http://localhost:{SERVER_PORT}/api/results/stats", timeout=5)
        return True
    except Exception as e:
        print(f"[watchdog] Server check failed: {e}")
        return False

def check_tunnel():
    try:
        urllib.request.urlopen(f"https://{TUNNEL_SUBDOMAIN}.loca.lt/api/results/stats", timeout=10)
        return True
    except Exception as e:
        print(f"[watchdog] Tunnel check failed: {e}")
        return False

def start_server():
    return subprocess.Popen(
        ["npx", "tsx", "server/index.ts"],
        cwd=r"C:\Users\asus\WorkBuddy\2026-06-24-13-26-40\youde-xizheng-questionnaire-clean",
        shell=True,
    )

def start_tunnel():
    return subprocess.Popen(
        ["lt", "--port", str(SERVER_PORT), "--subdomain", TUNNEL_SUBDOMAIN],
        shell=True,
    )

print(f"[watchdog] Starting...")
server_proc = start_server()
time.sleep(3)

tunnel_proc = start_tunnel()
time.sleep(5)

if check_tunnel():
    print(f"[watchdog] ✅ Tunnel is live at https://{TUNNEL_SUBDOMAIN}.loca.lt")
else:
    print(f"[watchdog] ⚠️ Tunnel might have different subdomain, check manually")

while True:
    time.sleep(CHECK_INTERVAL)
    if not check_tunnel():
        print("[watchdog] Tunnel down! Restarting...")
        if tunnel_proc:
            tunnel_proc.kill()
        time.sleep(2)
        tunnel_proc = start_tunnel()
        time.sleep(5)
    if not check_server():
        print("[watchdog] Server down! Restarting...")
        if server_proc:
            server_proc.kill()
        time.sleep(2)
        server_proc = start_server()
        time.sleep(3)
