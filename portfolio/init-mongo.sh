#!/bin/bash
# Wait for MongoDB to start
sleep 10

# Create the portfolio database and user
mongosh --host localhost --port 27017 << EOF
use admin
db.auth("admin", "admin123")

use portfolio
db.createCollection("admins")

EOF

echo "✅ MongoDB initialization complete"
