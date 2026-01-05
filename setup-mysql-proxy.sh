#!/bin/bash
# MySQL Proxy Setup for Docker Swarm + AWS RDS
# This script sets up a TCP proxy to allow Docker overlay network to access external RDS

set -e

echo "=== MySQL Proxy Setup for Docker Swarm ==="

# Configuration
RDS_ENDPOINT="elearningplatform.cj6aaa462kbk.ap-southeast-2.rds.amazonaws.com"
RDS_PORT="3306"
PROXY_PORT="13306"
MANAGER_IP=$(hostname -I | awk '{print $1}')

echo "Manager IP: $MANAGER_IP"
echo "RDS Endpoint: $RDS_ENDPOINT:$RDS_PORT"
echo "Proxy will listen on: $MANAGER_IP:$PROXY_PORT"

# 1. Install socat if not present
if ! command -v socat &> /dev/null; then
    echo "Installing socat..."
    sudo yum install -y socat
else
    echo "✓ socat already installed"
fi

# 2. Kill existing proxy if running
if pgrep -f "socat.*$PROXY_PORT" > /dev/null; then
    echo "Stopping existing proxy..."
    pkill -f "socat.*$PROXY_PORT"
fi

# 3. Start MySQL proxy in background
echo "Starting MySQL proxy..."
nohup socat TCP-LISTEN:$PROXY_PORT,bind=$MANAGER_IP,fork,reuseaddr TCP:$RDS_ENDPOINT:$RDS_PORT > /tmp/mysql-proxy.log 2>&1 &

# Wait for proxy to start
sleep 2

# 4. Verify proxy is running
if sudo ss -lntp | grep $PROXY_PORT > /dev/null; then
    echo "✅ MySQL proxy is running on $MANAGER_IP:$PROXY_PORT"
else
    echo "❌ Failed to start MySQL proxy"
    exit 1
fi

# 5. Test proxy connection
echo "Testing proxy connection to RDS..."
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$MANAGER_IP/$PROXY_PORT"; then
    echo "✅ Proxy successfully connects to RDS"
else
    echo "⚠️  Warning: Could not verify RDS connection"
fi

# 6. Update .env file
if [ -f ".env" ]; then
    echo "Updating .env file..."
    sed -i.bak "s|^DB_HOST=.*|DB_HOST=$MANAGER_IP|" .env
    sed -i.bak "s|^DB_PORT=.*|DB_PORT=$PROXY_PORT|" .env
    echo "✅ .env updated"
    echo ""
    echo "Current DB configuration:"
    grep "^DB_" .env
else
    echo "❌ .env file not found in current directory"
    exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Stop current stack: docker stack rm elearn"
echo "2. Wait 30 seconds for cleanup"
echo "3. Deploy stack: docker stack deploy -c docker-compose-swarm.yml elearn"
echo "4. Monitor: watch -n 2 'docker service ls'"
echo ""
echo "To check proxy logs: tail -f /tmp/mysql-proxy.log"
echo "To stop proxy: pkill -f 'socat.*$PROXY_PORT'"
