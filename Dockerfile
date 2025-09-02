# Imagen oficial Odoo 17 Community
FROM odoo:17.0

USER root

# Si necesitas dependencias extra para tus módulos
# COPY requirements.txt /tmp/requirements.txt
# RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copiar configuración y módulos
COPY odoo.conf /etc/odoo/odoo.conf
RUN mkdir -p /mnt/extra-addons && chown -R odoo:odoo /mnt/extra-addons /etc/odoo

COPY addons /mnt/extra-addons

# Entrypoint para variables dinámicas de Railway
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER odoo
EXPOSE 8069
CMD ["/bin/sh", "-c", "/entrypoint.sh"]
