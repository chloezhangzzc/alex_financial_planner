"""
MCP server configurations for the Alex Researcher
"""
from agents.mcp import MCPServerStdio


def create_playwright_mcp_server(timeout_seconds=60):
    """Create a Playwright MCP server instance for web browsing.
    
    Args:
        timeout_seconds: Client session timeout in seconds (default: 60)
        
    Returns:
        MCPServerStdio instance configured for Playwright
    """
    # Base arguments for the Playwright MCP server
    args = [
        "--headless",
        "--isolated", 
        "--no-sandbox",
        "--ignore-https-errors",
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    ]
    
    # Prefer running the locally-installed MCP binary (avoids runtime npm downloads in App Runner).
    import os
    import glob
    mcp_command = "npx"
    mcp_args_prefix = ["@playwright/mcp@latest"]

    # Common local install locations when built into the container image
    candidates = [
        "/app/node_modules/.bin/playwright-mcp",
        "/app/node_modules/.bin/mcp-playwright",
        "/app/node_modules/.bin/playwright-mcp-server",
    ]
    for candidate in candidates:
        if os.path.exists(candidate):
            mcp_command = candidate
            mcp_args_prefix = []
            break

    if os.path.exists("/.dockerenv") or os.environ.get("AWS_EXECUTION_ENV"):
        # If we can find a Chromium binary, pass it explicitly.
        # Otherwise, let Playwright resolve it via PLAYWRIGHT_BROWSERS_PATH.
        chrome_paths = glob.glob("/ms-playwright/chromium-*/chrome-linux/chrome")
        if chrome_paths:
            args.extend(["--executable-path", chrome_paths[0]])
    
    params = {
        "command": mcp_command,
        "args": mcp_args_prefix + args,
    }
    
    return MCPServerStdio(params=params, client_session_timeout_seconds=timeout_seconds)