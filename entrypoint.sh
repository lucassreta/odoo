#!/usr/bin/env sh
set -e

# Railway expone estas variables cuando agregas PostgreSQL:
# PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

: "${ODOO_ADMIN_PASSWORD:?Debes definir ODOO_ADMIN_PASSWORD en Railway}"

# Reemplaza placeholder en odoo.conf con el valor real
sed -i "s|\${ODOO_ADMIN_PASSWORD}|${ODOO_ADMIN_PASSWORD}|g" /etc/odoo/odoo.conf

exec odoo -c /etc/odoo/odoo.conf \
  --db_host="${PGHOST}" \
  --db_port="${PGPORT}" \
  --db_user="${PGUSER}" \
  --db_password="${PGPASSWORD}"

