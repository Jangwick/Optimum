#!/bin/sh
set -e

echo "=== Startup Script ==="
echo "Available environment variables:"
env | grep -iE "MYSQL|DATABASE|DB_|PG_|POSTGRES" || echo "(none found)"
echo "======================="

# Try to construct DATABASE_URL from any available source
if [ -z "$DATABASE_URL" ]; then
  if [ -n "$MYSQL_URL" ]; then
    export DATABASE_URL="$MYSQL_URL"
    echo "Set DATABASE_URL from MYSQL_URL"
  elif [ -n "$MYSQL_PRIVATE_URL" ]; then
    export DATABASE_URL="$MYSQL_PRIVATE_URL"
    echo "Set DATABASE_URL from MYSQL_PRIVATE_URL"
  elif [ -n "$MYSQLHOST" ] || [ -n "$MYSQL_HOST" ]; then
    HOST="${MYSQLHOST:-$MYSQL_HOST}"
    PORT="${MYSQLPORT:-$MYSQL_PORT:-3306}"
    USER="${MYSQLUSER:-$MYSQL_USER:-root}"
    PASS="${MYSQLPASSWORD:-$MYSQL_PASSWORD}"
    DB="${MYSQLDATABASE:-$MYSQL_DATABASE:-railway}"
    if [ -n "$PASS" ]; then
      export DATABASE_URL="mysql://${USER}:${PASS}@${HOST}:${PORT}/${DB}"
    else
      export DATABASE_URL="mysql://${USER}@${HOST}:${PORT}/${DB}"
    fi
    echo "Set DATABASE_URL from individual MySQL variables"
  fi
fi

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set and no MySQL variables found."
  echo "Please set DATABASE_URL in Railway Variables tab."
  echo "Either use the raw connection string from your MySQL addon's Connect tab,"
  echo "or reference it with: \${{MySQL.MYSQL_PRIVATE_URL}}"
  echo ""
  echo "All environment variables:"
  env | sort
  exit 1
fi

echo "DATABASE_URL is set (scheme: $(echo $DATABASE_URL | cut -d: -f1))"

# Start the server — it handles schema sync and seeding itself
echo "Starting server..."
exec node src/server.js
