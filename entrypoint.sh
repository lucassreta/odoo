#!/usr/bin/env sh
set -e

# Railway expone estas variables cuando agregas PostgreSQL:
# PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

: "${ODOO_ADMIN_PASSWORD:?Debes definir ODOO_ADMIN_PASSWORD en Railway}"

# El script ya tiene toda la información de la BD
# No es necesario modificar odoo.conf para la conexión
# `sed` para ODOO_ADMIN_PASSWORD está bien
sed -i "s|\${ODOO_ADMIN_PASSWORD}|${ODOO_ADMIN_PASSWORD}|g" /etc/odoo/odoo.conf

exec odoo \
    --config=/etc/odoo/odoo.conf \
    --db-filter=.* \
    --addons-path=/usr/lib/python3/dist-packages/odoo/addons,/mnt/extra-addons \
    --data-dir=/var/lib/odoo \
    --db_host="${PGHOST}" \
    --db_port="${PGPORT}" \
    --db_user="${PGUSER}" \
    --db_password="${PGPASSWORD}" 

