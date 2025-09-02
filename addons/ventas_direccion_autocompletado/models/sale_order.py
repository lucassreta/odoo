from odoo import models, fields

class SaleOrder(models.Model):
    _inherit = 'sale.order'
    
    x_address_autocomplete = fields.Char(
        string='Dirección con Autocompletado',
        help='Campo de dirección con autocompletado de Google Places'
    )