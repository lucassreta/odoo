{
    'name': 'Ventas Dirección Autocompletado',
    'version': '17.0.1.0',
    'summary': 'Adds Google Places autocomplete to Sales Orders',
    'description': '''
    Este módulo agrega un campo de dirección con autocompletado de Google Places
    en las órdenes de venta para facilitar la entrada de direcciones.
    ''',
    'author': 'lucas1234',
    'website': 'https://www.lucas.com',
    'category': 'Sales',
    'depends': ['sale_management'],
    'data': [
        'views/sale_order_view.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'ventas_direccion_autocompletado/static/src/js/google_places_autocomplete.js',
        ],
    },
    'external_dependencies': {
        'python': [],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
    'license': 'LGPL-3',
}