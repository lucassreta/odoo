from odoo import models, fields, api
from odoo.exceptions import UserError

class RegisterFaceWizard(models.TransientModel):
    _name = 'register.face.wizard'
    _description = 'Asistente para registro facial'
    
    employee_id = fields.Many2one('hr.employee', 'Empleado', required=True)
    instructions = fields.Html('Instrucciones', default="""
        <div style="text-align: center; padding: 20px;">
            <h3>Registro de Reconocimiento Facial</h3>
            <p>Para un registro exitoso:</p>
            <ul style="text-align: left; margin: 20px auto; max-width: 400px;">
                <li>Mantenga el rostro centrado en la cámara</li>
                <li>Evite sombras o iluminación excesiva</li>
                <li>Mantenga una expresión neutra</li>
                <li>No use lentes oscuros o mascarillas</li>
                <li>Mire directamente a la cámara</li>
            </ul>
            <p><strong>Una vez listo, haga clic en "Iniciar Registro"</strong></p>
        </div>
    """)
    
    def action_open_registration(self):
        """Abrir interfaz de registro"""
        return {
            'type': 'ir.actions.act_url',
            'url': f'/kiosk/register?employee_id={self.employee_id.id}',
            'target': 'new'
        }