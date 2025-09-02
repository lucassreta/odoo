from odoo import http, fields
from odoo.http import request
import json
import base64
import logging

_logger = logging.getLogger(__name__)

class BiometricKioskController(http.Controller):

    @http.route('/kiosk/biometric', type='http', auth='none', methods=['GET'], csrf=False)
    def kiosk_page(self):
        """Página principal del kiosco biométrico"""
        return request.render('biometric_attendance.kiosk_page', {
            'company': request.env['res.company'].sudo().browse(1),
            'current_time': fields.Datetime.now()
        })

    @http.route('/kiosk/api/verify_face', type='json', auth='none', methods=['POST'], csrf=False)
    def verify_face_api(self, **kwargs):
        """API para verificar rostro desde el kiosco"""
        try:
            face_data = kwargs.get('face_data')
            if not face_data:
                return {'success': False, 'message': 'Datos faciales requeridos'}

            # Verificar empleado
            employee_model = request.env['hr.employee'].sudo()
            result = employee_model.verify_face(face_data)
            
            return result
        except Exception as e:
            _logger.error(f"Error en verificación facial: {str(e)}")
            return {'success': False, 'message': 'Error interno del servidor'}

    @http.route('/kiosk/api/attendance', type='json', auth='none', methods=['POST'], csrf=False)
    def create_attendance_api(self, **kwargs):
        """API para crear registro de asistencia"""
        try:
            employee_id = kwargs.get('employee_id')
            confidence = kwargs.get('confidence', 0.0)
            device_info = kwargs.get('device_info')
            
            if not employee_id:
                return {'success': False, 'message': 'ID de empleado requerido'}

            attendance_model = request.env['hr.attendance'].sudo()
            result = attendance_model.create_biometric_attendance(
                employee_id, 'facial', confidence, device_info
            )
            
            return result
        except Exception as e:
            _logger.error(f"Error creando asistencia: {str(e)}")
            return {'success': False, 'message': 'Error registrando asistencia'}

    @http.route('/kiosk/api/employee_info', type='json', auth='none', methods=['POST'], csrf=False)
    def get_employee_info(self, **kwargs):
        """Obtener información del empleado para mostrar en kiosco"""
        try:
            employee_id = kwargs.get('employee_id')
            employee = request.env['hr.employee'].sudo().browse(employee_id)
            
            if not employee.exists():
                return {'success': False, 'message': 'Empleado no encontrado'}
            
            # Codificar imagen en base64
            image_data = None
            if employee.image_1920:
                image_data = f"data:image/png;base64,{employee.image_1920.decode()}"
            
            return {
                'success': True,
                'employee': {
                    'id': employee.id,
                    'name': employee.name,
                    'department': employee.department_id.name if employee.department_id else '',
                    'job_position': employee.job_title or '',
                    'image': image_data,
                    'employee_number': employee.employee_id or employee.id
                }
            }
        except Exception as e:
            _logger.error(f"Error obteniendo info empleado: {str(e)}")
            return {'success': False, 'message': 'Error obteniendo información'}

    @http.route('/kiosk/register', type='http', auth='user', methods=['GET'], csrf=False)
    def registration_page(self):
        """Página de registro facial para empleados"""
        return request.render('biometric_attendance.registration_page')

    @http.route('/kiosk/api/register_face', type='json', auth='user', methods=['POST'], csrf=False)
    def register_face_api(self, **kwargs):
        """API para registrar plantilla facial"""
        try:
            employee_id = kwargs.get('employee_id')
            face_data = kwargs.get('face_data')
            photo_data = kwargs.get('photo_data')
            
            if not all([employee_id, face_data, photo_data]):
                return {'success': False, 'message': 'Datos incompletos'}
            
            # Verificar que el usuario puede registrar este empleado
            employee = request.env['hr.employee'].browse(employee_id)
            if not employee.exists():
                return {'success': False, 'message': 'Empleado no encontrado'}
            
            # Registrar plantilla
            result = employee.register_face_template(employee_id, face_data, photo_data)
            return result
            
        except Exception as e:
            _logger.error(f"Error registrando rostro: {str(e)}")
            return {'success': False, 'message': 'Error en el registro'}