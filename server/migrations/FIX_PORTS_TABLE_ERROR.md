# 🔧 Fix: Database Schema Mismatch Error

## Error:
```
Unknown column 'code' in 'field list'
Error: Unknown column 'code' in 'field list'
at PortsService.getExistingPorts
```

## Root Cause:
Your **local development database** has an outdated `ports` table structure that's missing the `code` column. The `PortsService` expects this column to exist.

---

## ✅ Solution: Update Your Local Database

### **Option 1: Run SQL Script (Recommended)**

1. **Open your MySQL client** (phpMyAdmin, MySQL Workbench, HeidiSQL, or command line)

2. **Connect to your local database:** `trending_projectx`

3. **Run this SQL:**

```sql
USE trending_projectx;

-- Drop and recreate the ports table with correct structure
DROP TABLE IF EXISTS ports;

CREATE TABLE ports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ports_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

4. **Restart your server:**
   - Stop the server (Ctrl+C in the terminal running `npm run dev`)
   - Start it again: `npm run dev`

5. **Verify:** The server should start without errors and automatically populate the `ports` table from the API.

---

### **Option 2: Import Full Schema**

If you want to ensure **all tables** are up to date:

1. **Backup your current database** (if you have important data):
   ```sql
   -- In MySQL client
   -- Export your database first!
   ```

2. **Drop and recreate the database:**
   ```sql
   DROP DATABASE IF EXISTS trending_projectx;
   CREATE DATABASE trending_projectx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE trending_projectx;
   ```

3. **Import the full schema:**
   - Use the file: `server/schema.sql`
   - In MySQL Workbench: Server → Data Import → Import from Self-Contained File
   - Or via command line (if MySQL is in PATH):
     ```bash
     mysql -u root -p trending_projectx < server/schema.sql
     ```

4. **Restart your server**

---

### **Option 3: Manual ALTER (If You Want to Keep Data)**

If your `ports` table has data you want to keep:

```sql
USE trending_projectx;

-- Check current structure
DESCRIBE ports;

-- Add the code column if it doesn't exist
ALTER TABLE ports
  ADD COLUMN code VARCHAR(10) NOT NULL AFTER id,
  ADD UNIQUE KEY uk_ports_code (code);

-- Add other missing columns
ALTER TABLE ports
  ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT '' AFTER code,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL AFTER name,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL AFTER city,
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) NULL AFTER state,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL AFTER country,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL AFTER latitude;
```

**Note:** This might fail if your current table structure is very different.

---

## 🎯 Quick Fix (Recommended):

**I've created a migration script for you:**

📄 **File:** `server/migrations/fix_ports_table.sql`

**Steps:**
1. Open your MySQL client
2. Connect to `trending_projectx` database
3. Open and run the file: `server/migrations/fix_ports_table.sql`
4. Restart your server

---

## ✅ Verification:

After running the fix, verify the table structure:

```sql
USE trending_projectx;
DESCRIBE ports;
```

**Expected output:**
```
+------------+------------------+------+-----+-------------------+-------------------+
| Field      | Type             | Null | Key | Default           | Extra             |
+------------+------------------+------+-----+-------------------+-------------------+
| id         | int unsigned     | NO   | PRI | NULL              | auto_increment    |
| code       | varchar(10)      | NO   | UNI | NULL              |                   |
| name       | varchar(255)     | NO   |     |                   |                   |
| city       | varchar(100)     | YES  |     | NULL              |                   |
| state      | varchar(100)     | YES  |     | NULL              |                   |
| country    | varchar(100)     | YES  |     | NULL              |                   |
| latitude   | decimal(10,8)    | YES  |     | NULL              |                   |
| longitude  | decimal(11,8)    | YES  |     | NULL              |                   |
| created_at | datetime         | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| updated_at | datetime         | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
+------------+------------------+------+-----+-------------------+-------------------+
```

---

## 📝 Why This Happened:

Your production database (on Coolify/VPS) was created with the latest schema, but your local development database has an older version of the `ports` table that was created before the `code` column was added.

**Going forward:** Always keep your local and production schemas in sync by running migrations on both environments.

---

## 🚀 After Fixing:

1. ✅ Server will start without errors
2. ✅ `PortsService` will automatically fetch and populate ports from the API
3. ✅ You can continue development

---

**Last Updated:** 2026-01-07
