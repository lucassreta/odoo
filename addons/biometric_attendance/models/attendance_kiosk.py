from odoo import models, fields, api

class AttendanceKiosk(models.TransientModel):
    _name = 'attendance.kiosk'
    _description = 'Modelo transitorio para kiosco de asistencia'
    
    name = fields.Char('Nombre', default='Kiosco de Asistencia')
    last_employee_id = fields.Many2one('hr.employee', 'Último Empleado')
    session_start = fields.Datetime('Inicio de Sesión', default=fields.Datetime.now)
    total_recognitions = fields.Integer('Reconocimientos Totales', default=0)
    success_rate = fields.Float('Tasa de Éxito (%)', default=0.0)
    
    @api.model
    def get_kiosk_stats(self):
        """Obtener estadísticas del kiosco"""
        today = fields.Date.today()
        domain = [
            ('check_in', '>=', f"{today} 00:00:00"),
            ('check_in', '<=', f"{today} 23:59:59"),
            ('biometric_method', '=', 'facial')
        ]
        
        attendances = self.env['hr.attendance'].search(domain)
        
        stats = {
            'today_attendances': len(attendances),
            'unique_employees': len(attendances.mapped('employee_id')),
            'avg_confidence': sum(attendances.mapped('confidence_score')) / len(attendances) if attendances else 0,
            'last_attendance': attendances[0].check_in if attendances else None
        }
        
        return stats