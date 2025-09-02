from odoo import models, fields, api

class BiometricTemplate(models.Model):
    _name = 'biometric.template'
    _description = 'Plantillas Biométricas'
    
    employee_id = fields.Many2one('hr.employee', string='Empleado', required=True)
    template_type = fields.Selection([
        ('face', 'Facial'),
        ('fingerprint', 'Huella Dactilar')
    ], string='Tipo', required=True)
    template_data = fields.Text('Datos de Plantilla', required=True)
    quality_score = fields.Float('Calidad')
    created_date = fields.Datetime('Fecha de Creación', default=fields.Datetime.now)
    active = fields.Boolean('Activo', default=True)