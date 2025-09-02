# -*- coding: utf-8 -*-
{
    'name': 'Asistencia Biométrica Facial',
    'version': '17.0.1.0.0',
    'category': 'Human Resources',
    'summary': 'Sistema de asistencia con reconocimiento facial',
    'description': """
Módulo de asistencia biométrica que permite:
========================================
* Registro facial de empleados
* Check-in/Check-out mediante reconocimiento facial  
* Modo kiosco para dispositivos móviles
* Integración con el módulo de asistencias de Odoo
* Interfaz moderna y responsive
* Estadísticas en tiempo real
    """,
    'author': 'Tu Empresa',
    'website': 'https://www.tuempresa.com',
    'depends': [
        'base',
        'hr', 
        'hr_attendance',
        'web'
    ],
    'data': [
        'security/ir.model.access.csv',
        'data/kiosk_templates.xml',
        'data/wizard_actions.xml',
        'views/hr_employee_views.xml',
        'views/attendance_kiosk_views.xml',
        'views/hr_attendance_views.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'biometric_attendance/static/src/js/face_recognition.js',
            'biometric_attendance/static/src/css/kiosk_style.css',
        ],
        'web.assets_frontend': [
            'biometric_attendance/static/src/js/kiosk_app.js',
            'biometric_attendance/static/src/js/face_registration.js',
            'biometric_attendance/static/src/css/kiosk_frontend.css',
        ],
    },
    'demo': [],
    'qweb': [],
    'installable': True,
    'auto_install': False,
    'application': True,
    'license': 'LGPL-3',
}