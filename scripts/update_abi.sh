#!/bin/bash
# filepath: scripts/update_abi.sh

# Paths to the artifact and frontend ABI
ARTIFACT_ABI="artifacts/contracts/TodoWeb3.sol/TodoWeb3.json"
FRONTEND_ABI="src/abis/TodoWeb3.json"

# Check if jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq is required but not installed."
    read -p "Do you want to install jq now? [Y/n] " answer
    case "$answer" in
        [Yy]* | "" )
            sudo apt install -y jq
            ;;
        * )
            echo "jq is required to run this script. Exiting."
            exit 1
            ;;
    esac
fi

# Extract the abi array and overwrite the frontend ABI
jq '.abi' "$ARTIFACT_ABI" > "$FRONTEND_ABI"

echo "✅ ABI updated: $FRONTEND_ABI now contains the latest ABI from $ARTIFACT_ABI"