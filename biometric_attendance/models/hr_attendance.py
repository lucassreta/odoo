from odoo import models, fields, api
from odoo.exceptions import ValidationError

class HrAttendance(models.Model):
    _inherit = 'hr.attendance'
    
    biometric_method = fields.Selection([
        ('manual', 'Manual'),
        ('facial', 'Reconocimiento Facial'),
        ('card', 'Tarjeta')
    ], string='Método de Registro', default='manual')
    
    confidence_score = fields.Float('Puntuación de Confianza', help='Confianza del reconocimiento facial')
    device_info = fields.Char('Información del Dispositivo')
    
    @api.model
    def create_biometric_attendance(self, employee_id, method='facial', confidence=0.0, device_info=None):
        """Crea un registro de asistencia biométrica"""
        employee = self.env['hr.employee'].browse(employee_id)
        
        # Verificar si ya tiene un check-in activo
        last_attendance = self.search([
            ('employee_id', '=', employee_id)
        ], limit=1, order='check_in desc')
        
        vals = {
            'employee_id': employee_id,
            'biometric_method': method,
            'confidence_score': confidence,
            'device_info': device_info,
        }
        
        if not last_attendance or last_attendance.check_out:
            # Check-in
            vals['check_in'] = fields.Datetime.now()
        else:
            # Check-out
            vals['check_out'] = fields.Datetime.now()
        
        attendance = self.create(vals)
        
        return {
            'success': True,
            'attendance_id': attendance.id,
            'action': 'check_out' if vals.get('check_out') else 'check_in',
            'employee_name': employee.name,
            'time': vals.get('check_out', vals.get('check_in'))
        }