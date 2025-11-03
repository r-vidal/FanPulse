#!/bin/bash

# Database backup script for FanPulse

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/fanpulse_backup_$TIMESTAMP.sql"

echo "💾 FanPulse Database Backup"
echo "=========================="
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if running locally or on Railway
if [ -n "$DATABASE_URL" ]; then
    # Production backup
    echo "📦 Creating production backup..."
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
else
    # Local backup
    echo "📦 Creating local backup..."
    docker-compose exec -T postgres pg_dump -U fanpulse fanpulse > "$BACKUP_FILE"
fi

# Compress backup
echo "🗜️  Compressing backup..."
gzip "$BACKUP_FILE"

echo ""
echo "✅ Backup created: ${BACKUP_FILE}.gz"
echo "💾 Size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
echo ""
echo "📌 To restore:"
echo "  gunzip ${BACKUP_FILE}.gz"
echo "  psql \$DATABASE_URL < $BACKUP_FILE"
