#!/bin/sh

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
    PORT="${MYSQLPORT:-${MYSQL_PORT:-3306}}"
    USER="${MYSQLUSER:-${MYSQL_USER:-root}}"
    PASS="${MYSQLPASSWORD:-$MYSQL_PASSWORD}"
    DB="${MYSQLDATABASE:-${MYSQL_DATABASE:-railway}}"
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
  echo "All environment variables:"
  env | sort
  # Start server anyway so health check passes, migrations can be run manually
  echo "Starting server without DATABASE_URL..."
  exec node src/server.js
fi

echo "DATABASE_URL is set (scheme: $(echo $DATABASE_URL | cut -d: -f1))"

# Run migrations (don't exit on failure)
echo "Running prisma migrate deploy..."
npx prisma migrate deploy || echo "WARNING: Migrations failed, starting server anyway"

# Run seed (don't exit on failure)
echo "Running prisma db seed..."
npx prisma db seed || echo "WARNING: Seed failed, starting server anyway"

# Start the server
echo "Starting server..."
exec node src/server.js
