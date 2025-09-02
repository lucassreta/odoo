from odoo import models, fields, api
import base64
import json

class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    # Campos para almacenar datos biométricos
    face_template = fields.Text('Plantilla Facial', help='Datos codificados del rostro para reconocimiento')
    face_photo = fields.Binary('Foto de Referencia', help='Foto utilizada para el reconocimiento facial')
    biometric_active = fields.Boolean('Biometría Activa', default=False)
    last_face_training = fields.Datetime('Último Entrenamiento Facial')
    
    @api.model
    def register_face_template(self, employee_id, face_data, photo_data):
        """Registra la plantilla facial del empleado"""
        employee = self.browse(employee_id)
        employee.write({
            'face_template': json.dumps(face_data),
            'face_photo': photo_data,
            'biometric_active': True,
            'last_face_training': fields.Datetime.now()
        })
        return {'success': True, 'message': 'Rostro registrado correctamente'}
    
    @api.model
    def verify_face(self, face_data):
        """Verifica el rostro contra todos los empleados registrados"""
        employees = self.search([('biometric_active', '=', True)])
        
        for employee in employees:
            if employee.face_template:
                stored_template = json.loads(employee.face_template)
                # Aquí iría la lógica de comparación facial
                similarity = self._compare_faces(face_data, stored_template)
                if similarity > 0.85:  # Umbral de confianza
                    return {
                        'success': True,
                        'employee_id': employee.id,
                        'employee_name': employee.name,
                        'confidence': similarity
                    }
        
        return {'success': False, 'message': 'Rostro no reconocido'}
    
    def _compare_faces(self, face1, face2):
        """Compara dos plantillas faciales y devuelve similaridad"""
        # Implementación simplificada - en producción usar bibliotecas como face_recognition
        # Por ahora devolvemos un valor aleatorio para demostración
        import random
        return random.uniform(0.7, 0.95)