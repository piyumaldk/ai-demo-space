#!/bin/sh
set -e

echo "Starting AI Demo with runtime configuration..."

# Create nginx runtime dirs under /tmp so non-root user can write
mkdir -p /tmp/nginx/cache /tmp/nginx/logs /tmp/nginx/run || true
touch /tmp/nginx/nginx.pid
chmod 666 /tmp/nginx/nginx.pid || true

if [ ! -e /var/cache/nginx ] || [ -L /var/cache/nginx ]; then
  ln -sf /tmp/nginx/cache /var/cache/nginx || true
fi
if [ ! -e /var/log/nginx ] || [ -L /var/log/nginx ]; then
  ln -sf /tmp/nginx/logs /var/log/nginx || true
fi
if [ ! -e /var/run/nginx ] || [ -L /var/run/nginx ]; then
  ln -sf /tmp/nginx/run /var/run/nginx || true
fi

# Runtime environment variable injection
echo "Generating runtime configuration from environment variables..."

cat > /tmp/runtime-config.js << 'EOF_HEADER'
// Runtime Configuration - Generated from environment variables at container startup
window.__RUNTIME_CONFIG__ = {
EOF_HEADER

# Capture all VITE_* env vars into the config object
env | grep '^VITE_' | while IFS='=' read -r key value; do
  escaped_value=$(echo "$value" | sed "s/'/\\\\'/g")
  echo "  $key: '$escaped_value'," >> /tmp/runtime-config.js
done

cat >> /tmp/runtime-config.js << 'EOF_FOOTER'
};

console.log('Runtime configuration loaded from environment variables');
console.log('Loaded', Object.keys(window.__RUNTIME_CONFIG__).length, 'configuration values');
EOF_FOOTER

chmod 644 /tmp/runtime-config.js

var_count=$(env | grep -c '^VITE_' || echo "0")
echo "Runtime configuration generated with $var_count VITE_* variables"

echo "Starting nginx..."
exec nginx -g "daemon off;"
