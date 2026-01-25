
# Database Deployment Guide

## ⚠️ Important: No Auto-Updates
The server **does not** automatically update the database schema when it starts. You must apply changes manually or via script.

## How to Update Production Database (Coolify)

Since you want to update the production database from your local machine, we recommend using an **SSH Tunnel**.

### Prerequisites
1.  **SSH Access**: You need SSH access to the VPS hosting Coolify.
2.  **Database Credentials**: You need the internal database credentials (usually found in your Coolify `.env` or connection string).

### Step 1: Open SSH Tunnel
Open a terminal on your local machine and run:

```bash
# Syntax: ssh -L <local-port>:127.0.0.1:<remote-db-port> <user>@<host>
# Example (maps remote port 3306 to local 3307):
ssh -L 3307:127.0.0.1:3306 root@trendingnow.ge
```

*Keep this terminal open.*

### Step 2: Run Migration Script
In a **new** terminal window (in `server/` directory):

1.  We created a helper script: `scripts/run-migration.ts`.
2.  Run it using `npx tsx`:

```bash
npx tsx scripts/run-migration.ts
```

3.  The script will prompt you:
    *   **Use .env settings?**: Answer `n` (No) to enter the tunnel details.
    *   **DB Host**: `127.0.0.1` (since we are tunneling)
    *   **DB Port**: `3307` (the local port we defined in Step 1)
    *   **DB User/Pass/Name**: Enter your production credentials.
    
4.  Select the migration file you want to run (e.g., `fix_ports_table.sql`).

### Step 3: Verify
Check your application or phpMyAdmin to ensure the changes were applied.

## Automated Option (Advanced)
If you want to automate this, you can create a `.env.prod` file with the tunnel config and run:

```bash
# Load prod env and run
dotenv -e .env.prod npx tsx scripts/run-migration.ts
```
